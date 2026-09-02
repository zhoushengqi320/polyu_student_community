# PolyUHub 本地开发环境要求与安装指南

本文档面向**新加入团队的开发者**，说明如何在本地安装、配置并运行 PolyUHub。

> 本项目是 **Next.js / Node.js** 项目，**没有** Python 的 `requirements.txt`。依赖清单见根目录 `package.json` 与 `package-lock.json`。

---

## 1. 环境要求

| 工具 | 版本要求 | 用途 |
| --- | --- | --- |
| Git | 最新稳定版 | 拉取代码、协作开发 |
| Node.js | **18+**（建议 20 LTS） | 运行 Next.js |
| npm | 随 Node 自带 | 安装依赖、运行脚本 |
| 现代浏览器 | Chrome / Edge / Safari 等 | 本地调试 |

安装后检查：

```bash
node -v    # 应 >= 18
npm -v
git --version
```

可选（仅部分维护脚本需要）：

- Supabase 项目访问权限（查看数据、用户 UUID）
- `SUPABASE_SERVICE_ROLE_KEY`（仅本地导入脚本，普通开发不需要）

---

## 2. 获取代码

```bash
git clone https://github.com/zhoushengqi320/polyu_student_community.git
cd polyu_student_community
```

若仓库为私有，需先由团队负责人将你加入 GitHub 仓库。

---

## 3. 安装依赖

在项目根目录执行：

```bash
npm install
```

该命令会根据 `package-lock.json` 安装固定版本的依赖，保证团队环境一致。

---

## 4. 配置环境变量

在项目根目录创建 `.env.local`（**不要提交到 Git**）：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase Anon Key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 可选：仅本地批量导入等维护脚本需要，普通开发可不配置
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role key
```

### 向团队负责人索取

新成员通常**不需要自己新建 Supabase 项目**，应向负责人获取：

| 变量 | 是否必需 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 必需 | Supabase 项目地址 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必需 | 前端可用的公开密钥 |
| `NEXT_PUBLIC_SITE_URL` | 必需 | 本地固定为 `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | 可选 | 高权限密钥，仅导入脚本使用 |

**安全提醒：**

- 不要把 `.env.local` 发到聊天群或提交 Git
- `SUPABASE_SERVICE_ROLE_KEY` 可绕过 RLS，仅限可信环境使用

---

## 5. 启动本地开发服务器

```bash
npm run dev
```

浏览器访问：

```text
http://localhost:3000
```

默认使用 Turbopack 热更新，修改代码后页面会自动刷新。

---

## 6. 首次登录与权限

1. 打开 `http://localhost:3000/auth/login`
2. 使用 **@connect.polyu.hk** 邮箱登录（Magic Link）
3. 首次登录会进入 onboarding 流程
4. 如需管理员后台权限，联系负责人在 Supabase 将你的 `profiles.role` 设为 `admin`

本地 Supabase Auth 回调地址需包含：

```text
http://localhost:3000/auth/callback
```

（团队共享的 Supabase 项目通常已配置好。）

---

## 7. 新成员通常不需要做的事

加入已有团队时，以下一般由负责人统一维护，**新成员默认不用自己做**：

- 执行 `supabase/migrations/` 数据库迁移
- 配置 Railway 生产部署
- 批量导入课程 / 指南内容（`import:guides`、`import:courses:jsonl`）
- 修改 Supabase Auth 生产回调域名

只有在你需要**从零搭建一套全新 Supabase 环境**时，才参考根目录 `README.md` 中的「Supabase 设置」章节。

---

## 8. 常用开发命令

```bash
npm run dev          # 启动本地开发（端口 3000）
npm run build        # 生产构建（push 前建议执行）
npm run start        # 启动生产模式（本地验证 build 结果）
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
```

内容维护脚本（按需）：

```bash
npm run import:guides              # 从 content/ 导入学习/生活指南
npm run import:courses:jsonl       # 从 JSONL 导入课程元数据
npm run verify:deploy              # 检查部署环境变量
```

---

## 9. 安装验收清单

完成以下检查，即表示本地环境可用：

- [ ] `npm install` 无报错
- [ ] `.env.local` 已配置三个 `NEXT_PUBLIC_*` 变量
- [ ] `npm run dev` 能启动，访问首页正常
- [ ] 能用 `@connect.polyu.hk` 邮箱登录
- [ ] 能浏览 `/courses`、`/forum`、`/search` 等核心页面
- [ ] `npm run build` 能通过（避免 push 后生产部署 502）

健康检查（可选）：

```text
http://localhost:3000/api/health
```

应返回 Supabase 已配置的状态。

---

## 10. 提交代码前注意

1. **先跑构建**：`npm run build`（ESLint 报错会导致生产构建失败）
2. **不要提交**：`.env`、`.env.local`、任何密钥或 service role key
3. **遵循团队分支约定**：直接推 `main` 或先开 PR，以团队规则为准

---

## 11. 常见问题

### `npm install` 失败

- 确认 Node 版本 >= 18
- 删除 `node_modules` 和 `package-lock.json` 后重试（先与团队确认，避免 lock 文件冲突）
- 或使用 `npm ci` 在已有 lock 文件时做干净安装

### 登录收不到 Magic Link

- 检查垃圾邮件文件夹
- 确认使用的是 `@connect.polyu.hk` 邮箱
- 确认 Supabase Auth 中 Redirect URL 包含 `http://localhost:3000/auth/callback`

### 页面空白或接口报错

- 检查 `.env.local` 三个 `NEXT_PUBLIC_*` 是否填写正确
- 重启 `npm run dev`（环境变量修改后需重启）

### push 后线上 502

- 多为 `npm run build` 失败导致部署未成功
- 本地先执行 `npm run build` 修复报错后再 push

---

## 12. 延伸阅读

更完整的项目说明、部署流程、权限模型见根目录：

- `README.md` — 项目总览与生产部署
- `package.json` — 依赖与脚本清单
- `supabase/migrations/` — 数据库结构变更历史

---

## 13. 新成员 Onboarding 速查（复制即用）

```bash
# 克隆仓库
git clone https://github.com/zhoushengqi320/polyu_student_community.git
cd polyu_student_community

# 安装依赖
npm install

# 向负责人索取 .env.local 并放到项目根目录

# 启动开发
npm run dev

# 浏览器打开 http://localhost:3000
```

如有问题，联系团队负责人获取 Supabase 凭证与协作权限。
