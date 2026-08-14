from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.config import ROOT_DIR, ensure_data_dirs, settings
from app.jobs import (
    create_batch_from_local_root,
    create_batch_from_upload_groups,
    create_job_from_uploads,
    discover_folder_queue,
    export_job,
    group_uploads_by_folder,
    list_batches,
    list_jobs,
    load_batch,
    load_job,
    start_batch,
    start_job,
    update_item_course,
)
from app.schema import CourseRecord

ensure_data_dirs()

app = FastAPI(
    title="PolyUHub Course PDF Pipeline",
    description="独立工具：批量 PDF → Qwen 抽取 → JSONL（非网站页面）",
    version="1.1.0",
)

STATIC_DIR = ROOT_DIR / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    html_path = STATIC_DIR / "index.html"
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@app.get("/api/health")
async def health() -> dict:
    root = Path(settings.course_pdf_root)
    return {
        "ok": True,
        "qwenConfigured": bool(settings.qwen_api_key.strip()),
        "model": settings.qwen_model,
        "baseUrl": settings.qwen_base_url,
        "autoExport": settings.auto_export,
        "coursePdfRoot": str(root),
        "coursePdfRootExists": root.exists(),
    }


@app.get("/api/local/preview")
async def api_local_preview(root: str | None = None) -> dict:
    path = Path(root or settings.course_pdf_root).expanduser().resolve()
    try:
        queue = discover_folder_queue(path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "root": str(path),
        "folderCount": len(queue),
        "pdfCount": sum(len(pdfs) for _, pdfs in queue),
        "folders": [
            {"name": name, "pdfCount": len(pdfs)} for name, pdfs in queue
        ],
    }


@app.get("/api/jobs")
async def api_list_jobs() -> list[dict]:
    jobs = await list_jobs()
    return [
        {
            "id": job.id,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
            "status": job.status,
            "total": job.total,
            "done": job.done,
            "failed": job.failed,
            "message": job.message,
            "batch_id": job.batch_id,
            "folder_name": job.folder_name,
            "export_path": job.export_path,
        }
        for job in jobs
    ]


@app.get("/api/jobs/{job_id}")
async def api_get_job(job_id: str) -> dict:
    job = await load_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="任务不存在")
    return job.model_dump()


@app.get("/api/batches")
async def api_list_batches() -> list[dict]:
    batches = await list_batches()
    return [b.model_dump() for b in batches]


@app.get("/api/batches/{batch_id}")
async def api_get_batch(batch_id: str) -> dict:
    batch = await load_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch.model_dump()


class LocalBatchBody(BaseModel):
    root_path: str | None = None
    only_folders: list[str] | None = None


@app.post("/api/batches/local")
async def api_create_local_batch(body: LocalBatchBody | None = None) -> dict:
    body = body or LocalBatchBody()
    try:
        batch = await create_batch_from_local_root(
            body.root_path,
            only_folders=body.only_folders,
        )
        batch = await start_batch(batch.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return batch.model_dump()


@app.post("/api/batches/{batch_id}/start")
async def api_start_batch(batch_id: str) -> dict:
    try:
        batch = await start_batch(batch_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return batch.model_dump()


@app.post("/api/jobs")
async def api_create_job(
    files: list[UploadFile] = File(...),
    sequential_folders: bool = Query(True),
) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="请上传至少一个 PDF")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    prepared: list[tuple[str, bytes]] = []

    for upload in files:
        name = upload.filename or f"upload-{len(prepared)}.pdf"
        if not name.lower().endswith(".pdf"):
            continue
        content = await upload.read()
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"{name} 超过 {settings.max_upload_mb}MB 限制",
            )
        prepared.append((name, content))

    groups = group_uploads_by_folder(prepared)

    # 多个文件夹：自动串行 + 完成后自动保存 JSONL
    if sequential_folders and len(groups) > 1:
        try:
            batch = await create_batch_from_upload_groups(groups)
            batch = await start_batch(batch.id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        current = batch.folders[batch.current_index] if batch.folders else None
        return {
            "type": "batch",
            "id": batch.id,
            "batch_id": batch.id,
            "job_id": current.job_id if current else None,
            "total_folders": len(batch.folders),
            "status": batch.status,
            "message": batch.message,
        }

    # 单文件夹 / 零散文件：一个 job
    flat: list[tuple[str, bytes]] = []
    for items in groups.values():
        flat.extend(items)
    try:
        job = await create_job_from_uploads(
            flat,
            folder_name=next(iter(groups.keys())) if len(groups) == 1 else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    start_job(job.id)
    return {
        "type": "job",
        "id": job.id,
        "job_id": job.id,
        "total": job.total,
        "status": job.status,
    }


@app.post("/api/jobs/{job_id}/retry-failed")
async def api_retry_failed(job_id: str) -> dict:
    job = await load_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="任务不存在")

    for item in job.items:
        if item.status == "error":
            item.status = "pending"
            item.error = None

    from app.jobs import save_job

    job.status = "queued"
    job.failed = 0
    job.message = "重试失败项"
    await save_job(job)
    start_job(job.id)
    return {"id": job.id, "status": "queued"}


class PatchCourseBody(BaseModel):
    course: CourseRecord


@app.put("/api/jobs/{job_id}/items/{item_id}")
async def api_patch_item(job_id: str, item_id: str, body: PatchCourseBody) -> dict:
    try:
        job = await update_item_course(job_id, item_id, body.course)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return job.model_dump()


@app.get("/api/jobs/{job_id}/export")
async def api_export(job_id: str) -> FileResponse:
    try:
        path = await export_job(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FileResponse(
        path=str(path),
        filename=path.name,
        media_type="application/x-ndjson",
    )


@app.get("/api/batches/{batch_id}/export")
async def api_export_batch(batch_id: str) -> FileResponse:
    batch = await load_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    if not batch.merged_export_path or not Path(batch.merged_export_path).exists():
        raise HTTPException(status_code=400, detail="合并 JSONL 尚未生成")
    path = Path(batch.merged_export_path)
    return FileResponse(
        path=str(path),
        filename=path.name,
        media_type="application/x-ndjson",
    )


def run() -> None:
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )


if __name__ == "__main__":
    run()
