import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();
const CONTENT_ROOTS = [
  path.join(PROJECT_ROOT, "content", "guides"),
  path.join(PROJECT_ROOT, "content", "life"),
  path.join(PROJECT_ROOT, "content", "study"),
];
const SCHOOL_ID = "polyu";

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
    keepExisting: args.has("--keep-existing"),
    moduleFilter: process.argv
      .slice(2)
      .find((arg) => arg.startsWith("--module="))
      ?.replace("--module=", ""),
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

function parseFrontMatter(raw) {
  const normalized = raw.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    throw new Error("Markdown 缺少 YAML front matter");
  }

  const endIndex = normalized.indexOf("\n---", 4);
  if (endIndex === -1) {
    throw new Error("Markdown front matter 未正确结束");
  }

  const front = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 4).replace(/^\r?\n/, "");
  const data = {};
  let currentListKey = null;

  for (const line of front.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentListKey) {
      data[currentListKey].push(listItem[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    const match = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!match) {
      throw new Error(`无法解析 front matter 行: ${line}`);
    }

    const key = match[1];
    let rawValue = match[2].trim();
    currentListKey = null;

    if (rawValue === "") {
      data[key] = [];
      currentListKey = key;
      continue;
    }

    if (rawValue === "true" || rawValue === "false") {
      data[key] = rawValue === "true";
      continue;
    }

    if (/^\d+$/.test(rawValue)) {
      data[key] = Number(rawValue);
      continue;
    }

    if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      data[key] = JSON.parse(rawValue);
      continue;
    }

    data[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }

  return { data, body: body.trim() + "\n" };
}

async function loadArticles() {
  const articles = [];

  for (const dir of CONTENT_ROOTS) {
    let entries = [];
    try {
      entries = await fs.readdir(dir);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }

    const files = entries
      .filter((name) => name.endsWith(".md"))
      .sort((a, b) => a.localeCompare(b, "en"));

    for (const fileName of files) {
      const fullPath = path.join(dir, fileName);
      const raw = await fs.readFile(fullPath, "utf8");
      const { data, body } = parseFrontMatter(raw);
      const moduleName = String(data.module || path.basename(dir));

      if (!data.id || !data.title || !data.category) {
        throw new Error(`${fileName} 缺少 id / title / category`);
      }

      articles.push({
        fileName,
        id: String(data.id),
        module: moduleName,
        title: String(data.title),
        category: String(data.category),
        excerpt: data.excerpt ? String(data.excerpt) : null,
        targetAudience: data.targetAudience ? String(data.targetAudience) : null,
        estimatedReadingTime:
          typeof data.estimatedReadingTime === "number"
            ? data.estimatedReadingTime
            : null,
        isPinned: Boolean(data.isPinned),
        topics: Array.isArray(data.topics) ? data.topics.map(String) : [],
        content: body.replace(/\*\*(.+?)\*\*/g, "$1"),
      });
    }
  }

  return articles;
}

async function resolveAuthorId(supabase) {
  const { data: admins, error: adminError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1);

  if (adminError) throw new Error(`查询管理员失败: ${adminError.message}`);
  if (admins?.[0]?.id) return admins[0].id;

  const { data: users, error: userError } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (userError) throw new Error(`查询用户失败: ${userError.message}`);
  if (!users?.[0]?.id) {
    throw new Error("数据库中还没有任何 profiles。请先登录一次再导入。");
  }
  return users[0].id;
}

async function softDeleteModule(supabase, moduleName) {
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .update({ deleted_at: deletedAt })
    .eq("module", moduleName)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    throw new Error(`软删 ${moduleName} 失败: ${error.message}`);
  }
  return data?.length ?? 0;
}

async function upsertArticle(supabase, article, authorId) {
  const now = new Date().toISOString();

  const { error: postError } = await supabase.from("posts").upsert(
    {
      id: article.id,
      module: article.module,
      category_id: article.category,
      user_id: authorId,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      topics: article.topics,
      status: "published",
      school_id: SCHOOL_ID,
      deleted_at: null,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (postError) {
    throw new Error(`写入 posts 失败（${article.fileName}）: ${postError.message}`);
  }

  if (article.module !== "guides") {
    return;
  }

  const { error: metaError } = await supabase.from("guides_meta").upsert(
    {
      post_id: article.id,
      stage: article.category,
      category: article.category,
      target_audience: article.targetAudience,
      estimated_reading_time: article.estimatedReadingTime,
      last_verified_at: now,
      source_links: [],
      is_pinned: article.isPinned,
      updated_at: now,
    },
    { onConflict: "post_id" },
  );

  if (metaError) {
    throw new Error(
      `写入 guides_meta 失败（${article.fileName}）: ${metaError.message}`,
    );
  }
}

async function main() {
  const options = parseArgs();
  await loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));
  await loadEnvFile(path.join(PROJECT_ROOT, ".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey || serviceKey.includes("your_supabase")) {
    throw new Error(
      "请在 .env.local 配置真实的 NEXT_PUBLIC_SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  let articles = await loadArticles();
  if (options.moduleFilter) {
    articles = articles.filter((item) => item.module === options.moduleFilter);
  }

  console.log(`已读取 ${articles.length} 篇内容`);

  if (options.dryRun) {
    for (const article of articles) {
      console.log(
        `- [${article.module}/${article.category}] ${article.title} (${article.content.length} chars)`,
      );
    }
    console.log("dry-run 完成，未写入数据库。");
    return;
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authorId = await resolveAuthorId(supabase);
  console.log(`使用作者 profile: ${authorId}`);

  const modules = [...new Set(articles.map((item) => item.module))];

  for (const moduleName of modules) {
    const moduleArticles = articles.filter((item) => item.module === moduleName);

    if (!options.keepExisting) {
      try {
        const count = await softDeleteModule(supabase, moduleName);
        console.log(`已软删旧 ${moduleName} 内容 ${count} 篇`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("invalid input value for enum module_key")) {
          console.error(
            `✗ 跳过模块 ${moduleName}：数据库尚未加入 module_key='${moduleName}'。请先在 Supabase 执行 supabase/migrations/011_module_key_study_life.sql`,
          );
          continue;
        }
        throw error;
      }
    }

    for (const article of moduleArticles) {
      try {
        await upsertArticle(supabase, article, authorId);
        console.log(`✓ [${article.module}] ${article.title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("invalid input value for enum module_key")) {
          console.error(
            `✗ 跳过 ${article.title}：请先执行 011_module_key_study_life.sql`,
          );
          break;
        }
        throw error;
      }
    }
  }

  console.log("导入流程结束。可查看 /guides /life /study。");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
