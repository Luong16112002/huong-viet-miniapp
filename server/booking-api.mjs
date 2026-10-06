export function checkBookingAvailability(input, now = new Date()) {
  const { date, time, guests } = input;
  const area =
    { outdoor: 'garden', vip: 'private', trong_nha: "indoor", san_vuon: "garden", phong_rieng: "private" }[
      input.area
    ] || input.area;
  if (!["indoor", "garden", "private", "floor1", "floor2"].includes(area))
    throw Object.assign(new Error("Khu vực không hợp lệ."), { status: 400, code: "INVALID_AREA" });
  if (
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > 20 ||
    !["indoor", "garden", "private", "floor1", "floor2"].includes(area)
  )
    throw Object.assign(new Error("Số khách hoặc khu vực chưa hợp lệ."), {
      status: 400,
    });
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(now);
  const last = new Date(`${today}T12:00:00Z`);
  last.setUTCDate(last.getUTCDate() + 30);
  const when = Date.parse(`${date}T${time}:00+07:00`);
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(when) ||
    new Date(when + 7 * 3600000).toISOString().slice(0, 10) !== date ||
    !/^((1\d|20):(00|30)|21:00)$/.test(time) ||
    date < today ||
    date > last.toISOString().slice(0, 10)
  )
    throw Object.assign(new Error("Ngày hoặc giờ đến chưa hợp lệ."), {
      status: 400,
    });
  if (when < now.getTime() + 1800000)
    return {
      available: false,
      message:
        "Khung giờ này không còn phù hợp. Vui lòng chọn giờ đến cách hiện tại ít nhất 30 phút.",
      alternatives: Array.from(
        { length: 23 },
        (_, i) =>
          `${String(10 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
      )
        .filter(
          (t) => Date.parse(`${date}T${t}:00+07:00`) >= now.getTime() + 1800000,
        )
        .slice(0, 3),
    };
  // No table inventory exists yet. Never fabricate confirmed availability.
  return {
    available: null,
    canRequest: true,
    message:
      "Có thể gửi yêu cầu cho lịch hẹn này. Nhà hàng sẽ kiểm tra và xác nhận bàn.",
    alternatives: [],
  };
}
export async function bookingRoute(req, res, send, inventory, availableTables) {
  const path = new URL(req.url, "http://localhost").pathname;
  if (
    req.method !== "POST" ||
    ![
      "/api/bookings/check-availability",
      "/api/bookings/available-tables",
    ].includes(path)
  )
    return false;
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 8000)
        throw Object.assign(new Error("Dữ liệu quá lớn."), { status: 413 });
    }
    let input;
    try {
      input = JSON.parse(body);
    } catch {
      throw Object.assign(new Error("Dữ liệu không hợp lệ."), { status: 400 });
    }
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw Object.assign(new Error("Dữ liệu không hợp lệ."), { status: 400 });
    console.log("[AVAILABLE TABLES REQUEST]", { date: input.date, time: input.time, guests: input.guests, area: input.area });
    const result = checkBookingAvailability(input);
    if (path === "/api/bookings/available-tables") {
      const tables =
        result.canRequest && availableTables ? availableTables(input) : [];
      const suggestions = [];
      if (!tables.length && availableTables) {
        for (const time of ["18:00", "18:30", "19:00", "19:30"]) {
          if (time === input.time) continue;
          const candidate = { ...input, time };
          if (checkBookingAvailability(candidate).canRequest) {
            const count = availableTables(candidate).length;
            if (count) suggestions.push({ time, area: input.area, count });
          }
        }
        for (const area of ["indoor", "garden", "private", "floor1", "floor2"]) {
          if (area === input.area) continue;
          const candidate = { ...input, area };
          if (checkBookingAvailability(candidate).canRequest) {
            const count = availableTables(candidate).length;
            if (count) suggestions.push({ time: input.time, area, count });
          }
        }
      }
      send(res, 200, {
        success: true,
        count: tables.length,
        tables,
        suggestions: suggestions.slice(0, 5),
        available: tables.length > 0,
        alternatives: [],
        message: tables.length
          ? "Có bàn phù hợp. Vui lòng chọn bàn."
          : "Không còn bàn phù hợp trong khung giờ này.",
      });
      return true;
    }
    if (result.canRequest && inventory) {
      const availability = inventory(input);
      if (availability !== null) {
        result.available = availability;
        result.message = availability
          ? "C\u00f3 b\u00e0n ph\u00f9 h\u1ee3p; nh\u00e0 h\u00e0ng s\u1ebd x\u00e1c nh\u1eadn sau khi nh\u1eadn y\u00eau c\u1ea7u."
          : "Ch\u01b0a c\u00f3 b\u00e0n ph\u00f9 h\u1ee3p trong khung gi\u1edd n\u00e0y.";
        result.canRequest = availability;
      }
    }
    send(res, 200, result);
  } catch (error) {
    send(res, error.status || 500, {
      success: false,
      code: error.code || (error.status ? `HTTP_${error.status}` : "INTERNAL_ERROR"),
      error: error.status ? error.message : "Chưa kiểm tra được lịch hẹn.",
    });
  }
  return true;
}

