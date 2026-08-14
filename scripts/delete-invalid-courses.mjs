/**
 * 删除无效课程（非标准课号 / 非课程文件误导入）
 *
 * 用法：
 *   npm run cleanup:courses-invalid -- --dry-run
 *   npm run cleanup:courses-invalid -- --execute
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const SCHOOL_ID = "polyu";
const DELETE_BATCH = 50;

const STANDARD_RE = /^[A-Z]{2,6}\d{3,4}[A-Z0-9_-]{0,8}$/i;
const EXTENDED_RE = /^[A-Z]{2,6}[A-Z0-9]{4,14}$/i;

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: !args.has("--execute"),
    execute: args.has("--execute"),
  };
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i === -1) continue;
      const key = trimmed.slice(0, i).trim();
      const value = trimmed
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function normalizeCode(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/\//g, ":")
    .trim()
    .toUpperCase();
}

function isValidSinglePart(part) {
  if (!part || part.length < 5 || part.length > 20) return false;
  if (/[%]/.test(part)) return false;
  if (
    /科目|編號|名称|名稱|ANNIVERSARY|BOOKLET|VERSION|HTTP|SUBJECTCODE/i.test(
      part,
    )
  ) {
    return false;
  }
  if (/course|subject|title|credit|description/i.test(part)) return false;
  if (!/[A-Z]/i.test(part) || !/\d/.test(part)) return false;
  return STANDARD_RE.test(part) || EXTENDED_RE.test(part);
}

function isValidCourseCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized || normalized.length < 5 || normalized.length > 80) return false;
  if (/%20|%2F|%/i.test(String(code))) return false;
  if (/ANNIVERSARY|BOOKLET|WEBVERSION|WEB_VERSION/i.test(normalized)) return false;
  return normalized.split(":").every(isValidSinglePart);
}

function pathLooksLikeNonCoursePdf(storagePath) {
  const text = String(storagePath || "").replace(/\\/g, "/");
  const fileName = text.split("/").pop() || "";
  // 仅根据文件名判断明显非课程大纲的材料
  return /anniversary|booklet|handbook(?!)|prospectus|brochure/i.test(fileName);
}

async function listCourses(supabase) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("courses")
      .select("id, code, name, pdf_storage_path, department")
      .eq("school_id", SCHOOL_ID)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function main() {
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));
  await loadEnvFile(path.join(PROJECT_ROOT, ".env"));
  const options = parseArgs();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const courses = await listCourses(supabase);
  const invalid = [];

  for (const course of courses) {
    const invalidCode = !isValidCourseCode(course.code);
    const nonCoursePdf = pathLooksLikeNonCoursePdf(course.pdf_storage_path);
    if (!invalidCode && !nonCoursePdf) continue;

    invalid.push({
      id: course.id,
      code: course.code,
      name: course.name,
      reason: [
        invalidCode ? "invalid_code" : null,
        nonCoursePdf ? "non_course_pdf" : null,
      ]
        .filter(Boolean)
        .join("+"),
      path: course.pdf_storage_path,
    });
  }

  console.log(`Loaded ${courses.length} courses`);
  console.log(`Invalid to delete: ${invalid.length}`);
  for (const item of invalid.slice(0, 40)) {
    console.log(`- ${item.code} [${item.reason}] ${item.name}`);
  }
  if (invalid.length > 40) console.log(`… and ${invalid.length - 40} more`);

  if (!options.execute) {
    console.log("\nDry run only. Re-run with --execute to delete.");
    return;
  }

  if (invalid.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  let deleted = 0;
  for (let i = 0; i < invalid.length; i += DELETE_BATCH) {
    const batch = invalid.slice(i, i + DELETE_BATCH);
    const { error } = await supabase
      .from("courses")
      .delete()
      .in(
        "id",
        batch.map((item) => item.id),
      );
    if (error) throw new Error(error.message);
    deleted += batch.length;
    console.log(`Deleted ${deleted}/${invalid.length}`);
  }
  console.log(`\nDone. Deleted ${deleted} invalid courses.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
