import { useRef, useState } from "react";
import { areas, Row, transitions } from "./admin-api";
import { AdminIcon } from "./admin-shell";
import {
  bookingDate,
  bookingInitials,
  bookingLabels,
  BookingStatusBadge,
} from "./booking-management";

export function BookingDetailDrawer({
  row,
  busy,
  onStatus,
  onAssign,
}: {
  row: Row;
  busy: boolean;
  onStatus: (status: string) => void;
  onAssign: (tableId: string, duration: number) => void;
}) {
  const [table, setTable] = useState(row.tableId || ""),
    [duration, setDuration] = useState(row.durationMinutes || 120),
    [confirm, setConfirm] = useState<string | null>(null);
  const assignRef = useRef<HTMLSelectElement>(null);
  const allowed = transitions(row, true),
    canAssign = ["pending", "confirmed"].includes(row.status);
  const focusAssign = () => {
    assignRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    assignRef.current?.focus();
  };
  const update = (status: string) => {
    if (status === "confirmed" && !row.tableId) focusAssign();
    else if (["cancelled", "rejected"].includes(status)) setConfirm(status);
    else onStatus(status);
  };
  const timeline = row.timeline?.length
    ? row.timeline
    : row.createdAt
      ? [{ at: row.createdAt, label: "Khách gửi yêu cầu", status: "pending" }]
      : [];
  return (
    <div className="bm-drawer">
      <div className="bm-drawer-summary">
        <small>LỊCH ĐẶT BÀN</small>
        <h3>#{row.code || row.id}</h3>
        <BookingStatusBadge status={row.status} />
      </div>
      <section className="bm-drawer-section">
        <h3>Thông tin khách</h3>
        <div className="bm-customer bm-drawer-customer">
          <span className="bm-avatar">{bookingInitials(row.name)}</span>
          <div>
            <b>{row.name}</b>
            <a href={`tel:${row.phone}`}>{row.phone || "Chưa có SĐT"}</a>
          </div>
        </div>
      </section>
      <section className="bm-drawer-section">
        <h3>Thời gian & chỗ ngồi</h3>
        <dl className="bm-booking-facts">
          <div>
            <dt>
              <AdminIcon name="calendar" />
              Ngày đặt
            </dt>
            <dd>{bookingDate(row.date)}</dd>
          </div>
          <div>
            <dt>
              <AdminIcon name="clock" />
              Giờ đến
            </dt>
            <dd>{row.time}</dd>
          </div>
          <div>
            <dt>
              <AdminIcon name="users" />
              Số khách
            </dt>
            <dd>{row.guests} khách</dd>
          </div>
          <div>
            <dt>
              <AdminIcon name="table" />
              Khu vực
            </dt>
            <dd>{areas[row.area] || row.area}</dd>
          </div>
          <div>
            <dt>Bàn đã xếp</dt>
            <dd>
              {row.tableId || (
                <span className="bm-unassigned">Chưa xếp bàn</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Thời lượng</dt>
            <dd>{row.durationMinutes || 120} phút</dd>
          </div>
        </dl>
      </section>
      {canAssign && (
        <section className="bm-drawer-section bm-assignment">
          <h3>{row.tableId ? "Gán / đổi bàn" : "Xếp bàn cho khách"}</h3>
          <p>Chọn bàn phù hợp số khách, khu vực và khung giờ đặt.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (table && !busy) onAssign(table, duration);
            }}
          >
            <label>
              Bàn phù hợp
              <select
                ref={assignRef}
                aria-label="Bàn phù hợp"
                value={table}
                disabled={busy}
                onChange={(e) => setTable(e.target.value)}
              >
                <option value="">Chọn bàn</option>
                {row.tableId &&
                  !(row.suggestedTables || []).some(
                    (t: Row) => t.id === row.tableId,
                  ) && (
                    <option value={row.tableId}>
                      {row.tableId} · Bàn hiện tại
                    </option>
                  )}
                {row.suggestedTables?.map((t: Row) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.capacity} khách
                  </option>
                ))}
              </select>
            </label>
            <label>
              Thời lượng (phút)
              <input
                type="number"
                min={30}
                max={360}
                step={30}
                required
                aria-label="Thời lượng đặt bàn"
                disabled={busy}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
            <button className="primary" disabled={busy || !table}>
              {busy
                ? "Đang cập nhật…"
                : row.tableId
                  ? "Cập nhật bàn"
                  : "Gán bàn"}
            </button>
          </form>
          {!row.suggestedTables?.length && !row.tableId && (
            <p className="bm-muted">Chưa có bàn phù hợp trong khung giờ này.</p>
          )}
        </section>
      )}
      <section className="bm-drawer-section">
        <h3>Ghi chú</h3>
        <p className="bm-drawer-note">{row.note || "Không có ghi chú"}</p>
      </section>
      <section className="bm-drawer-section">
        <h3>Timeline booking</h3>
        {timeline.length ? (
          <ol className="bm-timeline">
            {timeline.map((entry: Row, i: number) => (
              <li key={i}>
                <span className="bm-timeline-dot" aria-hidden="true" />
                <div>
                  <strong>
                    {entry.label || bookingLabels[entry.status] || entry.status}
                  </strong>
                  <time dateTime={entry.at}>
                    {entry.at
                      ? new Date(entry.at).toLocaleTimeString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                    <span>
                      {entry.at
                        ? new Date(entry.at).toLocaleDateString("vi-VN", {
                            timeZone: "Asia/Ho_Chi_Minh",
                          })
                        : ""}
                    </span>
                  </time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="bm-muted">Chưa có lịch sử cập nhật.</p>
        )}
      </section>
      {confirm && (
        <div className="bm-drawer-confirm" role="alert">
          <p>{confirm === "cancelled" ? "Hủy" : "Từ chối"} lịch đặt này?</p>
          <button disabled={busy} onClick={() => setConfirm(null)}>
            Quay lại
          </button>
          <button
            className="danger"
            disabled={busy}
            onClick={() => {
              onStatus(confirm);
              setConfirm(null);
            }}
          >
            {confirm === "cancelled" ? "Hủy booking" : "Từ chối"}
          </button>
        </div>
      )}
      <footer className="bm-drawer-actions">
        {canAssign && (
          <button disabled={busy} onClick={focusAssign}>
            {row.tableId ? "Đổi bàn" : "Gán bàn"}
          </button>
        )}
        {allowed.map((status) => (
          <button
            key={status}
            className={
              ["cancelled", "rejected"].includes(status)
                ? "bm-danger-action"
                : "primary"
            }
            disabled={busy}
            onClick={() => update(status)}
          >
            {
              (
                {
                  confirmed: "Xác nhận",
                  checked_in: "✓ Check-in",
                  completed: "Hoàn tất",
                  rejected: "Từ chối",
                  cancelled: "Hủy booking",
                } as Record<string, string>
              )[status]
            }
          </button>
        ))}
      </footer>
    </div>
  );
}
