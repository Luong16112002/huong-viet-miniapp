# Nhà Hàng Hương Việt - RESTful API Specification

## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Xác thực (Auth)](#2-xác-thực-auth)
- [3. Nhà hàng (Restaurants)](#3-nhà-hàng-restaurants)
- [4. Món ăn (Foods)](#4-món-ăn-foods)
- [5. Đặt bàn (Reservations)](#5-đặt-bàn-reservations)
- [6. Đơn hàng (Orders)](#6-đơn-hàng-orders)
- [7. AI Chatbot](#7-ai-chatbot)
- [8. Thông báo (Notifications)](#8-thông-báo-notifications)
- [9. Mã lỗi chung](#9-mã-lỗi-chung)

---

## 1. Tổng quan

Base URL: `https://api.huongviet.vn/v1`

Authentication: Bearer JWT Token trong header `Authorization: Bearer <token>`

Content-Type: `application/json`

### Tóm tắt các endpoint

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập (Zalo SDK / SĐT OTP) |
| GET | `/api/restaurants` | Lấy danh sách nhà hàng |
| GET | `/api/foods` | Lấy danh sách món ăn |
| POST | `/api/reservations` | Tạo đặt bàn mới |
| GET | `/api/orders` | Lấy danh sách đơn hàng |
| POST | `/api/orders` | Tạo đơn hàng mới (gọi món) |
| POST | `/api/chatbot` | Gửi tin nhắn AI Food Assistant |
| GET | `/api/notifications` | Lấy danh sách thông báo |

---

## 2. Xác thực (Auth)

### 2.1 POST `/api/auth/login` - Đăng nhập

Xác thực người dùng qua Zalo SDK hoặc SĐT OTP, trả về JWT token + thông tin user.

**Request Body JSON:**

```json
{
  "code": "zalo_oauth_code_xyz",
  "phone": null,
  "otp": null
}
```

**Parameters:**

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| code | string | Conditional | Mã OAuth từ Zalo SDK (nếu đăng nhập Zalo) |
| phone | string | Conditional | Số điện thoại (nếu đăng nhập OTP) |
| otp | string | Conditional | Mã OTP 6 chữ số (nếu đăng nhập OTP) |

**Response 200 OK (Thành công):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxMzgwMDAwMCwiZXhwIjoxNzEzODg2NDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "phone": "0987654321",
    "avatar": null
  }
}
```

**Response 401 Unauthorized (Lỗi):**

```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Xác thực thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.",
    "details": "OTP không hợp lệ hoặc đã hết hạn"
  }
}
```

---

## 3. Nhà hàng (Restaurants)

### 3.1 GET `/api/restaurants` - Lấy danh sách nhà hàng

Lấy danh sách nhà hàng Hương Việt theo vị trí người dùng.

**Query Parameters:**

| Param | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| lat | float | Có | Vĩ độ vị trí người dùng |
| lng | float | Có | Kinh độ vị trí người dùng |

**Ví dụ:** `/api/restaurants?lat=17.47&lng=106.60`

**Response 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nhà Hàng Hương Việt - Cầu Giấy",
      "address": "123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
      "phone": "024 1234 5678",
      "openHours": "09:00 - 22:00",
      "rating": 4.7,
      "images": [
        "https://res.cloudinary.com/huongviet/image/upload/v1/nhahang1_main.jpg",
        "https://res.cloudinary.com/huongviet/image/upload/v1/nhahang1_space.jpg",
        "https://res.cloudinary.com/huongviet/image/upload/v1/nhahang1_kitchen.jpg"
      ],
      "lat": 21.0285,
      "lng": 105.7913
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 4. Món ăn (Foods)

### 4.1 GET `/api/foods` - Lấy danh sách món ăn

Lấy thực đơn món ăn theo danh mục và nhà hàng.

**Query Parameters:**

| Param | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| categoryId | string | Không | ID danh mục món (main-dish, appetizer, dessert, drink) |
| restaurantId | int | Có | ID nhà hàng |

**Ví dụ:** `/api/foods?categoryId=main-dish&restaurantId=1`

**Response 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bò nướng lá lốt",
      "price": 89000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/bo_nuong_la_lot.jpg",
      "categoryId": "main-dish",
      "status": "available",
      "badge": "Signature",
      "description": "Thịt bò Úc tẩm gia vị truyền thống, cuốn lá lốt non nướng than hoa, đậm đà hương vị đặc trưng miền Nam.",
      "ingredients": "Thịt bò nạc, lá lốt tươi, tỏi, ớt, tiêu, mắm tôm, đường phèn"
    },
    {
      "id": 2,
      "name": "Gỏi cuốn",
      "price": 45000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/goi_cuon.jpg",
      "categoryId": "appetizer",
      "status": "available",
      "badge": "Healthy",
      "description": "Gỏi cuốn tôm thịt tươi mát, ăn kèm rau sống và nước chấm đậu phộng thơm lừng.",
      "ingredients": "Tôm sú, thịt lợn nạc, bánh tráng, giá đỗ, húng quế, xà lách, rau răm"
    },
    {
      "id": 3,
      "name": "Phở Bò Hà Nội",
      "price": 65000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/pho_bo.jpg",
      "categoryId": "main-dish",
      "status": "available",
      "badge": "Bestseller",
      "description": "Nước dùng phở đậm đà ninh từ xương bò 12 tiếng, kèm bánh phở dẻo, thịt bò tái, gân mềm.",
      "ingredients": "Xương bò, thịt bò tái, gân bò, bánh phở, hành tây, gừng, quế, hồi, đinh hương"
    },
    {
      "id": 4,
      "name": "Bánh Xèo Miền Tây",
      "price": 75000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/banh_xeo.jpg",
      "categoryId": "main-dish",
      "status": "available",
      "badge": null,
      "description": "Bánh xèo giòn tan, nhân tôm thịt măng, cuốn bánh tráng sống ăn kèm rau rừng.",
      "ingredients": "Bột gạo, nghệ, tôm sú, thịt ba chỉ, măng khô, hành tây, giá đỗ"
    },
    {
      "id": 5,
      "name": "Cá Kho Tộ",
      "price": 120000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/ca_kho_to.jpg",
      "categoryId": "main-dish",
      "status": "available",
      "badge": "Chef's pick",
      "description": "Cá lóc kho tộ đậm đà vị mặn ngọt, thịt cá săn chắc ngấm gia vị, ăn cực cơm.",
      "ingredients": "Cá lóc, dừa nạo, mắm kho, đường phèn, thịt xông khói, ớt, gừng, tỏi"
    },
    {
      "id": 6,
      "name": "Chả Giò Cửa Biển",
      "price": 55000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/cha_gio.jpg",
      "categoryId": "appetizer",
      "status": "available",
      "badge": "Crispy",
      "description": "Chả giò tôm cua giòn rụm bên ngoài, nhân nóng hổi ăn kèm rau sống và nước chấm.",
      "ingredients": "Tôm, cua, thịt băm, mộc nhĩ, cà rốt, bánh tráng chiên"
    },
    {
      "id": 7,
      "name": "Chè Bưởi Thái Bình",
      "price": 35000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/che_buoi.jpg",
      "categoryId": "dessert",
      "status": "available",
      "badge": null,
      "description": "Chè bưởi thơm mát, thạch trong veo, nước đường thanh nhiệt ngọt dịu.",
      "ingredients": "Thịt bưởi, thạch rau câu, sợi bánh hỏi, đường phèn, hạt nếp cẩm"
    },
    {
      "id": 8,
      "name": "Sinh Tố Bơ",
      "price": 40000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/sinh_to_bo.jpg",
      "categoryId": "drink",
      "status": "available",
      "badge": "Fresh",
      "description": "Sinh tố bơ sáp Đắk Lắk xay mịn với sữa tươi, béo ngậy tự nhiên.",
      "ingredients": "Bơ sáp, sữa tươi không đường, sữa đặc, đường cát trắng"
    },
    {
      "id": 9,
      "name": "Lẩu Thái Cá Basa",
      "price": 180000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/lau_thai.jpg",
      "categoryId": "main-dish",
      "status": "available",
      "badge": "Hot",
      "description": "Lẩu thái chua cay truyền thống, nương cá basa mềm, rau củ tươi đi kèm.",
      "ingredients": "Cá basa, sả, ớt, lá chanh, cà chua, măng chua, dâu tằm, nấm rơm"
    },
    {
      "id": 10,
      "name": "Trà Đào Cam Sả",
      "price": 38000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/tra_dao.jpg",
      "categoryId": "drink",
      "status": "available",
      "badge": "New",
      "description": "Trà đào thơm phức vị đào tươi, cam cắt lát và sả nấu vàng nước cốt.",
      "ingredients": "Đào tươi, cam, sả, lá bưởi, trà ô long, đường phèn"
    },
    {
      "id": 11,
      "name": "Xôi Xéo",
      "price": 50000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/xoi_xeo.jpg",
      "categoryId": "main-dish",
      "status": "sold_out",
      "badge": null,
      "description": "Xôi nếp đậu xanh ngon đậm, rắc lạc rang và hành phi thơm lừng.",
      "ingredients": "Nếp cái hoa vàng, đậu xanh, hành khô, lạc rang, dầu mè"
    }
  ],
  "pagination": {
    "total": 11,
    "page": 1,
    "limit": 20
  }
}
```

---

## 5. Đặt bàn (Reservations)

### 5.1 POST `/api/reservations` - Tạo đặt bàn mới

Tạo mới yêu cầu đặt bàn tại nhà hàng Hương Việt.

**Request Body JSON:**

```json
{
  "userId": 1,
  "restaurantId": 1,
  "tableId": 6,
  "date": "2026-04-15",
  "time": "19:00",
  "guestsCount": 4,
  "note": "Gần cửa sổ",
  "name": "Nguyễn Văn A",
  "phone": "0987654321"
}
```

**Parameters:**

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| userId | int | Có | ID người dùng đăng nhập |
| restaurantId | int | Có | ID nhà hàng |
| tableId | int | Có | ID bàn đặt |
| date | string (YYYY-MM-DD) | Có | Ngày đặt |
| time | string (HH:MM) | Có | Giờ đặt |
| guestsCount | int | Có | Số khách (từ 1-20) |
| note | string | Không | Ghi chú đặc biệt |
| name | string | Có | Tên người đặt |
| phone | string | Có | Số điện thoại liên hệ |

**Response 201 Created (Thành công):**

```json
{
  "success": true,
  "reservationId": "TB00123",
  "status": "confirmed",
  "tableNumber": 6,
  "message": "Đặt bàn thành công. Chúng tôi đã gửi mã xác nhận đến số điện thoại của bạn.",
  "qrCodeUrl": "https://res.cloudinary.com/huongviet/qr/TB00123.png"
}
```

**Response 400 Bad Request:**

```json
{
  "success": false,
  "error": {
    "code": "TABLE_NOT_AVAILABLE",
    "message": "Bàn số 6 không còn trống vào khung giờ 19:00 ngày 15/04/2026.",
    "suggestedTables": [
      { "tableId": 8, "tableNumber": 8, "capacity": 4 },
      { "tableId": 10, "tableNumber": 10, "capacity": 6 }
    ]
  }
}
```

---

## 6. Đơn hàng (Orders)

### 6.1 GET `/api/orders` - Lấy danh sách đơn hàng theo userId

Lấy danh sách đơn hàng của người dùng, có thể lọc theo trạng thái.

**Query Parameters:**

| Param | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| userId | int | Có | ID người dùng |
| status | string | Không | Lọc theo trạng thái (pending, confirmed, preparing, ready, completed, cancelled) |
| page | int | Không | Trang (default 1) |
| limit | int | Không | Số record / trang (default 10) |

**Ví dụ:** `/api/orders?userId=1&status=pending`

**Response 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "orderCode": "HV260415001",
      "items": [
        {
          "foodId": 1,
          "name": "Bò nướng lá lốt",
          "quantity": 2,
          "unitPrice": 89000,
          "note": "Ít ớt",
          "subtotal": 178000,
          "image": "https://res.cloudinary.com/huongviet/image/upload/v1/bo_nuong_la_lot.jpg"
        },
        {
          "foodId": 2,
          "name": "Gỏi cuốn",
          "quantity": 1,
          "unitPrice": 45000,
          "note": null,
          "subtotal": 45000,
          "image": "https://res.cloudinary.com/huongviet/image/upload/v1/goi_cuon.jpg"
        }
      ],
      "total": 223000,
      "status": "pending",
      "createdAt": "2026-04-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 6.2 POST `/api/orders` - Tạo đơn hàng mới (gọi món)

Tạo đơn hàng gọi món mới từ giỏ hàng của người dùng.

**Request Body JSON:**

```json
{
  "userId": 1,
  "restaurantId": 1,
  "items": [
    {
      "foodId": 1,
      "quantity": 2,
      "note": "Ít ớt"
    }
  ],
  "total": 223000,
  "note": "Giao nhanh",
  "paymentMethod": "cash"
}
```

**Parameters:**

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| userId | int | Có | ID người dùng |
| restaurantId | int | Có | ID nhà hàng |
| items | array | Có | Danh sách món ăn (foodId, quantity, note) |
| total | decimal | Có | Tổng tiền đơn hàng |
| note | string | Không | Ghi chú đơn hàng |
| paymentMethod | string | Có | Phương thức thanh toán (cash, card, zalopay, momo) |

**Response 201 Created (Thành công):**

```json
{
  "success": true,
  "orderId": 1001,
  "orderCode": "HV260415001",
  "status": "pending",
  "estimatedTime": 30,
  "message": "Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ xác nhận trong vòng 5 phút."
}
```

---

## 7. AI Chatbot

### 7.1 POST `/api/chatbot` - Gửi tin nhắn AI Food Assistant

Trò chuyện với trợ lý ẩm thực AI, nhận gợi ý món ăn cá nhân hóa.

**Request Body JSON:**

```json
{
  "userId": 1,
  "message": "Hôm nay có món gì ngon?",
  "context": "recommend"
}
```

**Parameters:**

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| userId | int | Có | ID người dùng |
| message | string | Có | Nội dung tin nhắn của user |
| context | string | Không | Context chat (recommend, order, reservation, general) |

**Response 200 OK:**

```json
{
  "reply": "Hôm nay nhà hàng có 3 món ngon cực kỳ đáng thử 🌟\n\n1. **Bò nướng lá lốt** - Đặc sản signature nhà hàng, thịt bò Úc tẩm gia vị cuốn lá lốt nướng than hoa siêu thơm.\n2. **Lẩu Thái Cá Basa** - Khẩu vị chua cay đúng chuẩn Thái, cá basa mềm tan trong miệng.\n3. **Chè Bưởi Thái Bình** - Tráng miệng thanh mát, giải tỏa cơn nóng bức.\n\nBạn muốn mình giới thiệu chi tiết món nào hơn không nè?",
  "suggestions": [
    {
      "foodId": 1,
      "name": "Bò nướng lá lốt",
      "reason": "Đặc sản signature nhà hàng",
      "price": 89000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/bo_nuong_la_lot.jpg"
    },
    {
      "foodId": 9,
      "name": "Lẩu Thái Cá Basa",
      "reason": "Hôm nay trời mát thích hợp ăn lẩu",
      "price": 180000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/lau_thai.jpg"
    },
    {
      "foodId": 7,
      "name": "Chè Bưởi Thái Bình",
      "reason": "Tráng miệng thanh nhiệt",
      "price": 35000,
      "image": "https://res.cloudinary.com/huongviet/image/upload/v1/che_buoi.jpg"
    }
  ],
  "quickReplies": [
    "Đặt món Bò nướng lá lốt",
    "Xem toàn bộ thực đơn",
    "Gợi ý món cho 2 người",
    "Món ít cay cho trẻ em"
  ]
}
```

---

## 8. Thông báo (Notifications)

### 8.1 GET `/api/notifications` - Lấy thông báo user

Lấy danh sách thông báo của người dùng (đơn hàng, đặt bàn, khuyến mãi, hệ thống).

**Query Parameters:**

| Param | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| userId | int | Có | ID người dùng |
| limit | int | Không | Số lượng tối đa (default 20) |
| page | int | Không | Trang (default 1) |

**Ví dụ:** `/api/notifications?userId=1&limit=20`

**Response 200 OK:**

```json
{
  "success": true,
  "data": [
    {
      "id": 5001,
      "type": "order",
      "title": "Đơn hàng #HV260415001 đã được xác nhận",
      "body": "Đơn hàng gọi món của bạn đang được bếp chuẩn bị. Thời gian dự kiến 30 phút.",
      "read": false,
      "createdAt": "2026-04-15T10:35:00.000Z",
      "metadata": {
        "orderId": 1001,
        "orderCode": "HV260415001",
        "status": "preparing"
      }
    },
    {
      "id": 5002,
      "type": "reservation",
      "title": "Đặt bàn TB00123 đã được xác nhận ✅",
      "body": "Bạn đã đặt bàn số 6 lúc 19:00 ngày 15/04 cho 4 người. Hãy đến sớm 10 phút để được đón tiếp tốt nhất nhé!",
      "read": false,
      "createdAt": "2026-04-14T15:20:00.000Z",
      "metadata": {
        "reservationId": "TB00123",
        "tableNumber": 6,
        "date": "2026-04-15",
        "time": "19:00"
      }
    },
    {
      "id": 5003,
      "type": "promotion",
      "title": "🎉 Ưu đãi đặc biệt - Giảm 20% cuối tuần",
      "body": "Thứ 7 & Chủ Nhật tuần này, giảm ngay 20% tổng hóa đơn khi gọi món qua app. Mã: WEEKEND20",
      "read": true,
      "createdAt": "2026-04-12T09:00:00.000Z",
      "metadata": {
        "promoCode": "WEEKEND20",
        "discountPercent": 20,
        "validUntil": "2026-04-19"
      }
    },
    {
      "id": 5004,
      "type": "system",
      "title": "Chào mừng đến với Hương Việt!",
      "body": "Cảm ơn bạn đã đăng ký tài khoản. Hãy khám phá thực đơn ẩm thực Việt Nam đậm hương vị cùng chúng tôi nhé.",
      "read": true,
      "createdAt": "2026-04-01T08:00:00.000Z",
      "metadata": {}
    }
  ],
  "unreadCount": 2,
  "pagination": {
    "total": 4,
    "page": 1,
    "limit": 20
  }
}
```

---

## 9. Mã lỗi chung

| HTTP Code | Error Code | Mô tả |
|---|---|---|
| 400 | VALIDATION_ERROR | Dữ liệu không hợp lệ |
| 401 | AUTH_FAILED | Xác thực thất bại (token hết hạn / sai) |
| 403 | FORBIDDEN | Không có quyền truy cập |
| 404 | NOT_FOUND | Tài nguyên không tồn tại |
| 409 | CONFLICT | Xung truy cập dữ liệu (bàn đã đặt, trùng email...) |
| 429 | RATE_LIMITED | Gửi yêu cầu quá nhanh, vui lòng chờ |
| 500 | INTERNAL_ERROR | Lỗi hệ thống không xác định |
