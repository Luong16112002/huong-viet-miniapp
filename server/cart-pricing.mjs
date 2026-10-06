const invalid = (message) => {
  throw Object.assign(new Error(message), { status: 400 });
};
export function priceCart(menu, input, vouchers = [], now = Date.now()) {
  if (!["pickup", "delivery", "dinein"].includes(input.deliveryType))
    invalid("Vui lòng chọn hình thức nhận món.");
  if (
    !Array.isArray(input.items) ||
    !input.items.length ||
    input.items.length > 100
  )
    invalid("Giỏ hàng không hợp lệ.");
  const lines = input.items.map((item) => {
    const product = menu.find((p) =>
      item.productId ? p.id === item.productId : p.name === item.name,
    );
    if (
      !product || product.available === false || product.deleted ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    )
      invalid("Món ăn hoặc tùy chọn đã thay đổi. Vui lòng chọn lại món.");
    const requested = item.options ?? [];
    if (!Array.isArray(requested) || requested.length > 30) invalid("Tùy chọn không hợp lệ.");
    const groups = product.variantGroups || [];
    const seen = new Set();
    const options = requested.map(input => {
      if (!input || typeof input !== "object") invalid("Tùy chọn không hợp lệ.");
      const group = groups.find(g => g.title === input.name);
      const option = group?.options.find(o => o.name === input.value);
      const key = `${group?.id}:${option?.id}`;
      if (!group || !option || seen.has(key) || !["SINGLE", "MULTIPLE"].includes(group.type)) invalid("Tùy chọn món không còn hợp lệ.");
      seen.add(key);
      return { name: group.title, value: option.name, price: option.extraPrice };
    });
    for (const group of groups) {
      const count = options.filter(o => o.name === group.title).length;
      if ((group.isRequired && count === 0) || (group.type === "SINGLE" && count > 1)) invalid(`Vui lòng chọn ${group.title.toLowerCase()}.`);
    }
    return {
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl || null,
      price: product.price + options.reduce((sum, option) => sum + option.price, 0),
      options,
      quantity: item.quantity,
    };
  });
  const subtotal = lines.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingFee = input.deliveryType === "delivery" ? 25000 : 0;
  const code =
    typeof input.voucherCode === "string"
      ? input.voucherCode.trim().toUpperCase()
      : "";
  let discount = 0;
  if (code) {
    const voucher = vouchers.find((v) => v.code === code && v.enabled === true);
    if (!voucher) invalid("Mã ưu đãi không hợp lệ hoặc chưa được kích hoạt.");
    if (
      (voucher.expiresAt && Date.parse(voucher.expiresAt) <= now) ||
      (voucher.startsAt && Date.parse(voucher.startsAt) > now)
    )
      invalid("Mã ưu đãi chưa có hiệu lực hoặc đã hết hạn.");
    if (subtotal < (voucher.minSubtotal || 0))
      invalid(
        `Đơn hàng cần đạt tối thiểu ${voucher.minSubtotal.toLocaleString("vi-VN")}đ để dùng mã này.`,
      );
    if (!Number.isFinite(voucher.amount) || voucher.amount <= 0)
      invalid("Mã ưu đãi chưa được cấu hình hợp lệ.");
    discount = Math.min(subtotal, voucher.amount);
  }
  return {
    subtotal,
    shippingFee,
    discount,
    total: subtotal + shippingFee - discount,
    voucherCode: code,
    lines,
  };
}
