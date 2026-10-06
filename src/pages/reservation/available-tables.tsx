import { useEffect, useState } from "react";
import { BookingAvailability } from "@/services/booking.api";
import { reservationAreas } from "@/utils/reservation";
export function AvailableTables({
  data,
  selected,
  onSelect,
  onSuggestion,
  loading,
  error,
  onRetry,
  guests,
  area,
  time,
}: {
  data?: BookingAvailability;
  selected: string;
  onSelect: (id: string) => void;
  onSuggestion: (time: string, area: string) => void;
  loading?: boolean;
  error?: string;
  onRetry: () => void;
  guests: number;
  area: string;
  time: string;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [data?.tables.map((t) => t.id).join(",")]);
  const start = page === 0 ? 0 : 12 + (page - 1) * 20,
    end = page === 0 ? 12 : start + 20;
  return (
    <section className="reserve-table-section">
      <h3>Bàn còn trống</h3>
      <p>Chọn bàn phù hợp với {guests} khách</p>
      {loading && <p role="status">Đang cập nhật bàn trống…</p>}
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            Thử lại
          </button>
        </div>
      ) : data ? (
        <>
          <div className="reserve-table-grid">
            {data.tables.slice(start, end).map((t) => (
              <button
                type="button"
                key={t.id}
                aria-pressed={selected === t.id}
                onClick={() => onSelect(t.id)}
              >
                <strong>
                  {t.name} {selected === t.id ? "✓" : ""}
                </strong>
                <span>
                  {t.id} · {t.capacity} khách
                </span>
                {t.capacity === guests && <small>Phù hợp nhất</small>}
                <small>
                  {reservationAreas.find((a) => a.id === t.area)?.name ||
                    t.area}
                </small>
              </button>
            ))}
          </div>
          {page > 0 && (
            <button type="button" onClick={() => setPage((n) => n - 1)}>
              ← Bàn trước
            </button>
          )}
          {data.tables.length > end && (
            <button type="button" onClick={() => setPage((n) => n + 1)}>
              Xem thêm bàn ({data.tables.length - end})
            </button>
          )}
          {!data.tables.length && (
            <>
              <p>Không còn bàn phù hợp cho {guests} khách tại {reservationAreas.find(a => a.id === area)?.name} lúc {time}.</p>
              {data.suggestions?.map((s) => (
                <button
                  type="button"
                  key={s.time + s.area}
                  onClick={() => onSuggestion(s.time, s.area)}
                >
                  {s.time} ·{" "}
                  {reservationAreas.find((a) => a.id === s.area)?.name} còn{" "}
                  {s.count} bàn
                </button>
              ))}
              <p>Chọn giờ khác hoặc chọn khu vực khác ở phía trên.</p>
            </>
          )}
        </>
      ) : (
        !loading && <p>Chọn đủ ngày, giờ, số khách và không gian để xem bàn.</p>
      )}
    </section>
  );
}
