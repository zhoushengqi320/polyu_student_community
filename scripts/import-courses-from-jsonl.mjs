/**
 * 从 Qwen 流水线导出的 JSONL 导入 / 更新 courses 表
 *
 * 用法：
 *   npm run import:courses:jsonl -- --file="C:\Users\Administrator\Desktop\courses-all (1).jsonl" --dry-run
 *   npm run import:courses:jsonl -- --file="C:\Users\Administrator\Desktop\courses-all (1).jsonl" --update-existing
 *
 * 需要 .env.local：
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const SCHOOL_ID = "polyu";
const INSERT_BATCH_SIZE = 100;

const COURSE_FIELDS = [
  "code",
  "name",
  "department",
  "faculty",
  "level",
  "credits",
  "description",
  "objectives",
  "prerequisites",
  "teaching_pattern",
  "semester_offered",
  "assessment_json",
  "pdf_url",
  "pdf_storage_path",
  "source_file_name",
  "source_updated_at",
  "school_id",
];

function parseArgs() {
  const argv = process.argv.slice(2);
  const fileArg = argv.find((arg) => arg.startsWith("--file="));
  return {
    dryRun: argv.includes("--dry-run"),
    updateExisting: argv.includes("--update-existing"),
    filePath: fileArg
      ? fileArg.replace("--file=", "").replace(/^["']|["']$/g, "")
      : null,
  };
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function truncate(value, maxLength) {
  if (value == null) return value;
  const text = String(value).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeCode(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/\//g, ":")
    .trim()
    .toUpperCase();
}

function normalizeAssessment(raw) {
  if (!raw || typeof raw !== "object") {
    return { items: [], original_text: null };
  }
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((item) => ({
          label: String(item?.label || "").trim(),
          value:
            item?.value == null || item?.value === ""
              ? null
              : String(item.value).trim(),
        }))
        .filter((item) => item.label)
    : [];
  return {
    items,
    original_text:
      raw.original_text == null || raw.original_text === ""
        ? null
        : String(raw.original_text),
  };
}

function sanitizeCourse(row) {
  const code = normalizeCode(row.code);
  const creditsRaw = row.credits;
  let credits = null;
  if (creditsRaw != null && creditsRaw !== "") {
    const num = Number(creditsRaw);
    credits = Number.isFinite(num) ? num : null;
  }

  return {
    code: truncate(code, 64),
    name: truncate(row.name || code, 300),
    department: truncate(String(row.department || "unknown").toLowerCase(), 64),
    faculty: truncate(row.faculty ?? null, 200),
    level: truncate(row.level ?? null, 64),
    credits,
    description: truncate(row.description ?? null, 20000),
    objectives: truncate(row.objectives ?? null, 20000),
    prerequisites: truncate(row.prerequisites ?? null, 8000),
    teaching_pattern: truncate(row.teaching_pattern ?? null, 8000),
    semester_offered: truncate(row.semester_offered ?? null, 200),
    assessment_json: normalizeAssessment(row.assessment_json),
    pdf_url: row.pdf_url ?? null,
    pdf_storage_path: truncate(row.pdf_storage_path ?? null, 500),
    source_file_name: truncate(row.source_file_name ?? null, 300),
    source_updated_at: row.source_updated_at ?? null,
    school_id: row.school_id || SCHOOL_ID,
  };
}

function pickCourseFields(course) {
  const out = {};
  for (const key of COURSE_FIELDS) {
    out[key] = course[key] ?? null;
  }
  return out;
}

async function readJsonl(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows = [];
  const errors = [];

  for (let index = 0; index < lines.length; index += 1) {
    try {
      const parsed = JSON.parse(lines[index]);
      const course = sanitizeCourse(parsed);
      if (!course.code || course.code.length < 4) {
        errors.push(`L${index + 1}: code 无效`);
        continue;
      }
      rows.push(course);
    } catch (error) {
      errors.push(
        `L${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { rows, errors };
}

async function getExistingCodes(supabase) {
  const existing = new Set();
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("courses")
      .select("code")
      .eq("school_id", SCHOOL_ID)
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`读取已有课程失败: ${error.message}`);
    }
    for (const row of data || []) {
      if (row.code) existing.add(String(row.code).toUpperCase());
    }
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return existing;
}

async function main() {
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));
  await loadEnvFile(path.join(PROJECT_ROOT, ".env"));

  const options = parseArgs();
  if (!options.filePath) {
    throw new Error(
      '请指定 JSONL 文件，例如：--file="C:\\Users\\Administrator\\Desktop\\courses-all (1).jsonl"',
    );
  }

  const absolutePath = path.resolve(options.filePath);
  const { rows, errors } = await readJsonl(absolutePath);
  console.log(`File: ${absolutePath}`);
  console.log(`Parsed: ${rows.length} courses`);
  if (errors.length) {
    console.log(`Skipped/invalid lines: ${errors.length}`);
    for (const item of errors.slice(0, 10)) {
      console.log(`  - ${item}`);
    }
  }

  // 同文件内按 code 去重（后写覆盖先写）
  const byCode = new Map();
  for (const row of rows) {
    byCode.set(row.code, row);
  }
  const unique = [...byCode.values()];
  console.log(`Unique by code: ${unique.length}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error(
      "缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY（写在 .env.local）",
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const existing = await getExistingCodes(supabase);
  const toInsert = [];
  const toUpdate = [];

  for (const course of unique) {
    if (existing.has(course.code)) {
      toUpdate.push(course);
    } else {
      toInsert.push(course);
    }
  }

  console.log(`Already in DB: ${toUpdate.length}`);
  console.log(`New: ${toInsert.length}`);
  console.log("Examples:");
  for (const item of unique.slice(0, 8)) {
    console.log(`  - ${item.code}: ${item.name}`);
  }

  if (options.dryRun) {
    console.log("\nDry run only. No database changes.");
    if (!options.updateExisting && toUpdate.length > 0) {
      console.log(
        `提示：有 ${toUpdate.length} 门课已存在。正式导入若要覆盖脏数据，请加 --update-existing`,
      );
    }
    return;
  }

  const payload = (
    options.updateExisting ? [...toInsert, ...toUpdate] : toInsert
  ).map(pickCourseFields);

  if (payload.length === 0) {
    console.log("\n没有需要写入的课程。若要覆盖已有课程，请加 --update-existing");
    return;
  }

  if (options.updateExisting) {
    for (let i = 0; i < payload.length; i += INSERT_BATCH_SIZE) {
      const batch = payload.slice(i, i + INSERT_BATCH_SIZE);
      const { error } = await supabase
        .from("courses")
        .upsert(batch, { onConflict: "code,school_id" });
      if (error) {
        throw new Error(`Upsert 失败 (batch ${i}): ${error.message}`);
      }
      console.log(
        `Upserted ${Math.min(i + INSERT_BATCH_SIZE, payload.length)} / ${payload.length}`,
      );
    }
  } else {
    for (let i = 0; i < payload.length; i += INSERT_BATCH_SIZE) {
      const batch = payload.slice(i, i + INSERT_BATCH_SIZE);
      const { error } = await supabase.from("courses").insert(batch);
      if (error) {
        throw new Error(`Insert 失败 (batch ${i}): ${error.message}`);
      }
      console.log(
        `Inserted ${Math.min(i + INSERT_BATCH_SIZE, payload.length)} / ${payload.length}`,
      );
    }
  }

  console.log(`\nDone. Wrote ${payload.length} courses.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
