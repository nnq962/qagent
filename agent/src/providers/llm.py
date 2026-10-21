"""Giao tiếp với mô hình ngôn ngữ qua HTTP API của Ollama."""

from ollama import Client

from src.config import Settings


# -----------------------------------------------------------------------------
class OllamaLLM:
    """Gửi hội thoại đến Ollama và trả về nội dung phản hồi.

    Lịch sử thuộc về từng phiên gọi, không được lưu chung trong provider.
    """

    def __init__(self, settings: Settings) -> None:
        """Khởi tạo client theo cấu hình kết nối.

        Args:
            settings: URL, model và thời gian chờ của Ollama.
        """
        self._client = Client(host=settings.ollama_base_url, timeout=settings.ollama_timeout)
        self._model = settings.ollama_model

    def reply(self, messages: list[dict[str, str]]) -> str:
        """Sinh câu trả lời từ lịch sử hội thoại mà không sửa dữ liệu đầu vào.

        Args:
            messages: Danh sách tin nhắn theo thứ tự, gồm role và content.

        Returns:
            Nội dung trả lời đã loại bỏ khoảng trắng ở hai đầu.

        Raises:
            ollama.ResponseError: Khi Ollama báo lỗi, ví dụ model không tồn tại.
            ConnectionError: Khi không kết nối được Ollama.
            httpx.HTTPError: Khi yêu cầu HTTP thất bại hoặc hết thời gian chờ.
            ValueError: Khi hội thoại hoặc câu trả lời không có nội dung.
        """
        if not messages:
            raise ValueError("Hội thoại không được để trống.")
        response = self._client.chat(
            model=self._model,
            messages=messages,
            stream=False,
            think=False,
        )
        answer = (response.message.content or "").strip()
        if not answer:
            raise ValueError("Ollama trả về câu trả lời rỗng.")
        return answer
