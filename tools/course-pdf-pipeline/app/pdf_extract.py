from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def extract_pdf_text(file_path: Path, *, max_pages: int = 30) -> str:
    reader = PdfReader(str(file_path))
    chunks: list[str] = []

    for index, page in enumerate(reader.pages):
        if index >= max_pages:
            break
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        text = text.strip()
        if text:
            chunks.append(text)

    joined = "\n\n".join(chunks)
    return normalize_text(joined)


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = []
    for line in text.split("\n"):
        cleaned = " ".join(line.split())
        lines.append(cleaned)
    # 压缩过多空行
    out: list[str] = []
    blank = 0
    for line in lines:
        if not line:
            blank += 1
            if blank <= 1:
                out.append("")
            continue
        blank = 0
        out.append(line)
    return "\n".join(out).strip()


def truncate_for_llm(text: str, max_chars: int = 24000) -> str:
    if len(text) <= max_chars:
        return text
    head = text[: max_chars - 800]
    tail = text[-700:]
    return f"{head}\n\n...[truncated]...\n\n{tail}"
