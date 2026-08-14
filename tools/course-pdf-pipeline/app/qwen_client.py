from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.config import settings
from app.schema import AssessmentItem, LlmCourseExtract

SYSTEM_PROMPT = """你是香港理工大学（PolyU）官方 Subject Description Form / 课程大纲 PDF 的信息抽取助手。
请只根据用户提供的 PDF 文本抽取结构化字段，不要编造原文没有的信息。
若某字段找不到，返回 null 或空字符串/空数组。
必须输出一个 JSON 对象，不要 markdown，不要解释。"""

USER_PROMPT_TEMPLATE = """从下列课程 PDF 文本中抽取字段。

文件名提示：{filename}

请输出 JSON，字段如下：
{{
  "code": "Subject code, uppercase; combined subjects joined with colon e.g. ABCT1D01:ABCT1301",
  "name": "Official English course title",
  "level": "e.g. 1 / 2 / 3 / 4 / UG / PG, or null if missing",
  "credits": number or null,
  "description": "Subject Synopsis / Description in English, keep key points",
  "objectives": "Intended Learning Outcomes / Objectives in English; do not repeat the word Objectives",
  "prerequisites": "Pre-requisite / Co-requisite / Exclusion summary in English",
  "teaching_pattern": "Teaching/Learning Approach summary in English",
  "semester_offered": "Semester offered, or null",
  "assessment_items": [{{"label": "English assessment name e.g. Assignment / Final Examination", "value": "e.g. 40%"}}],
  "assessment_original_text": "Assessment section summary in English",
  "notes": "Brief note if uncertain, or null"
}}

规则：
1. code 优先用 PDF 内 Subject Code；若缺失再用文件名。
2. assessment_items 尽量覆盖全部评分项，排除 Total；label 必须用英文（如 Assignment、Quiz、Final Examination），不要用中文。
3. value 保留百分比字符串，如 "40%"。
4. name / description / objectives / prerequisites / teaching_pattern / assessment 等正文与标签一律保持英文原文，不要翻译成中文；专有名词按原文保留。
5. 不要把「科目編號 / Subject Code / Indicative Syllabus」等表头写进 name/description。
6. 只输出 JSON。

PDF 文本：
---
{pdf_text}
---
"""


def _strip_code_fence(content: str) -> str:
    content = content.strip()
    fence = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```$", content, re.I)
    if fence:
        return fence.group(1).strip()
    return content


def _parse_json_object(content: str) -> dict[str, Any]:
    cleaned = _strip_code_fence(content)
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        data = json.loads(cleaned[start : end + 1])
        if isinstance(data, dict):
            return data
    raise ValueError("模型未返回可解析的 JSON 对象")


def parse_llm_course(data: dict[str, Any]) -> LlmCourseExtract:
    items_raw = data.get("assessment_items") or []
    items: list[AssessmentItem] = []
    if isinstance(items_raw, list):
        for item in items_raw:
            if not isinstance(item, dict):
                continue
            label = str(item.get("label") or "").strip()
            value = item.get("value")
            value_str = None if value is None else str(value).strip()
            if label:
                items.append(AssessmentItem(label=label, value=value_str or None))

    credits = data.get("credits")
    credits_val: float | None
    try:
        credits_val = float(credits) if credits is not None and credits != "" else None
    except (TypeError, ValueError):
        credits_val = None

    return LlmCourseExtract(
        code=str(data.get("code") or "").strip().upper().replace("/", ":").replace(" ", ""),
        name=str(data.get("name") or "").strip(),
        level=(str(data["level"]).strip() if data.get("level") not in (None, "") else None),
        credits=credits_val,
        description=_as_optional_str(data.get("description")),
        objectives=_as_optional_str(data.get("objectives")),
        prerequisites=_as_optional_str(data.get("prerequisites")),
        teaching_pattern=_as_optional_str(data.get("teaching_pattern")),
        semester_offered=_as_optional_str(data.get("semester_offered")),
        assessment_items=items,
        assessment_original_text=_as_optional_str(data.get("assessment_original_text")),
        notes=_as_optional_str(data.get("notes")),
    )


def _as_optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


async def extract_course_with_qwen(
    *,
    filename: str,
    pdf_text: str,
) -> tuple[LlmCourseExtract, dict[str, Any]]:
    if not settings.qwen_api_key.strip():
        raise RuntimeError("未配置 QWEN_API_KEY，请在 tools/course-pdf-pipeline/.env 中设置")

    payload = {
        "model": settings.qwen_model,
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": USER_PROMPT_TEMPLATE.format(
                    filename=filename,
                    pdf_text=pdf_text,
                ),
            },
        ],
    }

    url = settings.qwen_base_url.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.qwen_api_key.strip()}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code >= 400:
            raise RuntimeError(
                f"Qwen API 错误 {response.status_code}: {response.text[:800]}"
            )
        body = response.json()

    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Qwen 响应结构异常: {body}") from exc

    raw = _parse_json_object(str(content))
    return parse_llm_course(raw), raw
