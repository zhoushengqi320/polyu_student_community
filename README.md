# PolyUHub

PolyUHub 是一个面向香港理工大学学生的 Web 社区平台，提供课程评价、入学攻略、美食推荐、常用网站导航、找搭子和自由讨论区等校园生活功能。

项目基于 Next.js App Router 和 Supabase 构建，重点放在模块化扩展、理大邮箱认证、社区内容发布、互动评论和后台审核管理。

## 功能概览

### 已实现

- 首页六大模块入口
- 常用网站导航，支持分类展示和搜索
- 理大邮箱 Magic Link 登录
- 首次登录 onboarding，补全昵称、年级、专业等资料
- 自由讨论区
  - 帖子列表、分类、搜索、话题筛选
  - 发帖、匿名发帖、帖子详情
  - 评论与回复
  - 回复统一展示在一级评论下一层，避免无限嵌套
  - 点赞、收藏、举报
- 个人主页
- 管理后台
  - 用户列表
  - 封禁 / 解封用户
  - 授予理大认证
  - 查看与处理举报
  - 删除论坛帖子和评论
  - 管理员操作日志

### 开发中 / 待完善

- 课程评价完整业务流程
- 入学攻略发布与详情页
- 美食推荐完整业务流程
- 找搭子完整业务流程
- 管理后台搜索、筛选和更多审核工具
- 通知、私信、二手交易等扩展功能

## 技术栈

- Framework: Next.js 15 App Router
- Language: TypeScript
- UI: React 19, Tailwind CSS 4, Radix UI, shadcn/ui 风格组件
- Backend: Supabase
- Database: PostgreSQL with Row Level Security
- Auth: Supabase Auth Magic Link
- Form: react-hook-form, Zod
- Icons: lucide-react

## 项目结构

```text
app/                         Next.js 路由页面
components/                  页面组件和通用 UI
constants/                   路由、模块、权限、分类等配置
hooks/                       前端 hooks
lib/
  admin/                     管理后台 session 与 actions
  auth/                      登录、session、onboarding 逻辑
  db/                        Supabase 数据访问层
  db/mappers/                数据库 row 到业务类型的转换
  forum/                     论坛 Server Actions
  interaction/               点赞、收藏、举报 actions
  supabase/                  Supabase client/server/middleware
  utils/                     权限、时间格式化等工具
  validations/               Zod 表单校验
supabase/
  migrations/                数据库迁移
  seed.sql                   初始数据
types/                       TypeScript 类型定义
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
```

### 启动开发服务器

```bash
npm run dev
```

启动后访问：

```text
http://localhost:3000
```

## 常用命令

```bash
npm run dev        # 启动本地开发服务器
npm run build      # 构建生产版本
npm run start      # 启动生产服务
npm run lint       # 运行 ESLint
npm run typecheck  # TypeScript 类型检查
```

## Supabase 配置

### 1. 创建 Supabase 项目

在 Supabase 创建新项目，并复制 Project URL 和 anon public key 到 `.env.local`。

### 2. 执行数据库迁移

按顺序执行 `supabase/migrations/` 中的 SQL 文件：

```text
001_initial_schema.sql
002_rls_policies.sql
003_magic_link_onboarding.sql
004_forum_enhancements.sql
005_forum_reports.sql
006_forum_comment_replies.sql
```

然后执行：

```text
supabase/seed.sql
```

也可以使用 Supabase CLI：

```bash
supabase db push
```

### 3. 配置 Magic Link 登录

在 Supabase 控制台中配置：

- Authentication -> Providers -> Email，启用 Email 登录
- Authentication -> URL Configuration
  - Site URL: `http://localhost:3000`
  - Redirect URL: `http://localhost:3000/auth/callback`

项目默认只允许 `@connect.polyu.hk` 理大邮箱登录。

### 4. 设置管理员账号

先用理大邮箱登录一次，确保 `profiles` 表中已经生成你的用户资料。然后在 Supabase SQL Editor 执行：

```sql
UPDATE public.profiles
SET role = 'admin',
    status = 'active',
    onboarding_completed = true
WHERE id = '你的用户 UUID';
```

用户 UUID 可以在 Supabase 的 `Authentication -> Users` 中查看。

设置完成后，重新登录网站并访问：

```text
http://localhost:3000/admin
```

## 权限模型

项目通过 `lib/utils/permissions.ts` 统一控制权限。

| 角色 | 说明 |
| --- | --- |
| `guest` | 未登录用户，只能浏览公开内容 |
| `user` | 普通登录用户，可以评论、点赞、收藏 |
| `verified_polyu_user` | 已认证理大学生，可以发帖和参与需要认证的模块 |
| `admin` | 管理员，可以进入后台管理用户、内容和举报 |
| `banned` | 被封禁用户，只能浏览，不能互动 |

## 核心数据表

| 表名 | 用途 |
| --- | --- |
| `profiles` | 用户资料 |
| `posts` | 帖子内容，支持论坛和后续攻略等模块复用 |
| `comments` | 评论与回复 |
| `reactions` | 点赞和收藏 |
| `reports` | 用户举报 |
| `admin_action_logs` | 管理员操作日志 |
| `resources` | 常用网站链接 |
| `resource_categories` | 常用网站分类 |
| `courses` / `course_reviews` | 课程与评价 |
| `food_places` / `food_recommendations` | 美食地点与推荐 |
| `buddy_posts` | 找搭子帖子 |
| `guides_meta` | 入学攻略扩展信息 |

## 架构原则

- 页面层保持轻量，只负责路由、数据获取和组件组合
- 数据库访问集中放在 `lib/db/`
- 写操作优先通过 Server Actions 完成
- 权限判断集中在 `lib/utils/permissions.ts`
- 表单输入统一使用 Zod 校验
- 配置型数据放在 `constants/`
- 每个业务模块尽量保持独立，方便后续扩展

## Git 注意事项

不要提交以下内容：

- `.env`
- `.env.local`
- Supabase service role key
- 任何私钥、密码或真实敏感数据

项目的 `.gitignore` 已默认忽略本地环境变量文件。

## License

Private project.
