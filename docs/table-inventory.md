# Danh mục bàn

Chuyển dữ liệu cũ sang bộ chuẩn: `node server/migrate-table-inventory.mjs` để xem trước,
`node server/migrate-table-inventory.mjs --apply` để áp dụng. Lệnh apply sao lưu toàn bộ SQLite
trước khi chuyển đổi. Transaction cập nhật liên kết records và thay inventory cùng lúc,
giữ trạng thái bàn cũ, lưu bảng ánh xạ `table_migrations`, chặn liên kết không xác định
hoặc sức chứa không đủ cho booking đang hoạt động. Sau migration có 500 bàn active.
Migration phân bổ lại sức chứa chuẩn; seed thông thường vẫn giữ chỉnh sửa của Admin.

Mỗi khu tối đa 100 bàn, kể cả bàn ngưng sử dụng. Mã theo khu:
floor1 → T1-, floor2 → T2-, indoor → IN-, garden → SV-, private → PR-.
API nhận alias cũ outdoor/vip và chuẩn hóa thành garden/private.

Seed mới chia sức chứa theo số bàn: 001–020: 2, 021–050: 4, 051–070: 6,
071–082: 8, 083–090: 10, 091–096: 12, 097–100: 20 khách.
Seed không ghi đè sức chứa đã được Admin chỉnh sửa. Dữ liệu cũ cần migration riêng.

Kiểm tra seed: `node server/seed-tables.mjs --dry-run`

Tạo các bàn còn thiếu: `node server/seed-tables.mjs`

Seed dùng COMMERCE_DB_PATH trong môi trường/server/.env, mặc định server/data/commerce.sqlite.
Seed chạy trong transaction, không ghi đè bàn đã có. Nếu có mã cũ hoặc khu vượt 100 bàn, seed dừng và rollback; cần chuyển đổi dữ liệu cùng các liên kết booking/order trước.

App khách hiển thị 12 bàn đầu, các trang tiếp theo tối đa 20 bàn; Admin phân trang 20/25 bàn. Cả hai dùng chung inventory backend.
