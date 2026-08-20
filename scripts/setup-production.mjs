/**
 * 生产上线一键脚本（不含内容导入）
 *
 * 前置：
 *   1. npx vercel login 已完成
 *   2. .env.local 含 NEXT_PUBLIC_SUPABASE_* 与 SUPABASE_SERVICE_ROLE_KEY
 *   3. 可选 SUPABASE_ACCESS_TOKEN（用于自动配置 Auth 回调）
 *
 * 用法：
 *   node scripts/setup-production.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const PROJECT_REF = "fmumzuwcuysvrxzamdre";

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
    stdio: options.silent ? "pipe" : "inherit",
    encoding: "utf8",
    env: process.env,
    input: options.input,
  });
  if (result.status !== 0) {
    const err = result.stderr || result.stdout || "";
    throw new Error(`命令失败: ${command} ${args.join(" ")}\n${err}`);
  }
  return result.stdout ?? "";
}

function setEnv(name, value) {
  run("npx", ["vercel", "env", "add", name, "production", "--force"], {
    input: `${value}\n`,
  });
}

function getProductionUrl() {
  const output = run("npx", ["vercel", "inspect", "--prod"], { silent: true });
  const match = output.match(/https:\/\/[^\s]+\.vercel\.app/);
  if (!match) {
    throw new Error("无法解析生产域名，请从 Vercel Dashboard 复制后手动配置 Auth");
  }
  return match[0].replace(/\/+$/, "");
}

function mergeRedirectUrls(existing, siteUrl) {
  const required = [
    `${siteUrl}/auth/callback`,
    "http://localhost:3000/auth/callback",
    "https://*.up.railway.app/auth/callback",
    "https://*.vercel.app/auth/callback",
  ];
  const current = String(existing ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([...current, ...required])].join(",");
}

async function configureSupabaseAuth(siteUrl) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    console.log("\n跳过 Supabase Auth 自动配置（未设置 SUPABASE_ACCESS_TOKEN）");
    console.log("请手动在 Supabase Dashboard → Authentication → URL Configuration 设置：");
    console.log(`  Site URL: ${siteUrl}`);
    console.log(`  Redirect: ${siteUrl}/auth/callback`);
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const getRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    { headers },
  );
  if (!getRes.ok) {
    throw new Error(`读取 Auth 配置失败 (${getRes.status})`);
  }
  const current = await getRes.json();
  const payload = {
    site_url: siteUrl,
    uri_allow_list: mergeRedirectUrls(current.uri_allow_list, siteUrl),
  };
  const patchRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    },
  );
  if (!patchRes.ok) {
    const body = await patchRes.text();
    throw new Error(`更新 Auth 配置失败 (${patchRes.status}): ${body}`);
  }
  console.log("\n✓ Supabase Auth URL 已更新");
}

async function verifySupabaseSchema() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { error } = await sb.from("posts").select("id").eq("module", "study").limit(1);
  if (error) {
    throw new Error(`Supabase 迁移可能未完成: ${error.message}`);
  }
  console.log("✓ Supabase 迁移状态正常（study 模块可用）");
}

async function main() {
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error(".env.local 缺少 Supabase 环境变量");
  }

  console.log("=== 步骤 1/3：检查 Supabase 迁移 ===");
  await verifySupabaseSchema();

  console.log("\n=== 步骤 2/3：Vercel 部署 ===");
  run("npx", ["vercel", "whoami"]);
  run("npx", ["vercel", "link", "--yes"]);

  setEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);

  console.log("\n首次部署以获取生产域名…");
  run("npx", ["vercel", "--prod", "--yes"]);

  const siteUrl = getProductionUrl();
  console.log(`\n生产域名: ${siteUrl}`);

  setEnv("NEXT_PUBLIC_SITE_URL", siteUrl);
  console.log("\n重新部署以应用 SITE_URL…");
  run("npx", ["vercel", "--prod", "--yes"]);

  console.log("\n=== 步骤 3/3：Supabase Auth 回调 ===");
  await configureSupabaseAuth(siteUrl);

  console.log("\n=== 上线完成 ===");
  console.log(`健康检查: ${siteUrl}/api/health`);
  console.log(`登录测试: ${siteUrl}/auth/login`);
}

main().catch((error) => {
  console.error("\n✗", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
