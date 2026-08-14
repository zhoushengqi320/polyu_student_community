# Course PDF Pipeline（独立工具）

这是 **PolyUHub 仓库内的独立 Python Web 后台**，不是网站页面。

用途：批量导入 PolyU 官方课程 PDF → 调用 **Qwen API** 结构化抽取 → 导出与网站 `courses` 表兼容的 **JSONL**。

## 快速开始

```bash
cd tools/course-pdf-pipeline
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
```

编辑 `.env`，填入你的 Key：

```env
QWEN_API_KEY=sk-你的密钥
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus
```

启动：

```bash
python -m app.main
```

浏览器打开：<http://127.0.0.1:8765>

## 使用流程

### 推荐：本地串行扫描

1. 打开后台，查看 `课程/` 预览（文件夹数 / PDF 数）
2. 点击「开始串行扫描」
3. 系统按院系文件夹依次处理（AAE → ABCT → …），扫完一个自动下一个
4. 每个文件夹完成后自动保存：
   - `data/exports/<batchId>/<文件夹>.jsonl`
   - 并追加到 `data/exports/<batchId>/courses-all.jsonl`
5. 全部完成后可下载合并 JSONL

### 上传模式

选择整个文件夹上传时，同样按子文件夹串行处理并自动保存。

## JSONL 字段（可对接网站）

每行一个 JSON，字段与现有 import / `courses` 表对齐：

- `code` `name` `department` `faculty` `level` `credits`
- `description` `objectives` `prerequisites` `teaching_pattern`
- `semester_offered`
- `assessment_json.items` / `assessment_json.original_text`
- `pdf_storage_path`（形如 `课程/COMP/COMP1001.pdf`）
- `source_file_name` `school_id`（默认 `polyu`）

## 建议目录结构上传

若本地 PDF 已按院系分文件夹，可用带相对路径的方式上传（浏览器多选时通常只有文件名；若需要保留 `COMP/xxx.pdf`，可先打成保持目录的任务或按院系分批上传后手动确认 `department`）。

导出后的 `pdf_storage_path` 默认写成：

```text
课程/<上传相对路径或文件名>
```

与网站本地 PDF 路由约定一致。

## 注意事项

- 扫描件 / 纯图片 PDF 可能抽不出文本，会失败；需 OCR 后再跑（本版不做 OCR）。
- API 费用与限速由你的 Qwen 账户承担；大批量请分批。
- `.env`、`data/`、`.venv/` 已加入本工具 `.gitignore`，勿提交密钥。
- 本工具 **不** 直接写 Supabase；只产出 JSONL。

## 目录说明

```text
tools/course-pdf-pipeline/
  app/                 FastAPI 后端与抽取逻辑
  static/              Web 后台前端
  data/uploads|jobs|exports/
  .env.example
  requirements.txt
```
