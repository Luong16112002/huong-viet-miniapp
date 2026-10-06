# Quản trị Hương Việt

Mở `/admin`, `/admin/tables`, `/admin/bookings` hoặc `/admin/orders` trên cùng frontend với ứng dụng khách. Đăng nhập bằng tên tài khoản và mật khẩu. Tên cấu hình qua `ADMIN_USERNAME`, mật khẩu lưu dưới dạng scrypt `ADMIN_PASSWORD_HASH` trong `server/.env`. Tài khoản hiện tại dùng tên `admin`, mật khẩu là mã quản trị cũ đã được chuyển đổi sang hash. Không đưa thông tin đăng nhập vào biến `VITE_*`. Trình duyệt chỉ lưu token phiên trong sessionStorage, không lưu mật khẩu. Phiên hết hạn sau 8 giờ; đăng xuất thu hồi token. Khởi động lại backend yêu cầu đăng nhập lại.

Admin dùng chính kết nối SQLite của `createCommerce`, mặc định `server/data/commerce.sqlite`. Không tạo đơn/đặt bàn mẫu hoặc cơ sở dữ liệu Admin riêng. Bàn mới do quản trị viên nhập theo sơ đồ nhà hàng thực tế. POST `/api/admin/login` xác thực tên/mật khẩu; các API quản trị còn lại yêu cầu token phiên hợp lệ. Đăng nhập sai giới hạn 8 lần mỗi phút theo địa chỉ kết nối. `ADMIN_ACCESS_KEY` không còn được chấp nhận làm Bearer token trong bản chạy ứng dụng. Tham số key chỉ được truyền trực tiếp trong kiểm thử tương thích; cấu hình runtime không truyền tham số này. Thiếu tài khoản sẽ từ chối đăng nhập.

Chạy `npm start` để mở backend và Zalo frontend. Khởi động lại backend sau khi cập nhật cấu hình hoặc mã server.

## Quy trình

1. Thêm bàn, khu vực, sức chứa ở **Quản lý bàn**.
2. Khách gửi lịch trên app → **Đặt bàn** hiển thị yêu cầu cùng gợi ý bàn phù hợp.
3. Chọn bàn và thời lượng (mặc định 120 phút, 30–360 phút), gán rồi xác nhận. Lịch có giao nhau bị từ chối, hai lịch sát giờ được phép.
4. Check-in sớm tối đa 30 phút, trong khoảng giờ đặt → bàn đang sử dụng.
5. Cập nhật đơn theo tiến trình nhận món. Đơn tại bàn phải có mã bàn trong danh sách bàn.
6. Hoàn tất lượt đặt bàn hoặc hoàn tất đơn và chọn **Khách đã rời bàn** → bàn đang dọn. Nếu còn đơn chưa hoàn tất, server từ chối giải phóng bàn.
7. Nhân viên chọn **Trống** sau khi dọn. Nếu bàn còn lịch đặt, trạng thái sẽ là **Đã đặt**.

Xóa bàn là ngưng sử dụng để giữ liên kết lịch sử. Không được ngưng bàn đang có lịch hoặc đơn chưa hoàn tất. Khu vực khách hiện dùng trong nhà/sân vườn/phòng riêng; tầng 1/tầng 2 là khu vực quản lý nội bộ. Thay đổi được ghi trong `admin_audit`; tiến trình trạng thái lưu trong từng bản ghi.

Danh sách Admin và lịch sử đơn/đặt bàn của khách cập nhật mỗi 10 giây khi đang mở. Tổng giá trị đơn hoàn tất không đồng nghĩa doanh thu đã đối soát thanh toán.

Kiểm tra: `node --test server/admin-auth.test.mjs server/admin.test.mjs server/commerce.test.mjs server/notifications.test.mjs`.
