/**
 * 清理课程：
 * 1) 默认：删除本地/远程 PDF 找不到的课程
 * 2) --not-in-jsonl=文件：删除不在该 JSONL 中的课程（导入后清理旧脏数据）
 *
 * 用法：
 *   npm run cleanup:courses-missing-pdf -- --dry-run
 *   npm run cleanup:courses-missing-pdf -- --execute
 *   npm run cleanup:courses-missing-pdf -- --not-in-jsonl="C:\path\courses-all.jsonl" --execute
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const SCHOOL_ID = "polyu";
const COURSE_DIR = path.join(PROJECT_ROOT, "课程");
const LEGACY_DIR = path.join(PROJECT_ROOT, "学科");
const DELETE_BATCH = 50;

function parseArgs() {
  const argv = process.argv.slice(2);
  const jsonlArg = argv.find((arg) => arg.startsWith("--not-in-jsonl="));
  return {
    dryRun: !argv.includes("--execute"),
    execute: argv.includes("--execute"),
    notInJsonl: jsonlArg
      ? jsonlArg.replace("--not-in-jsonl=", "").replace(/^["']|["']$/g, "")
      : null,
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

function normalizeRelative(storagePath) {
  let relative = String(storagePath || "")
    .replace(/\\/g, "/")
    .trim()
    .replace(/^\.\//, "");
  for (const prefix of ["课程", "学科", "course_pdfs"]) {
    if (relative === prefix) {
      relative = "";
      break;
    }
    if (relative.startsWith(`${prefix}/`)) {
      relative = relative.slice(prefix.length + 1);
      break;
    }
  }
  return relative.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
}

function localPdfExists(storagePath) {
  const relative = normalizeRelative(storagePath);
  if (!relative.toLowerCase().endsWith(".pdf")) return false;
  const candidates = [
    path.join(COURSE_DIR, ...relative.split("/")),
    path.join(LEGACY_DIR, ...relative.split("/")),
    path.join(PROJECT_ROOT, String(storagePath).replace(/\\/g, "/")),
  ];
  return candidates.some((p) => fs.existsSync(p) && fs.statSync(p).isFile());
}

async function remoteUrlExists(url) {
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (head.ok) return true;
    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      redirect: "follow",
    });
    return get.ok || get.status === 206;
  } catch {
    return false;
  }
}

function toStoragePublicUrl(base, objectPath) {
  const encoded = objectPath
    .split("/")
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/course_pdfs/${encoded}`;
}

async function pdfAvailable(course, supabaseUrl) {
  const pdfUrl = course.pdf_url?.trim() || null;
  const storagePath = course.pdf_storage_path?.trim() || null;

  if (pdfUrl && /^https?:\/\//i.test(pdfUrl)) {
    return (await remoteUrlExists(pdfUrl))
      ? { ok: true, reason: "pdf_url" }
      : { ok: false, reason: "pdf_url_not_found" };
  }

  if (!storagePath) {
    return { ok: false, reason: "no_pdf_path" };
  }

  const normalized = storagePath.replace(/\\/g, "/");
  if (normalized.startsWith("course_pdfs/")) {
    const objectPath = normalizeRelative(normalized);
    const publicUrl = toStoragePublicUrl(supabaseUrl, objectPath);
    return (await remoteUrlExists(publicUrl))
      ? { ok: true, reason: "storage" }
      : { ok: false, reason: "storage_not_found" };
  }

  if (localPdfExists(storagePath)) {
    return { ok: true, reason: "local" };
  }
  return { ok: false, reason: "local_not_found" };
}

async function listCourses(supabase) {
  const rows = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("courses")
      .select("id, code, name, pdf_url, pdf_storage_path")
      .eq("school_id", SCHOOL_ID)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function loadJsonlCodes(filePath) {
  const codes = new Set();
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj.code) codes.add(String(obj.code).trim().toUpperCase());
    } catch {
      // skip
    }
  }
  return codes;
}

async function deleteCourses(supabase, targets) {
  let deleted = 0;
  for (let i = 0; i < targets.length; i += DELETE_BATCH) {
    const batch = targets.slice(i, i + DELETE_BATCH);
    const ids = batch.map((item) => item.id);
    const { error } = await supabase.from("courses").delete().in("id", ids);
    if (error) {
      throw new Error(`Delete failed at batch ${i}: ${error.message}`);
    }
    deleted += batch.length;
    console.log(`Deleted ${deleted}/${targets.length}`);
  }
  return deleted;
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
  console.log(`Loaded ${courses.length} courses`);

  let targets = [];

  if (options.notInJsonl) {
    const absolute = path.resolve(options.notInJsonl);
    const codes = await loadJsonlCodes(absolute);
    console.log(`JSONL codes: ${codes.size} (${absolute})`);
    targets = courses
      .filter((course) => !codes.has(String(course.code).trim().toUpperCase()))
      .map((course) => ({
        id: course.id,
        code: course.code,
        reason: "not_in_jsonl",
        pdf_storage_path: course.pdf_storage_path,
      }));
  } else {
    let checked = 0;
    for (const course of courses) {
      checked += 1;
      if (checked % 200 === 0) {
        console.log(`Checked ${checked}/${courses.length}…`);
      }
      const result = await pdfAvailable(course, url);
      if (!result.ok) {
        targets.push({
          id: course.id,
          code: course.code,
          reason: result.reason,
          pdf_storage_path: course.pdf_storage_path,
        });
      }
    }
  }

  console.log(`\nTo delete: ${targets.length}`);
  for (const item of targets.slice(0, 30)) {
    console.log(`- ${item.code} [${item.reason}] ${item.pdf_storage_path || ""}`);
  }
  if (targets.length > 30) {
    console.log(`… and ${targets.length - 30} more`);
  }

  if (!options.execute) {
    console.log("\nDry run only. Re-run with --execute to delete.");
    return;
  }

  if (targets.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  const deleted = await deleteCourses(supabase, targets);
  console.log(`\nDone. Deleted ${deleted} courses.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
