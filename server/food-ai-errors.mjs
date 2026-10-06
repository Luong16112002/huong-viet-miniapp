export function foodAIError(error) {
  const message = String(error?.message || '');
  const timeout = /timeout|timed out|abort/i.test(message) || ['ETIMEDOUT', 'ECONNRESET'].includes(error?.code);
  const status = timeout ? 504 : Number(error?.status || error?.code) || 502;
  let code = 'AI_INVALID_RESPONSE';
  let publicMessage = 'AI trả về phản hồi không hợp lệ. Bạn vui lòng thử lại.';
  if (error?.code === 'FOOD_NOT_FOUND') { code = 'FOOD_NOT_FOUND'; publicMessage = 'Không tìm thấy thông tin món ăn.'; }
  else if (error?.code === 'AI_NOT_CONFIGURED' || [401, 403, 404].includes(status)) { code = 'AI_CONFIGURATION_ERROR'; publicMessage = 'Dịch vụ AI hiện chưa được cấu hình đúng.'; }
  else if (status === 400) { code = 'AI_BAD_REQUEST'; publicMessage = 'Yêu cầu AI không hợp lệ. Bạn vui lòng kiểm tra món và câu hỏi.'; }
  else if ([429, 503, 504].includes(status)) { code = status === 429 ? 'AI_RATE_LIMIT' : status === 504 ? 'AI_TIMEOUT' : 'AI_UNAVAILABLE'; publicMessage = 'AI Chef đang tạm thời bận. Bạn thử lại sau một chút nhé.'; }
  else if (status === 500) { code = 'AI_SERVER_ERROR'; publicMessage = 'Dịch vụ AI gặp lỗi xử lý. Bạn vui lòng thử lại.'; }
  return { status: status >= 400 && status <= 599 ? status : 502, body: { success: false, error: code, message: publicMessage } };
}

export function logFoodAIError(error) {
  // SDK errors can contain request URLs. Never log credentials, even on the server.
  const secret = process.env.GEMINI_API_KEY;
  const sanitize = value => {
    let text = String(value ?? '');
    if (secret) text = text.split(secret).join('[REDACTED]');
    return text.replace(/AIza[\w-]+/g, '[REDACTED]').replace(/([?&]key=)[^&\s"']+/gi, '$1[REDACTED]');
  };
  console.error('[FOOD AI ERROR]', { status: error?.status, code: sanitize(error?.code), message: sanitize(error?.message) });
}
