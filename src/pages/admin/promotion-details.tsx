import { useState } from "react";
import { AdminDialog } from "./admin-components";
import { AdminIcon } from "./admin-shell";
import { labels, money, Row } from "./admin-api";
import {
  promoDate,
  promoDay,
  promoLabels,
  promoOrders,
  promoPerformance,
  promoState,
  promoUsage,
} from "./promotion-data";

export function PromoStatus({ row }: { row: Row }) {
  const state = promoState(row);
  return (
    <span className={"pm-status pm-status-" + state}>
      <i />
      {promoLabels[state]}
    </span>
  );
}

export function PromotionForm({
  row,
  rows,
  busy,
  error,
  onClose,
  onSave,
}: {
  row: Row;
  rows: Row[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (row: Row, method: string) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    ...row,
    start: promoDay(row.startsAt),
    end: promoDay(row.expiresAt),
  });
  const [validation, setValidation] = useState<Record<string, string>>({});
  const patch = (field: string, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    setValidation((v) => ({ ...v, [field]: "" }));
  };
  const submit = () => {
    const errors: Record<string, string> = {};
    const code = String(form.code).trim().toUpperCase();
    if (!String(form.name).trim() || String(form.name).trim().length > 120)
      errors.name = "Tên ưu đãi cần có từ 1–120 ký tự.";
    if (!/^[A-Z0-9_-]{2,30}$/.test(code))
      errors.code = "Mã gồm 2–30 chữ, số, dấu gạch ngang hoặc gạch dưới.";
    else if (
      form._new &&
      rows.some((r) => String(r.code).toUpperCase() === code)
    )
      errors.code = "Mã ưu đãi đã tồn tại. Hãy chọn mã khác.";
    if (
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0 ||
      Number(form.amount) > 1e9
    )
      errors.amount = "Mức giảm phải lớn hơn 0 và không quá 1 tỷ đồng.";
    if (
      !Number.isFinite(Number(form.minSubtotal)) ||
      Number(form.minSubtotal) < 0 ||
      Number(form.minSubtotal) > 1e9
    )
      errors.minSubtotal = "Giá trị đơn tối thiểu từ 0 đến 1 tỷ đồng.";
    if (!form.end || !Number.isFinite(Date.parse(form.end)))
      errors.end = "Vui lòng chọn ngày kết thúc hợp lệ.";
    if (
      form.start &&
      (!Number.isFinite(Date.parse(form.start)) || form.start > form.end)
    )
      errors.start = "Ngày bắt đầu không được sau ngày kết thúc.";
    setValidation(errors);
    if (Object.keys(errors).length) return;
    void onSave(
      {
        ...form,
        code,
        expiresAt:
          form.end === promoDay(row.expiresAt)
            ? row.expiresAt
            : form.end + "T23:59:59+07:00",
        startsAt:
          form.start === promoDay(row.startsAt)
            ? row.startsAt || null
            : form.start
              ? form.start + "T00:00:00+07:00"
              : null,
      },
      form._new ? "POST" : "PUT",
    );
  };
  const field = (key: string, label: string, type = "text", hint?: string) => (
    <label
      className={"pm-form-field" + (key === "name" ? " pm-form-wide" : "")}
    >
      <span>
        {label}
        {["name", "code", "amount", "end"].includes(key) && <em> *</em>}
      </span>
      <input
        aria-label={label}
        aria-invalid={Boolean(validation[key])}
        aria-describedby={validation[key] ? "pm-error-" + key : undefined}
        type={type}
        value={form[key] ?? ""}
        disabled={busy || (key === "code" && !form._new)}
        maxLength={key === "code" ? 30 : key === "name" ? 120 : undefined}
        step={type === "number" ? 1 : undefined}
        onChange={(e) =>
          patch(
            key,
            key === "code" ? e.target.value.toUpperCase() : e.target.value,
          )
        }
      />
      {validation[key] ? (
        <small id={"pm-error-" + key} className="pm-field-error">
          {validation[key]}
        </small>
      ) : (
        hint && <small>{hint}</small>
      )}
    </label>
  );
  return (
    <AdminDialog
      drawer
      title={form._new ? "Tạo ưu đãi mới" : "Chỉnh sửa ưu đãi"}
      onClose={() => !busy && onClose()}
    >
      <form
        className="pm-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="pm-form-intro">
          <span>
            <AdminIcon name="ticket" />
          </span>
          <div>
            <h3>
              {form._new
                ? "Ưu đãi dành cho khách hàng"
                : "Cập nhật chương trình ưu đãi"}
            </h3>
            <p>Thông tin rõ ràng giúp khách dễ chọn và sử dụng mã.</p>
          </div>
        </div>
        {error && (
          <p className="pm-error" role="alert">
            {error}
          </p>
        )}
        <fieldset disabled={busy}>
          <legend>Thông tin chương trình</legend>
          <div className="pm-form-grid">
            {field("name", "Tên ưu đãi")}
            {field(
              "code",
              "Mã giảm giá",
              "text",
              form._new
                ? "Ví dụ: HUONGVIET50"
                : "Mã ưu đãi được giữ nguyên khi chỉnh sửa.",
            )}
            <label className="pm-form-field">
              <span>Loại giảm giá</span>
              <select
                aria-label="Loại giảm giá"
                value="fixed"
                onChange={() => {}}
              >
                <option value="fixed">₫ Giảm tiền cố định</option>
                <option disabled>Phần trăm · Chưa hỗ trợ</option>
                <option disabled>Thành viên · Chưa hỗ trợ</option>
                <option disabled>Món ăn · Chưa hỗ trợ</option>
              </select>
            </label>
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Giá trị & điều kiện áp dụng</legend>
          <div className="pm-form-grid">
            {field("amount", "Giá trị giảm (đ)", "number")}
            {field(
              "minSubtotal",
              "Giá trị đơn tối thiểu (đ)",
              "number",
              "Nhập 0 để áp dụng cho mọi giá trị đơn.",
            )}
            <label className="pm-form-field pm-form-wide">
              <span>Giảm tối đa</span>
              <input
                disabled
                value="Tối đa bằng giá trị giảm, không vượt tổng tiền món"
                readOnly
              />
              <small>
                Mã giảm trực tiếp số tiền cố định, không giảm phí giao hàng.
              </small>
            </label>
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Thời gian áp dụng</legend>
          <div className="pm-form-grid">
            {field(
              "start",
              "Ngày bắt đầu",
              "date",
              "Để trống nếu không giới hạn ngày bắt đầu.",
            )}
            {field(
              "end",
              "Ngày kết thúc",
              "date",
              "Có hiệu lực đến hết ngày theo giờ Việt Nam.",
            )}
          </div>
        </fieldset>
        <fieldset className="pm-limit-fields">
          <legend>Phạm vi & giới hạn sử dụng</legend>
          <p>
            Hệ thống hiện áp dụng cho tất cả khách hàng và món ăn, không giới
            hạn lượt dùng. Các cấu hình bên dưới chỉ hiển thị để tham khảo.
          </p>
          <div className="pm-form-grid">
            {[
              ["Giới hạn lượt dùng", "Không giới hạn"],
              ["Giới hạn mỗi khách", "Không giới hạn"],
              ["Đối tượng áp dụng", "Tất cả khách hàng"],
              ["Danh mục / món áp dụng", "Tất cả món ăn"],
            ].map(([label, value]) => (
              <label className="pm-form-field" key={label}>
                <span>{label}</span>
                <input disabled readOnly value={value} />
              </label>
            ))}
          </div>
        </fieldset>
        <label className="pm-enabled">
          <input
            type="checkbox"
            checked={form.enabled === true}
            disabled={busy}
            onChange={(e) => patch("enabled", e.target.checked)}
          />
          <span>
            <b>Bật ưu đãi</b>
            <small>Mã chỉ sử dụng được trong thời gian áp dụng.</small>
          </span>
        </label>
        <div className="pm-form-preview">
          <span>Xem trước mức giảm</span>
          <strong>Giảm trực tiếp {money(Number(form.amount) || 0)}</strong>
          <small>
            {Number(form.minSubtotal) > 0
              ? "Đơn từ " + money(Number(form.minSubtotal))
              : "Không yêu cầu đơn tối thiểu"}
          </small>
        </div>
        <footer className="pm-form-footer">
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button className="pm-primary" disabled={busy}>
            {busy ? "Đang lưu…" : form._new ? "Tạo ưu đãi" : "Lưu thay đổi"}
          </button>
        </footer>
      </form>
    </AdminDialog>
  );
}

export function PromotionDrawer({
  row,
  orders,
  usageTab,
  busy,
  onClose,
  onEdit,
  onToggle,
}: {
  row: Row;
  orders: Row[];
  usageTab: boolean;
  busy: boolean;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const [tab, setTab] = useState(usageTab ? "usage" : "overview");
  const performance = promoPerformance(row, orders),
    uses = promoOrders(row, orders);
  const info = (label: string, value: string | number) => (
    <div key={label}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
  return (
    <AdminDialog drawer title="Chi tiết ưu đãi" onClose={onClose}>
      <div className="pm-drawer">
        <div className="pm-detail-hero">
          <span>
            <AdminIcon name="ticket" />
          </span>
          <h2>{row.name || row.title}</h2>
          <p>
            {row.description ||
              "Voucher giảm trực tiếp cho đơn hàng tại Hương Việt"}
          </p>
          <div>
            <code>{row.code}</code>
            <PromoStatus row={row} />
          </div>
        </div>
        <nav className="pm-detail-tabs" aria-label="Nội dung ưu đãi">
          <button
            aria-pressed={tab === "overview"}
            onClick={() => setTab("overview")}
          >
            Tổng quan
          </button>
          <button
            aria-pressed={tab === "usage"}
            onClick={() => setTab("usage")}
          >
            Lượt sử dụng <span>{promoUsage(row, orders)}</span>
          </button>
        </nav>
        {tab === "overview" ? (
          <>
            <section>
              <h3>Thông tin ưu đãi</h3>
              <dl>
                {info("Loại ưu đãi", "Giảm tiền cố định")}
                {info("Giá trị giảm", money(row.amount))}
                {info(
                  "Đơn tối thiểu",
                  row.minSubtotal ? money(row.minSubtotal) : "Không yêu cầu",
                )}
                {info("Giới hạn giảm tối đa", "Không vượt tổng tiền món")}
              </dl>
            </section>
            <section>
              <h3>Thời gian & phạm vi</h3>
              <dl>
                {info("Ngày bắt đầu", promoDate(row.startsAt))}
                {info("Ngày kết thúc", promoDate(row.expiresAt))}
                {info("Tổng lượt sử dụng", promoUsage(row, orders) + " lượt")}
                {info("Giới hạn sử dụng", "Không giới hạn")}
                {info("Giới hạn mỗi khách", "Không giới hạn")}
                {info("Đối tượng áp dụng", "Tất cả khách hàng")}
                {info("Danh mục / món áp dụng", "Tất cả món ăn")}
              </dl>
            </section>
            <section>
              <h3>Hiệu quả chương trình</h3>
              <div className="pm-performance">
                {[
                  ["Tổng lượt dùng", promoUsage(row, orders)],
                  ["Doanh thu áp dụng", money(performance.revenue)],
                  ["Tiền đã giảm", money(performance.discount)],
                  ["Đơn hàng trung bình", money(performance.average)],
                ].map(([label, value]) => (
                  <article key={label}>
                    <small>{label}</small>
                    <b>{value}</b>
                  </article>
                ))}
              </div>
              <p className="pm-note">
                Doanh thu và tiền giảm được tính từ{" "}
                {performance.completed.length} đơn hoàn tất. Lượt dùng không bao
                gồm đơn đã hủy.
              </p>
            </section>
          </>
        ) : (
          <section>
            <h3>Lịch sử sử dụng voucher</h3>
            {uses.length ? (
              <div className="pm-use-list">
                {[...uses]
                  .sort(
                    (a, b) =>
                      (Date.parse(b.createdAt) || 0) -
                      (Date.parse(a.createdAt) || 0),
                  )
                  .map((o, i) => (
                    <article key={o.id || i}>
                      <div>
                        <b>#{o.orderCode}</b>
                        <span>
                          {o.customerName ||
                            o.deliveryAddress?.recipientName ||
                            "Khách tại quầy"}
                        </span>
                        <small>
                          {promoDate(o.createdAt)} ·{" "}
                          {labels[o.state] || o.state}
                        </small>
                      </div>
                      <div>
                        <strong>{money(o.totalAmount)}</strong>
                        <small>
                          Đã áp dụng: {money(o.payment?.discount || 0)}
                        </small>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="pm-panel-empty">
                <AdminIcon name="ticket" />
                <b>Chưa có đơn hàng sử dụng mã này</b>
                <p>Lịch sử sẽ xuất hiện khi khách áp dụng voucher.</p>
              </div>
            )}
          </section>
        )}
        <footer className="pm-detail-footer">
          <button disabled={busy} onClick={onToggle}>
            {row.enabled ? "Tắt ưu đãi" : "Bật ưu đãi"}
          </button>
          <button className="pm-primary" disabled={busy} onClick={onEdit}>
            Chỉnh sửa ưu đãi
          </button>
        </footer>
      </div>
    </AdminDialog>
  );
}
