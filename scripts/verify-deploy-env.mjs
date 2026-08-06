import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();

const REQUIRED_PUBLIC = [
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    hint: "Supabase → Project Settings → API → Project URL",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    hint: "Supabase → Project Settings → API → anon public key",
  },
  {
    key: "NEXT_PUBLIC_SITE_URL",
    hint: "生产域名，如 https://your-app.vercel.app（勿用 localhost）",
    productionOnly: true,
  },
];

function isPlaceholder(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("your_supabase") ||
    normalized.includes("your_") ||
    normalized === "undefined" ||
    normalized === "null"
  );
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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

function checkVar({ key, hint, productionOnly = false }) {
  const value = process.env[key]?.trim() ?? "";
  const issues = [];

  if (isPlaceholder(value)) {
    issues.push(`缺少或仍为占位符`);
  } else if (!isValidHttpUrl(value) && key.endsWith("_URL")) {
    issues.push(`不是有效的 http(s) URL`);
  } else if (
    productionOnly &&
    /localhost|127\.0\.0\.1/.test(value)
  ) {
    issues.push(`生产环境不应使用 localhost`);
  }

  return { key, hint, value: value ? "(已设置)" : "(空)", issues };
}

async function main() {
  const production = process.argv.includes("--production");
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));
  await loadEnvFile(path.join(PROJECT_ROOT, ".env"));

  console.log(
    production
      ? "PolyUHub 生产部署环境变量检查"
      : "PolyUHub 本地/部署环境变量检查",
  );
  console.log("");

  const results = REQUIRED_PUBLIC.filter(
    (item) => !production || !item.key.includes("SERVICE"),
  ).map((item) =>
    checkVar({
      ...item,
      productionOnly: production ? item.productionOnly : false,
    }),
  );

  let failed = false;
  for (const result of results) {
    if (result.issues.length === 0) {
      console.log(`✓ ${result.key} ${result.value}`);
      continue;
    }
    failed = true;
    console.log(`✗ ${result.key}: ${result.issues.join("；")}`);
    console.log(`  → ${result.hint}`);
  }

  console.log("");
  if (production) {
    console.log("Supabase Auth 还需在控制台配置：");
    console.log("  Site URL = NEXT_PUBLIC_SITE_URL 相同");
    console.log("  Redirect URLs 包含：");
    console.log("    https://<域名>/auth/callback");
    console.log("    http://localhost:3000/auth/callback （本地开发）");
  } else {
    console.log("本地开发通过后可执行：npm run verify:deploy -- --production");
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
