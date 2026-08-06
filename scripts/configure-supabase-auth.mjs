/**
 * 通过 Supabase Management API 配置 Auth Site URL 与 Redirect URLs。
 * 需要 .env.local 中的 SUPABASE_ACCESS_TOKEN（Dashboard → Account → Access Tokens）
 *
 * 用法：
 *   node scripts/configure-supabase-auth.mjs --site-url=https://your-app.vercel.app
 *   node scripts/configure-supabase-auth.mjs --site-url=https://your-app.vercel.app --dry-run
 */
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

function parseArgs() {
  const siteUrlArg = process.argv.find((arg) => arg.startsWith("--site-url="));
  const siteUrl = siteUrlArg?.replace("--site-url=", "").replace(/\/+$/, "");
  return {
    dryRun: process.argv.includes("--dry-run"),
    siteUrl,
  };
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
  const merged = [...new Set([...current, ...required])];
  return merged.join(",");
}

async function main() {
  const options = parseArgs();
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "请在 .env.local 添加 SUPABASE_ACCESS_TOKEN（Supabase Dashboard → Account → Access Tokens）",
    );
  }

  const siteUrl =
    options.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!siteUrl || siteUrl.includes("localhost")) {
    throw new Error(
      "请传入生产域名：--site-url=https://your-app.vercel.app",
    );
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
    const body = await getRes.text();
    throw new Error(`读取 Auth 配置失败 (${getRes.status}): ${body}`);
  }

  const current = await getRes.json();
  const payload = {
    site_url: siteUrl,
    uri_allow_list: mergeRedirectUrls(current.uri_allow_list, siteUrl),
  };

  console.log("将更新 Supabase Auth 配置：");
  console.log("  site_url:", payload.site_url);
  console.log("  uri_allow_list:", payload.uri_allow_list);

  if (options.dryRun) {
    console.log("dry-run 完成，未写入。");
    return;
  }

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

  console.log("✓ Supabase Auth URL 已更新");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
