import "./select-location.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { copy } from "@/constants/copy";
import { MapPinIcon, MapPinIconSolid, BackIcon, ChevronRightIcon } from "@/components/common/vectors";

interface Location {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: "open" | "opening_soon";
  hours: string;
}

export default function SelectLocationPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const locations: Location[] = [
    {
      id: "1",
      name: "Hương Việt · Art Gallery",
      address: "02-03a KCN trong KCX, Tân Thuận Đông, Quận 7, TP.HCM",
      distance: "6,7 km",
      status: "open",
      hours: "06:00 – 23:00",
    },
    {
      id: "2",
      name: "Hương Việt · Riverside",
      address: "504 Huỳnh Tấn Phát, Bình Thuận, Quận 7, TP.HCM",
      distance: "12,2 km",
      status: "open",
      hours: "07:00 – 23:30",
    },
    {
      id: "3",
      name: "Hương Việt · Him Lam",
      address: "Đường Số 5, Khu đô thị Him Lam, Quận 7, TP.HCM",
      distance: "18,5 km",
      status: "opening_soon",
      hours: "Mở cửa tháng 10",
    },
  ];

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectLocation = (location: Location) => {
    if (location.status === "opening_soon") return;
    navigate(-1);
  };

  return (
    <div className="location-page relative flex h-full flex-col bg-background pattern-bg">
      <div className="sticky top-0 z-20 bg-cream100/80 backdrop-blur-md border-b border-soft/60 px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-divider02 active:scale-95 transition-all"
          >
            <BackIcon style={{ width: 16, height: 16 }} />
          </button>
          <span className="xxxsmall-sb uppercase tracking-[0.2em] text-gold600">
            Hương Việt
          </span>
          <div className="h-9 w-9" />
        </div>
        <div className="flex flex-col gap-1 mb-1">
          <h1 className="heading_serif text-espresso900 leading-tight text-[24px]">
            Chọn địa điểm
          </h1>
          <p className="xsmall text-text-secondary">
            Chọn nhà hàng gần bạn nhất để được phục vụ tốt nhất
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-3">
        <div className="relative w-full">
          <input
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-divider02 text-normal text-espresso900 outline-none focus:border-gold500 focus:ring-4 focus:ring-gold500/10 transition-all placeholder:text-neutral600 shadow-sm"
            placeholder={copy.selectLocation.searchPlaceholder || "Tìm tên nhà hàng, đường…"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral600" />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-1 pb-2">
        <div className="text-xsmall-m text-text-secondary">
          {copy.selectLocation.nearestTitle}
        </div>
        <div className="xxxsmall-m text-gold700">
          {filteredLocations.length} {copy.common.resultCountSuffix}
        </div>
      </div>

      <div className="flex-1 no-scrollbar overflow-y-auto">
        {filteredLocations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-text-secondary px-6 py-16">
            <div className="pattern-bg w-28 h-28 rounded-full flex items-center justify-center mb-5 bg-white border border-divider02">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                <path
                  d="M32 56c14 0 22-8.5 22-18S46 12 32 12 10 21.5 10 38s8 18 22 18zm0-24a7 7 0 100 14 7 7 0 000-14z"
                  fill="none"
                  stroke="#C9A86A"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="heading_serif text-espresso900 mb-1.5">
              Không tìm thấy địa điểm
            </h3>
            <p className="xsmall text-text-secondary text-center max-w-xs leading-relaxed">
              {copy.selectLocation.notFound}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 p-4 pb-8">
            {filteredLocations.map((item, index) => {
              const disabled = item.status === "opening_soon";
              return (
                <button
                  key={item.id}
                  data-location-id={item.id}
                  onClick={() => handleSelectLocation(item)}
                  disabled={disabled}
                  className={
                    "card flex w-full items-center gap-3.5 text-left transition-all active:scale-[0.99] " +
                    (disabled ? "opacity-60 !cursor-not-allowed" : "")
                  }
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl relative overflow-hidden"
                    style={{ background: disabled ? "rgba(140,140,140,0.10)" : "linear-gradient(135deg, rgba(232,201,137,0.22), rgba(201,168,106,0.14))" }}
                  >
                    {disabled ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22v-6m0-10V2m10 10h-6M8 12H2m13.66-6.66l-4.24 4.24M6.34 17.66l-4.24 4.24m0-14.14l4.24 4.24m11.32 11.32l-4.24-4.24"
                          stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <MapPinIconSolid color="#c9a86a" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="small-sb clamp-1 text-espresso900">{item.name}</div>
                      <div className="xxxsmall-sb text-gold700 whitespace-nowrap">
                        {item.distance}
                      </div>
                    </div>
                    <div className="xxxsmall text-text-secondary clamp-2 leading-relaxed" style={{ lineHeight: "18px" }}>
                      {item.address}
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className={
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 w-fit " +
                        (item.status === "open"
                          ? "bg-emerald50 border border-emerald200/70"
                          : "bg-amber50 border border-amber200/70")
                      }>
                        <div className={
                          "h-1.5 w-1.5 rounded-full " +
                          (item.status === "open" ? "bg-emerald500" : "bg-amber500 animate-pulse")
                        } />
                        <span className={
                          "xxxsmall-m " +
                          (item.status === "open" ? "text-emerald700" : "text-amber700")
                        }>
                          {item.status === "open" ? "Đang mở cửa" : "Sắp mở cửa"} · {item.hours}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!disabled && (
                    <ChevronRightIcon className="h-5 w-5 text-text-tertiary flex-shrink-0" />
                  )}
                </button>
              );
            })}

            <button
              onClick={() => navigate(-1)}
              className="flex w-full items-center gap-3 p-4 mt-2 rounded-2xl border border-dashed border-gold400/50 bg-gold-gradient-soft/20 transition-all hover:bg-gold-gradient-soft/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-gold400/40">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="#c9a86a" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="small-sb text-espresso900">Thêm địa chỉ mới</div>
                <div className="xxxsmall text-text-secondary">Sử dụng vị trí hiện tại của bạn</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
