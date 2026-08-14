from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = ROOT_DIR.parent.parent
DATA_DIR = ROOT_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
JOBS_DIR = DATA_DIR / "jobs"
BATCHES_DIR = DATA_DIR / "batches"
EXPORTS_DIR = DATA_DIR / "exports"
DEFAULT_COURSE_ROOT = REPO_ROOT / "课程"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    qwen_api_key: str = ""
    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    qwen_model: str = "qwen-plus"
    host: str = "127.0.0.1"
    port: int = 8765
    max_upload_mb: int = 50
    # 本地串行扫描默认根目录（仓库内 课程/）
    course_pdf_root: str = str(DEFAULT_COURSE_ROOT)
    # 写入 pdf_storage_path 时的前缀
    pdf_storage_prefix: str = "课程"
    auto_export: bool = True


settings = Settings()


def ensure_data_dirs() -> None:
    for path in (DATA_DIR, UPLOADS_DIR, JOBS_DIR, BATCHES_DIR, EXPORTS_DIR):
        path.mkdir(parents=True, exist_ok=True)
