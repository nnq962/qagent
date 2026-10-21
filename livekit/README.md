# LiveKit Server với Docker Compose

Cấu hình một node cho phát triển trên **Linux với Docker Engine và Compose v2+**.
Image được ghim ở `livekit/livekit-server:v1.13.10`. Dùng host networking nên
không có mục `ports`; các cổng được mở trực tiếp trên máy host.

## Chạy

```bash
cd /home/quyetnn/nnq962/qagent/livekit
# Lần tạo ban đầu đã có .env với API key/secret ngẫu nhiên.
# Khi clone/copy thư mục mà chưa có .env:
# cp .env.example .env
# Thay LIVEKIT_API_KEY và LIVEKIT_API_SECRET trước khi chạy.
# Có thể sinh key bằng: openssl rand -hex 12
# Có thể sinh secret bằng: openssl rand -hex 32

docker compose config --quiet
docker compose up -d
docker compose logs -f livekit
```

Trong `.env`, đặt `LIVEKIT_NODE_IP` là **IP của máy host mà client truy cập được**.
Mặc định `127.0.0.1` chỉ dùng khi client chạy trên chính máy này. Để thử web và
Android qua Wi-Fi, đổi sang IP LAN, ví dụ `192.168.1.10`, rồi chạy
`docker compose up -d` để áp dụng. Có thể xem IP bằng `ip -brief address`.

`LIVEKIT_URL` là giá trị tham khảo cho backend/agent; thay đổi biến này không
thay IP mà server quảng bá. Khi dùng LAN, cập nhật nó thành
`ws://192.168.1.10:7880` và cấu hình cùng URL đó trong client.

## Cổng và kết nối

| Cổng | Giao thức | Mục đích |
| --- | --- | --- |
| 7880 | TCP | HTTP API và WebSocket signaling |
| 7881 | TCP | WebRTC qua TCP khi UDP không dùng được |
| 7882 | UDP | WebRTC media qua UDP multiplexing |

Nếu firewall đang bật, cho phép các cổng này từ mạng phát triển.
Không chỉ mở 7880: kết nối signaling thành công vẫn có thể không có âm thanh
nếu cổng media bị chặn. Máy Android và host cần truy cập được nhau; Wi-Fi có
client isolation có thể chặn kết nối.

- Web trên chính host: `ws://localhost:7880`.
- Android thật hoặc máy khác trong LAN: `ws://<IP-LAN-HOST>:7880`.
- Android Emulator mặc định có thể truy cập host qua `10.0.2.2`, nhưng địa chỉ
  signaling đó không thay thế yêu cầu IP/cổng media phải truy cập được.
- Backend/agent chạy trong container khác trên Linux có thể dùng host networking
  và `ws://127.0.0.1:7880`; localhost trong container bridge là chính container đó.

Trên web, micro yêu cầu secure context: `http://localhost` phù hợp khi phát triển
trên host. Truy cập trang qua `http://<IP-LAN>` thường không được cấp micro;
thử web từ thiết bị khác cần HTTPS và LiveKit qua WSS với chứng chỉ được tin cậy.
Android dùng WS khi phát triển có thể cần cấu hình cho phép cleartext traffic
trong bản debug; bản triển khai thực tế nên dùng WSS.

## Kiểm tra và quản lý

### Dashboard

```bash
docker compose up -d --build
```

Mở **http://localhost:3080** để xem phòng, identity/tên người tham gia, AI agent,
thời điểm tham gia và các track audio/video. Bấm vào phòng để mở chi tiết,
tìm theo tên/identity hoặc nhấn Làm mới. Dữ liệu tự cập nhật mỗi 5 giây;
khi mất kết nối, giao diện báo lỗi và đánh dấu dữ liệu cũ.

Dashboard chỉ đọc dữ liệu, không lưu lịch sử. API key/secret chỉ được truyền
cho backend qua môi trường container. Mặc định dashboard bind `127.0.0.1:3080`
và chưa có đăng nhập, dành cho truy cập trên chính máy host.
Nếu cần truy cập từ máy khác, nên đặt sau reverse proxy có xác thực và HTTPS;
không mở trực tiếp dashboard chưa xác thực ra Internet.

Source nằm trong `dashboard/`, dùng Node.js và `livekit-server-sdk`.
Dashboard kết nối trực tiếp `http://127.0.0.1:7880` bằng host networking,
độc lập với URL WebSocket mà client sử dụng.

### Kiểm tra server

```bash
# Kiểm tra HTTP server; không thay cho kiểm tra audio với SDK.
curl --fail http://127.0.0.1:7880/
docker compose ps

# Dừng server
docker compose down
```

Client cần JWT do backend cấp, có quyền room join và identity riêng cho từng
người dùng. Backend/agent dùng API key và secret từ `.env`; không đưa secret vào
web bundle hoặc APK. `.env` được bỏ qua bởi Git. `docker compose config` không
có `--quiet` có thể in secret đã nội suy.

## Phạm vi và triển khai public

Đây là lớp truyền âm thanh/dữ liệu. Để bot nói chuyện cần thêm LiveKit Agents,
mô hình STT/LLM/TTS hoặc speech-to-speech và backend cấp JWT.
Server không lưu lịch sử hội thoại vào database. Redis có thể bổ sung khi cần
triển khai phân tán nhiều node.

Cấu hình hiện tại chưa bật TLS hoặc TURN. Khi triển khai Internet:

1. Dùng domain và chứng chỉ TLS được tin cậy; đặt reverse proxy cho HTTPS/WSS
   tới cổng 7880. Hạn chế truy cập trực tiếp 7880 khi đã có proxy.
2. Đặt `LIVEKIT_NODE_IP` thành public IP truy cập được, chuyển tiếp cổng media
   nếu có NAT. Chỉ reverse proxy HTTP không đủ để truyền WebRTC media.
3. Cấu hình TURN, ưu tiên có TURN/TLS, để hỗ trợ các mạng chặn UDP/TCP trực tiếp.
4. Dùng backend xác thực người dùng và cấp token giới hạn quyền/thời hạn.

Nếu dùng Docker Desktop trên macOS/Windows, host networking có điều kiện hỗ trợ
riêng; cấu hình này hướng tới Linux. Không dùng mặc định như bản production.

Tham khảo chính thức:

- [Triển khai LiveKit](https://docs.livekit.io/transport/self-hosting/deployment/)
- [Cấu hình server](https://github.com/livekit/livekit/blob/v1.13.10/config-sample.yaml)
- [Xác thực frontend](https://docs.livekit.io/frontends/build/authentication/)
