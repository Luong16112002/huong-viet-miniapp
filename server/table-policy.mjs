export const tablePrefixes = {
  floor1: "T1",
  floor2: "T2",
  indoor: "IN",
  garden: "SV",
  private: "PR",
};
export const canonicalArea = (area) =>
  ({ outdoor: "garden", vip: "private" })[area] || area;
export const tableCode = (area, number) =>
  `${tablePrefixes[canonicalArea(area)]}-${String(number).padStart(3, "0")}`;
export function validateTablePolicy(next, existing, current) {
  const fail = (message) => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  if (!tableCapacities.includes(next.capacity)) fail("Sức chứa phải là 2, 4, 6, 8, 10, 12 hoặc 20 khách.");
  const prefix = tablePrefixes[next.area];
  if (!prefix) fail("Khu vực không hợp lệ.");
  // Preserve historical references until an explicit migration.
  if (!current || next.area !== current.area) {
    if (
      !new RegExp(`^${prefix}-(?:0[0-9][0-9]|100)$`).test(next.id) ||
      next.id.endsWith("-000")
    )
      fail(`Mã bàn của khu này phải từ ${prefix}-001 đến ${prefix}-100.`);
    if (
      existing.filter(
        (t) => canonicalArea(t.area) === next.area && t.id !== current?.id,
      ).length >= 100
    )
      fail("Mỗi khu vực tối đa 100 bàn, kể cả bàn ngưng sử dụng.");
  }
}

export const tableCapacities = [2,4,6,8,10,12,20];
export const capacityForNumber = n => n<=20?2:n<=50?4:n<=70?6:n<=82?8:n<=90?10:n<=96?12:20;
