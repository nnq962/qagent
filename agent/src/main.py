"""Chạy giao diện chat terminal để kiểm tra kết nối Ollama."""

import argparse
import sys

import httpx
from ollama import ResponseError

from src.config import load_settings
from src.providers.llm import OllamaLLM

SYSTEM_PROMPT = "Bạn là trợ lý hữu ích. Trả lời bằng tiếng Việt, rõ ràng và ngắn gọn."


# -----------------------------------------------------------------------------
def main() -> int:
    """Chạy một câu hỏi hoặc phiên chat tương tác với lịch sử trong bộ nhớ.

    Tham số --prompt gửi một câu hỏi rồi kết thúc. Trong chế độ tương tác,
    dùng /exit để thoát hoặc /reset để xóa lịch sử của phiên hiện tại.
    Lượt hỏi thất bại không được thêm vào lịch sử. Lịch sử mất khi thoát.

    Returns:
        Mã 0 khi hoàn tất bình thường, mã 1 khi cấu hình hoặc yêu cầu thất bại.
    """
    parser = argparse.ArgumentParser(description="Chat với Ollama từ terminal.")
    parser.add_argument("--prompt", help="Gửi một câu hỏi rồi kết thúc.")
    args = parser.parse_args()
    try:
        settings = load_settings()
    except ValueError as error:
        print(f"Lỗi cấu hình: {error}", file=sys.stderr)
        return 1

    llm = OllamaLLM(settings)
    history = [{"role": "system", "content": SYSTEM_PROMPT}]
    if args.prompt is None:
        print(f"Model: {settings.ollama_model} | /reset: xóa lịch sử | /exit: thoát")

    while True:
        try:
            question = args.prompt if args.prompt is not None else input("Bạn: ")
            question = question.strip()
            if not question:
                if args.prompt is not None:
                    print("Câu hỏi không được để trống.", file=sys.stderr)
                    return 1
                continue
            if args.prompt is None and question == "/exit":
                return 0
            if args.prompt is None and question == "/reset":
                history = history[:1]
                print("Đã xóa lịch sử hội thoại.")
                continue
            messages = [*history, {"role": "user", "content": question}]
            answer = llm.reply(messages)
            history = [*messages, {"role": "assistant", "content": answer}]
            print(f"Trợ lý: {answer}")
            if args.prompt is not None:
                return 0
        except (EOFError, KeyboardInterrupt):
            print()
            return 0
        except (ResponseError, ConnectionError, httpx.HTTPError, ValueError) as error:
            print(f"Không lấy được câu trả lời: {error}", file=sys.stderr)
            if args.prompt is not None:
                return 1


if __name__ == "__main__":
    raise SystemExit(main())
