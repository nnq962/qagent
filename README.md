# qagent

Trợ lý AI hỗ trợ chat chữ và giọng nói cho web và Android.

## Thành phần

- [`agent/`](agent/README.md): Python 3.10, quản lý môi trường bằng uv, kết nối Ollama.
- [`livekit/`](livekit/README.md): LiveKit Server và dashboard chạy bằng Docker Compose.

## Chạy agent

```bash
cd agent
uv sync --locked
cp .env.example .env
# Chỉnh OLLAMA_BASE_URL theo địa chỉ Ollama truy cập được.
uv run python -m src.main
```

Model mặc định: `gemma4:e4b`. Lệnh `/reset` xóa lịch sử và `/exit` kết thúc chat.

## Chạy LiveKit và dashboard

```bash
cd livekit
cp .env.example .env
# Thay API key/secret và chỉnh LIVEKIT_NODE_IP trước khi chạy.
docker compose up -d --build
```

Dashboard: http://localhost:3080 (trên máy chạy Docker).
Xem README của từng module để cấu hình mạng và triển khai.

## Trạng thái MVP

Đã có chat terminal với Ollama và LiveKit Server kèm dashboard giám sát.
STT/TTS, tích hợp hội thoại qua LiveKit, công cụ DB/tìm kiếm web và client
web/Android sẽ được bổ sung tiếp.

Các file `.env` cục bộ không được đưa vào Git; `.env.example` là mẫu cấu hình.
