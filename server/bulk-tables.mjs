import {
  tableCode,
  canonicalArea,
  validateTablePolicy,
} from "./table-policy.mjs";
export function planBulkTables(input, existing, areas, statuses) {
  const fail = (message) => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  const {
    quantity = 100,
    startNumber = 1,
    capacity = 4,
    area: rawArea = "indoor",
    status = "AVAILABLE",
    areaAllocation,
    capacityAllocation,
  } = input;
  const area = canonicalArea(rawArea);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500)
    fail("Số lượng bàn phải từ 1 đến 500.");
  if (
    !Number.isSafeInteger(startNumber) ||
    startNumber < 1 ||
    startNumber > 100
  )
    fail("Số bắt đầu phải từ 1 đến 100.");
  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 50 ||
    !areas.includes(area) ||
    !statuses.includes(status)
  )
    fail("Sức chứa, khu vực hoặc trạng thái không hợp lệ.");
  function expand(allocation, key, allowed, fallback) {
    if (allocation === undefined) return Array(quantity).fill(fallback);
    if (
      !Array.isArray(allocation) ||
      !allocation.length ||
      allocation.length > allowed.length
    )
      fail("Phân bổ không hợp lệ.");
    const seen = new Set();
    const result = [];
    for (const entry of allocation) {
      if (
        !entry ||
        !allowed.includes(entry[key]) ||
        seen.has(entry[key]) ||
        !Number.isInteger(entry.quantity) ||
        entry.quantity < 0 ||
        entry.quantity > 500
      )
        fail("Phân bổ không hợp lệ.");
      seen.add(entry[key]);
      result.push(...Array(entry.quantity).fill(entry[key]));
    }
    if (result.length !== quantity)
      fail("Tổng phân bổ phải bằng số lượng bàn.");
    return result;
  }
  if (areaAllocation !== undefined && !Array.isArray(areaAllocation))
    fail("Phân bổ khu vực không hợp lệ.");
  const assignedAreas = expand(
      areaAllocation?.map((e) => ({ ...e, area: canonicalArea(e?.area) })),
      "area",
      areas,
      area,
    ),
    assignedCapacities = expand(
      capacityAllocation,
      "capacity",
      [2, 4, 6, 8, 10, 12, 20],
      capacity,
    );
  const codes = new Set(
      existing.flatMap((t) =>
        [t.id, t.code].filter(Boolean).map((v) => String(v).toUpperCase()),
      ),
    ),
    created = [],
    skipped = [];
  const counters = {};
  for (let i = 0; i < quantity; i++) {
    const zone = assignedAreas[i],
      sequence = startNumber + (counters[zone] || 0);
    counters[zone] = (counters[zone] || 0) + 1;
    if (sequence > 100)
      fail(
        "Mỗi khu chỉ có mã từ 001 đến 100. Hãy giảm số lượng hoặc phân bổ sang khu khác.",
      );
    const number = String(sequence).padStart(3, "0"),
      code = tableCode(zone, sequence);
    if (codes.has(code)) {
      skipped.push(code);
      continue;
    }
    const next = {
      id: code,
      code,
      name: "Bàn " + number,
      area: assignedAreas[i],
      capacity: assignedCapacities[i],
      status,
      active: status !== "DISABLED",
    };
    validateTablePolicy(next, [...existing, ...created]);
    created.push(next);
  }
  return { tables: created, skipped };
}
