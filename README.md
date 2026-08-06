# PolyUHub

PolyUHub 是一个面向香港理工大学（PolyU）学生的响应式 Web 校园信息社区。项目目标不是单纯做论坛，而是把课程评价、入学攻略、美食推荐、常用网站、找搭子和自由讨论区整合成一个可搜索、可互动、可长期维护的信息平台。

核心定位：**PolyU 学生自己的校园信息社区。**

核心文案：**选课前，先查 PolyUHub。**

## 当前项目进度

### 已完成 / 基础可用

- 首页流量入口：Hero、全站搜索、核心模块入口、热门课程、最新讨论、价值说明、页脚免责声明
- Supabase Magic Link 登录、PolyU 邮箱限制、onboarding、角色权限、个人主页
- 课程评价：列表 / 详情 / 评价 / 有用投票 / 收藏 / 举报；后台删除与课程管理
- 吃喝玩乐：地点列表、筛选、推荐、收藏、举报、用户提交
- 学习指南 / 生活指南：`/study`、`/life` + 后台内容 CMS；正文来自 `content/study`、`content/life`，用 `npm run import:guides` 导入
- 入学攻略（季节模块）：`FEATURES.seasonalGuides` 控制导航；列表 / 详情 / 收藏 / 评论 / 举报 / 后台 CMS
- 自由讨论区：分类、topic（含找搭子）、搜索排序、评论回复、赞藏举报
- 全站搜索 `/search`
- 社区规则 `/about/community-rules`（摘要 + 目录锚点）及登录 / 发帖 / 课评 / Food / 举报入口
- 法律页：条款 / 私隐 / 版权
- 举报系统与管理员后台（用户、内容、举报、操作日志）

### 待完善（非上线阻断）

- 生活指南部分栏目仍偏薄；美食冷启动数据不足
- 课程评价排序、后台评价筛选；课程 PDF 生产环境对象存储方案
- Study / Life 详情互动（评论 / 举报）与模块内搜索
- 账号注销流程与法务文案校准；通知 / 申诉入口
- `resources` 表为遗留数据，站点不暴露「常用网站」模块

## 技术栈

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui 风格组件
- Radix UI
- Supabase Auth
- Supabase PostgreSQL
- Supabase RLS
- Server Actions
- Railway / Node 生产部署
- `pdf-parse` 用于本地课程 PDF 导入脚本

## 项目结构

```text
app/                         Next.js 路由页面
  course-pdfs/[...path]/      本地课程 PDF 预览与下载路由
components/                  UI 组件与业务组件
constants/                   路由、模块、角色、分类、状态等常量
hooks/                       前端 hooks
lib/
  admin/                     管理后台 session 与 Server Actions
  auth/                      登录、session、onboarding
  course/                    课程评价 Server Actions
  db/                        Supabase 查询
  db/mappers/                DB row 到业务类型的映射
  forum/                     论坛 Server Actions
  interaction/               点赞、收藏、举报 Server Actions
  supabase/                  Supabase client/server/middleware
  utils/                     权限、日期、搜索等工具
  validations/               Zod 表单校验
scripts/                     本地维护脚本
supabase/
  migrations/                数据库迁移
  seed.sql                   初始数据
types/                       TypeScript 类型
middleware.ts                Supabase session 刷新与 onboarding 跳转
```

## 本地运行

### 环境要求

- Node.js 18+
- npm
- Supabase 项目

### 安装依赖

```bash
npm install
```

### 配置环境变量

在项目根目录创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 仅本地导入课程 PDF 脚本使用，不要暴露给前端
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role key
```

`SUPABASE_SERVICE_ROLE_KEY` 只用于本地批量导入课程数据，因为脚本需要绕过 RLS 写入 `courses` 表。不要提交到 GitHub。

### 启动开发服务器

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev              # 启动本地开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务
npm run lint             # 运行 ESLint
npm run typecheck        # TypeScript 类型检查
npm run import:guides    # 从 content/guides|life|study 导入内容到 posts
npm run import:courses   # 从 学科/ 文件夹导入课程 PDF
npm run verify:deploy    # 检查部署环境变量（加 --production 校验生产配置）
```

当前 `npm run typecheck` 已通过。

## Supabase 设置

### 1. 执行数据库迁移

按顺序在 Supabase `SQL Editor` 执行 `supabase/migrations/` 下全部文件：

```text
001_initial_schema.sql
002_rls_policies.sql
003_magic_link_onboarding.sql
004_forum_enhancements.sql
005_forum_reports.sql
006_forum_comment_replies.sql
007_course_reviews_enhancement.sql
008_simplify_course_reviews.sql
009_course_review_stats.sql
010_freshman_guides.sql
011_module_key_study_life.sql
012_relax_course_review_text_length.sql
013_content_images_storage.sql
014_food_places_user_insert.sql
015_food_place_target_type.sql
016_drop_estimated_reading_time.sql
017_drop_target_audience.sql
```

说明：

- `009`：课程评价统计字段与触发器
- `011`：为 `posts.module` 增加 `study` / `life`
- `013`：内容图 Storage bucket（`content-images`）
- `014` / `015`：美食地点用户提交与举报 target
- `016` / `017`：移除已废弃的攻略元数据列

可选执行：

```text
supabase/seed.sql
```

`supabase/seed_guides.sql` 已废弃；真实指南内容请用：

```bash
npm run import:guides
# 或只导入某一模块
npm run import:guides -- --module=study
```

### 2. 配置 Magic Link

在 Supabase 控制台：

- Authentication → Providers → Email：启用 Email 登录
- Authentication → URL Configuration：

本地开发：

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

生产（Railway 或其它平台部署后，把域名换成实际值）：

- Site URL: `https://你的生产域名`
- Redirect URLs 同时保留：
  - `http://localhost:3000/auth/callback`
  - `https://你的生产域名/auth/callback`
  - `https://*.up.railway.app/auth/callback`（Railway 默认域名）

并把环境变量 `NEXT_PUBLIC_SITE_URL` 设为生产 Site URL（不含末尾斜杠）。登录邮件里的回调地址由该变量生成。

项目默认只允许 `@connect.polyu.hk` 邮箱登录。

### 3. 设置管理员

先登录一次，让系统生成 `profiles` 记录。然后在 Supabase SQL Editor 执行：

```sql
UPDATE public.profiles
SET role = 'admin',
    status = 'active',
    onboarding_completed = true
WHERE id = '你的用户 UUID';
```

用户 UUID 可在 Supabase `Authentication -> Users` 查看。

## 生产部署（Railway，推荐）

前提：GitHub 仓库已推送最新 `main`；Supabase 已执行迁移 `001`–`017`；Email 登录已启用。

Railway 比 Vercel 注册更简单，适合本项目一键上线。

### 1. 创建项目并连接 GitHub

1. 打开 [railway.app](https://railway.app) → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo**
3. 选择 `zhoushengqi320/polyu_student_community`（或你的 fork）
4. Railway 会读取根目录 `railway.toml`，自动执行 `npm run build` 与 `npm start`

### 2. 生成公网域名

1. 进入该 Service → **Settings** → **Networking** → **Generate Domain**
2. 记下域名，例如 `https://polyuhub-production.up.railway.app`

### 3. 配置环境变量

在 Service → **Variables** 添加：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | 与本地 `.env.local` 相同 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | 前端可用 |
| `NEXT_PUBLIC_SITE_URL` | `https://你的-railway-域名.up.railway.app` | **不要**用 localhost |

说明：

- `SUPABASE_SERVICE_ROLE_KEY` **不要**配到 Railway；仅本地导入脚本使用
- 也可用 Railway 变量引用：`NEXT_PUBLIC_SITE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`（需先生成域名）

添加变量后 Railway 会自动 **Redeploy**（Next.js 需在构建时注入 `NEXT_PUBLIC_*`）。

### 4. 配置 Supabase Auth 回调

部署成功后，在 **Supabase → Authentication → URL Configuration**：

- **Site URL**：与 `NEXT_PUBLIC_SITE_URL` 相同
- **Redirect URLs** 至少包含：
  - `https://你的-railway-域名.up.railway.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://*.up.railway.app/auth/callback`

若 `.env.local` 有 `SUPABASE_ACCESS_TOKEN`，也可本地执行：

```bash
npm run configure:auth -- --site-url=https://你的-railway-域名.up.railway.app
```

### 5. 验收

- `https://你的域名/api/health` → `supabaseConfigured: true`
- 打开 `/auth/login`，用 `@connect.polyu.hk` 收 Magic Link 并登录
- 浏览 `/courses`、`/forum`、`/study`

部署前本地检查：

```bash
npm run verify:deploy -- --production
```

### 6. 本阶段暂不强制

- 内容批量导入（`import:guides` / `import:courses`）可在上线后补
- 课程 PDF 生产对象存储方案可后续再做

---

<details>
<summary>备选：Vercel 部署（可选）</summary>

若已有 Vercel 账号，也可 Import GitHub 仓库，配置相同的三个 `NEXT_PUBLIC_*` 环境变量后 Deploy。详见 git 历史中 Vercel 说明，或执行 `npm run setup:production`（需 `npx vercel login`）。

</details>

## 课程 PDF 导入

课程 PDF 放在：

```text
学科/
  AAE/
    AAE1BN01.pdf
  ABCT/
    ABCT4106.pdf
```

先测试解析，不写数据库：

```bash
npm run import:courses -- --dry-run
```

真实导入：

```bash
npm run import:courses
```

默认行为：

- 按 `courses.code + school_id` 判断是否已存在
- 已存在的课程会跳过
- 只插入新增课程
- 不会反复添加同一个课程
- 同一批 PDF 中重复的课程 code 会自动跳过，避免 Supabase `upsert` 冲突

如果想更新已有课程资料：

```bash
npm run import:courses -- --update-existing
```

修改 PDF 解析规则后，例如更新 `Objectives`、`Assessment` 或 PDF 路径展示逻辑，需要使用 `--update-existing` 重新写入已有课程。

当前导入结果会包含：

- `objectives`：课程目标正文，不包含重复的 `Objectives` 标题。
- `assessment_json.items`：按 PDF 原始表格分类保存，例如 `Tests/assignments 40%`、`Examination 60%`。
- `pdf_storage_path`：本地 PDF 路径，例如 `学科/ABCT/ABCT1001.pdf`。详情页会通过 `/course-pdfs/ABCT/ABCT1001.pdf` 预览或下载。

可以指定其他目录：

```bash
npm run import:courses -- --dir="/path/to/course-pdfs"
```

## 课程评价统计与互动

课程评价表单当前保持轻量化，只要求：

- Overall Rating
- Difficulty
- Review Text
- Anonymous
- Tags

课程详情页统计来自 `courses` 表聚合字段：

- `overall_rating`
- `difficulty_rating`
- `review_count`
- `top_tags`

`supabase/migrations/009_course_review_stats.sql` 会创建 `refresh_course_review_stats()` 和 `course_reviews_sync_course_stats` trigger。新增、更新、删除或软删除课程评价时，统计会自动刷新。

课程互动复用通用 `reactions` 表：

- 课程评价“有用”：`target_type = course_review`，`type = like`
- 课程收藏：`target_type = course`，`type = favorite`

## 入学攻略 Freshman Guides

第一阶段目标是搭建可维护的攻略系统，不追求内容完整。

当前实现：

- 攻略正文复用 `posts` 表，`module = guides`。
- 攻略扩展信息存放在 `guides_meta`。
- `/guides` 支持列表展示、分类筛选和关键词搜索。
- `/guides/[id]` 支持详情展示和基础 Markdown 渲染。
- `supabase/seed_guides.sql` 提供 8 篇短版 seed 攻略，用来测试页面和数据流程。

当前攻略分类：

- 申请入学
- 行前准备
- 到港第一周
- 选课流程
- 校园系统
- 宿舍 / 租房
- 银行卡 / 电话卡
- 生活适应

`seed_guides.sql` 是开发测试数据，不是未来真实内容导入方式。未来真实攻略数据计划以 JSONL 文件导入，建议后续新增：

```text
scripts/import-guides-from-jsonl.mjs
```

真实 JSONL 导入时继续写入 `posts` 和 `guides_meta`，并使用稳定的 external id / slug / source id，避免与 seed UUID 冲突。

## 权限模型

权限判断集中在 `lib/utils/permissions.ts`。

| 角色 | 权限 |
| --- | --- |
| `guest` | 浏览公开内容 |
| `user` | 浏览、评论、点赞、收藏、举报 |
| `verified_polyu_user` | 发帖、发布课程评价、参与需要认证的模块 |
| `admin` | 进入后台，管理用户、内容、举报和课程评价 |
| `banned` | 只能浏览，不能互动 |

## 核心数据表

| 表名 | 用途 |
| --- | --- |
| `profiles` | 用户资料 |
| `courses` | 课程官方结构化信息与评价聚合统计 |
| `course_reviews` | 学生课程评价，当前前端只使用 overall、difficulty、review text、anonymous、tags |
| `posts` | 论坛与攻略等内容 |
| `guides_meta` | 入学攻略扩展信息 |
| `comments` | 跨模块评论 |
| `reactions` | 点赞、收藏、课程评价“有用”、课程收藏 |
| `reports` | 举报 |
| `admin_action_logs` | 管理员操作日志 |
| `resources` / `resource_categories` | 常用网站导航 |
| `food_places` / `food_recommendations` | 美食模块 |
| `buddy_posts` | 找搭子模块 |

## 开发原则

- 只做响应式 Web，不做 App、小程序、React Native 或 Flutter。
- 六大核心模块保持稳定：课程评价、入学攻略、美食推荐、常用网站、找搭子、自由讨论区。
- `app/` 只负责路由、数据获取和组件组合。
- 业务逻辑放在 `lib/`。
- Supabase 查询集中在 `lib/db/`。
- 写操作优先通过 Server Actions。
- 权限判断集中在 `lib/utils/permissions.ts`。
- 表单输入使用 Zod 校验。
- 评论、点赞、收藏、举报尽量复用通用模型，不为每个模块重复造系统。
- 用户生成内容优先软删除，保留 `deleted_at`。
- 管理员操作写入 `admin_action_logs`。

## TypeScript 与 Supabase 类型

当前项目已修复基础 typecheck：

```bash
npm run typecheck
```

已处理的问题包括：

- `UserMenu` logout form action 返回类型与 React form action 不匹配。
- Supabase server / middleware cookie 回调的隐式 `any`。
- `types/database.ts` 补充 Supabase 表结构需要的 `Relationships`、`Enums`、`CompositeTypes`。
- 由于当前 `types/database.ts` 仍是手写维护，`lib/supabase/server.ts` 和 `lib/supabase/client.ts` 对 Supabase 查询层做了保守类型放宽，业务层仍通过 `types/` 和 mapper 保持类型约束。

后续如果接入 Supabase CLI，建议用官方命令重新生成数据库类型并替换 `types/database.ts`：

```bash
supabase gen types typescript --project-id <project-id> --schema public > types/database.ts
```

## 已知问题

- 课程 PDF 目前依赖本地 `学科/` 路径，生产环境需后续改为对象存储后才可稳定预览。
- 课程评价后台筛选、评价排序仍可继续增强。
- 生活指南部分栏目内容偏薄；美食模块缺冷启动地点数据。
- 找搭子为论坛 topic，不是独立导航模块；`/buddy` 会重定向到论坛。

## Git 注意事项

不要提交：

- `.env`
- `.env.local`
- Supabase service role key
- 任何私钥、密码或真实敏感数据

项目 `.gitignore` 已默认忽略本地环境变量文件。

## License

Private project.
