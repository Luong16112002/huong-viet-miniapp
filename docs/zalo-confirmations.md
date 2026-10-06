# Xác nhận đặt bàn và gọi món Hương Việt

OA: **Ẩm Thực Hương Việt1**, `840157406363354036`. Mini App: `1150623612345860288`.

## Chạy tại máy

Node.js 24 trở lên. Mở hai terminal tại thư mục dự án:

```powershell
npm.cmd run backend
```

```powershell
npm.cmd start
```

Frontend cổng 3000 chuyển `/api` về backend cổng 8787. Chỉ chạy một tiến trình cho mỗi cổng. `npm.cmd run ai-proxy` là lệnh cũ của cùng backend, không chạy thêm song song.

Đặt bàn/đơn hàng được ghi vào SQLite `server/data/commerce.sqlite` trước khi gọi Zalo. Không cần token để lưu đơn. Không xóa thư mục này; sao lưu bằng công cụ SQLite có hỗ trợ WAL. Lịch sử dùng mã truy cập ngẫu nhiên trên thiết bị, chưa có đồng bộ tài khoản giữa thiết bị. Mất mã truy cập không xóa dữ liệu server nhưng khách không tự xem lại được trên thiết bị mới. Các bản ghi demo cũ trên localStorage không được coi là đơn thật.

## Cấu hình gửi thật

Sử dụng **ZBS Template Message qua số điện thoại**, không dùng API UID giao dịch hoặc mUID cũ. Xem [API chính thức](https://docs.zaloplatforms.com/open-apis) và [quyền gửi ZBS](https://docs.zaloplatforms.com/docs/ZBS/bat-dau/gioi-thieu-ve-cac-nhom-quyen-thuoc-zbs-template-message).

1. Hoàn tất điều kiện OA/ZBS, OA ủy quyền ứng dụng gửi tin qua số điện thoại, đăng ký và duyệt hai mẫu tin. Chỉ có OA ID/Mini App ID chưa đủ để gửi tin.
2. Thêm các biến trong `server/.env.example` vào `server/.env` hoặc secret manager. Không ghi đè GEMINI_API_KEY hiện có. Không đặt token hay secret trong biến `VITE_*`.
3. `ZALO_OA_ACCESS_TOKEN`: token OA có quyền gửi ZBS; `ZALO_APP_SECRET`: secret ứng dụng tương ứng dùng giải mã phone token của Mini App. Quản lý cấp mới/luân chuyển token ở backend; bản này chưa tự refresh token.
4. `ZALO_RESERVATION_TEMPLATE_ID`, `ZALO_ORDER_TEMPLATE_ID`: ID mẫu **đã duyệt** của OA. Mẫu ghi nhận yêu cầu chờ xác nhận, không tuyên bố đã giữ bàn/đã thanh toán.
5. Mẫu đặt bàn dùng `customer_name`, `booking_code`, `booking_date`, `booking_time`, `guests`, `status`. Mẫu đơn dùng `order_code`, `amount`, `status`. Đổi tên tham số bằng JSON `ZALO_*_TEMPLATE_FIELDS`, ví dụ `{"booking_code":"ma_dat_ban"}`. Nếu mẫu có bộ tham số khác, sửa adapter theo mẫu đã duyệt.
6. Cấp quyền số điện thoại cho Mini App. Khi khách gửi yêu cầu, SDK xin chia sẻ số điện thoại; server xác minh token theo [getPhoneNumber chính thức](https://docs.zaloplatforms.com/docs/MA/api/user/user-information/getPhoneNumber). Tin chỉ gửi về số Zalo đã xác minh của người đặt, không gửi tùy ý về số nhập tay. Từ chối quyền vẫn lưu đơn.
7. Khởi động lại backend. Triển khai backend HTTPS có ổ lưu trữ bền vững, khai báo domain Mini App và `VITE_COMMERCE_API_URL=https://your-domain/api/commerce`, rồi build/deploy lại frontend. Không dùng localhost trên điện thoại thật.

## Trạng thái và giới hạn

- Chưa cấu hình, không có quyền, token hết hạn, timeout hoặc API từ chối: **Đã ghi nhận, đang chờ xác nhận**.
- Chỉ HTTP thành công, `error === 0` và `data.msg_id` có giá trị mới lưu `notification.status=accepted`. UI ghi **Zalo đã tiếp nhận thông báo**; chưa khẳng định giao đến/đã đọc. Chưa tích hợp webhook giao tin.
- Tin nhắn không tự chuyển đơn/bàn thành đã xác nhận; chưa có màn hình quản trị xác nhận nhà hàng.
- Không tự gửi lại tin pending: cần đối soát `tracking_id` nếu lần gọi trước timeout để tránh gửi trùng. Các yêu cầu mới sau khi cấu hình sẽ gọi API thật.
- Giá được tính lại từ menu server. Voucher/điểm mẫu chưa có backend xác thực nên chưa áp dụng. Chọn ví không đồng nghĩa thanh toán thành công; trạng thái thanh toán luôn pending đến khi tích hợp cổng thanh toán.
- Mã truy cập lịch sử là bearer credential riêng của trình duyệt; triển khai công khai cần giới hạn lưu lượng tại reverse proxy và hệ thống đăng nhập/phân quyền quản trị phù hợp.

## Kiểm tra

```powershell
npm.cmd run test:commerce
```

Kiểm tra API giả lập trong test: lưu bền vững, chống trùng, phân tách lịch sử, giá server, lỗi quyền/timeout và success có message ID. Test không gửi tin đến khách và không chứng minh OA hiện đã có quyền gửi thật.
