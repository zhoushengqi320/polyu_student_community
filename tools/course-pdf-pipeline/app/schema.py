from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class AssessmentItem(BaseModel):
    label: str
    value: str | None = None


class AssessmentJson(BaseModel):
    items: list[AssessmentItem] = Field(default_factory=list)
    original_text: str | None = None


class CourseRecord(BaseModel):
    """与网站 courses 表 / import 脚本字段对齐的导出结构。"""

    code: str
    name: str
    department: str
    faculty: str | None = None
    level: str | None = None
    credits: float | None = None
    description: str | None = None
    objectives: str | None = None
    prerequisites: str | None = None
    teaching_pattern: str | None = None
    semester_offered: str | None = None
    assessment_json: AssessmentJson = Field(default_factory=AssessmentJson)
    pdf_url: str | None = None
    pdf_storage_path: str | None = None
    source_file_name: str | None = None
    source_updated_at: str | None = None
    school_id: str = "polyu"


class LlmCourseExtract(BaseModel):
    """模型应返回的中间结构（再补全 department / 路径等）。"""

    code: str = ""
    name: str = ""
    level: str | None = None
    credits: float | None = None
    description: str | None = None
    objectives: str | None = None
    prerequisites: str | None = None
    teaching_pattern: str | None = None
    semester_offered: str | None = None
    assessment_items: list[AssessmentItem] = Field(default_factory=list)
    assessment_original_text: str | None = None
    notes: str | None = None


ItemStatus = Literal[
    "pending",
    "extracting",
    "calling_llm",
    "done",
    "error",
    "skipped",
]


class JobItem(BaseModel):
    id: str
    filename: str
    relative_path: str
    status: ItemStatus = "pending"
    error: str | None = None
    pdf_text_preview: str | None = None
    pdf_text_chars: int = 0
    course: CourseRecord | None = None
    raw_llm: dict[str, Any] | None = None
    # 本地扫描时直接读原文件，避免复制
    source_abs_path: str | None = None


JobStatus = Literal["queued", "running", "completed", "failed", "cancelled"]


class Job(BaseModel):
    id: str
    created_at: str
    updated_at: str
    status: JobStatus = "queued"
    total: int = 0
    done: int = 0
    failed: int = 0
    message: str | None = None
    items: list[JobItem] = Field(default_factory=list)
    batch_id: str | None = None
    folder_name: str | None = None
    export_path: str | None = None
    source_root: str | None = None


BatchStatus = Literal["queued", "running", "completed", "failed", "cancelled"]


class BatchFolder(BaseModel):
    name: str
    pdf_count: int = 0
    job_id: str | None = None
    status: JobStatus | Literal["waiting"] = "waiting"
    export_path: str | None = None


class Batch(BaseModel):
    id: str
    created_at: str
    updated_at: str
    status: BatchStatus = "queued"
    root_path: str
    folders: list[BatchFolder] = Field(default_factory=list)
    current_index: int = 0
    message: str | None = None
    merged_export_path: str | None = None
