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
      const endMatch = tail.match(new RegExp(`\\n?${endEscaped}\\s+`, "i"));
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
  return path.basename(filePath, ".pdf").replace(/_\d+$/, "").trim().toUpperCase();
}

function normalizeCourseCode(value) {
  return value
    .replace(/\s+/g, "")
    .replace(/\//g, ":")
    .replace(/_+\d+$/, "")
    .trim()
    .toUpperCase();
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

  const code = normalizeCourseCode(
    findFieldValue(text, "Subject Code", ["Subject Title"]) ??
      buildCourseCodeFromFile(filePath),
  );
  const rawName = findFieldValue(text, "Subject Title", ["Credit Value"]) ?? code;
  const name =
    rawName.length > 300 || /\n/.test(rawName)
      ? cleanInlineValue(rawName.split("\n")[0]).slice(0, 300) || code
      : rawName.trim();
  const credits = parseCredits(findFieldValue(text, "Credit Value", ["Level"]));
  const level = findFieldValue(text, "Level", [
    "Pre-requisite",
    "Co-requisite",
    "Exclusion",
    "Objectives",
  ]);
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

  return {
    code,
    name: name.trim(),
    department: meta.department,
    faculty: meta.faculty,
    level: level?.trim() ?? null,
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
  };
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

  for (const [index, filePath] of pdfFiles.entries()) {
    try {
      const course = await parseCoursePdf(filePath, path.resolve(options.courseDir));
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

  const payload = newCourses.map(({ _relativePath, ...course }) => sanitizeCourse(course));

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
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
