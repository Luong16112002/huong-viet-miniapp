import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/header";

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UtensilsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 3v7a3 3 0 006 0V3M7 3v18M16 3v7a3 3 0 006 0V3M19 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type HistoryTab = "reservation" | "order";

type ReservationBadgeType = "confirmed" | "cancelled" | "completed";
type OrderBadgeType = "preparing" | "completed";

interface ReservationItem {
  id: string;
  code: string;
  date: string;
  time: string;
  tableInfo: string;
  guests: number;
  status: ReservationBadgeType;
}

interface OrderItem {
  id: string;
  code: string;
  date: string;
  time: string;
  itemsInfo: string;
  total: number;
  status: OrderBadgeType;
}

const RESERVATION_ITEMS: ReservationItem[] = [
  {
    id: "res-1",
    code: "TB00123",
    date: "15/04/2025",
    time: "19:00",
    tableInfo: "Bàn 6",
    guests: 4,
    status: "confirmed",
  },
  {
    id: "res-2",
    code: "TB00122",
    date: "14/04/2025",
    time: "18:30",
    tableInfo: "Bàn 3",
    guests: 2,
    status: "cancelled",
  },
  {
    id: "res-3",
    code: "TB00121",
    date: "10/04/2025",
    time: "12:00",
    tableInfo: "Bàn 8",
    guests: 4,
    status: "completed",
  },
];

const ORDER_ITEMS: OrderItem[] = [
  {
    id: "ord-1",
    code: "0012345",
    date: "15/04/2026",
    time: "18:30",
    itemsInfo: "2 món (Bò nướng, Gỏi cuốn)",
    total: 223000,
    status: "preparing",
  },
  {
    id: "ord-2",
    code: "0012344",
    date: "14/04/2026",
    time: "12:15",
    itemsInfo: "2 món",
    total: 124000,
    status: "completed",
  },
];

function reservationBadgeConfig(type: ReservationBadgeType) {
  switch (type) {
    case "confirmed":
      return { label: "Đã xác nhận", className: "bg-green100 text-[#18552F] border-green200" };
    case "cancelled":
      return { label: "Đã hủy", className: "bg-red100 text-red600 border-red200" };
    case "completed":
      return { label: "Hoàn tất", className: "bg-neutral100 text-neutral700 border-neutral200" };
  }
}

function orderBadgeConfig(type: OrderBadgeType) {
  switch (type) {
    case "preparing":
      return { label: "Đang chuẩn bị", className: "bg-orange100 text-orange600 border-orange200" };
    case "completed":
      return { label: "Hoàn tất", className: "bg-neutral100 text-neutral700 border-neutral200" };
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HistoryTab>("reservation");

  const tabs: { value: HistoryTab; label: string }[] = [
    { value: "reservation", label: "Đặt bàn" },
    { value: "order", label: "Gọi món" },
  ];

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <Header title="Lịch sử sử dụng dịch vụ" back />

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-scroll">
        <div className="px-4 pt-4">
          <div className="inline-flex w-full rounded-2xl bg-white p-1 shadow-card-sm ring-1 ring-green100/80">
            {tabs.map((tab) => {
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={
                    "flex-1 rounded-xl py-2.5 xsmall-sb transition-all " +
                    (active
                      ? "bg-[#2F8A4F] text-white shadow-sm"
                      : "text-text-secondary hover:text-espresso900")
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pt-4 pb-8 flex flex-col gap-3">
          {activeTab === "reservation" && (
            <>
              {RESERVATION_ITEMS.map((item) => {
                const badgeCfg = reservationBadgeConfig(item.status);
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      navigate("/reservation-success", { state: { reservationId: item.id } })
                    }
                    className="relative w-full cursor-pointer overflow-hidden rounded-2xl border border-green100/80 bg-white p-4 shadow-card-sm hover:shadow-card transition-all active:scale-[0.995]"
                  >
                    {(item.status === "confirmed") && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#2F8A4F] to-[#18552F]" />
                    )}
                    {item.status === "cancelled" && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red500 to-red600" />
                    )}

                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green100 to-green200 text-[#18552F]">
                          <CalendarIcon />
                        </div>
                        <div className="min-w-0">
                          <span className="small-sb text-espresso900">#{item.code}</span>
                        </div>
                      </div>
                      <span
                        className={
                          "flex-shrink-0 rounded-full border px-3 py-1 xxxsmall-sb tracking-wide " +
                          badgeCfg.className
                        }
                      >
                        {badgeCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="inline-flex items-center gap-1.5">
                          <ClockIcon className="text-text-tertiary" />
                          <span className="xsmall-m text-text-secondary">
                            {item.date} {item.time}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <UsersIcon className="text-text-tertiary" />
                          <span className="xsmall-m text-espresso900">
                            {item.tableInfo} · {item.guests} người
                          </span>
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-tertiary flex-shrink-0">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === "order" && (
            <>
              {ORDER_ITEMS.map((item) => {
                const badgeCfg = orderBadgeConfig(item.status);
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/order-detail/${item.id}`)}
                    className="relative w-full cursor-pointer overflow-hidden rounded-2xl border border-green100/80 bg-white p-4 shadow-card-sm hover:shadow-card transition-all active:scale-[0.995]"
                  >
                    {item.status === "preparing" && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange500 to-amber500" />
                    )}

                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green100 to-green200 text-[#18552F]">
                          <UtensilsIcon />
                        </div>
                        <div className="min-w-0">
                          <span className="small-sb text-espresso900">#{item.code}</span>
                        </div>
                      </div>
                      <span
                        className={
                          "flex-shrink-0 rounded-full border px-3 py-1 xxxsmall-sb tracking-wide " +
                          badgeCfg.className
                        }
                      >
                        {badgeCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="inline-flex items-center gap-1.5">
                          <ClockIcon className="text-text-tertiary" />
                          <span className="xsmall-m text-text-secondary">
                            {item.date} {item.time}
                          </span>
                        </div>
                        <span className="xsmall-m text-espresso900 truncate">
                          {item.itemsInfo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="small-sb text-[#18552F]">
                          {formatCurrency(item.total)}₫
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
                          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
