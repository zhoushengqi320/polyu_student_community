# PolyUHub

PolyUHub 是一个面向香港理工大学学生的 Web 社区平台，提供课程评价、入学攻略、美食推荐、常用网站导航、找搭子和自由讨论区等校园生活功能。

核心定位：**PolyU 学生自己的校园信息社区。**

核心文案：**选课前，先查 PolyUHub。**

## 当前项目进度

### 已完成 / 基础可用

- **首页流量入口（Phase E）**
  - Hero：标题 **PolyUHub**，副标题 **PolyU 学生自己的校园信息社区**，slogan「选课前，先查 PolyUHub」
  - 全站搜索框（GET → `/search?q=`）
  - 六大模块入口网格
  - 热门课程（按评价数 Top 6）
  - 最新课程评价（Top 5，点击进入 `/courses/[courseCode]`，暂不实现 review anchor）
  - 最新讨论（论坛最新帖 Top 5）
  - 精选攻略（置顶优先 + 更新时间 Top 4）
  - 常用资源快捷入口（eStudent、Blackboard、Library 等 5 项）
  - Footer 非官方免责声明
  - `/search` 占位页（第一版提示「全站搜索开发中」，避免首页搜索 404）
  - 首页数据查询集中在 `lib/db/home.ts`；`app/loading.tsx` 提供骨架屏
- Supabase Magic Link 登录
- PolyU 邮箱限制与 onboarding
- 用户角色与权限模型
- 个人主页
- 常用网站导航
  - 分类展示
  - 搜索
  - Supabase 数据源
  - 未配置数据库时 fallback
- 自由讨论区
  - 帖子列表、详情、发布
  - 分类筛选、topic 筛选、搜索、排序
  - 热度、最新、最多评论、最多点赞、最多浏览
  - 匿名发帖
  - 评论与回复
  - 回复统一展示在一级评论下一层，避免无限嵌套
  - 点赞、收藏、举报
- 举报系统
  - 支持帖子、评论、课程评价等 target type
  - 支持垃圾内容、诈骗、学术不端、骚扰、隐私泄露等原因
- 管理员后台
  - 查看统计
  - 用户管理
  - 封禁 / 解封用户
  - 授予理大认证
  - 举报处理
  - 删除论坛帖子
  - 删除论坛评论
  - 删除课程评价
  - **入学攻略管理（Guides CRUD）**
    - 查看全部 draft / published / hidden / 已删除攻略
    - 创建草稿、编辑内容、发布、隐藏、重新发布、软删除
    - Tab 内视图切换（列表 / 创建 / 编辑），无需独立后台路由
    - 所有操作写入 `admin_action_logs`
  - 查看管理员操作日志
- 课程评价增强版
  - `/courses` 课程列表
  - 课程搜索、部门筛选、排序、分页
  - `/courses/[courseCode]` 课程详情
  - Overview / Assessment / Reviews / PDF 真正交互式 Tabs
  - 课程详情顶部统计卡片：Overall Rating、Difficulty、Review Count、Top Tags
  - 课程统计聚合字段落表到 `courses`
  - Assessment 按官方 PDF 中的原始分类展示，不强行归类为 assignment / quiz / final
  - Objectives 导入时只保留目标正文，不重复显示 `Objectives` 标题
  - PDF 区块支持通过本地 `学科/` 文件夹预览和下载原始 PDF
  - `/courses/[courseCode]/review` 发布课程评价
  - 轻量评价表单：综合评分、课程难度、标签、正文、匿名展示
  - 课程评价“有用”投票
  - 课程收藏 / 取消收藏
  - 课程评价举报
  - 管理员后台查看和删除课程评价
- 课程 PDF 导入脚本
  - 扫描 `学科/` 文件夹下的课程 PDF
  - 自动提取课程代码、课程名、credits、level、objectives、description、assessment 等信息
  - `assessment_json.items` 保留 PDF 原始考核分类和百分比
  - `pdf_storage_path` 保存本地 PDF 路径，页面通过 `/course-pdfs/...` 读取
  - 只插入数据库中不存在的新课程，避免重复导入
  - `--update-existing` 会更新已有课程，并自动跳过同一批次内重复课程 code
- 入学攻略基础版
  - `/guides` 攻略列表页
  - 分类筛选和关键词搜索
  - `/guides/[id]` 攻略详情页
  - 攻略正文复用 `posts`，`module = guides`
  - `guides_meta` 存储分类、目标读者、阅读时间、核对时间和来源链接
  - 基础 Markdown 展示
  - `supabase/seed_guides.sql` 提供 8 篇短版测试攻略
- 入学攻略管理后台（Phase D）
  - `/admin` → **攻略管理** Tab
  - 创建攻略默认保存为 **draft**，需手动发布后才出现在前台
  - 状态流转：`draft → 发布`、`published → 隐藏`、`hidden → 重新发布`、软删除
  - 前台 `/guides` 仅展示 `published` 且 `deleted_at IS NULL` 的内容
  - 管理员可编辑：标题、摘要、正文、分类、目标读者、阅读时长、参考链接
  - Server Actions：`lib/guides/actions.ts`（Zod 校验 + `requireAdmin()`）
  - 操作日志：`create_guide` / `update_guide` / `publish_guide` / `hide_guide` / `delete_guide`
- 入学攻略互动（Phase D+）
  - 攻略详情页收藏 / 取消收藏，显示收藏数
  - 攻略评论：发表、回复、两层结构（与论坛一致）
  - 删除自己的评论；管理员可删除任意评论
  - 举报攻略与举报评论
  - 未登录用户可浏览，收藏 / 评论需登录
  - 复用 `reactions`、`comments`、`reports`，不新建 guide 专用表

### 开发中 / 待完善

- 课程评价后续增强
  - 评价排序
  - 后台课程评价筛选
  - 个人主页展示“我的收藏课程”
- 入学攻略后续增强
  - JSONL 真实数据导入脚本
  - 后台攻略筛选 / 分页 / 置顶
  - 独立后台路由（如 `/admin/guides/new`）与更完善的 Markdown 编辑器
  - 攻略详情页相关推荐
- 美食推荐 Food Recommendations
- 找搭子 Buddy Matching
- 全站搜索 `/search` 真实检索（当前仅为占位页）
- 社区行为守则页面 `/about/community-rules`
- 首页后续增强
  - 最新找搭子区块
  - 课程评价 review anchor（待评价详情页增强后）
  - 全站搜索聚合课程、攻略、帖子、资源等模块

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
- Vercel 部署
- `pdf-parse` 用于本地课程 PDF 导入脚本

## 项目结构

```text
app/                         Next.js 路由页面
  course-pdfs/[...path]/      本地课程 PDF 预览与下载路由
  search/                     全站搜索占位页（第一版）
components/                  UI 组件与业务组件
  admin/guides/              攻略管理后台 UI（列表、表单、编辑器）
  guides/                    攻略前台 UI（列表、详情、收藏、评论区）
  home/                      首页各 Section（Hero、搜索框、动态区块）
  posts/                     通用评论组件（CommentForm、DeleteCommentButton）
constants/                   路由、模块、角色、分类、状态等常量
  home.ts                    首页 Hero、免责声明、区块数量限制
hooks/                       前端 hooks
lib/
  admin/                     管理后台 session 与 Server Actions
  auth/                      登录、session、onboarding
  course/                    课程评价 Server Actions
  guides/                    入学攻略管理 Server Actions
  db/                        Supabase 查询
  db/home.ts                 首页聚合数据查询
  db/mappers/                DB row 到业务类型的映射
  forum/                     论坛 Server Actions
  interaction/               点赞、收藏、举报 Server Actions
  supabase/                  Supabase client/server/middleware
  utils/                     权限、日期、搜索等工具
  validations/               Zod 表单校验（含 guideSchema）
scripts/                     本地维护脚本
supabase/
  migrations/                数据库迁移
  seed.sql                   初始数据
  seed_guides.sql            入学攻略测试数据
types/                       TypeScript 类型
  home.ts                    首页聚合数据类型
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
npm run import:courses   # 从 学科/ 文件夹导入课程 PDF
```

当前 `npm run typecheck` 与 `npm run build` 均已通过。

## Supabase 设置

### 1. 执行数据库迁移

按顺序执行：

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_magic_link_onboarding.sql
supabase/migrations/004_forum_enhancements.sql
supabase/migrations/005_forum_reports.sql
supabase/migrations/006_forum_comment_replies.sql
supabase/migrations/007_course_reviews_enhancement.sql
supabase/migrations/008_simplify_course_reviews.sql
supabase/migrations/009_course_review_stats.sql
supabase/migrations/010_freshman_guides.sql
```

这些 SQL 可以在 Supabase 控制台的 `SQL Editor -> New query` 中按顺序复制执行。`009_course_review_stats.sql` 会在 `courses` 表新增课程评价统计字段，并创建触发器自动同步统计。`010_freshman_guides.sql` 会扩展 `guides_meta`，用于 Freshman Guides 的分类和扩展信息。

然后执行：

```text
supabase/seed.sql
```

如果要插入入学攻略测试数据，再执行：

```text
supabase/seed_guides.sql
```

`seed_guides.sql` 只用于开发测试，会插入 8 篇短版攻略。执行前数据库里需要至少有一个 `profiles` 用户记录。

### 2. 配置 Magic Link

在 Supabase 控制台设置：

- Authentication -> Providers -> Email，启用 Email 登录
- Authentication -> URL Configuration
  - Site URL: `http://localhost:3000`
  - Redirect URL: `http://localhost:3000/auth/callback`

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
- 攻略收藏：`target_type = post`，`type = favorite`（guide post id）

## 首页 Homepage

首页定位为 PolyUHub 的流量入口，品牌统一使用 **PolyUHub**（不再使用「理大社区」作为站点名称）。

### 页面结构

1. **Hero**：PolyUHub 标题 +「PolyU 学生自己的校园信息社区」副标题 + 搜索框 + CTA
2. **六大模块**：课程评价、入学攻略、美食、常用网站、找搭子、自由讨论区
3. **热门课程**：`review_count` 排序 Top 6
4. **最新课程评价**：跨课程查询 Top 5，卡片链接 `/courses/[courseCode]`
5. **最新讨论**：论坛 `latest` 排序 Top 5
6. **精选攻略**：置顶优先，再按 `updated_at` Top 4
7. **常用资源**：eStudent、Learn@PolyU / Blackboard、PolyU Library、Academic Calendar、Campus Map

Footer 展示非官方免责声明（`constants/home.ts` → `HOME_DISCLAIMER`）。

### 数据层

- 聚合查询：`lib/db/home.ts` → `getHomePageData()`
- 类型定义：`types/home.ts`
- 常量：`constants/home.ts`（`HOME_LIMITS`、`HOME_HERO`、`QUICK_RESOURCE_TITLES`）

首页为动态渲染（依赖 Supabase session cookies）。未配置数据库时，Hero 与模块入口仍可用，动态区块显示空状态并提示配置 `.env.local`。

### 搜索占位页

- 路由：`/search?q=关键词`
- 第一版仅展示关键词与「全站搜索功能开发中」提示，并提供课程 / 攻略 / 首页快捷入口
- 首页 `HomeSearchBox` 通过 GET 跳转，避免 404

### 测试首页

1. 访问 `/`，确认 Hero 标题为 PolyUHub、副标题与 Footer 免责声明正确。
2. 在搜索框输入关键词，应跳转到 `/search?q=...` 占位页。
3. 配置 Supabase 并有数据时，确认热门课程、最新评价、最新讨论、精选攻略、常用资源各区块有内容或空状态。
4. 点击最新课程评价卡片，应进入 `/courses/[courseCode]`（无 `#review` anchor）。
5. 窄屏下检查各区块布局与骨架屏（刷新时 `app/loading.tsx`）。

## 入学攻略 Freshman Guides

目标是搭建可维护、可互动的攻略系统。Phase D 已完成管理员后台 CRUD，Phase D+ 已完成前台收藏与评论闭环。

### 前台

- 攻略正文复用 `posts` 表，`module = guides`。
- 攻略扩展信息存放在 `guides_meta`。
- `/guides` 支持列表展示、分类筛选和关键词搜索；列表页显示评论数与收藏状态。
- `/guides/[id]` 支持详情展示、基础 Markdown 渲染、收藏、评论与举报。
- 仅展示 `status = published` 且 `deleted_at IS NULL` 的攻略。

### 互动（复用通用模型）

攻略详情页不新建 `guide_comments` / `guide_favorites` / `guide_reports`，全部复用：

| 功能 | 数据表 | 关键字段 |
| --- | --- | --- |
| 收藏 | `reactions` | `target_type = post`，`target_id = guide post id`，`type = favorite` |
| 评论 / 回复 | `comments` | `target_type = post`，`target_id = guide post id`，`parent_id` 表示回复 |
| 举报攻略 | `reports` | `target_type = post`，`target_id = guide post id` |
| 举报评论 | `reports` | `target_type = comment`，`target_id = comment id` |

评论区复用论坛同一套两层结构：一级评论 + 扁平回复层，显示「回复 @谁」。

Server Actions 复用：

- `toggleReactionAction`（`lib/interaction/actions.ts`）— 收藏
- `createCommentAction`（`lib/forum/actions.ts`）— 评论 / 回复，支持 `revalidatePath` 刷新攻略页
- `deleteCommentAction`（`lib/interaction/actions.ts`）— 用户删自己的评论，admin 删任意评论
- `createReportAction`（`lib/interaction/actions.ts`）— 举报

`posts.comment_count` 由数据库 trigger 自动维护，攻略评论数与列表页同步。

### 后台（`/admin` → 攻略管理）

- 列表展示全部 draft / published / hidden / 已删除攻略。
- Tab 内视图切换：列表 ↔ 创建 ↔ 编辑（第一版不拆独立路由）。
- 创建攻略默认保存为 **draft**，避免半成品内容出现在前台。
- 状态切换：
  - `draft` → 点击「发布」
  - `published` → 点击「隐藏」
  - `hidden` → 点击「重新发布」
  - 任意未删除状态 → 点击「删除」（软删除，`deleted_at = now()`）
- 编辑时可修改：标题、摘要、正文、分类、目标读者、预计阅读时长、参考链接。
- 编辑保存时会更新 `guides_meta.last_verified_at`。
- 所有管理员操作写入 `admin_action_logs`。

### 测试数据

- `supabase/seed_guides.sql` 提供 8 篇短版 seed 攻略，用来测试页面和数据流程。
- seed 数据默认 `status = published`，可直接在前台看到；后台新建的内容默认为 draft。

### 攻略分类

- 申请入学
- 行前准备
- 到港第一周
- 选课流程
- 校园系统
- 宿舍 / 租房
- 银行卡 / 电话卡
- 生活适应

分类稳定 ID 定义在 `constants/guides.ts`，前后台共用。

### 后续计划

`seed_guides.sql` 是开发测试数据，不是未来真实内容导入方式。未来真实攻略数据计划以 JSONL 文件导入，建议后续新增：

```text
scripts/import-guides-from-jsonl.mjs
```

真实 JSONL 导入时继续写入 `posts` 和 `guides_meta`，并使用稳定的 external id / slug / source id，避免与 seed UUID 冲突。

### 测试攻略后台

1. 将账户设为 `admin`（见上文「设置管理员」）。
2. 访问 `/admin` → **攻略管理**。
3. 点击「创建攻略」，填写表单后保存为 draft。
4. 确认前台 `/guides` 看不到该攻略。
5. 在列表点击「发布」，确认前台可见。
6. 测试「隐藏」「重新发布」「删除」，并在 **操作记录** Tab 查看日志。

### 测试攻略互动

1. 打开一篇已发布攻略 `/guides/[id]`。
2. **未登录**：可浏览正文和评论；点击收藏 / 评论会提示登录。
3. **登录用户**：收藏 / 取消收藏，观察收藏数变化；发表评论和回复。
4. 删除自己的评论；管理员账号可删除任意评论。
5. 测试「举报攻略」和评论「举报」按钮。

## 权限模型

权限判断集中在 `lib/utils/permissions.ts`。

| 角色 | 权限 |
| --- | --- |
| `guest` | 浏览公开内容 |
| `user` | 浏览、评论、点赞、收藏、举报 |
| `verified_polyu_user` | 发帖、发布课程评价、参与需要认证的模块 |
| `admin` | 进入后台，管理用户、内容、举报、课程评价和入学攻略 |
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
| `reactions` | 点赞、收藏、课程评价“有用”、课程收藏、攻略收藏 |
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
- `lib/supabase/types.ts` 引入 `AppSupabaseClient`，消除 server / client / middleware 中的隐式 `any`。
- 由于当前 `types/database.ts` 仍是手写维护，`lib/supabase/server.ts` 和 `lib/supabase/client.ts` 对 Supabase 查询层做了保守类型放宽，业务层仍通过 `types/` 和 mapper 保持类型约束。

后续如果接入 Supabase CLI，建议用官方命令重新生成数据库类型并替换 `types/database.ts`：

```bash
supabase gen types typescript --project-id <project-id> --schema public > types/database.ts
```

## 已知问题

- 课程 PDF 自动解析已支持本地 PDF 预览、目标正文清洗和 Assessment 原始分类展示，但不同学院 PDF 格式仍可能需要后续微调。
- 课程评价后台筛选、评价排序和个人主页“我的收藏课程”入口仍待增强。
- 入学攻略 JSONL 批量导入脚本、后台筛选分页、相关推荐仍待实现。
- 全站搜索 `/search` 当前为占位页，尚未实现跨模块检索。
- 首页因 Supabase cookies 为动态渲染；构建时若未连上数据库，动态区块日志可能报 `Dynamic server usage`，不影响页面正常访问。

## Git 注意事项

不要提交：

- `.env`
- `.env.local`
- Supabase service role key
- 任何私钥、密码或真实敏感数据

项目 `.gitignore` 已默认忽略本地环境变量文件。

## License

Private project.
