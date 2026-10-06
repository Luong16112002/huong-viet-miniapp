# Gemini Pro proxy

AI chat calls `POST /api/gemini` (or `VITE_GEMINI_PROXY_URL` when configured). The Gemini API key must stay on the server and must never be bundled into the Mini App.

## Request

```json
{
  "model": "gemini-3.1-pro-preview",
  "systemInstruction": "...",
  "history": [{ "role": "user", "text": "..." }],
  "message": "Gợi ý món cho 4 người dưới 1 triệu"
}
```

The proxy should send the request to Google Gemini using the server-side `GEMINI_API_KEY`, restrict the system instruction to the restaurant domain, and return only:

```json
{ "text": "Nội dung tư vấn bằng tiếng Việt" }
```

Set `VITE_GEMINI_PROXY_URL` to the deployed proxy URL when it is not hosted under the same origin. Until the proxy is available, the app automatically uses its existing local restaurant recommendation fallback.

## Chạy local

1. Thu hồi API key đã từng gửi trong chat và tạo key mới.
2. Tạo file `.env` ở thư mục gốc:

```env
GEMINI_API_KEY=key_mới_của_bạn
```

3. Chạy proxy trong một terminal:

```bash
npm run ai-proxy
```

4. Chạy Mini App bằng `npm start`. Vite sẽ chuyển tiếp `/api/gemini` tới proxy local ở cổng `8787`.
