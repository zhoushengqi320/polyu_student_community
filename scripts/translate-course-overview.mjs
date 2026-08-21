/**
 * 将 courses 概览英文字段译为简体中文并写回 Supabase。
 *
 * 依赖本机 Ollama（默认 qwen2.5:7b）与 .env.local 中的
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY。
 *
 * 用法：
 *   node scripts/translate-course-overview.mjs --dry-run --limit=3
 *   node scripts/translate-course-overview.mjs --codes=AAE1001,AAE1002
 *   node scripts/translate-course-overview.mjs --dept=aae
 *   node scripts/translate-course-overview.mjs --concurrency=3
 *   node scripts/translate-course-overview.mjs
 *
 * 本机并行时建议同时设置（重启 Ollama 后生效）：
 *   launchctl setenv OLLAMA_NUM_PARALLEL 3
 *
 * 进度文件：tmp/translate-progress.json（可中断后续跑）
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const SCHOOL_ID = "polyu";
const FIELDS = [
  "description",
  "objectives",
  "prerequisites",
  "teaching_pattern",
];
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const PROGRESS_PATH = path.join(PROJECT_ROOT, "tmp", "translate-progress.json");
const LOG_PATH = path.join(PROJECT_ROOT, "tmp", "translate-log.jsonl");
const QUESTIONS_PATH = path.join(PROJECT_ROOT, "tmp", "translate-questions.jsonl");

const SYSTEM_RULES = `你是香港理工大学（PolyU）课程大纲翻译。把英文译成通顺、自然的简体中文。

硬性要求：
1. 忠实原意，不增删、不改写事实。
2. 特别注意助词与连接词，使中文通顺。例如写「学习 AI 的应用」「数据在航空工程中的应用」，不要写成「学习 AI 应用」这类缺「的」的生硬短语。
3. 保留课程代码与常用缩写（AI、AIDA、UAV、UAS、GNSS、ICAO、Nil 等）。专有机构名可保留英文。
4. Nil / N/A / None / Nil. →「无」
5. 保持原有段落/编号结构（1. 2. 3. 或换行）。
6. aerospace / aeronautical / aviation 在 PolyU 语境优先译为「航天 / 航空 / 民航」；合称可用「航天航空与民航工程」。
7. subject 在课纲语境译为「本科目」或「本课程」，不要译成「主题」。
8. 只输出译文正文，不要前言、不要解释、不要 markdown 代码围栏。`;

function parseArgs(argv) {
  const get = (prefix) => {
    const hit = argv.find((a) => a.startsWith(prefix));
    return hit ? hit.slice(prefix.length) : null;
  };
  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number(get("--limit=") || 0) || 0,
    dept: get("--dept="),
    codes: (get("--codes=") || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    force: argv.includes("--force"),
    model: get("--model=") || OLLAMA_MODEL,
    concurrency: Math.max(
      1,
      Number(
        get("--concurrency=") ||
          process.env.TRANSLATE_CONCURRENCY ||
          1,
      ) || 1,
    ),
  };
}

/** Serialize progress mutations across parallel workers. */
function createMutex() {
  let tail = Promise.resolve();
  return function runExclusive(fn) {
    const next = tail.then(fn, fn);
    tail = next.catch(() => {});
    return next;
  };
}

async function mapPool(items, concurrency, workerFn) {
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async (_, workerId) => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) break;
      await workerFn(items[index], index, workerId);
    }
  });
  await Promise.all(workers);
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
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

function looksChinese(text) {
  if (!text || !String(text).trim()) return true;
  const t = String(text).trim();
  if (/^(无|没有|不适用)[。.]?$/u.test(t)) return true;
  // 先修/互斥 + 课号为主：视为已中文化
  if (/^(先修|互斥科目)[:：]/u.test(t)) return true;
  const cn = (t.match(/[\u4e00-\u9fff]/g) || []).length;
  const letters = (t.match(/[A-Za-z]/g) || []).length;
  return cn >= 3 && cn >= letters * 0.15;
}

function needsTranslation(row) {
  return FIELDS.some((f) => {
    const v = row[f];
    return Boolean(v && String(v).trim() && !looksChinese(v));
  });
}

async function loadProgress() {
  try {
    return JSON.parse(await fs.readFile(PROGRESS_PATH, "utf8"));
  } catch {
    return { done: {}, failed: {}, updatedAt: null, stats: { ok: 0, fail: 0, skip: 0 } };
  }
}

async function saveProgress(progress) {
  progress.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(PROGRESS_PATH), { recursive: true });
  await fs.writeFile(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

async function appendJsonl(filePath, obj) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(obj)}\n`);
}

async function ollamaTranslate(model, field, english, code) {
  const prompt = `${SYSTEM_RULES}

（内部信息，勿写入译文）course=${code} field=${field}

>>>BEGIN
${english}
<<<END

请只输出 BEGIN/END 之间英文对应的简体中文译文。`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.15, num_predict: 4096 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  let text = String(data.response || "").trim();
  text = text
    .replace(/^```(?:zh|cn|chinese|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  if (!text) throw new Error("empty translation");
  return text;
}

async function ollamaTranslateBundle(model, bundle, code) {
  const keys = Object.keys(bundle);
  const prompt = `${SYSTEM_RULES}

（内部信息，勿写入译文）course=${code}

将下列 JSON 对象中每个字段的英文值译为简体中文，保持相同的 JSON key。
只输出一个合法 JSON 对象，不要 markdown，不要其它文字。

输入：
${JSON.stringify(bundle, null, 2)}`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
      options: { temperature: 0.15, num_predict: 8192 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  let raw = String(data.response || "").trim();
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(raw);
  const out = {};
  for (const key of keys) {
    if (parsed[key] == null || !String(parsed[key]).trim()) {
      throw new Error(`bundle missing key ${key}`);
    }
    out[key] = postProcess(key, String(parsed[key]));
  }
  return out;
}

async function fetchCourses(supabase, { dept, codes }) {
  const rows = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    let query = supabase
      .from("courses")
      .select(
        "id,code,name,department,description,objectives,prerequisites,teaching_pattern",
      )
      .eq("school_id", SCHOOL_ID)
      .order("code", { ascending: true })
      .range(from, from + pageSize - 1);

    if (dept) query = query.eq("department", dept);
    if (codes.length) query = query.in("code", codes);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function patchCourse(supabase, id, patch, dryRun) {
  if (dryRun) return;
  const { error } = await supabase.from("courses").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

function flattenListishObjectives(raw) {
  const t = String(raw || "").trim();
  if (!t.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed
        .map((x, i) => `${i + 1}. ${String(x).trim().replace(/[;；]?$/u, "")}`)
        .join("\n");
    }
  } catch {
    // continue
  }
  const quoted = [];
  const re = /['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(t))) {
    if (m[1].trim()) quoted.push(m[1].trim());
  }
  if (quoted.length >= 2) {
    return quoted
      .map((x, i) => `${i + 1}. ${x.replace(/[;；]?$/u, "")}`)
      .join("\n");
  }
  const inner = t.slice(1, -1).trim();
  if (!inner) return null;
  const parts = inner
    .split(/,\s*(?=[\u4e00-\u9fffA-Za-z])/u)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 1) {
    return parts
      .map(
        (x, i) =>
          `${i + 1}. ${x.replace(/^['"]|['"]$/g, "").replace(/[;；]?$/u, "")}`,
      )
      .join("\n");
  }
  return null;
}

function postProcess(field, text) {
  let t = text.trim();
  // strip model echo of our prompt scaffolding
  t = t
    .replace(/^>>>BEGIN\s*/i, "")
    .replace(/\s*<<<END$/i, "")
    .replace(/^[（(]内部信息[\s\S]*?[）)]\s*/u, "")
    .replace(/^course\s*=\s*\S+\s+field\s*=\s*\S+\s*/i, "")
    .replace(/^课程代码[:：].*\n+/u, "")
    .replace(/^字段[:：].*\n+/u, "")
    .replace(/^(课程简介|学习目标|先修要求|教学模式|描述|目标)[:：]\s*/u, "")
    .trim();
  // common Nil variants left in English
  if (/^(nil|n\/a|none|nil\.)\.?$/i.test(t)) return "无";
  if (field === "prerequisites" && /^(无|没有|不适用)\.?$/u.test(t)) return "无";
  if (field === "objectives") {
    const flat = flattenListishObjectives(t);
    if (flat) t = flat;
  }
  return t;
}

async function translateCourse(row, model) {
  const originals = {};
  const patch = {};
  for (const field of FIELDS) {
    const src = row[field];
    if (!src || !String(src).trim()) continue;
    if (looksChinese(src)) continue;
    const trimmed = String(src).trim();
    // Skip LLM for trivial Nil-like fields
    if (/^(nil|n\/a|none|nil\.)\.?$/i.test(trimmed)) {
      patch[field] = "无";
      continue;
    }
    originals[field] = trimmed;
  }
  if (!Object.keys(originals).length) {
    return { patch, originals };
  }

  const totalLen = Object.values(originals).reduce((n, s) => n + s.length, 0);
  let translated = {};

  if (totalLen <= 5500 && Object.keys(originals).length >= 2) {
    try {
      translated = await ollamaTranslateBundle(model, originals, row.code);
    } catch (error) {
      console.warn(`  bundle fallback ${row.code}: ${error.message || error}`);
      translated = {};
    }
  }

  if (!Object.keys(translated).length) {
    for (const [field, src] of Object.entries(originals)) {
      translated[field] = postProcess(
        field,
        await ollamaTranslate(model, field, src, row.code),
      );
    }
  }

  Object.assign(patch, translated);

  for (const [field, text] of Object.entries(translated)) {
    const src = originals[field] || "";
    if (!looksChinese(text) && String(src).length > 20) {
      await appendJsonl(QUESTIONS_PATH, {
        at: new Date().toISOString(),
        code: row.code,
        field,
        reason: "译文仍偏英文，请人工核对",
        sourcePreview: String(src).slice(0, 240),
        translationPreview: text.slice(0, 240),
      });
    }
  }

  return { patch, originals };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  }

  // smoke ollama
  const tags = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!tags.ok) throw new Error(`无法连接 Ollama: ${OLLAMA_URL}`);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const progress = await loadProgress();
  let rows = await fetchCourses(supabase, args);
  rows = rows.filter(needsTranslation);
  if (args.codes.length) {
    rows = rows.filter((r) => args.codes.includes(String(r.code).toUpperCase()));
  }
  if (!args.force) {
    rows = rows.filter((r) => !progress.done[r.id]);
  }
  if (args.limit > 0) rows = rows.slice(0, args.limit);

  console.log(
    JSON.stringify(
      {
        model: args.model,
        dryRun: args.dryRun,
        concurrency: args.concurrency,
        queue: rows.length,
        alreadyDone: Object.keys(progress.done).length,
      },
      null,
      2,
    ),
  );

  const withProgress = createMutex();
  let completed = 0;

  await mapPool(rows, args.concurrency, async (row, i, workerId) => {
    const label = `[w${workerId} ${i + 1}/${rows.length}] ${row.code}`;
    const started = Date.now();
    try {
      const { patch, originals } = await translateCourse(row, args.model);
      if (!Object.keys(patch).length) {
        await withProgress(async () => {
          progress.stats.skip += 1;
          progress.done[row.id] = { code: row.code, skipped: true };
          delete progress.failed[row.id];
        });
        console.log(`${label} skip (already zh/empty)`);
      } else {
        await patchCourse(supabase, row.id, patch, args.dryRun);
        await withProgress(async () => {
          progress.stats.ok += 1;
          progress.done[row.id] = {
            code: row.code,
            fields: Object.keys(patch),
            at: new Date().toISOString(),
            dryRun: args.dryRun,
            workerId,
          };
          delete progress.failed[row.id];
        });
        await appendJsonl(LOG_PATH, {
          at: new Date().toISOString(),
          code: row.code,
          id: row.id,
          fields: Object.keys(patch),
          ms: Date.now() - started,
          dryRun: args.dryRun,
          workerId,
          concurrency: args.concurrency,
          preview: Object.fromEntries(
            Object.entries(patch).map(([k, v]) => [
              k,
              {
                from: String(originals[k] ?? "").slice(0, 80),
                to: String(v).slice(0, 80),
              },
            ]),
          ),
        });
        console.log(
          `${label} ok fields=${Object.keys(patch).join(",")} ${Date.now() - started}ms`,
        );
      }
    } catch (error) {
      await withProgress(async () => {
        progress.stats.fail += 1;
        progress.failed[row.id] = {
          code: row.code,
          error: String(error.message || error),
          at: new Date().toISOString(),
          workerId,
        };
      });
      console.error(`${label} FAIL`, error.message || error);
      await appendJsonl(LOG_PATH, {
        at: new Date().toISOString(),
        code: row.code,
        id: row.id,
        workerId,
        error: String(error.message || error),
      });
    }

    completed += 1;
    const shouldSave = completed % 5 === 0 || completed === rows.length;
    if (shouldSave) {
      await withProgress(() => saveProgress(progress));
    }
  });

  await withProgress(() => saveProgress(progress));
  console.log("done", { ...progress.stats, concurrency: args.concurrency });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
