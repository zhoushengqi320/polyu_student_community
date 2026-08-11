import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { PDFParse } from "pdf-parse";

const PROJECT_ROOT = process.cwd();
const DEFAULT_COURSE_DIR = path.join(PROJECT_ROOT, "课程");
const SCHOOL_ID = "polyu";
const INSERT_BATCH_SIZE = 100;

const DEPARTMENT_META = {
  AAE: { department: "aae", faculty: "Faculty of Engineering" },
  ABCT: { department: "abct", faculty: "Faculty of Science" },
  ABCT2: { department: "abct", faculty: "Faculty of Science" },
  AF: { department: "af", faculty: "Faculty of Business" },
  AMA: { department: "ama", faculty: "Faculty of Science" },
  APSS: { department: "apss", faculty: "Faculty of Health and Social Sciences" },
  AP_M: { department: "ap", faculty: "Faculty of Science" },
  AP_RP: { department: "ap", faculty: "Faculty of Science" },
  AP_UG: { department: "ap", faculty: "Faculty of Science" },
  BME: { department: "bme", faculty: "Faculty of Engineering" },
  CEE: { department: "cee", faculty: "Faculty of Construction and Environment" },
  CHC_M: { department: "chc", faculty: "Faculty of Humanities" },
  CHC_UG: { department: "chc", faculty: "Faculty of Humanities" },
  CLC: { department: "clc", faculty: "Faculty of Humanities" },
  COMP: { department: "comp", faculty: "Faculty of Engineering" },
  COMP2: { department: "comp", faculty: "Faculty of Engineering" },
  DSAI: { department: "dsai", faculty: "Faculty of Engineering" },
  EEE: { department: "eee", faculty: "Faculty of Engineering" },
  ENGL: { department: "engl", faculty: "Faculty of Humanities" },
  FB: { department: "fb", faculty: "Faculty of Business" },
  FSN: { department: "fsn", faculty: "Faculty of Science" },
  LMS: { department: "lms", faculty: "Faculty of Business" },
  LSGI: { department: "lsgi", faculty: "Faculty of Construction and Environment" },
  ME: { department: "me", faculty: "Faculty of Engineering" },
  MM: { department: "mm", faculty: "Faculty of Business" },
  SFT: { department: "sft", faculty: "School of Fashion and Textiles" },
  SHTM: { department: "shtm", faculty: "School of Hotel and Tourism Management" },
};

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    updateExisting: args.has("--update-existing"),
    cleanupLegacyMerged: args.has("--cleanup-legacy-merged"),
    courseDir:
      process.argv
        .slice(2)
        .find((arg) => arg.startsWith("--dir="))
        ?.replace("--dir=", "") ?? DEFAULT_COURSE_DIR,
  };
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function walkPdfs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkPdfs(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findLineValue(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}\\s+([^\\n]+)`, "i");
  const match = text.match(regex);
  return match?.[1]?.trim() || null;
}

function cleanInlineValue(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/-- \d+ of \d+ --/g, "")
    .trim();
}

function findFieldValue(text, label, endLabels = []) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s+`, "i"));
  if (!match || match.index === undefined) {
    return null;
  }

  const start = match.index + match[0].length;
  const tail = text.slice(start);
  const endCandidates = endLabels
    .map((endLabel) => {
      const endEscaped = endLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const endMatch = tail.match(
        new RegExp(`\\n?${endEscaped}\\/?\\s*`, "i"),
      );
      return endMatch?.index && endMatch.index > 0 ? endMatch.index : null;
    })
    .filter((index) => index !== null);
  const lineEnd = tail.indexOf("\n");
  const fallbackEnd = lineEnd > 0 ? lineEnd : tail.length;
  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : fallbackEnd;
  const value = cleanInlineValue(tail.slice(0, end));

  return value || null;
}

function sliceSection(text, startLabels, endLabels) {
  const starts = startLabels
    .map((label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = text.match(new RegExp(`${escaped}\\s*`, "i"));
      return match?.index !== undefined
        ? { index: match.index, length: match[0].length }
        : null;
    })
    .filter((index) => index !== null);

  if (starts.length === 0) {
    return null;
  }

  const start = starts.sort((a, b) => a.index - b.index)[0];
  const afterStart = text.slice(start.index + start.length);
  const endCandidates = endLabels
    .map((label) => {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const index = afterStart.search(new RegExp(escaped, "i"));
      return index > 0 ? index : null;
    })
    .filter((index) => index !== null);
  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : 1800;

  return afterStart.slice(0, end).trim();
}

function truncate(value, maxLength) {
  if (value == null) {
    return value;
  }
  const text = String(value).trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function sanitizeCourse(course) {
  // Indexed columns must stay under Postgres btree row limit (~8191 bytes).
  return {
    ...course,
    code: truncate(course.code, 64),
    name: truncate(course.name, 300),
    department: truncate(course.department, 64),
    faculty: truncate(course.faculty, 200),
    level: truncate(course.level, 64),
    description: truncate(course.description, 20000),
    objectives: truncate(course.objectives, 20000),
    prerequisites: truncate(course.prerequisites, 8000),
    teaching_pattern: truncate(course.teaching_pattern, 8000),
  };
}

function parseCredits(raw) {
  if (!raw) {
    return null;
  }
  const match = raw.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseAssessment(section) {
  if (!section) {
    return {};
  }

  const items = [];
  const lines = section
    .split("\n")
    .map((line) => cleanInlineValue(line))
    .filter(Boolean);

  for (const line of lines) {
    const itemMatch = line.match(
      /^\d+\.\s+(.+?)\s+(\d+(?:\.\d+)?\s*%)(.*)$/i,
    );
    if (!itemMatch) {
      continue;
    }

    const label = itemMatch[1]
      .replace(/\s+/g, " ")
      .replace(/[.:;]+$/g, "")
      .trim();
    const value = itemMatch[2].replace(/\s+/g, " ").trim();

    if (label && !/^total$/i.test(label)) {
      items.push({ label, value });
    }
  }

  return {
    items,
    original_text: section,
  };
}

function buildCourseCodeFromFile(filePath) {
  let base = path.basename(filePath, ".pdf").trim().toUpperCase();
  base = base
    .replace(/_+(LMS|CMBA|MBA|UG|PG).*$/i, "")
    .replace(/_\d+$/, "");
  // 跨课 PDF 文件名：ABCT1D01_ABCT1301 → ABCT1D01:ABCT1301
  base = base.replace(/^([A-Z0-9]+)_([A-Z]{2,6}[A-Z0-9]+)$/, "$1:$2");
  return normalizeCourseCode(base);
}

function normalizeCourseCode(value) {
  if (value == null || value === "") {
    return "";
  }
  return String(value)
    .replace(/\s+/g, "")
    .replace(/\//g, ":")
    .replace(/_+(LMS|CMBA|MBA|UG|PG)$/i, "")
    .replace(/_+\d+$/, "")
    .replace(/_+$/g, "")
    .replace(/^SUBJECTCODE/i, "")
    .trim()
    .toUpperCase();
}

/** 标准课号：COMP1001、ABCT3114 */
const STANDARD_COURSE_CODE_RE = /^[A-Z]{2,6}\d{3,4}[A-Z0-9_-]{0,8}$/i;
/** PolyU 变体课号：AAE1BN01、ABCT1D04 */
const EXTENDED_COURSE_CODE_RE = /^[A-Z]{2,6}[A-Z0-9]{4,14}$/i;

function isValidSingleCourseCode(part) {
  if (!part || part.length < 5 || part.length > 16) {
    return false;
  }
  if (/course|subject|title|credit|description|form/i.test(part)) {
    return false;
  }
  if (!/[A-Z]/i.test(part) || !/\d/.test(part)) {
    return false;
  }
  return (
    STANDARD_COURSE_CODE_RE.test(part) || EXTENDED_COURSE_CODE_RE.test(part)
  );
}

function isValidCourseCode(code) {
  if (!code || code.length < 5 || code.length > 64) {
    return false;
  }
  if (/course|subject|title|credit|description|form/i.test(code)) {
    return false;
  }
  return code.split(":").every(isValidSingleCourseCode);
}

function looksLikeCourseCodeOnly(text) {
  const compact = String(text).replace(/\s+/g, "").toUpperCase();
  if (compact.includes(":")) {
    return compact.split(":").every(isValidSingleCourseCode);
  }
  return isValidSingleCourseCode(compact);
}

const PDF_FIELD_LABEL_RE =
  /\b(subject code|subject title|credit value|subject description form|description form|course description)\b/i;

function normalizeCreditsValue(raw) {
  if (raw == null || raw === "") {
    return null;
  }
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 && raw <= 30 ? raw : null;
  }
  const match = cleanInlineValue(String(raw)).match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }
  const value = Number(match[0]);
  if (!Number.isFinite(value) || value < 0 || value > 30) {
    return null;
  }
  return value;
}

function normalizeLevelValue(raw) {
  if (raw == null || raw === "") {
    return null;
  }
  if (typeof raw === "number") {
    return raw >= 1 && raw <= 9 ? String(raw) : null;
  }
  const cleaned = cleanInlineValue(String(raw));
  const digitMatch = cleaned.match(/^(\d{1,2})\b/);
  if (digitMatch) {
    const level = Number(digitMatch[1]);
    return level >= 1 && level <= 9 ? String(level) : null;
  }
  if (/^M[\(:]/i.test(cleaned)) {
    return "M";
  }
  const colonLevelMatch = cleaned.match(/:(\d{1,2})(?:\s|$|[):;])/);
  if (colonLevelMatch) {
    const level = Number(colonLevelMatch[1]);
    return level >= 1 && level <= 9 ? String(level) : null;
  }
  const token = cleaned.split(/\s+/)[0]?.toUpperCase();
  if (token && /^(M|UG|PG|1|2|3|4|5|6|7|8|9)$/.test(token)) {
    return token;
  }
  return null;
}

function normalizeCourseName(rawName, code) {
  if (!rawName) {
    return null;
  }

  let name = cleanInlineValue(rawName)
    .replace(/^subject title\s+/i, "")
    .replace(/^title\s+/i, "")
    .trim();

  if (!name) {
    return null;
  }
  if (PDF_FIELD_LABEL_RE.test(name)) {
    return null;
  }
  if (/^course$/i.test(name)) {
    return null;
  }
  if (name.toUpperCase() === code.toUpperCase()) {
    return null;
  }
  if (looksLikeCourseCodeOnly(name)) {
    return null;
  }
  if (name.length < 2) {
    return null;
  }

  return name;
}

function extractMultiLineSubjectCodes(text) {
  const match = text.match(
    /Subject Code\s+([\s\S]*?)(?:Subject Title|Credit Value)/i,
  );
  if (!match) {
    return null;
  }

  const codes = [
    ...match[1].matchAll(/[A-Z]{2,6}\d{3,4}[A-Z0-9]*/gi),
  ]
    .map((item) => normalizeCourseCode(item[0]))
    .filter((code) => isValidSingleCourseCode(code));

  if (codes.length <= 1) {
    return null;
  }

  return [...new Set(codes)].join(":");
}

function extractMultiLineSubjectTitles(text) {
  const match = text.match(
    /Subject Title\s+([\s\S]*?)(?:Credit Value|Level)/i,
  );
  if (!match) {
    return null;
  }

  const titles = match[1]
    .split("\n")
    .map((line) => cleanInlineValue(line))
    .filter(Boolean)
    .map((line) => line.replace(/^subject title\s+/i, "").trim())
    .filter((line) => line && !PDF_FIELD_LABEL_RE.test(line));

  return titles.length > 1 ? titles : null;
}

function extractSubjectCode(text, filePath) {
  const fromMultiLine = extractMultiLineSubjectCodes(text);
  const fromField =
    findLineValue(text, "Subject Code") ??
    findFieldValue(text, "Subject Code", ["Subject Title"]);
  const fromFile = buildCourseCodeFromFile(filePath);
  const fromFileExpanded = splitCourseCodes(fromFile);

  if (fromMultiLine) {
    return fromMultiLine;
  }

  if (fromFileExpanded.length > 1) {
    return fromFileExpanded.join(":");
  }

  const candidates = [fromField, fromFile].map(normalizeCourseCode).filter(Boolean);
  for (const candidate of candidates) {
    if (isValidCourseCode(candidate)) {
      return candidate;
    }
  }
  return isValidCourseCode(fromFile) ? fromFile : normalizeCourseCode(fromField || fromFile);
}

function extractSubjectTitle(text, code) {
  const multiTitles = extractMultiLineSubjectTitles(text);
  if (multiTitles) {
    return multiTitles.join("\n");
  }

  const candidates = [
    findLineValue(text, "Subject Title"),
    findFieldValue(text, "Subject Title", ["Credit Value"]),
  ].filter(Boolean);

  for (const raw of candidates) {
    const name = normalizeCourseName(raw, code);
    if (name) {
      return name;
    }
  }
  return null;
}

function splitCourseCodes(rawCode) {
  const normalized = normalizeCourseCode(rawCode);
  if (!normalized) {
    return [];
  }

  const rangeMatch = normalized.match(/^([A-Z]{2,6})(\d{3,4})-(\d{3,4})$/i);
  if (rangeMatch) {
    const prefix = rangeMatch[1].toUpperCase();
    const start = Number(rangeMatch[2]);
    const end = Number(rangeMatch[3]);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start <= 12) {
      const rangeCodes = [];
      for (let number = start; number <= end; number += 1) {
        const code = `${prefix}${number}`;
        if (isValidSingleCourseCode(code)) {
          rangeCodes.push(code);
        }
      }
      if (rangeCodes.length > 1) {
        return rangeCodes;
      }
    }
  }

  if (normalized.includes(":")) {
    const parts = normalized
      .split(":")
      .map((part) => normalizeCourseCode(part))
      .filter(Boolean);
    if (parts.length > 1 && parts.every(isValidSingleCourseCode)) {
      return parts;
    }
  }

  const re = /[A-Z]{2,6}\d{3,4}[A-Z0-9]*/gi;
  const matches = [];
  let match;
  while ((match = re.exec(normalized)) !== null) {
    const part = match[0].toUpperCase();
    if (isValidSingleCourseCode(part) && !matches.includes(part)) {
      matches.push(part);
    }
  }

  const compact = normalized.replace(/[^A-Z0-9]/gi, "");
  if (matches.length > 1 && matches.join("") === compact) {
    return matches;
  }

  return [normalized];
}

function splitCourseNames(name, count) {
  if (count <= 1 || !name) {
    return [name];
  }

  if (name.includes("\n")) {
    const lines = name
      .split("\n")
      .map((line) => cleanInlineValue(line))
      .filter(Boolean);
    if (lines.length === count) {
      return lines;
    }
  }

  const romanChunks = [
    ...name.matchAll(/(.+?\s+(?:I{1,3}|IV|VI{0,3}|IX|X))\b/gi),
  ].map((item) => item[1].trim());

  if (romanChunks.length === count) {
    return romanChunks;
  }

  const numberedChunks = [
    ...name.matchAll(/(.+?\s+\d+)\s*(?=\S)/g),
  ].map((item) => item[1].trim());

  if (numberedChunks.length === count) {
    return numberedChunks;
  }

  return Array.from({ length: count }, () => name);
}

function buildSharedPdfDescriptionNote(allCodes, currentCode) {
  const siblings = allCodes.filter((code) => code !== currentCode);
  if (siblings.length === 0) {
    return "";
  }
  return `【说明】本课程与 ${siblings.join("、")} 共用同一份官方课程大纲 PDF（合讲/跨课课程），大纲内容相同，仅课号不同。\n\n`;
}

function prependSharedPdfNote(description, allCodes, currentCode) {
  const note = buildSharedPdfDescriptionNote(allCodes, currentCode);
  if (!note) {
    return description;
  }
  if (description?.includes("共用同一份官方课程大纲")) {
    return description;
  }
  return `${note}${description ?? ""}`.trim() || null;
}

function expandMergedCourse(course) {
  const codes = splitCourseCodes(course.code);
  if (codes.length <= 1) {
    return [course];
  }

  const names = splitCourseNames(course.name, codes.length);

  return codes.map((code, index) => {
    const rawName = names[index] ?? course.name;
    const name =
      normalizeCourseName(rawName, code) ??
      rawName ??
      `（待补充）${code}`;

    return {
      ...course,
      code,
      name: truncate(name, 300),
      description: prependSharedPdfNote(course.description, codes, code),
      _splitFrom: course.code,
      _splitIndex: index,
      _splitTotal: codes.length,
    };
  });
}

function validateAndFixCourse(course, filePath) {
  const fileCode = buildCourseCodeFromFile(filePath);
  const fixes = [];

  let code = normalizeCourseCode(course.code);
  if (!isValidCourseCode(code)) {
    if (isValidCourseCode(fileCode)) {
      fixes.push(`code: ${course.code} → ${fileCode}`);
      code = fileCode;
    }
  }
  course.code = code;

  let name = normalizeCourseName(course.name, code);
  if (!name) {
    const retried = extractSubjectTitle(
      course._rawText ?? "",
      code,
    );
    if (retried) {
      fixes.push(`name: retried from PDF text`);
      name = retried;
    }
  }
  if (!name) {
    name = `（待补充）${code}`;
    fixes.push("name: fallback placeholder");
  }
  course.name = truncate(name, 300);

  const credits = normalizeCreditsValue(course.credits ?? course._rawCredits);
  if (credits !== course.credits) {
    if (course.credits != null) {
      fixes.push(`credits: ${course.credits} → ${credits}`);
    }
  }
  course.credits = credits;

  const rawLevel = course._rawLevel ?? course.level;
  const level = normalizeLevelValue(rawLevel);
  if (
    rawLevel != null &&
    String(rawLevel).trim() !== String(level ?? "")
  ) {
    fixes.push(
      `level: trimmed "${String(rawLevel).slice(0, 40)}" → ${level}`,
    );
  }
  course.level = level;

  course._validation = {
    valid: isValidCourseCode(course.code) && !looksLikeCourseCodeOnly(course.name),
    fixes,
    fileCode,
  };

  delete course._rawText;
  delete course._rawCredits;
  delete course._rawLevel;

  return course;
}

async function parseCoursePdf(filePath, courseDir) {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const text = normalizeText(parsed.text);
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const departmentFolder = path.basename(path.dirname(filePath)).toUpperCase();
  const meta = DEPARTMENT_META[departmentFolder] ?? {
    department: departmentFolder.toLowerCase(),
    faculty: null,
  };

  const code = extractSubjectCode(text, filePath);
  const rawCredits = findFieldValue(text, "Credit Value", ["Level"]);
  const rawLevel = findFieldValue(text, "Level", [
    "Pre-requisite",
    "Co-requisite",
    "Exclusion",
    "Objectives",
  ]);
  const name = extractSubjectTitle(text, code);
  const credits = normalizeCreditsValue(rawCredits);
  const level = normalizeLevelValue(rawLevel);
  const objectives = sliceSection(text, ["Objectives"], [
    "Intended Learning",
    "Subject Synopsis",
  ]);
  const description = sliceSection(text, ["Subject Synopsis", "Indicative Syllabus"], [
    "Teaching/Learning",
    "Assessment",
  ]);
  const prerequisites = sliceSection(text, ["Pre-requisite", "Co-requisite", "Exclusion"], [
    "Objectives",
    "Subject Synopsis",
  ]);
  const teachingPattern = sliceSection(text, ["Teaching/Learning"], ["Assessment"]);
  const assessmentSection = sliceSection(text, ["Assessment"], [
    "Student Study",
    "Reading List",
    "--",
  ]);

  const course = {
    code,
    name: name ?? code,
    department: meta.department,
    faculty: meta.faculty,
    level,
    credits,
    description,
    objectives,
    prerequisites,
    teaching_pattern: teachingPattern,
    semester_offered: null,
    assessment_json: parseAssessment(assessmentSection),
    pdf_url: null,
    pdf_storage_path: relativePath,
    source_file_name: path.basename(filePath),
    source_updated_at: null,
    school_id: SCHOOL_ID,
    _relativePath: path.relative(courseDir, filePath),
    _rawText: text,
    _rawCredits: rawCredits,
    _rawLevel: rawLevel,
  };

  return validateAndFixCourse(course, filePath);
}

async function getExistingCourseCodes(supabase) {
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
      throw new Error(`Failed to read existing courses: ${error.message}`);
    }

    for (const row of data ?? []) {
      existing.add(String(row.code).toUpperCase());
    }

    if (!data || data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return existing;
}

async function listLegacyMergedCourses(supabase) {
  const legacy = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("courses")
      .select("id,code")
      .eq("school_id", SCHOOL_ID)
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to read courses for cleanup: ${error.message}`);
    }

    for (const row of data ?? []) {
      const code = String(row.code).toUpperCase();
      if (code.includes(":") || splitCourseCodes(code).length > 1) {
        legacy.push({ id: row.id, code });
      }
    }

    if (!data || data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return legacy;
}

async function cleanupLegacyMergedCourses(supabase, dryRun) {
  const legacy = await listLegacyMergedCourses(supabase);
  console.log(`Found ${legacy.length} legacy merged course records to remove.`);

  if (legacy.length === 0 || dryRun) {
    if (dryRun && legacy.length > 0) {
      for (const item of legacy.slice(0, 10)) {
        console.log(`- would delete ${item.code}`);
      }
    }
    return legacy.length;
  }

  for (let i = 0; i < legacy.length; i += INSERT_BATCH_SIZE) {
    const batch = legacy.slice(i, i + INSERT_BATCH_SIZE);
    const ids = batch.map((item) => item.id);
    const { error } = await supabase.from("courses").delete().in("id", ids);
    if (error) {
      throw new Error(`Failed to delete legacy merged courses: ${error.message}`);
    }
  }

  console.log(`Removed ${legacy.length} legacy merged course records.`);
  return legacy.length;
}

async function main() {
  const options = parseArgs();
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if ((!supabaseUrl || !serviceRoleKey) && !options.dryRun) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local before importing.",
    );
  }

  const supabase =
    supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        })
      : null;
  const pdfFiles = await walkPdfs(path.resolve(options.courseDir));
  const existingCodes = supabase ? await getExistingCourseCodes(supabase) : new Set();
  const seenInFolder = new Set();
  const newCourses = [];
  const skipped = [];
  const validationStats = {
    fixed: 0,
    invalidCode: 0,
    namePlaceholder: 0,
    levelFixed: 0,
    splitFromPdf: 0,
  };

  for (const [index, filePath] of pdfFiles.entries()) {
    try {
      const parsed = await parseCoursePdf(filePath, path.resolve(options.courseDir));
      const expanded = expandMergedCourse(parsed);

      if (expanded.length > 1) {
        validationStats.splitFromPdf += expanded.length;
      }

      for (const course of expanded) {
        if (course._validation?.fixes?.length) {
          validationStats.fixed += 1;
          if (course._validation.fixes.some((f) => f.startsWith("level:"))) {
            validationStats.levelFixed += 1;
          }
          if (course._validation.fixes.some((f) => f.startsWith("name:"))) {
            validationStats.namePlaceholder += 1;
          }
        }

        if (!isValidSingleCourseCode(course.code)) {
          skipped.push({
            code: course.code,
            file: course._relativePath,
            reason: course._splitFrom
              ? `invalid split code from ${course._splitFrom}`
              : "invalid course code",
          });
          validationStats.invalidCode += 1;
          continue;
        }

        const duplicateInFolder = seenInFolder.has(course.code);
        seenInFolder.add(course.code);

        if (duplicateInFolder) {
          skipped.push({
            code: course.code,
            file: course._relativePath,
            reason: "duplicate in folder",
          });
          continue;
        }

        if (!options.updateExisting && existingCodes.has(course.code)) {
          skipped.push({
            code: course.code,
            file: course._relativePath,
            reason: "already in database",
          });
          continue;
        }

        newCourses.push(course);
      }
    } catch (error) {
      skipped.push({
        code: buildCourseCodeFromFile(filePath),
        file: path.relative(options.courseDir, filePath),
        reason: error instanceof Error ? error.message : "parse failed",
      });
    }

    if ((index + 1) % 50 === 0 || index + 1 === pdfFiles.length) {
      console.log(
        `Parsed ${index + 1}/${pdfFiles.length} · to import ${newCourses.length} · skipped ${skipped.length}`,
      );
    }
  }

  console.log(`Found ${pdfFiles.length} PDF files.`);
  console.log(`Prepared ${newCourses.length} courses to ${options.updateExisting ? "upsert" : "insert"}.`);
  console.log(`Skipped ${skipped.length} courses.`);
  console.log(
    `Validation: fixed ${validationStats.fixed}, level trimmed ${validationStats.levelFixed}, name placeholder ${validationStats.namePlaceholder}, invalid code ${validationStats.invalidCode}, split records ${validationStats.splitFromPdf}`,
  );

  if (skipped.length > 0) {
    console.log("\nSkipped examples:");
    for (const item of skipped.slice(0, 10)) {
      console.log(`- ${item.code} (${item.reason}) ${item.file}`);
    }
  }

  if (newCourses.length > 0) {
    console.log("\nCourse examples:");
    for (const item of newCourses.slice(0, 10)) {
      console.log(`- ${item.code}: ${item.name}`);
    }
  }

  if (options.dryRun) {
    console.log("\nDry run only. No database changes were made.");
    if (options.cleanupLegacyMerged && supabase) {
      await cleanupLegacyMergedCourses(supabase, true);
    }
    if (!supabase) {
      console.log(
        "SUPABASE_SERVICE_ROLE_KEY is missing, so dry run did not check existing database courses.",
      );
    }
    return;
  }

  if (newCourses.length === 0) {
    console.log("\nNo new courses to import.");
    return;
  }

  const payload = newCourses.map(
    ({ _relativePath, _validation, _splitFrom, _splitIndex, _splitTotal, ...course }) =>
      sanitizeCourse(course),
  );

  if (options.updateExisting) {
    for (let i = 0; i < payload.length; i += INSERT_BATCH_SIZE) {
      const batch = payload.slice(i, i + INSERT_BATCH_SIZE);
      const { error } = await supabase
        .from("courses")
        .upsert(batch, { onConflict: "code,school_id" });

      if (error) {
        throw new Error(`Failed to upsert courses (batch ${i}): ${error.message}`);
      }
      console.log(`Upserted ${Math.min(i + INSERT_BATCH_SIZE, payload.length)} / ${payload.length}`);
    }
  } else {
    for (let i = 0; i < payload.length; i += INSERT_BATCH_SIZE) {
      const batch = payload.slice(i, i + INSERT_BATCH_SIZE);
      const { error } = await supabase.from("courses").insert(batch);

      if (error) {
        throw new Error(`Failed to insert courses (batch ${i}): ${error.message}`);
      }
      console.log(`Inserted ${Math.min(i + INSERT_BATCH_SIZE, payload.length)} / ${payload.length}`);
    }
  }

  console.log(`\nImported ${newCourses.length} courses successfully.`);

  if (options.cleanupLegacyMerged && supabase) {
    await cleanupLegacyMergedCourses(supabase, false);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
