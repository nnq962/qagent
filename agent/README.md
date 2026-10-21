# Python agent

Project Python riêng, dùng `uv` và Python 3.10. Môi trường nằm trong `agent/.venv`.

```bash
cd /home/quyetnn/nnq962/qagent/agent
uv sync
uv run python
```

Cài thư viện bằng `uv add <ten-thu-vien>`.
Nếu cần kích hoạt trực tiếp: `source .venv/bin/activate`.

## Chat với Ollama

Đã cấu hình `.env` cục bộ để kết nối model `gemma4:e4b` trong container
`finance-ollama-1`. Khi dựng lại môi trường, copy `.env.example` thành `.env`
và chỉnh `OLLAMA_BASE_URL` theo địa chỉ Ollama truy cập được.

```bash
uv run python -m src.main --prompt "Xin chào, giới thiệu ngắn gọn bằng tiếng Việt."
uv run python -m src.main
```

Chat tương tác giữ lịch sử trong bộ nhớ; `/reset` để xóa và `/exit` để thoát.
Đây là bước thử LLM trực tiếp, chưa kết nối LiveKit, STT hoặc TTS.

Container Ollama hiện chưa publish cổng ra host. `.env` dùng IP bridge Docker
truy cập được từ máy Linux hiện tại. IP này có thể đổi khi container được tạo lại;
xem IP mới bằng `docker inspect finance-ollama-1` và cập nhật `.env` khi cần.
Nếu agent chạy trong Docker, kết nối vào mạng `finance_default` và dùng
`http://ollama:11434` để tránh phụ thuộc IP. Không cần mở Ollama ra Internet.

`OLLAMA_BASE_URL` dùng API gốc, không thêm `/v1`; `OLLAMA_TIMEOUT` tính bằng giây.
Provider dùng Ollama Python SDK, tắt thinking cho model đang thử và trả nội dung
hoàn chỉnh sau khi sinh xong. API tham khảo: https://docs.ollama.com/api/chat.
