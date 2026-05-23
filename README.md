# PolyUHub

香港理工大学学生社区 — 基于 Next.js 的响应式 Web 平台，面向长期维护与模块化扩展。

> 仅 Web 网站，不包含 App / 小程序方案。

---

## 六大核心模块

| # | 模块 | 路由 | 状态 |
|---|------|------|------|
| 1 | 课程评价 | `/courses` | 占位页，待开发 |
| 2 | 入学攻略 | `/guides` | 占位页，待开发 |
| 3 | 美食推荐 | `/food` | 占位页，待开发 |
| 4 | 常用网站导航 | `/resources` | ✅ 已完成 |
| 5 | 找搭子 | `/buddy` | 占位页，待开发 |
| 6 | 自由讨论区 | `/forum` | ✅ 已完成 |

### 其他路由

| 功能 | 路由 |
|------|------|
| 首页 | `/` |
| 登录 | `/auth/login` |
| 注册 | `/auth/signup` |
| 发帖（讨论区） | `/forum/new` |
| 个人主页 | `/profile/[id]` |
| 管理后台 | `/admin`（占位） |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15（App Router） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 数据库 / 认证 | Supabase（PostgreSQL + Auth + RLS） |
| 表单 | react-hook-form + Zod |
| UI | shadcn/ui 风格组件（Button、Card、Input 等） |

---

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装与运行

```bash
# 克隆 / 进入项目目录
cd "polyu student community"

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
# 启动开发服务器
npm run dev
```

浏览器访问：http://localhost:3000

### 常用命令

```bash
npm run dev        # 开发模式（Turbopack）
npm run build      # 生产构建
npm run start      # 启动生产服务
npm run lint       # ESLint 检查
npm run typecheck  # TypeScript 类型检查
```

---

## 项目结构

```
polyuhub/
├── app/                        # 路由层（薄页面，只做数据编排）
│   ├── page.tsx                # 首页
│   ├── layout.tsx
│   ├── auth/                   # 登录 / 注册 / 回调
│   ├── courses/                # 课程评价
│   ├── guides/                 # 入学攻略
│   ├── food/                   # 美食推荐
│   ├── resources/              # 常用网站导航 ✅
│   ├── buddy/                  # 找搭子
│   ├── forum/                  # 自由讨论区 ✅
│   ├── profile/                # 个人主页
│   └── admin/                  # 管理后台
│
├── components/
│   ├── ui/                     # 基础 UI（Button、Card、Input…）
│   ├── layout/                 # Navbar、Footer、MobileNav
│   ├── common/                 # 跨模块通用组件
│   ├── auth/                   # 登录 / 注册表单
│   ├── posts/                  # 帖子 / 评论（讨论区 + 可复用）
│   ├── forum/                  # 讨论区业务组件
│   ├── resources/              # 网站导航组件
│   └── courses/ …              # 各模块组件（随开发补充）
│
├── constants/                  # 路由、分类、角色、模块注册表
├── types/                      # TypeScript 类型定义
├── hooks/                      # useUser、useSearch、useDebounce
│
├── lib/
│   ├── supabase/               # client / server / middleware
│   ├── db/                     # 数据访问层（按领域拆分）
│   ├── db/mappers/             # DB row → 领域类型映射
│   ├── validations/            # Zod 表单校验
│   ├── auth/                   # session、actions、errors
│   ├── forum/                  # 讨论区 Server Actions
│   └── utils/                  # permissions、formatDate 等
│
├── supabase/
│   ├── migrations/             # 001 表结构 / 002 RLS
│   └── seed.sql                # 初始数据（网站导航链接）
│
└── middleware.ts               # Supabase session 刷新
```

---

## 架构原则

1. **六大模块独立**：每个模块有独立的 `app/*`、`components/*`、`lib/db/*`、`types/*`，不合并成大模块。
2. **薄页面**：`page.tsx` 只负责路由、数据获取、组合组件，不写复杂业务逻辑。
3. **数据下沉**：所有 Supabase 查询集中在 `lib/db/`，组件不直接调用数据库。
4. **配置外置**：路由、分类、角色枚举放在 `constants/`，页面不写死字符串。
5. **权限单点**：统一使用 `lib/utils/permissions.ts`，不在页面散落 `if (role === …)`。
6. **扩展友好**：新增板块 → 改 `constants/modules.ts` + 新增对应目录，尽量不动旧模块。

### 新增模块 Checklist

1. `constants/modules.ts` — 注册模块
2. `constants/routes.ts` — 添加路由
3. `app/[module]/` — 页面
4. `components/[module]/` — UI 组件
5. `lib/db/[module].ts` — 数据访问
6. `types/[module].ts` — 类型
7. `lib/validations/` — 表单校验（如有）
8. `supabase/migrations/` — 新表 + RLS（如需要）

---

## 权限系统

角色定义见 `constants/userRoles.ts`，判断逻辑见 `lib/utils/permissions.ts`。

| 角色 | 浏览 | 评论 / 点赞 | 发帖 / 发评价 |
|------|:----:|:-----------:|:-------------:|
| guest（未登录） | ✅ | ❌ | ❌ |
| user | ✅ | ✅ | ❌ |
| verified_polyu_user | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ |
| banned | ✅ | ❌ | ❌ |

各模块是否需认证发帖，由 `constants/modules.ts` 中 `requiresVerification` 控制。

---

## Supabase 设置

### 1. 创建项目

在 [Supabase](https://supabase.com) 创建项目，获取 URL 和 Anon Key。

### 2. 执行数据库迁移

在 Supabase **SQL Editor** 中按顺序执行：

```
supabase/migrations/001_initial_schema.sql   # 表结构 + trigger
supabase/migrations/002_rls_policies.sql     # Row Level Security
supabase/seed.sql                            # 网站导航初始数据
```

或使用 Supabase CLI：`supabase db push`

### 3. 认证配置

1. **Authentication → Providers** → 启用 Email
2. 开发阶段可在 **Authentication → Settings** 关闭 **Confirm email** 以便快速测试
3. 注册后 `profiles` 表通过数据库 trigger 自动创建
4. 邮箱验证回调：`/auth/callback`（需配置 `NEXT_PUBLIC_SITE_URL`）

### 4. 开发环境提权（发帖测试）

发帖、发课程评价等需要 `verified_polyu_user` 或 `admin`：

```sql
UPDATE public.profiles
SET role = 'verified_polyu_user', polyu_verified_at = NOW()
WHERE id = '你的用户 UUID';
```

### 5. 未配置 Supabase 时的行为

| 模块 | 行为 |
|------|------|
| 常用网站导航 | 使用本地 fallback 示例数据 |
| 讨论区 / 认证 | 显示配置提示，功能不可用 |
| 其他模块 | 占位页，正常浏览 |

---

## 已实现功能详情

### 常用网站导航（`/resources`）

- 按分类展示 PolyU 常用链接
- 客户端搜索过滤
- 数据来自 Supabase `resources` 表，未配置时使用 fallback

### 用户认证

- 邮箱注册 / 登录 / 退出
- Server Actions + Zod 校验
- Navbar 显示登录状态与用户菜单
- 个人主页 `/profile/[id]`

### 自由讨论区（`/forum`）

- 帖子列表 + 分类筛选
- 发帖 `/forum/new`（需认证用户）
- 帖子详情 + 评论
- 组件位于 `components/posts/`，后续入学攻略等模块可复用

---

## 开发规范

- **一次只开发一个小功能**，避免大规模生成代码
- **不随意改动**已有目录结构和文件名
- **不删除**已有功能；重构需先说明原因
- **TypeScript 类型安全**：所有 db 操作和表单有类型约束
- **不提交** `.env.local` 等敏感文件

---

## 当前进度

### 基础设施

- [x] 项目脚手架（Next.js + TS + Tailwind）
- [x] 目录结构与 constants / types / lib 骨架
- [x] 布局组件（Navbar / Footer / MobileNav）
- [x] 首页 + 六大模块路由占位
- [x] Supabase 数据库迁移 + RLS + seed
- [x] 权限系统（`permissions.ts` + RLS 对齐）

### 业务模块

- [x] 常用网站导航
- [x] 用户认证
- [x] 自由讨论区
- [ ] 课程评价
- [ ] 入学攻略
- [ ] 美食推荐
- [ ] 找搭子
- [ ] 管理后台（审核 / 举报 / 用户管理）

### 未来扩展（已预留 constants / features）

- [ ] 二手交易
- [ ] 租房信息
- [ ] 实习 / RA 信息
- [ ] GPA Calculator
- [ ] Course Planner
- [ ] 通知系统
- [ ] 私信系统
- [ ] 多学校扩展

---

## 数据库表概览

| 表名 | 用途 |
|------|------|
| `profiles` | 用户资料（扩展 auth.users） |
| `posts` | 帖子（forum / guides 共用） |
| `guides_meta` | 入学攻略扩展字段 |
| `courses` / `course_reviews` | 课程与评价 |
| `food_places` / `food_recommendations` | 美食 |
| `buddy_posts` | 找搭子 |
| `resource_categories` / `resources` | 网站导航 |
| `comments` | 评论（多态 target） |
| `reactions` | 点赞 / 收藏 |
| `reports` | 举报 |
| `admin_action_logs` | 管理员操作审计 |

所有用户内容表均含 `created_at`、`updated_at`；需软删除的使用 `deleted_at`；内容可见性使用 `status` 字段。

---

## License

Private project — 香港理工大学学生社区。
