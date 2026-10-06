-- ============================================================
--  DATABASE SCHEMA - NHÀ HÀNG HƯƠNG VIỆT
--  Engine: MySQL 8.0+ with InnoDB
--  Mô tả: Cơ sở dữ liệu cho ứng dụng gọi món & đặt bàn nhà hàng
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
--  BẢNG 1: users - Lưu thông tin người dùng
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id`            BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID người dùng',
    `name`          VARCHAR(100)        NOT NULL COMMENT 'Họ và tên người dùng',
    `phone`         VARCHAR(20)         NOT NULL COMMENT 'Số điện thoại (unique)',
    `email`         VARCHAR(150)        NULL DEFAULT NULL COMMENT 'Địa chỉ email',
    `avatar`        VARCHAR(255)        NULL DEFAULT NULL COMMENT 'URL ảnh đại diện',
    `zalo_id`       VARCHAR(100)        NULL DEFAULT NULL COMMENT 'ID Zalo từ OAuth SDK',
    `created_at`    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo tài khoản',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_phone` (`phone`),
    UNIQUE KEY `uk_users_zalo_id` (`zalo_id`),
    KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu thông tin người dùng ứng dụng';

-- ============================================================
--  BẢNG 2: restaurants - Lưu thông tin các chi nhánh nhà hàng
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurants` (
    `id`            BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID nhà hàng',
    `name`          VARCHAR(150)        NOT NULL COMMENT 'Tên chi nhánh nhà hàng',
    `address`       TEXT                NOT NULL COMMENT 'Địa chỉ đầy đủ',
    `phone`         VARCHAR(20)         NOT NULL COMMENT 'Số điện thoại nhà hàng',
    `open_hours`    VARCHAR(100)        NOT NULL COMMENT 'Giờ mở cửa (vd: 09:00 - 22:00)',
    `description`   TEXT                NULL DEFAULT NULL COMMENT 'Mô tả chi tiết về chi nhánh',
    `images_json`   JSON                NULL DEFAULT NULL COMMENT 'JSON chứa danh sách URL ảnh nhà hàng',
    `lat`           DECIMAL(10,8)       NOT NULL COMMENT 'Vĩ độ bản đồ',
    `lng`           DECIMAL(11,8)       NOT NULL COMMENT 'Kinh độ bản đồ',
    `rating`        DECIMAL(2,1)        NOT NULL DEFAULT 5.0 COMMENT 'Đánh giá trung bình (0-5 sao)',
    `review_count`  INT UNSIGNED        NOT NULL DEFAULT 0 COMMENT 'Tổng số lượt đánh giá',
    `created_at`    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thêm chi nhánh',
    PRIMARY KEY (`id`),
    KEY `idx_restaurants_location` (`lat`, `lng`),
    KEY `idx_restaurants_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu các chi nhánh Nhà Hàng Hương Việt';

-- ============================================================
--  BẢNG 3: categories - Danh mục món ăn
-- ============================================================
CREATE TABLE IF NOT EXISTS `categories` (
    `id`            BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID danh mục',
    `name`          VARCHAR(50)         NOT NULL COMMENT 'Tên danh mục (Món chính, Tráng miệng...)',
    `icon`          VARCHAR(100)        NOT NULL COMMENT 'Tên / URL biểu tượng danh mục',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh mục phân loại món ăn';

-- ============================================================
--  BẢNG 4: foods - Danh sách món ăn trong thực đơn
-- ============================================================
CREATE TABLE IF NOT EXISTS `foods` (
    `id`                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID món ăn',
    `name`                  VARCHAR(150)        NOT NULL COMMENT 'Tên món ăn',
    `price`                 DECIMAL(12,2)       NOT NULL COMMENT 'Giá bán (VNĐ)',
    `image`                 VARCHAR(255)        NOT NULL COMMENT 'URL ảnh minh họa món',
    `category_id`           BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> categories.id, danh mục món',
    `status`                ENUM('available','sold_out','hidden') NOT NULL DEFAULT 'available' COMMENT 'Trạng thái bán: còn / hết / ẩn',
    `badge`                 VARCHAR(30)         NULL DEFAULT NULL COMMENT 'Thẻ nhãn (Signature, Bestseller, New...)',
    `description`           TEXT                NULL DEFAULT NULL COMMENT 'Mô tả chi tiết món ăn',
    `ingredients`           TEXT                NULL DEFAULT NULL COMMENT 'Nguyên liệu chính',
    `prep_time_minutes`     INT UNSIGNED        NOT NULL DEFAULT 15 COMMENT 'Thời gian chuẩn bị (phút)',
    `created_at`            TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thêm món',
    PRIMARY KEY (`id`),
    KEY `fk_foods_category` (`category_id`),
    KEY `idx_foods_status` (`status`),
    KEY `idx_foods_price` (`price`),
    CONSTRAINT `fk_foods_category` FOREIGN KEY (`category_id`)
        REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thực đơn món ăn Nhà Hàng Hương Việt';

-- ============================================================
--  BẢNG 5: tables - Quản lý bàn ăn tại nhà hàng
-- ============================================================
CREATE TABLE IF NOT EXISTS `tables` (
    `id`            BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID bàn',
    `restaurant_id` BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> restaurants.id, nhà hàng sở hữu bàn',
    `number`        INT UNSIGNED        NOT NULL COMMENT 'Số bàn (để gọi khách)',
    `capacity`      INT UNSIGNED        NOT NULL COMMENT 'Sức chứa tối đa khách / bàn',
    `status`        ENUM('available','reserved','maintenance') NOT NULL DEFAULT 'available' COMMENT 'Trạng thái: trống / đặt / bảo trì',
    `zone`          VARCHAR(30)         NULL DEFAULT NULL COMMENT 'Khu vực (Tầng trệt, Sân thượng, VIP...)',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tables_restaurant_number` (`restaurant_id`, `number`),
    KEY `fk_tables_restaurant` (`restaurant_id`),
    KEY `idx_tables_status` (`status`),
    CONSTRAINT `fk_tables_restaurant` FOREIGN KEY (`restaurant_id`)
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quản lý bàn ăn theo từng chi nhánh';

-- ============================================================
--  BẢNG 6: reservations - Phiếu đặt bàn
-- ============================================================
CREATE TABLE IF NOT EXISTS `reservations` (
    `id`            BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID đặt bàn',
    `user_id`       BIGINT UNSIGNED     NULL DEFAULT NULL COMMENT 'FK -> users.id, người dùng đặt (null nếu khách vãng lai)',
    `restaurant_id` BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> restaurants.id, nhà hàng đặt',
    `table_id`      BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> tables.id, bàn được đặt',
    `date`          DATE                NOT NULL COMMENT 'Ngày đặt bàn',
    `time`          TIME                NOT NULL COMMENT 'Giờ đặt bàn',
    `guests_count`  INT UNSIGNED        NOT NULL COMMENT 'Số khách dự kiến',
    `note`          TEXT                NULL DEFAULT NULL COMMENT 'Ghi chú đặc biệt (gần cửa sổ, cho trẻ em...)',
    `name`          VARCHAR(100)        NOT NULL COMMENT 'Tên người đặt (để kiểm tra)',
    `phone`         VARCHAR(20)         NOT NULL COMMENT 'SĐT liên hệ người đặt',
    `status`        ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái đơn đặt',
    `created_at`    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo phiếu đặt',
    PRIMARY KEY (`id`),
    KEY `fk_reservations_user` (`user_id`),
    KEY `fk_reservations_restaurant` (`restaurant_id`),
    KEY `fk_reservations_table` (`table_id`),
    KEY `idx_reservations_datetime` (`date`, `time`),
    KEY `idx_reservations_status` (`status`),
    KEY `idx_reservations_phone` (`phone`),
    CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_reservations_restaurant` FOREIGN KEY (`restaurant_id`)
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reservations_table` FOREIGN KEY (`table_id`)
        REFERENCES `tables` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu các yêu cầu đặt bàn của khách hàng';

-- ============================================================
--  BẢNG 7: orders - Phiếu đơn hàng gọi món
-- ============================================================
CREATE TABLE IF NOT EXISTS `orders` (
    `id`                BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID đơn hàng',
    `user_id`           BIGINT UNSIGNED     NULL DEFAULT NULL COMMENT 'FK -> users.id, người dùng tạo đơn',
    `restaurant_id`     BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> restaurants.id, nhà hàng thực hiện',
    `reservation_id`    BIGINT UNSIGNED     NULL DEFAULT NULL COMMENT 'FK -> reservations.id, liên kết đặt bàn (nếu có)',
    `total`             DECIMAL(12,2)       NOT NULL DEFAULT 0 COMMENT 'Tổng tiền thanh toán (VNĐ)',
    `status`            ENUM('pending','confirmed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái xử lý đơn',
    `payment_method`    ENUM('cash','card','zalopay','momo') NOT NULL COMMENT 'Phương thức thanh toán',
    `payment_status`    ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái thanh toán',
    `note`              TEXT                NULL DEFAULT NULL COMMENT 'Ghi chú của khách hàng',
    `created_at`        TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo đơn',
    `updated_at`        TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời gian cập nhật trạng thái gần nhất',
    PRIMARY KEY (`id`),
    KEY `fk_orders_user` (`user_id`),
    KEY `fk_orders_restaurant` (`restaurant_id`),
    KEY `fk_orders_reservation` (`reservation_id`),
    KEY `idx_orders_status` (`status`),
    KEY `idx_orders_payment_status` (`payment_status`),
    KEY `idx_orders_created_at` (`created_at`),
    CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_orders_restaurant` FOREIGN KEY (`restaurant_id`)
        REFERENCES `restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_orders_reservation` FOREIGN KEY (`reservation_id`)
        REFERENCES `reservations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu các đơn hàng gọi món của khách';

-- ============================================================
--  BẢNG 8: order_details - Chi tiết từng món trong đơn hàng
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_details` (
    `id`            BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID dòng chi tiết',
    `order_id`      BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> orders.id, đơn hàng cha',
    `food_id`       BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> foods.id, món ăn được gọi',
    `quantity`      INT UNSIGNED        NOT NULL COMMENT 'Số lượng món gọi',
    `unit_price`    DECIMAL(12,2)       NOT NULL COMMENT 'Đơn giá tại thời điểm gọi (khóa giá)',
    `note`          VARCHAR(255)        NULL DEFAULT NULL COMMENT 'Ghi chú riêng cho món (ít ớt, không hành...)',
    `subtotal`      DECIMAL(12,2)       NOT NULL COMMENT 'Thành tiền = quantity * unit_price',
    PRIMARY KEY (`id`),
    KEY `fk_order_details_order` (`order_id`),
    KEY `fk_order_details_food` (`food_id`),
    CONSTRAINT `fk_order_details_order` FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_order_details_food` FOREIGN KEY (`food_id`)
        REFERENCES `foods` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết các món ăn trong mỗi đơn hàng';

-- ============================================================
--  BẢNG 9: notifications - Thông báo đẩy cho người dùng
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`            BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID thông báo',
    `user_id`       BIGINT UNSIGNED     NOT NULL COMMENT 'FK -> users.id, người nhận thông báo',
    `type`          ENUM('order','reservation','promotion','system','reservation_rejected') NOT NULL COMMENT 'Phân loại thông báo',
    `title`         VARCHAR(200)        NOT NULL COMMENT 'Tiêu đề ngắn gọn thông báo',
    `content`       TEXT                NULL DEFAULT NULL COMMENT 'Nội dung chi tiết thông báo',
    `image`         VARCHAR(255)        NULL DEFAULT NULL COMMENT 'URL ảnh đính kèm (nếu có)',
    `read`          BOOLEAN             NOT NULL DEFAULT FALSE COMMENT 'Đã đọc hay chưa',
    `created_at`    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo thông báo',
    `metadata`      JSON                NULL DEFAULT NULL COMMENT 'JSON metadata bổ sung (orderId, promoCode...)',
    PRIMARY KEY (`id`),
    KEY `fk_notifications_user` (`user_id`),
    KEY `idx_notifications_user_read` (`user_id`, `read`),
    KEY `idx_notifications_type` (`type`),
    KEY `idx_notifications_created_at` (`created_at`),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu các thông báo cho người dùng ứng dụng';

-- ============================================================
--  BẢNG 10: promotions - Chương trình khuyến mãi
-- ============================================================
CREATE TABLE IF NOT EXISTS `promotions` (
    `id`                BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, ID chương trình',
    `name`              VARCHAR(150)        NOT NULL COMMENT 'Tên chương trình khuyến mãi',
    `code`              VARCHAR(30)         NOT NULL COMMENT 'Mã giảm giá (unique, để user nhập)',
    `discount_percent`  DECIMAL(5,2)        NOT NULL COMMENT '% giảm giá (0-100)',
    `min_total`         DECIMAL(12,2)       NOT NULL DEFAULT 0 COMMENT 'Tổng hóa đơn tối thiểu để áp dụng',
    `from_date`         DATE                NOT NULL COMMENT 'Ngày bắt đầu hiệu lực',
    `to_date`           DATE                NOT NULL COMMENT 'Ngày hết hạn',
    `is_active`         BOOLEAN             NOT NULL DEFAULT TRUE COMMENT 'Trạng thái bật / tắt chương trình',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_promotions_code` (`code`),
    KEY `idx_promotions_date_range` (`from_date`, `to_date`),
    KEY `idx_promotions_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu các chương trình khuyến mãi và mã giảm giá';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  TỔNG KẾT: 10 bảng chính của hệ thống
--  1. users              - Người dùng
--  2. restaurants        - Chi nhánh nhà hàng
--  3. categories         - Danh mục món ăn
--  4. foods              - Thực đơn món ăn
--  5. tables             - Bàn ăn theo chi nhánh
--  6. reservations       - Phiếu đặt bàn
--  7. orders             - Phiếu đơn hàng gọi món
--  8. order_details      - Chi tiết món trong đơn
--  9. notifications      - Thông báo người dùng
-- 10. promotions         - Chương trình khuyến mãi
-- ============================================================
