#!/usr/bin/env node
/**
 * 将文件名中的英文冒号 ":" 替换为下划线 "_"，避免 Windows 无法识别。
 *
 * 用法：
 *   node scripts/sanitize-windows-filenames.mjs              # 扫描当前项目并重命名
 *   node scripts/sanitize-windows-filenames.mjs --dry-run    # 只预览，不改名
 *   node scripts/sanitize-windows-filenames.mjs --watch      # 持续监视新文件
 *   node scripts/sanitize-windows-filenames.mjs --dir=学科   # 指定目录
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { watch } from "node:fs";

const PROJECT_ROOT = process.cwd();

const DEFAULT_IGNORE = new Set([
  ".git",
  ".next",
  "node_modules",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".vercel",
]);

function parseArgs(argv) {
  const args = {
    dryRun: false,
    watch: false,
    dir: PROJECT_ROOT,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--watch") args.watch = true;
    else if (arg.startsWith("--dir=")) {
      const value = arg.slice("--dir=".length);
      args.dir = path.isAbsolute(value)
        ? value
        : path.resolve(PROJECT_ROOT, value);
    }
  }

  return args;
}

function sanitizeName(name) {
  // 仅处理英文冒号（Windows 非法字符）；保留中文全角冒号「：」
  return name.replaceAll(":", "_");
}

function shouldIgnoreDir(dirName) {
  return DEFAULT_IGNORE.has(dirName);
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function uniqueTargetPath(dir, desiredName) {
  const ext = path.extname(desiredName);
  const base = path.basename(desiredName, ext);
  let candidate = desiredName;
  let index = 1;

  while (await pathExists(path.join(dir, candidate))) {
    candidate = `${base}_${index}${ext}`;
    index += 1;
  }

  return candidate;
}

/**
 * @returns {Promise<{ renamed: number, skipped: number, errors: number }>}
 */
async function renameIfNeeded(filePath, { dryRun }) {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);

  if (!name.includes(":")) {
    return { renamed: 0, skipped: 1, errors: 0 };
  }

  const sanitized = sanitizeName(name);
  let finalName = sanitized;
  const destPath = path.join(dir, sanitized);

  if (destPath !== filePath && (await pathExists(destPath))) {
    finalName = await uniqueTargetPath(dir, sanitized);
  }

  const finalPath = path.join(dir, finalName);
  const relFrom = path.relative(PROJECT_ROOT, filePath) || filePath;
  const relTo = path.relative(PROJECT_ROOT, finalPath) || finalPath;

  if (dryRun) {
    console.log(`[dry-run] ${relFrom}  →  ${relTo}`);
    return { renamed: 1, skipped: 0, errors: 0 };
  }

  try {
    await fs.rename(filePath, finalPath);
    console.log(`✓ ${relFrom}  →  ${relTo}`);
    return { renamed: 1, skipped: 0, errors: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ 重命名失败: ${relFrom} (${message})`);
    return { renamed: 0, skipped: 0, errors: 1 };
  }
}

async function walk(dir, onFile) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`无法读取目录 ${dir}: ${message}`);
    return;
  }

  for (const entry of entries) {
    if (entry.name === "." || entry.name === "..") continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (shouldIgnoreDir(entry.name)) continue;
      // 目录名若含冒号，也一并处理
      if (entry.name.includes(":")) {
        await onFile(fullPath, { isDirectory: true });
      }
      // 目录改名后路径可能变化，重新拼路径不安全；先收集再处理更稳
      await walk(fullPath, onFile);
      continue;
    }

    if (entry.isFile() || entry.isSymbolicLink()) {
      await onFile(fullPath, { isDirectory: false });
    }
  }
}

async function collectTargets(rootDir) {
  /** @type {string[]} */
  const files = [];
  /** @type {string[]} */
  const dirs = [];

  async function walkCollect(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (shouldIgnoreDir(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walkCollect(fullPath);
        if (entry.name.includes(":")) {
          dirs.push(fullPath);
        }
      } else if (entry.isFile() || entry.isSymbolicLink()) {
        if (entry.name.includes(":")) {
          files.push(fullPath);
        }
      }
    }
  }

  await walkCollect(rootDir);
  // 先文件后目录（深层目录先改：按路径长度降序）
  files.sort((a, b) => b.length - a.length);
  dirs.sort((a, b) => b.length - a.length);
  return { files, dirs };
}

async function sanitizeOnce(rootDir, { dryRun }) {
  const { files, dirs } = await collectTargets(rootDir);
  let renamed = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of files) {
    const result = await renameIfNeeded(filePath, { dryRun });
    renamed += result.renamed;
    skipped += result.skipped;
    errors += result.errors;
  }

  for (const dirPath of dirs) {
    // 目录可能因父级已改名而不存在
    if (!(await pathExists(dirPath))) continue;
    const result = await renameIfNeeded(dirPath, { dryRun });
    renamed += result.renamed;
    skipped += result.skipped;
    errors += result.errors;
  }

  return { renamed, skipped, errors, found: files.length + dirs.length };
}

function startWatch(rootDir, { dryRun }) {
  console.log(`监视中: ${rootDir}`);
  console.log("有新文件名含 ':' 时会自动改为 '_'（Ctrl+C 退出）\n");

  /** @type {Map<string, NodeJS.Timeout>} */
  const timers = new Map();

  const schedule = (filePath) => {
    const prev = timers.get(filePath);
    if (prev) clearTimeout(prev);
    timers.set(
      filePath,
      setTimeout(async () => {
        timers.delete(filePath);
        if (!(await pathExists(filePath))) return;
        const name = path.basename(filePath);
        if (!name.includes(":")) return;
        await renameIfNeeded(filePath, { dryRun });
      }, 300),
    );
  };

  const watcher = watch(
    rootDir,
    { recursive: true },
    (_eventType, filename) => {
      if (!filename) return;
      // 忽略隐藏/依赖目录片段
      const parts = filename.split(path.sep);
      if (parts.some((part) => shouldIgnoreDir(part))) return;
      schedule(path.join(rootDir, filename));
    },
  );

  watcher.on("error", (error) => {
    console.error("监视出错:", error instanceof Error ? error.message : error);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!(await pathExists(options.dir))) {
    throw new Error(`目录不存在: ${options.dir}`);
  }

  console.log(`目标目录: ${options.dir}`);
  console.log(`模式: ${options.dryRun ? "dry-run（不改名）" : "实际重命名"}`);
  console.log("");

  const summary = await sanitizeOnce(options.dir, options);
  console.log("");
  console.log(
    `扫描完成：发现 ${summary.found} 个含冒号的名称，重命名 ${summary.renamed}，失败 ${summary.errors}`,
  );

  if (options.watch) {
    console.log("");
    startWatch(options.dir, options);
    await new Promise(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
