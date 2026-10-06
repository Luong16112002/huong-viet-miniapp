import { BookingIcon } from "./booking-icon";
import { Link, useNavigate } from "react-router-dom";
import { ReservationArea } from "@/types/reservation.types";
import {
  addDays,
  canReserveTime,
  reservationAreas,
  reservationDateLabel,
  reservationTimes,
  ReservationDraft,
} from "@/utils/reservation";
import diningImage from "@/static/booking-courtyard-v1.webp";

export function BookingHeader({ back }: { back: () => void }) {
  return (
    <header className="reserve-header">
      <button type="button" aria-label="Quay lại" onClick={back}>
        ←
      </button>
      <strong>Đặt bàn</strong>
      <Link to="/order?tab=reservation" aria-label="Xem lịch đặt bàn">
        •••
      </Link>
    </header>
  );
}
export function BookingHero() {
  return (
    <div className="reserve-hero">
      <img src={diningImage} alt="Bàn ăn Việt trong sân vườn ấm áp ánh đèn lồng" />
      <div>
        <small>HƯƠNG VIỆT · ĐẶT BÀN</small>
        <h1>
          Một chỗ ngồi,
          <br />
          những phút sum vầy.
        </h1>
        <p>Ẩm thực và dịch vụ chuẩn vị Việt</p>
        <span>◷ Mở cửa hằng ngày · 10:00 – 22:00</span>
      </div>
    </div>
  );
}
export function BookingStepper({
  step,
  onChange,
}: {
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <nav className="reserve-steps" aria-label="Tiến trình đặt bàn">
      {["Lịch hẹn", "Liên hệ", "Kiểm tra"].map((name, i) => (
        <button
          type="button"
          key={name}
          disabled={i > step}
          aria-current={i === step ? "step" : undefined}
          onClick={() => onChange(i)}
        >
          <span>{i < step ? "✓" : `0${i + 1}`}</span>
          {name}
        </button>
      ))}
    </nav>
  );
}
export function BookingSummaryCard({ draft }: { draft: ReservationDraft }) {
  return (
    <aside className="reserve-summary">
      <div>
        <h2>
          <BookingIcon name="calendar" /> Bữa hẹn của bạn
        </h2>
        <Link to="/order?tab=reservation">Xem lịch đặt bàn của bạn ›</Link>
      </div>
      <dl>
        {[
          [
            "Ngày đến",
            draft.date ? reservationDateLabel(draft.date) : "Chưa chọn ngày",
          ],
          ["Giờ đến", draft.time || "Chưa chọn giờ"],
          ["Số khách", `${draft.guests} người`],
          ["Bàn", draft.tableId || "Chưa chọn bàn"],
          [
            "Không gian",
            reservationAreas.find((a) => a.id === draft.area)?.name ||
              "Chưa chọn",
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="reserve-summary-icon">
              <BookingIcon
                name={
                  label === "Ngày đến"
                    ? "calendar"
                    : label === "Giờ đến"
                      ? "clock"
                      : label === "Số khách"
                        ? "guests"
                        : "home"
                }
              />
            </span>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
export function DatePickerSection({
  today,
  date,
  onChange,
}: {
  today: string;
  date: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="reserve-section">
      <div className="reserve-section-title">
        <h3>
          <BookingIcon name="calendar" /> Ngày đến
        </h3>
        <label className="reserve-date-other">
          <BookingIcon name="calendar" /> Chọn ngày khác
          <input
            aria-label="Chọn ngày đến"
            type="date"
            min={today}
            max={addDays(today, 30)}
            value={date}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
      <div className="reserve-dates">
        {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map(
          (day, i) => (
            <button
              type="button"
              key={day}
              aria-pressed={day === date}
              onClick={() => onChange(day)}
            >
              <small>
                {i === 0 ? "Hôm nay" : reservationDateLabel(day).split(",")[0]}
              </small>
              <strong>{day.slice(8)}</strong>
              <small>Tháng {Number(day.slice(5, 7))}</small>
            </button>
          ),
        )}
      </div>
      <p className="reserve-hint">
        Đã chọn: {date ? reservationDateLabel(date) : "Chưa chọn ngày"}
      </p>
    </section>
  );
}
export function GuestSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <section className="reserve-section">
      <div className="reserve-section-title">
        <h3>
          <BookingIcon name="guests" /> Số khách
        </h3>
        <small>Tối đa 20 khách</small>
      </div>
      <div className="reserve-guest-row">
        <span>Bao gồm cả trẻ em</span>
        <div className="reserve-counter">
          <button
            type="button"
            aria-label="Giảm số khách"
            disabled={value <= 1}
            onClick={() => onChange(value - 1)}
          >
            −
          </button>
          <output aria-live="polite">{value}</output>
          <button
            type="button"
            aria-label="Tăng số khách"
            disabled={value >= 20}
            onClick={() => onChange(value + 1)}
          >
            +
          </button>
        </div>
      </div>
      <div className="reserve-chips">
        {[2, 4, 6, 8, 12].map((n) => (
          <button
            type="button"
            key={n}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
          >
            {n} khách
          </button>
        ))}
      </div>
      {value > 12 && (
        <p className="reserve-notice">
          Vui lòng liên hệ nhà hàng để hỗ trợ đoàn đông.
        </p>
      )}
    </section>
  );
}
export function TimeSlotSection({
  date,
  time,
  now,
  onChange,
}: {
  date: string;
  time: string;
  now: Date;
  onChange: (value: string) => void;
}) {
  return (
    <section className="reserve-section">
      <div className="reserve-section-title">
        <h3>
          <BookingIcon name="clock" /> Giờ đến
        </h3>
        <small>Giờ Việt Nam</small>
      </div>
      <p className="reserve-hint">
        Đặt trước ít nhất 30 phút · Nhận khách đến 21:00
      </p>
      {["Bữa trưa", "Chiều & tối"].map((label, index) => (
        <div className="reserve-time-group" key={label}>
          <h4>{label}</h4>
          <div className="reserve-times">
            {reservationTimes
              .filter((t) => (index === 0 ? t < "15:00" : t >= "15:00"))
              .map((t) => (
                <button
                  type="button"
                  key={t}
                  disabled={!canReserveTime(date, t, now)}
                  aria-pressed={time === t}
                  onClick={() => onChange(t)}
                >
                  {t}
                </button>
              ))}
          </div>
        </div>
      ))}
      {!reservationTimes.some((t) => canReserveTime(date, t, now)) && (
        <p className="reserve-notice">
          Ngày này không còn giờ phù hợp. Vui lòng chọn ngày khác.
        </p>
      )}
    </section>
  );
}
export function AreaSelector({
  value,
  onChange,
}: {
  value: ReservationArea;
  onChange: (value: ReservationArea) => void;
}) {
  return (
    <section className="reserve-section">
      <h3>
        <BookingIcon name="home" /> Không gian mong muốn
      </h3>
      <div className="reserve-areas">
        {reservationAreas.map((a) => (
          <button
            type="button"
            key={a.id}
            aria-pressed={a.id === value}
            onClick={() => onChange(a.id)}
          >
            <span className="reserve-area-symbol">
              <BookingIcon
                name={
                  a.id === "indoor"
                    ? "home"
                    : a.id === "garden"
                      ? "leaf"
                      : "guests"
                }
              />
            </span>
            <strong>{a.name}</strong>
            <small>{a.description}</small>
            <span className="reserve-radio" aria-hidden="true">
              {a.id === value ? "●" : "○"}
            </span>
          </button>
        ))}
      </div>
      <p className="reserve-hint">
        ⓘ Vị trí bàn sẽ được xác nhận theo tình trạng thực tế của nhà hàng.
      </p>
    </section>
  );
}
export const specialRequests = [
  "Có trẻ em",
  "Sinh nhật",
  "Cần ghế em bé",
  "Không gian yên tĩnh",
  "Gần cửa sổ",
  "Trang trí sinh nhật",
];
export function ContactFormSection({
  name,
  phone,
  email,
  note,
  requests,
  onChange,
  onToggle,
}: {
  name: string;
  phone: string;
  email: string;
  note: string;
  requests: string[];
  onChange: (key: string, value: string) => void;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="reserve-contact">
      <label>
        Họ và tên <b>*</b>
        <input
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Nhập họ tên của bạn"
        />
      </label>
      <label>
        Số điện thoại <b>*</b>
        <input
          type="tel"
          autoComplete="tel"
          required
          maxLength={20}
          value={phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="Nhập số điện thoại"
        />
      </label>
      <label>
        Email <small>(không bắt buộc)</small>
        <input
          type="email"
          autoComplete="email"
          maxLength={120}
          value={email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="ban@example.com"
        />
      </label>
      <label>
        Ghi chú
        <textarea
          maxLength={350}
          rows={3}
          value={note}
          onChange={(e) => onChange("note", e.target.value)}
          placeholder="Ví dụ: sinh nhật, có trẻ em, cần ghế em bé, đến muộn 10 phút…"
        />
        <small>{note.length}/350 ký tự</small>
      </label>
      <section>
        <h3>Yêu cầu đặc biệt</h3>
        <div className="reserve-chips reserve-request-chips">
          {specialRequests.map((r) => (
            <button
              type="button"
              key={r}
              aria-pressed={requests.includes(r)}
              onClick={() => onToggle(r)}
            >
              {requests.includes(r) ? "✓ " : "+ "}
              {r}
            </button>
          ))}
        </div>
        {requests.includes("Sinh nhật") &&
          !requests.includes("Trang trí sinh nhật") && (
            <button
              type="button"
              className="reserve-birthday"
              onClick={() => onToggle("Trang trí sinh nhật")}
            >
              Bạn có muốn nhà hàng chuẩn bị trang trí không? +
            </button>
          )}
      </section>
    </div>
  );
}
export function BookingReviewSection({
  draft,
  onEdit,
}: {
  draft: ReservationDraft;
  onEdit: () => void;
}) {
  return (
    <section className="reserve-review">
      <div className="reserve-section-title">
        <h3>Thông tin liên hệ</h3>
        <button type="button" onClick={onEdit}>
          Chỉnh sửa
        </button>
      </div>
      <strong>{draft.name}</strong>
      <p>{draft.phone}</p>
      {draft.email && <p>{draft.email}</p>}
      {draft.note && (
        <div className="reserve-review-note">
          <small>Ghi chú & yêu cầu đặc biệt</small>
          <p>{draft.note}</p>
        </div>
      )}
      <ul>
        <li>Vui lòng đến đúng giờ hoặc sớm hơn 5–10 phút.</li>
        <li>Thời gian giữ bàn sẽ được nhà hàng xác nhận cùng yêu cầu.</li>
        <li>Nếu thay đổi kế hoạch, vui lòng liên hệ sớm.</li>
      </ul>
      <p className="reserve-notice">
        Nhà hàng sẽ liên hệ xác nhận. Gửi yêu cầu chưa có nghĩa là bàn đã được
        giữ.
      </p>
    </section>
  );
}
export function BookingFooterAction({
  step,
  busy,
  disabled,
  onBack,
}: {
  step: number;
  busy: boolean;
  disabled: boolean;
  onBack: () => void;
}) {
  return (
    <footer className="reserve-footer">
      {step > 0 && (
        <button type="button" disabled={busy} onClick={onBack}>
          Quay lại
        </button>
      )}
      <button
        type="submit"
        form="reserve-form"
        className="reserve-primary"
        disabled={disabled || busy}
      >
        {busy
          ? "Đang gửi yêu cầu…"
          : step === 2
            ? "Xác nhận đặt bàn"
            : "Tiếp tục"}{" "}
        <span>→</span>
      </button>
    </footer>
  );
}
