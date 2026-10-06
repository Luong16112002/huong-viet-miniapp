# Gemini trong chatbot Hương Việt

- Node hiện tại: 24.8.0; dùng SDK chính thức @google/genai.
- Backend: `npm run ai-proxy` (port 8787).
- Frontend Zalo: `npm start` (port 3000). Nếu đã chạy thì không khởi động thêm phiên.
- API: POST http://localhost:8787/api/ai/chat, JSON `{ "message": "Phở bò giá bao nhiêu?", "history": [] }`.
- Health: GET http://localhost:8787/api/ai/health.
- Khóa đặt tại `server/.env`, biến GEMINI_API_KEY. Không gửi khóa vào frontend. Đổi khóa xong khởi động lại backend.
- Model mặc định `gemini-3.1-pro-preview`, có thể đặt GEMINI_MODEL trong server/.env.
- Backend đọc cùng product.mock.ts và expanded-menu.mock.ts với frontend thông qua esbuild; không nhận menu/prompt do client cung cấp. Giữ esbuild trong dependencies khi triển khai backend.
- Vite chuyển /api tới localhost:8787. Trên điện thoại thật/Zalo đã deploy, backend cần HTTPS public và VITE_GEMINI_PROXY_URL=https://your-api-host/api/ai/chat trước khi build; localhost trên điện thoại không trỏ tới máy tính. Đăng ký domain API trong cấu hình Zalo.
- Timeout backend 25 giây, frontend 30 giây. Lỗi mạng/quota/auth/server chuyển sang tư vấn nội bộ và thông báo ngoại tuyến ngắn.
- Response thành công: `{ success: true, reply: "...", recommendations: [...] }`. Trường text giữ tương thích endpoint cũ /api/gemini.
- Khi 429 RESOURCE_EXHAUSTED: chờ thời gian retry Google trả hoặc kiểm tra quota/billing. Không đổi sang retry liên tục.
- Kiểm tra sống: `node tmp/test-gemini-live.mjs` gửi 7 câu thật, có thể chạm hạn mức 5 yêu cầu/phút.

Gemini trả JSON có ID và số lượng món. Backend xác thực ID/số lượng, dựng danh sách với giá menu và tự tính tổng. Không đưa giá model ước lượng vào phần gợi ý. Giữ câu tư vấn trực tiếp nếu không có danh sách gợi ý.
Kiểm tra UI: node tmp/check-ai-integration.cjs (cần Chrome CDP 9223 và frontend 3000). Mock các status lỗi để kiểm tra fallback, không dùng quota Gemini.
