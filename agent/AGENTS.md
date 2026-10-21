# Quy tắc viết code

Áp dụng cho code trong thư mục `agent/` và các thư mục con.

## Clean code

- Viết code rõ ràng, dễ đọc; ưu tiên giải pháp đơn giản phù hợp với MVP.
- Đặt tên biến, hàm và class thể hiện đúng mục đích; tuân theo quy ước Python.
- Mỗi hàm và class có trách nhiệm rõ ràng; tránh lặp code và trừu tượng hóa khi chưa cần.
- Chỉ thêm comment khi cần giải thích ý định hoặc logic khó hiểu; tránh diễn giải lại code hiển nhiên.

## Comment phân tách

- Dùng dòng comment sau để phân tách các định nghĩa ở cấp module:

  ```python
  # -----------------------------------------------------------------------------
  ```

- Đặt dòng phân tách giữa hai hàm ngoài class, giữa hai class, hoặc giữa một hàm ngoài class và một class.
- Đặt dòng phân tách ngay trên `def`, `async def` hoặc `class`, không có dòng trống ở giữa.
- Với định nghĩa có decorator, đặt dòng phân tách ngay trên decorator đầu tiên; không chen vào giữa decorator và định nghĩa.
- Giữ hai dòng trống giữa phần kết thúc định nghĩa trước và dòng comment phân tách của định nghĩa tiếp theo.
- Không thêm dòng comment phân tách giữa các method trong cùng một class; chỉ dùng dòng trống thông thường.

## Docstring bằng tiếng Việt

- Mọi hàm, method (bao gồm `__init__` và các method đặc biệt), hàm bất đồng bộ và class phải có docstring đầy đủ bằng tiếng Việt.
- Dùng chuỗi ba dấu nháy kép, đặt ở câu lệnh đầu tiên trong thân hàm hoặc class.
- Docstring của hàm/method mô tả mục đích, tham số, giá trị trả về và các ngoại lệ có thể phát sinh khi áp dụng; nêu tác động phụ hoặc giới hạn quan trọng nếu có.
- Dùng định dạng Google với các mục `Args`, `Returns`, `Raises` và `Yields` khi phù hợp; nội dung mô tả bằng tiếng Việt, giữ nguyên tên tham số và tên kiểu trong code.
- Không cần liệt kê `self`/`cls` hoặc thêm các mục không áp dụng. Với generator, dùng `Yields` để mô tả giá trị được sinh ra.
- Docstring của class mô tả trách nhiệm, cách sử dụng và các thuộc tính công khai quan trọng khi có; docstring của `__init__` mô tả tham số khởi tạo.
- Viết docstring đúng với hành vi thực tế và cập nhật cùng code khi hành vi thay đổi.

Ví dụ:

```python
def load_settings():
    """Nạp cấu hình phục vụ việc khởi chạy agent."""
    pass


# -----------------------------------------------------------------------------
def create_session():
    """Khởi tạo phiên hội thoại với các dịch vụ đã cấu hình."""
    pass


# -----------------------------------------------------------------------------
class Agent:
    """Điều phối vòng đời của agent hội thoại."""

    def start(self):
        """Bắt đầu xử lý các phiên hội thoại."""
        pass

    def stop(self):
        """Dừng xử lý và giải phóng tài nguyên của agent."""
        pass


# -----------------------------------------------------------------------------
class SearchClient:
    """Cung cấp khả năng tìm kiếm thông tin trên web cho agent."""

    def search(self, query):
        """Tìm kiếm thông tin theo từ khóa được cung cấp.

        Args:
            query: Từ khóa hoặc câu hỏi cần tìm kiếm.
        """
        pass
```
