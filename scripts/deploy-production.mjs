/**
 * 生产部署辅助：Vercel link + 环境变量 + 首次 prod 部署
 * 前置：npx vercel login 已完成
 *
 * 用法：
 *   node scripts/deploy-production.mjs --site-url=https://your-app.vercel.app
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();

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

function run(command, args, options = {}) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`命令失败: ${command} ${args.join(" ")}`);
  }
}

function parseArgs() {
  const siteUrlArg = process.argv.find((arg) => arg.startsWith("--site-url="));
  return {
    siteUrl: siteUrlArg?.replace("--site-url=", "").replace(/\/+$/, ""),
  };
}

async function setVercelEnv(name, value) {
  run("npx", [
    "vercel",
    "env",
    "add",
    name,
    "production",
    "--force",
    "--yes",
  ], {
    input: `${value}\n`,
  });
}

async function main() {
  const { siteUrl } = parseArgs();
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !anonKey) {
    throw new Error(".env.local 缺少 NEXT_PUBLIC_SUPABASE_URL 或 ANON_KEY");
  }
  if (!siteUrl) {
    throw new Error("请传入 --site-url=https://your-app.vercel.app");
  }

  run("npx", ["vercel", "whoami"]);
  run("npx", ["vercel", "link", "--yes"]);

  await setVercelEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  await setVercelEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);
  await setVercelEnv("NEXT_PUBLIC_SITE_URL", siteUrl);

  run("npx", ["vercel", "--prod", "--yes"]);

  console.log("\n部署完成。请访问：");
  console.log(`  ${siteUrl}/api/health`);
  console.log(`  ${siteUrl}/auth/login`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
