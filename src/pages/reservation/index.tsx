import { AvailableTables } from "./available-tables";
import { BookingIcon } from "./booking-icon";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReservationStore } from "@/stores/reservation.store";
import { useAuthStore } from "@/stores/auth.store";
import { ReservationArea } from "@/types/reservation.types";
import {
  addDays,
  canReserveTime,
  reservationAreas,
  reservationTimes,
  restaurantToday,
  validateReservation,
} from "@/utils/reservation";
import { checkAvailability, BookingAvailability } from "@/services/booking.api";
import {
  BookingHeader,
  BookingHero,
  BookingStepper,
  BookingSummaryCard,
  DatePickerSection,
  GuestSelector,
  TimeSlotSection,
  AreaSelector,
  ContactFormSection,
  BookingReviewSection,
  BookingFooterAction,
} from "./booking-components";
import "./booking-redesign.css";

export default function ReservationPage() {
  const navigate = useNavigate();
  const locationState = useLocation().state;
  const chefBooking = locationState?.chefBooking;
  const rebook = locationState?.rebook;
  const user = useAuthStore((s) => s.user);
  const addReservation = useReservationStore((s) => s.addReservation);
  const [now, setNow] = useState(() => new Date());
  const today = restaurantToday(now);
  const [date, setDate] = useState(() =>
    reservationTimes.some((t) => canReserveTime(today, t))
      ? today
      : addDays(today, 1),
  );
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(Math.min(20, Math.max(1, Number(rebook?.guests) || 2)));
  const [area, setArea] = useState<ReservationArea>(rebook?.area || "indoor");
  const [contact, setContact] = useState({
    name: rebook?.name || user?.name || "",
    phone: rebook?.phone || user?.phone || "",
    email: rebook?.email || user?.email || "",
    note: "",
  });
  const [requests, setRequests] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const [availability, setAvailability] = useState<{
    key: string;
    data?: BookingAvailability;
    loading?: boolean;
    error?: string;
  }>({ key: "" });
  const [retry, setRetry] = useState(0);
  const [selection, setSelection] = useState({ key: "", id: "" });
  const key = JSON.stringify({ date, time, guests, area });
  const selectedTableId = selection.key === key ? selection.id : "";
  const note = [
    contact.note,
    ...(requests.length ? [`Yêu cầu: ${requests.join(", ")}`] : []),
  ]
    .filter(Boolean)
    .join("\n");
  const draft = {
    date,
    time,
    guests,
    area,
    ...contact,
    note,
    status: "pending" as const,
    tableId: selectedTableId,
  };
  const validation = validateReservation(draft, now);
  const scheduleValid =
    !validation.date && !validation.time && !validation.guests && !validation.area;
  const current = availability.key === key ? availability : undefined;
  const disabled =
    !selectedTableId ||
    !!current?.error ||
    !current?.data?.tables.some((t) => t.id === selectedTableId) ||
    !scheduleValid ||
    (scheduleValid && !current) ||
    !!current?.loading ||
    current?.data?.available === false ||
    (step > 0 && Object.keys(validation).length > 0);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      !chefBooking ||
      !canReserveTime(chefBooking.date, chefBooking.time) ||
      !Number.isInteger(chefBooking.guests) ||
      chefBooking.guests < 1 ||
      chefBooking.guests > 20 ||
      !reservationAreas.some((a) => a.id === chefBooking.area)
    )
      return;
    setDate(chefBooking.date);
    setTime(chefBooking.time);
    setGuests(chefBooking.guests);
    setArea(chefBooking.area);
    if (typeof chefBooking.tableId === "string") setSelection({key:JSON.stringify({date:chefBooking.date,time:chefBooking.time,guests:chefBooking.guests,area:chefBooking.area}),id:chefBooking.tableId});
  }, [chefBooking]);
  useEffect(() => {
    if (!scheduleValid) return;
    let active = true,
      controller: AbortController | undefined,
      inFlight = false;
    const refresh = async () => {
      if (inFlight || document.hidden) return;
      inFlight = true;
      controller = new AbortController();
      const signal = controller.signal;
      setAvailability((old) =>
        old.key === key ? { ...old, loading: true } : { key, loading: true },
      );
      try {
        const data = await checkAvailability(
          { date, time, guests, area },
          signal,
        );
        if (active) {
          setAvailability({ key, data });
          setSelection((old) =>
            old.key === key && data.tables.some((t) => t.id === old.id)
              ? old
              : { key, id: "" },
          );
        }
      } catch (error) {
        if (active)
          setAvailability({
            key,
            error: error instanceof Error ? error.message + ("code" in error ? ` [${error.code}]` : "") : "Chưa tải được bàn trống.",
          });
      } finally {
        inFlight = false;
      }
    };
    const debounce = setTimeout(refresh, 300),
      poll = setInterval(refresh, 10000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      clearTimeout(debounce);
      clearInterval(poll);
      controller?.abort();
      window.removeEventListener("focus", focus);
    };
  }, [key, retry, scheduleValid]);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);
  function back() {
    if (busy) return;
    if (step > 0) setStep(step - 1);
    else navigate("/");
  }
  async function advance(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (disabled) {
      setError("Vui lòng kiểm tra và điền đủ thông tin bắt buộc.");
      return;
    }
    setError("");
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const result = await addReservation(draft);
      navigate(`/reservation-success?id=${encodeURIComponent(result.id)}`, {
        replace: true,
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Chưa gửi được yêu cầu. Vui lòng thử lại.",
      );
      setBusy(false);
      submitting.current = false;
      setRetry((n) => n + 1);
      setStep(0);
    }
  }
  return (
    <div className="reserve-page">
      <BookingHeader back={back} />
      <BookingHero />
      <div className="reserve-container">
        <BookingStepper
          step={step}
          onChange={(value) => {
            if (!busy) {
              setStep(value);
              setError("");
            }
          }}
        />
        <BookingSummaryCard draft={draft} />
        <p className="reserve-notice">
          ▯ Chia sẻ số điện thoại Zalo để nhận thông báo về yêu cầu. Nếu từ
          chối, bạn vẫn đặt bàn được.
        </p>
        <form id="reserve-form" onSubmit={advance} noValidate>
          <fieldset disabled={busy}>
            <div className="reserve-heading">
              <span>
                <BookingIcon name="leaf" />
              </span>
              <div>
                <h2 ref={heading} tabIndex={-1}>
                  {
                    [
                      "Lên lịch cho bữa hẹn",
                      "Thông tin liên hệ",
                      "Kiểm tra bữa hẹn",
                    ][step]
                  }
                </h2>
                <p>
                  {
                    [
                      "Chọn thời gian và không gian bạn yêu thích.",
                      "Để nhà hàng liên hệ và chăm chút cho bữa hẹn.",
                      "Một lần xem lại, để bữa hẹn thật trọn vẹn.",
                    ][step]
                  }
                </p>
              </div>
            </div>
            {step === 0 && (
              <>
                <DatePickerSection
                  today={today}
                  date={date}
                  onChange={(value) => {
                    setDate(value);
                    setTime("");
                    setError("");
                  }}
                />
                <GuestSelector value={guests} onChange={setGuests} />
                <TimeSlotSection
                  date={date}
                  time={time}
                  now={now}
                  onChange={setTime}
                />
                <AreaSelector value={area} onChange={setArea} />
                <AvailableTables
                  guests={guests}
                  area={area}
                  time={time}
                  data={current?.data}
                  loading={current?.loading}
                  error={current?.error}
                  selected={selectedTableId}
                  onSelect={(id) => setSelection({ key, id })}
                  onRetry={() => setRetry((n) => n + 1)}
                  onSuggestion={(t, a) => {
                    setTime(t);
                    setArea(a as ReservationArea);
                  }}
                />
              </>
            )}
            {step === 1 && (
              <ContactFormSection
                {...contact}
                requests={requests}
                onChange={(field, value) =>
                  setContact((old) => ({ ...old, [field]: value }))
                }
                onToggle={(value) =>
                  setRequests((old) =>
                    old.includes(value)
                      ? old.filter((r) => r !== value)
                      : [...old, value],
                  )
                }
              />
            )}{" "}
            {step === 2 && (
              <BookingReviewSection draft={draft} onEdit={() => setStep(1)} />
            )}{" "}
            {scheduleValid && !current?.error && (
              <div className="reserve-availability" role="status">
                {current?.loading
                  ? "Đang kiểm tra lịch hẹn…"
                  : current?.data?.message}
                {current?.data?.available === false &&
                  current.data.alternatives.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        setTime(t);
                        setStep(0);
                      }}
                    >
                      {t}
                    </button>
                  ))}
              </div>
            )}
            {step === 1 && Object.keys(validation).length > 0 && (
              <p className="reserve-hint">{Object.values(validation)[0]}</p>
            )}
            {error && (
              <p className="reserve-error" role="alert">
                {error}
              </p>
            )}
          </fieldset>
        </form>
      </div>
      <BookingFooterAction
        step={step}
        busy={busy}
        disabled={disabled}
        onBack={back}
      />
    </div>
  );
}
