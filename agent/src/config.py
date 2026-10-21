"""Đọc cấu hình kết nối mô hình từ môi trường và tệp .env của agent."""

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv


# -----------------------------------------------------------------------------
@dataclass(frozen=True)
class Settings:
    """Lưu cấu hình bất biến để kết nối dịch vụ Ollama.

    Attributes:
        ollama_base_url: Địa chỉ gốc của HTTP API Ollama, không gồm /v1.
        ollama_model: Tên đầy đủ của model đã có trên Ollama.
        ollama_timeout: Thời gian chờ phản hồi tính bằng giây.
    """

    ollama_base_url: str
    ollama_model: str
    ollama_timeout: float


# -----------------------------------------------------------------------------
def load_settings() -> Settings:
    """Nạp và kiểm tra cấu hình, ưu tiên biến môi trường đã được khai báo.

    Đọc tệp .env ở thư mục agent, độc lập với thư mục chạy lệnh.

    Returns:
        Cấu hình kết nối Ollama đã được kiểm tra.

    Raises:
        ValueError: Khi URL, tên model hoặc thời gian chờ không hợp lệ.
    """
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip().rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "gemma4:e4b").strip()
    parsed = urlparse(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("OLLAMA_BASE_URL phải là địa chỉ HTTP/HTTPS hợp lệ.")
    if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        raise ValueError("OLLAMA_BASE_URL chỉ chứa địa chỉ gốc, không thêm /v1 hoặc /api.")
    if not model:
        raise ValueError("OLLAMA_MODEL không được để trống.")
    timeout = float(os.getenv("OLLAMA_TIMEOUT", "120"))
    if not 0 < timeout < float("inf"):
        raise ValueError("OLLAMA_TIMEOUT phải là số hữu hạn lớn hơn 0.")
    return Settings(base_url, model, timeout)
