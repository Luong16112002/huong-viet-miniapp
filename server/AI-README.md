# AI Chef Assistant

## Chạy

- Đặt `GEMINI_API_KEY` trong `server/.env` (đã bỏ qua bởi Git), không dùng biến `VITE_` cho khóa.
- `npm start`: backend + Zalo dev server. Hoặc `npm run dev`: backend + Vite.
- Nếu frontend đang chạy riêng, chỉ chạy `npm run backend`; tránh bật thêm frontend cùng cổng 3000.
- Backend HTTPS cần triển khai riêng khi phát hành Mini App. `VITE_GEMINI_PROXY_URL` chỉ chứa URL công khai `/api/ai/chat`, không chứa khóa.

## Luồng dữ liệu

`message + history + context → prepareChat → truy xuất tối đa 18 món liên quan → Gemini structured JSON → kiểm tra ID/số lượng/ngân sách → cards/combos/actions`.

`menu-context.mjs` dùng cùng danh mục `product.mock.ts` như ứng dụng; chưa có database thực đơn riêng. Không gửi cả 120 món hoặc thông tin khách hàng lên Gemini. `chef-engine.mjs` lọc ID yêu thích/lịch sử, ưu tiên tên món và từ khóa, lọc các hạn chế có dữ liệu, chỉ truyền món liên quan. Sở thích là dữ liệu, không phải system instruction.

Server chỉ chấp nhận ID từ kết quả truy xuất; số phần 1–20. Giá, tổng combo và tiền còn lại được tính từ thực đơn phía server. Món không tồn tại, số lượng sai, trùng lặp hoặc combo vượt ngân sách không được đưa thành hành động đặt hàng. Mô hình không ghi vào giỏ hàng hoặc tạo đơn: khách bấm thêm món/combo, rồi xác nhận ở giỏ hàng.

Context số người/ngân sách giữ giữa các lượt; history mang tên và số lượng trong combo đã hiển thị. Tạo lại giữ điều kiện và loại các ID vừa đề xuất. Sở thích/yêu thích lưu sessionStorage; feedback lưu trong hội thoại hiện tại. Chỉ gửi ID món của đơn completed/delivered lấy qua API đơn hàng của phiên đăng nhập, không gửi tên, điện thoại, địa chỉ hoặc nội dung đơn.

## Giao diện

- Form thu gọn: số người 1/2/4/6/8+ (tối đa 20), ngân sách, khẩu vị, sở thích, dị ứng và yêu thích.
- Bảy quick action phía trên ô nhập; mục Dành cho bạn chỉ hiện khi có lịch sử hoàn tất.
- Card món, mô tả, số lượng, thêm giỏ; 2–3 combo khi mô hình tìm đủ lựa chọn hợp lệ, tổng và số tiền còn lại.
- Tên món trong phản hồi bấm được; bottom sheet ảnh, mô tả, thành phần hiện có, mức cay, lưu yêu thích và gợi ý món kèm.
- BOOK_TABLE hiển thị form ngày/giờ/số khách/khu vực; chuyển draft sang màn đặt bàn hiện có.
- Nhập giọng nói tiếng Việt bằng SpeechRecognition nếu WebView hỗ trợ. Bấm micro mới bắt đầu; có xử lý từ chối quyền, không nhận được giọng nói và không hỗ trợ. Không lưu audio; trình duyệt có thể dùng dịch vụ nhận dạng từ xa. Transcript cuối được gửi vào AI.

## Giới hạn dữ liệu và vận hành

AI kiểm tra inventory bàn thật qua commerce/admin: bàn đang hoạt động, đủ sức chứa, đúng khu vực và không trùng lịch. Nếu khách chưa chọn khu vực, tra tất cả khu và đếm riêng từng khu. Thiếu ngày/giờ/số khách thì hỏi đúng phần thiếu, không truy vấn bàn; không tự chọn ngày khi khách chưa nêu hoặc chưa có lựa chọn trong hội thoại. Khi hết bàn, kiểm tra các giờ sau cách 30 phút đến 21:00. Kết quả chỉ là bàn trống tại lúc kiểm tra, không giữ chỗ.

`server/services/aiContextService.mjs` cung cấp các hàm getRestaurantInfo, getMenuItems, getFoodById, getFoodByName, getDrinks, getPromotions, getCart, getOrders, getBookings, getAvailableTables và getCustomerProfile. Giữ đuôi .mjs theo cấu trúc backend hiện có. Router chỉ gửi dữ liệu liên quan lên Gemini. Gemini diễn giải kết quả tra cứu bằng giọng tư vấn tự nhiên. Không ghép dữ liệu thành câu trả lời cố định trong chat chính. Schema phản hồi bàn yêu cầu availabilityStatus khớp kết quả tra cứu; kết quả mâu thuẫn bị từ chối. Backend xếp hạng theo độ gần sức chứa và ưu tiên khu vực, chỉ gửi tối đa 5 bàn, kèm tổng số bàn và số lượng theo khu để Gemini tóm tắt. Nhóm món Cơm/Phở/Bún/Lẩu/Cháo lấy món đang bán theo category hoặc tiền tố tên, chỉ gửi tối đa 5 món; không gửi cả thực đơn.

Session giới hạn 10 lượt gần nhất, hết hạn sau 30 phút, tách theo mã truy cập lịch sử thiết bị và sessionId; không nhận userId từ client làm quyền đọc lịch sử. Session giữ món hiện tại, số khách/ngân sách và bộ lọc lịch đặt bàn. Nút hành động do server tạo; SELECT_AREA tiếp tục hỏi Gemini với lịch đã chọn, OPEN_BOOKING mang lịch sang màn đặt bàn, ADD_TO_CART mở sheet món để khách chọn/thêm vào giỏ. Các hành động mở món, đơn, giỏ và ưu đãi vẫn được hỗ trợ.

Ưu đãi chỉ trả về nếu đang hiệu lực, bật, giảm giá hợp lệ và giỏ hàng đạt mức tối thiểu. Danh sách vouchers hiện trống; không tạo mã giả. Chưa có hồ sơ hạng thành viên được xác thực nên voucher giới hạn memberTiers bị loại khi không có hạng phù hợp, không tự suy ra hạng từ client. Giá giỏ được tính lại theo danh mục server.

Danh mục chưa có đầy đủ ingredients/allergens/availability; dùng mô tả nhưng không khẳng định danh sách nguyên liệu đầy đủ, an toàn dị ứng hoặc còn hàng. Lọc dị ứng theo dữ liệu có sẵn không thay thế xác nhận nhà hàng.

Timeout SDK 25 giây, frontend 30 giây. Với gemini-2.5-flash, tắt thinking budget để giảm độ trễ JSON combo. Lỗi 429 vẫn phụ thuộc quota của tài khoản; UI có thử lại/mở thực đơn. Không tự đổi model/khóa hay lặp request để vượt quota.

## Kiểm thử

`node --test server/ai-policy.test.mjs server/chef-engine.test.mjs`

Kiểm tra browser: preferences/session, thẻ món, bottom sheet, favorites, combo vào giỏ, regenerate, feedback, responsive 360–430, nhận dạng giọng nói giả lập và nhánh unsupported, BOOK_TABLE và chuyển draft sang đặt bàn. Kiểm tra micro thật cần thiết bị Zalo hỗ trợ; giả lập không xác minh được quyền/nhận dạng thực tế.

Nguồn kỹ thuật: https://ai.google.dev/api/generate-content và https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition.

## Hỏi AI trên trang món

Nút Hỏi AI về món này giữ nguyên sheet hiện tại. POST `/api/ai/food-detail-chat` chỉ cần `{ "foodId": 21, "message": "Có thể làm ít cay không?" }`. Server query bảng `foods` trong SQLite bằng ID trước mỗi lần trả lời. ID Phở gà hiện có là 21; giữ nguyên ID để tương thích giỏ hàng. Client không gửi dữ liệu món.

Chỉ câu hỏi cực kỳ đơn giản về giá, thành phần hoặc độ cay trả trực tiếp từ database. Mọi câu hỏi tư vấn (đồ uống, món kèm, đối tượng phù hợp, trẻ em, dị ứng, ăn kiêng, tùy chỉnh, khẩu phần và câu hỏi nhiều ý) đều gọi Gemini với context đầy đủ từ SQLite. Mặc định 3–6 câu, 60–120 từ; yêu cầu phân tích kỹ hơn dùng 150–250 từ. Gợi ý ăn kèm dựa trên `pairings`; chỉ tạo card cho tên khớp thực đơn. Thiếu thông tin dùng: "Mình chưa có thông tin xác nhận về chi tiết này trong dữ liệu món. Bạn có thể hỏi nhân viên nhà hàng để được xác nhận chính xác hơn."

Database mặc định: `server/data/foods.sqlite`, có thể đổi bằng `FOOD_DB_PATH`. Bảng `foods(id TEXT PRIMARY KEY, data TEXT NOT NULL)` lưu JSON đầy đủ: id, name, price, unit, category, description, ingredients, spicyLevel, allergens, suitableFor, notSuitableFor, customizations, servingSize, calories, available, pairings. Lần khởi động đầu seed tất cả món từ danh mục; các lần sau thêm ID mới. Migration context-v2 chạy một lần, bổ sung các trường trống cho món cũ và giữ giá, trạng thái, dữ liệu đã sửa. Khi sửa giá/danh mục hiện hữu cần cập nhật bản ghi database tương ứng. Phở gà dùng chi tiết được cung cấp; món khác dùng thành phần/mô tả/tùy chọn sẵn có. Chi tiết chưa xác nhận để null hoặc mảng rỗng, không suy diễn không cay, an toàn dị ứng hoặc còn hàng. Nhà hàng cần bổ sung dữ liệu thực tế vào JSON cho các trường còn thiếu.

Sheet có loading, lỗi, hủy request khi đóng, lịch sử riêng mỗi món, 10 câu hỏi nhanh và các câu hỏi tiếp theo. Thêm món hiện tại dùng lựa chọn/số lượng/ghi chú trên trang (kể cả chế độ sửa giỏ); thiếu tùy chọn bắt buộc sẽ quay lại phần lựa chọn. Món kèm dùng tùy chọn mặc định của luồng giỏ hiện có.

URL endpoint được suy ra từ `VITE_GEMINI_PROXY_URL`; có thể đặt riêng `VITE_FOOD_DETAIL_AI_URL` nếu cấu hình route tùy biến. Không đưa khóa vào các biến frontend.

Kiểm thử: `node --test server/food-detail-ai.test.mjs server/food-repository.test.mjs server/hotpot.test.mjs`. Gemini được giả lập trong kiểm thử; chưa xác minh câu trả lời qua Gemini thật trong lần nâng cấp này.

### Xử lý lỗi và gửi một lần

Popup chỉ gọi fetch trong `send`, khóa bằng ref ngay trước request và state để disable nút. Enter dùng `requestSubmit()`, nút gửi chỉ có `type="submit"`; không gửi từ effect. Chỉ một vị trí thêm phản hồi AI, có ID và kiểm tra trùng. Đóng popup/hủy component hủy request và bỏ phản hồi đến muộn. Session không nạp lại lỗi cũ và loại bỏ phản hồi AI trùng liên tiếp.

Lỗi route trả `{ success: false, error: "MÃ_LỖI", message: "Thông báo tiếng Việt" }`. `FOOD_NOT_FOUND` là 404; lỗi key/quyền hoặc model không tồn tại là `AI_CONFIGURATION_ERROR`; request sai là 400; quota là 429; lỗi server là 500/503; timeout là 504. Backend log `[FOOD AI ERROR]` kèm status, code, message và che API key. Khi Gemini lỗi, trả mã lỗi tương ứng để khách thử lại; không thay câu trả lời tư vấn bằng danh sách database. Câu trả lời thành công có `source: "gemini"`, bubble giữ xuống dòng. Loading: “✨ AI Chef đang phân tích món và khẩu vị phù hợp...”.

Kiểm thử bổ sung: `node --test server/food-ai-errors.test.mjs`. Kiểm tra Chrome Network qua `tmp/verify-food-ai-flow.cjs`: một lần gửi → một POST → 200 → một box AI, kể cả nhấn đôi/Enter; các lỗi 403/429/500/404 có thông báo riêng. Đã kiểm tra Gemini thật trả gợi ý nước chanh cho Phở gà. Lỗi thực tế trước sửa: backend đang chạy bản cũ trả 404 cho `foodId`, trong khi payload `food.id` cũ vẫn trả 200. Sau thay đổi backend cần khởi động lại phiên dev; frontend HMR không cập nhật tiến trình Node backend.

### Context v2

Chạy `node scripts/migrate-food-context.mjs` để migration và xuất `server/food-context-review.json` cho toàn bộ 128 món. `drinkPairings` tách riêng khỏi `pairings`; `nutrition` luôn có calories/protein/fat/carbs, chưa có số liệu thì để null. Dữ liệu Mực nướng sa tế dùng thông tin được cung cấp trong yêu cầu; giữ nguyên ID và giá trong thực đơn. Các món còn lại chỉ bổ sung từ dữ liệu thực đơn đã có, không tự tạo công thức, mức cay, khẩu phần hoặc cam kết tùy chỉnh. Báo cáo liệt kê chi tiết còn thiếu để nhà hàng bổ sung.

Kiểm thử v2: `node --test server/food-context-v2.test.mjs server/food-detail-ai.test.mjs server/food-repository.test.mjs server/food-ai-errors.test.mjs server/hotpot.test.mjs`. Ba loại câu hỏi đơn giản về giá, thành phần, độ cay hoạt động cả khi Gemini không được cấu hình. Kiểm thử luồng tư vấn: `node --test server/food-consultation.test.mjs`.

### Tư vấn trẻ em

Context luôn có `suitableForChildren` (true/false/null) và `childNotes` (chuỗi/null). Migration `child-context-v1` bổ sung hai trường cho món cũ và cập nhật dữ liệu mẫu Bò nướng lá lốt theo thông tin nhà hàng cung cấp, giữ nguyên ID/giá và không ghi đè lại khi khởi động sau. Null là chưa xác nhận, không suy diễn thành true; allergens rỗng không chứng minh món không có dị ứng.

Prompt tư vấn mặc định 3–5 câu: trả lời trực tiếp, giải thích dựa trên độ cay/nguyên liệu/ghi chú độ dễ ăn, gợi ý tùy chỉnh có thật. Chỉ nêu ngắn trường còn thiếu và tiếp tục phân tích dữ liệu đã có. Không tự thêm độ mềm, nước chấm hay cách chế biến. Năm câu hỏi về đối tượng, trẻ em, ít cay, món kèm và đồ uống luôn qua Gemini.

Kiểm thử: `node --test server/food-children.test.mjs server/food-consultation.test.mjs server/food-repository.test.mjs server/food-detail-ai.test.mjs`.

### Truy xuất thực đơn theo câu hỏi

Khi hỏi đồ uống, backend đọc danh sách hiện tại từ SQLite (`repository.list()`), lọc categoryId/category drink, nuoc-uong hoặc Đồ uống và loại available/availability=false. `drinkContext` gồm ID, tên, giá, mô tả, tags và dữ liệu nguyên liệu/dị ứng đã có. Khi hỏi món kèm, dùng khai vị/món kèm và các món được nhà hàng ghi nhận trong pairings. Gemini chọn 2–3 đồ uống từ danh sách thực tế, không bị giới hạn bởi drinkPairings trống. Thẻ gợi ý được kiểm tra ID và lấy giá từ database.

Chỉ khi danh sách đồ uống thực sự rỗng mới trả: “Hiện tại thực đơn chưa có dữ liệu đồ uống để mình gợi ý chính xác.” Các câu tư vấn khác tiếp tục dùng context của món. Kiểm thử bổ sung: `node --test server/food-related-context.test.mjs`.

### Voice input

`useVoiceInput` xin quyền bằng Permissions API (nếu có) và getUserMedia, ghi âm bằng MediaRecorder trong tối đa 12 giây, gửi POST /api/ai/transcribe. Backend dùng Gemini audio transcription, không lưu file audio. Giới hạn audio 4 MB, xử lý tối đa 14 giây (client 15 giây). Kết quả điền vào input, không tự gửi tin nhắn. Micro bị khóa khi xin quyền, chuyển audio hoặc chat đang gửi. Đóng trang hủy request và giải phóng micro.

Không dùng SpeechRecognition trong WebView; chỉ log capability để chẩn đoán. Thiết bị không hỗ trợ getUserMedia/MediaRecorder nhận hướng dẫn cập nhật Zalo hoặc dùng micro bàn phím. Quyền OS/WebView vẫn cần kiểm tra trên thiết bị Zalo thật; HTTP qua địa chỉ LAN có thể không được cấp micro, dùng HTTPS. Transcript chỉ log khi DEV; không log audio hoặc khóa dịch vụ.
