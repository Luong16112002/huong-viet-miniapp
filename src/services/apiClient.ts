export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public code: string, public status = 0, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiUrl(path: string): string {
  if (import.meta.env.PROD && !API_BASE_URL)
    throw new ApiError("Chưa cấu hình địa chỉ backend production.", "API_NOT_CONFIGURED");
  const url = new URL(path, API_BASE_URL || window.location.origin);
  if (import.meta.env.PROD && (url.protocol !== "https:" || /^(localhost|127\.|\[::1\])/.test(url.hostname)))
    throw new ApiError("Backend production phải dùng HTTPS public.", "INVALID_API_URL");
  return url.href;
}

export async function apiFetch(path: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const url = apiUrl(path);
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (timedOut || (error instanceof DOMException && error.name === "TimeoutError"))
      throw new ApiError("API phản hồi quá lâu. Vui lòng thử lại.", "API_TIMEOUT");
    throw new ApiError("Không kết nối được backend. Kiểm tra mạng, domain API và CORS.", "NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const response = await apiFetch(path, options, timeoutMs);
  const data = await response.json().catch(() => {
    throw new ApiError("API trả dữ liệu không hợp lệ.", `HTTP_${response.status}`, response.status);
  });
  if (!response.ok)
    throw new ApiError(data.message || data.error || "Không xử lý được yêu cầu.", data.code || `HTTP_${response.status}`, response.status, data);
  return data;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => apiRequest<T>(path, options),
  post: <T>(path: string, body: unknown, options?: RequestInit) => apiRequest<T>(path, {
    ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(body),
  }),
};
