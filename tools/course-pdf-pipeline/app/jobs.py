from __future__ import annotations

import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.config import (
    BATCHES_DIR,
    EXPORTS_DIR,
    JOBS_DIR,
    UPLOADS_DIR,
    ensure_data_dirs,
    settings,
)
from app.department_meta import guess_department_from_code, guess_from_folder
from app.export_jsonl import append_job_jsonl, write_job_jsonl
from app.pdf_extract import extract_pdf_text, truncate_for_llm
from app.qwen_client import extract_course_with_qwen
from app.schema import (
    AssessmentJson,
    Batch,
    BatchFolder,
    CourseRecord,
    Job,
    JobItem,
)

_jobs_lock = asyncio.Lock()
_batches_lock = asyncio.Lock()
_running_tasks: dict[str, asyncio.Task] = {}
_running_batches: dict[str, asyncio.Task] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _job_path(job_id: str) -> Path:
    return JOBS_DIR / f"{job_id}.json"


def _batch_path(batch_id: str) -> Path:
    return BATCHES_DIR / f"{batch_id}.json"


async def save_job(job: Job) -> None:
    ensure_data_dirs()
    job.updated_at = _now_iso()
    path = _job_path(job.id)
    tmp = path.with_suffix(".tmp")
    payload = job.model_dump()
    async with _jobs_lock:
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(path)


async def load_job(job_id: str) -> Job | None:
    path = _job_path(job_id)
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return Job.model_validate(data)


async def save_batch(batch: Batch) -> None:
    ensure_data_dirs()
    batch.updated_at = _now_iso()
    path = _batch_path(batch.id)
    tmp = path.with_suffix(".tmp")
    async with _batches_lock:
        tmp.write_text(
            json.dumps(batch.model_dump(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        tmp.replace(path)


async def load_batch(batch_id: str) -> Batch | None:
    path = _batch_path(batch_id)
    if not path.exists():
        return None
    return Batch.model_validate(json.loads(path.read_text(encoding="utf-8")))


async def list_jobs(limit: int = 50) -> list[Job]:
    ensure_data_dirs()
    files = sorted(JOBS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
    jobs: list[Job] = []
    for path in files[:limit]:
        try:
            jobs.append(Job.model_validate(json.loads(path.read_text(encoding="utf-8"))))
        except Exception:
            continue
    return jobs


async def list_batches(limit: int = 30) -> list[Batch]:
    ensure_data_dirs()
    files = sorted(
        BATCHES_DIR.glob("*.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    batches: list[Batch] = []
    for path in files[:limit]:
        try:
            batches.append(
                Batch.model_validate(json.loads(path.read_text(encoding="utf-8")))
            )
        except Exception:
            continue
    return batches


def _safe_relpath(name: str) -> str:
    cleaned = name.replace("\\", "/").strip().lstrip("/")
    parts = [p for p in cleaned.split("/") if p not in ("", ".", "..")]
    return "/".join(parts) or f"file-{uuid.uuid4().hex[:8]}.pdf"


def _list_pdfs(folder: Path) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() == ".pdf"],
        key=lambda p: p.name.lower(),
    )


def discover_folder_queue(root: Path) -> list[tuple[str, list[Path]]]:
    """返回 [(folder_name, pdf_paths), ...]，按文件夹名排序；根目录零散 PDF 归入 _root。"""
    if not root.exists() or not root.is_dir():
        raise ValueError(f"目录不存在或不可用: {root}")

    queue: list[tuple[str, list[Path]]] = []
    subdirs = sorted(
        [p for p in root.iterdir() if p.is_dir()],
        key=lambda p: p.name.lower(),
    )
    for sub in subdirs:
        pdfs = _list_pdfs(sub)
        if pdfs:
            queue.append((sub.name, pdfs))

    root_pdfs = _list_pdfs(root)
    if root_pdfs:
        queue.append(("_root", root_pdfs))

    if not queue:
        raise ValueError(f"未在 {root} 下找到含 PDF 的子文件夹")
    return queue


async def create_job_from_uploads(
    files: list[tuple[str, bytes]],
    *,
    batch_id: str | None = None,
    folder_name: str | None = None,
) -> Job:
    ensure_data_dirs()
    job_id = uuid.uuid4().hex[:12]
    job_dir = UPLOADS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    items: list[JobItem] = []
    for original_name, content in files:
        rel = _safe_relpath(original_name)
        if not rel.lower().endswith(".pdf"):
            continue
        dest = job_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
        items.append(
            JobItem(
                id=uuid.uuid4().hex[:10],
                filename=Path(rel).name,
                relative_path=rel,
                status="pending",
                source_abs_path=str(dest),
            )
        )

    if not items:
        raise ValueError("未找到有效的 PDF 文件")

    now = _now_iso()
    job = Job(
        id=job_id,
        created_at=now,
        updated_at=now,
        status="queued",
        total=len(items),
        done=0,
        failed=0,
        items=items,
        message="已创建，等待处理",
        batch_id=batch_id,
        folder_name=folder_name,
    )
    await save_job(job)
    return job


async def create_job_from_local_pdfs(
    *,
    folder_name: str,
    pdf_paths: list[Path],
    source_root: Path,
    batch_id: str | None = None,
) -> Job:
    ensure_data_dirs()
    job_id = uuid.uuid4().hex[:12]
    items: list[JobItem] = []

    for pdf in pdf_paths:
        if folder_name == "_root":
            rel = pdf.name
        else:
            rel = f"{folder_name}/{pdf.name}"
        items.append(
            JobItem(
                id=uuid.uuid4().hex[:10],
                filename=pdf.name,
                relative_path=rel.replace("\\", "/"),
                status="pending",
                source_abs_path=str(pdf.resolve()),
            )
        )

    now = _now_iso()
    job = Job(
        id=job_id,
        created_at=now,
        updated_at=now,
        status="queued",
        total=len(items),
        done=0,
        failed=0,
        items=items,
        message=f"文件夹 {folder_name} 已排队",
        batch_id=batch_id,
        folder_name=folder_name,
        source_root=str(source_root.resolve()),
    )
    await save_job(job)
    return job


async def create_batch_from_local_root(
    root_path: str | None = None,
    *,
    only_folders: list[str] | None = None,
) -> Batch:
    root = Path(root_path or settings.course_pdf_root).expanduser().resolve()
    queue = discover_folder_queue(root)

    if only_folders:
        allow = {name.strip() for name in only_folders if name.strip()}
        queue = [(name, pdfs) for name, pdfs in queue if name in allow]
        if not queue:
            raise ValueError("过滤后没有可扫描的文件夹")

    batch_id = uuid.uuid4().hex[:12]
    now = _now_iso()
    batch = Batch(
        id=batch_id,
        created_at=now,
        updated_at=now,
        status="queued",
        root_path=str(root),
        folders=[
            BatchFolder(name=name, pdf_count=len(pdfs), status="waiting")
            for name, pdfs in queue
        ],
        current_index=0,
        message=f"已发现 {len(queue)} 个文件夹，等待开始",
        merged_export_path=str(
            (EXPORTS_DIR / batch_id / "courses-all.jsonl").resolve()
        ),
    )
    await save_batch(batch)

    # 预创建各文件夹 job（先不启动），方便 UI 展示队列
    for index, (name, pdfs) in enumerate(queue):
        job = await create_job_from_local_pdfs(
            folder_name=name,
            pdf_paths=pdfs,
            source_root=root,
            batch_id=batch_id,
        )
        batch.folders[index].job_id = job.id
    await save_batch(batch)
    return batch


async def create_batch_from_upload_groups(
    groups: dict[str, list[tuple[str, bytes]]],
) -> Batch:
    """浏览器上传：按顶层文件夹分组后串行处理。"""
    if not groups:
        raise ValueError("没有可处理的文件夹")

    batch_id = uuid.uuid4().hex[:12]
    now = _now_iso()
    names = sorted(groups.keys(), key=lambda x: x.lower())
    batch = Batch(
        id=batch_id,
        created_at=now,
        updated_at=now,
        status="queued",
        root_path="upload",
        folders=[
            BatchFolder(name=name, pdf_count=len(groups[name]), status="waiting")
            for name in names
        ],
        current_index=0,
        message=f"上传批次：{len(names)} 个文件夹",
        merged_export_path=str(
            (EXPORTS_DIR / batch_id / "courses-all.jsonl").resolve()
        ),
    )
    await save_batch(batch)

    for index, name in enumerate(names):
        job = await create_job_from_uploads(
            groups[name],
            batch_id=batch_id,
            folder_name=name,
        )
        batch.folders[index].job_id = job.id
        batch.folders[index].pdf_count = job.total
    await save_batch(batch)
    return batch


def _code_from_filename(filename: str) -> str:
    base = Path(filename).stem.strip().upper()
    base = re.sub(r"_+(LMS|CMBA|MBA|UG|PG).*$", "", base, flags=re.I)
    base = re.sub(r"_\d+$", "", base)
    base = re.sub(r"^([A-Z0-9]+)_([A-Z]{2,6}[A-Z0-9]+)$", r"\1:\2", base)
    return base.replace(" ", "").replace("/", ":")


def _build_course_record(
    *,
    item: JobItem,
    llm_code: str,
    llm_name: str,
    llm_fields: dict,
) -> CourseRecord:
    from app.department_meta import DEPARTMENT_META

    rel = item.relative_path.replace("\\", "/")
    parts = Path(rel).parts
    folder = parts[0] if len(parts) > 1 else None
    code = (llm_code or _code_from_filename(item.filename)).upper()

    if folder and folder != "_root" and folder.upper() in DEPARTMENT_META:
        meta = guess_from_folder(folder)
    else:
        meta = guess_department_from_code(code)

    assessment = AssessmentJson(
        items=llm_fields.get("assessment_items") or [],
        original_text=llm_fields.get("assessment_original_text"),
    )

    prefix = settings.pdf_storage_prefix.strip().strip("/\\") or "课程"
    storage_rel = rel if not rel.startswith("_root/") else Path(rel).name
    return CourseRecord(
        code=code,
        name=llm_name or code,
        department=str(meta.get("department") or "unknown"),
        faculty=meta.get("faculty"),
        level=llm_fields.get("level"),
        credits=llm_fields.get("credits"),
        description=llm_fields.get("description"),
        objectives=llm_fields.get("objectives"),
        prerequisites=llm_fields.get("prerequisites"),
        teaching_pattern=llm_fields.get("teaching_pattern"),
        semester_offered=llm_fields.get("semester_offered"),
        assessment_json=assessment,
        pdf_url=None,
        pdf_storage_path=f"{prefix}/{storage_rel}",
        source_file_name=item.filename,
        source_updated_at=None,
        school_id="polyu",
    )


async def auto_export_job(job: Job) -> Path | None:
    if not settings.auto_export:
        return None
    if job.done <= 0:
        return None

    ensure_data_dirs()
    if job.batch_id:
        folder = job.folder_name or job.id
        safe_folder = re.sub(r"[^\w.\-]+", "_", folder)
        output = EXPORTS_DIR / job.batch_id / f"{safe_folder}.jsonl"
        merged = EXPORTS_DIR / job.batch_id / "courses-all.jsonl"
    else:
        output = EXPORTS_DIR / f"courses-{job.id}.jsonl"
        merged = None

    count = write_job_jsonl(job, output, only_done=True)
    if count == 0:
        return None

    job.export_path = str(output.resolve())
    if merged is not None:
        append_job_jsonl(job, merged, only_done=True)
    await save_job(job)
    return output


async def process_job(job_id: str) -> None:
    job = await load_job(job_id)
    if not job:
        return

    job.status = "running"
    job.message = "处理中"
    await save_job(job)

    if job.batch_id:
        batch = await load_batch(job.batch_id)
        if batch:
            for folder in batch.folders:
                if folder.job_id == job.id:
                    folder.status = "running"
                    batch.current_index = batch.folders.index(folder)
                    batch.message = (
                        f"正在处理文件夹 {batch.current_index + 1}/{len(batch.folders)}："
                        f"{folder.name}"
                    )
                    break
            await save_batch(batch)

    try:
        for index, item in enumerate(job.items):
            current = await load_job(job_id)
            if current and current.status == "cancelled":
                return

            # 刷新 item 引用（cancel 检查后继续用内存对象）
            if item.status == "done":
                continue

            item.status = "extracting"
            item.error = None
            label = job.folder_name or ""
            job.message = (
                f"[{label}] 提取文本 {index + 1}/{job.total}: {item.filename}"
                if label
                else f"提取文本 {index + 1}/{job.total}: {item.filename}"
            )
            await save_job(job)

            pdf_path = (
                Path(item.source_abs_path)
                if item.source_abs_path
                else UPLOADS_DIR / job_id / item.relative_path
            )
            try:
                text = await asyncio.to_thread(extract_pdf_text, pdf_path)
                item.pdf_text_chars = len(text)
                item.pdf_text_preview = text[:1200]
                if len(text.strip()) < 40:
                    raise ValueError("PDF 文本过少，可能是扫描件或加密文件")

                item.status = "calling_llm"
                job.message = (
                    f"[{label}] 调用 Qwen {index + 1}/{job.total}: {item.filename}"
                    if label
                    else f"调用 Qwen {index + 1}/{job.total}: {item.filename}"
                )
                await save_job(job)

                llm_course, raw = await extract_course_with_qwen(
                    filename=item.filename,
                    pdf_text=truncate_for_llm(text),
                )
                item.raw_llm = raw
                item.course = _build_course_record(
                    item=item,
                    llm_code=llm_course.code,
                    llm_name=llm_course.name,
                    llm_fields={
                        "level": llm_course.level,
                        "credits": llm_course.credits,
                        "description": llm_course.description,
                        "objectives": llm_course.objectives,
                        "prerequisites": llm_course.prerequisites,
                        "teaching_pattern": llm_course.teaching_pattern,
                        "semester_offered": llm_course.semester_offered,
                        "assessment_items": llm_course.assessment_items,
                        "assessment_original_text": llm_course.assessment_original_text,
                    },
                )
                item.status = "done"
            except Exception as exc:
                item.status = "error"
                item.error = str(exc)

            job.done = sum(1 for i in job.items if i.status == "done")
            job.failed = sum(1 for i in job.items if i.status == "error")
            await save_job(job)

        job.status = "completed"
        export_path = await auto_export_job(job)
        export_note = f"；已自动保存 {export_path.name}" if export_path else ""
        job.message = f"完成：成功 {job.done}，失败 {job.failed}{export_note}"
        await save_job(job)

        if job.batch_id:
            await on_batch_job_finished(job.batch_id, job)
    except Exception as exc:
        job.status = "failed"
        job.message = str(exc)
        await save_job(job)
        if job.batch_id:
            await on_batch_job_finished(job.batch_id, job)
    finally:
        _running_tasks.pop(job_id, None)


def start_job(job_id: str) -> None:
    if job_id in _running_tasks and not _running_tasks[job_id].done():
        return
    task = asyncio.create_task(process_job(job_id))
    _running_tasks[job_id] = task


async def on_batch_job_finished(batch_id: str, job: Job) -> None:
    batch = await load_batch(batch_id)
    if not batch or batch.status in ("cancelled", "completed"):
        return

    for folder in batch.folders:
        if folder.job_id == job.id:
            folder.status = job.status
            folder.export_path = job.export_path
            break

    # 启动下一个 waiting 文件夹
    next_index = None
    for index, folder in enumerate(batch.folders):
        if folder.status == "waiting" and folder.job_id:
            next_index = index
            break

    if next_index is None:
        batch.status = "completed"
        batch.current_index = len(batch.folders)
        batch.message = (
            f"全部完成：{len(batch.folders)} 个文件夹。"
            f"合并文件：{batch.merged_export_path}"
        )
        await save_batch(batch)
        return

    batch.status = "running"
    batch.current_index = next_index
    next_folder = batch.folders[next_index]
    next_folder.status = "queued"
    batch.message = (
        f"正在处理文件夹 {next_index + 1}/{len(batch.folders)}："
        f"{next_folder.name}（{next_folder.pdf_count} 个 PDF）"
    )
    await save_batch(batch)
    if next_folder.job_id:
        start_job(next_folder.job_id)


async def start_batch(batch_id: str) -> Batch:
    batch = await load_batch(batch_id)
    if not batch:
        raise FileNotFoundError("批次不存在")
    if not batch.folders:
        raise ValueError("批次没有文件夹")

    start_index = next(
        (
            index
            for index, folder in enumerate(batch.folders)
            if folder.status in ("waiting", "queued", "failed", "running")
            and folder.job_id
        ),
        None,
    )
    if start_index is None:
        batch.status = "completed"
        batch.message = "批次已全部完成"
        await save_batch(batch)
        return batch

    batch.status = "running"
    batch.current_index = start_index
    folder = batch.folders[start_index]
    folder.status = "queued"
    batch.message = (
        f"开始处理文件夹 {start_index + 1}/{len(batch.folders)}："
        f"{folder.name}（{folder.pdf_count} 个 PDF）"
    )
    await save_batch(batch)
    if folder.job_id:
        start_job(folder.job_id)
    return batch


async def export_job(job_id: str) -> Path:
    job = await load_job(job_id)
    if not job:
        raise FileNotFoundError("任务不存在")
    ensure_data_dirs()
    if job.export_path and Path(job.export_path).exists():
        return Path(job.export_path)
    output = EXPORTS_DIR / f"courses-{job_id}.jsonl"
    count = write_job_jsonl(job, output, only_done=True)
    if count == 0:
        raise ValueError("没有可导出的成功记录")
    job.export_path = str(output.resolve())
    await save_job(job)
    return output


async def update_item_course(
    job_id: str,
    item_id: str,
    course: CourseRecord,
) -> Job:
    job = await load_job(job_id)
    if not job:
        raise FileNotFoundError("任务不存在")
    for item in job.items:
        if item.id == item_id:
            item.course = course
            item.status = "done"
            item.error = None
            break
    else:
        raise FileNotFoundError("条目不存在")
    job.done = sum(1 for i in job.items if i.status == "done")
    job.failed = sum(1 for i in job.items if i.status == "error")
    await save_job(job)
    return job


def group_uploads_by_folder(
    files: list[tuple[str, bytes]],
) -> dict[str, list[tuple[str, bytes]]]:
    groups: dict[str, list[tuple[str, bytes]]] = {}
    for name, content in files:
        rel = _safe_relpath(name)
        parts = rel.split("/")
        if len(parts) >= 2:
            folder = parts[0]
            # 去掉可能的外层目录名如 "课程"
            if folder in ("课程", "学科") and len(parts) >= 3:
                folder = parts[1]
                rel = "/".join(parts[1:])
            elif folder in ("课程", "学科"):
                folder = "_root"
                rel = parts[-1]
            else:
                rel = "/".join(parts)
        else:
            folder = "_root"
        groups.setdefault(folder, []).append((rel, content))
    return groups
