from __future__ import annotations

import json
from pathlib import Path

from app.schema import CourseRecord, Job


def course_to_export_dict(course: CourseRecord) -> dict:
    data = course.model_dump()
    assessment = data.get("assessment_json") or {}
    data["assessment_json"] = {
        "items": assessment.get("items") or [],
        "original_text": assessment.get("original_text"),
    }
    return data


def write_job_jsonl(job: Job, output_path: Path, *, only_done: bool = True) -> int:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with output_path.open("w", encoding="utf-8") as handle:
        for item in job.items:
            if only_done and item.status != "done":
                continue
            if not item.course:
                continue
            handle.write(
                json.dumps(course_to_export_dict(item.course), ensure_ascii=False)
                + "\n"
            )
            count += 1
    return count


def append_job_jsonl(job: Job, output_path: Path, *, only_done: bool = True) -> int:
    """把任务成功记录追加到合并 JSONL。"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with output_path.open("a", encoding="utf-8") as handle:
        for item in job.items:
            if only_done and item.status != "done":
                continue
            if not item.course:
                continue
            handle.write(
                json.dumps(course_to_export_dict(item.course), ensure_ascii=False)
                + "\n"
            )
            count += 1
    return count
