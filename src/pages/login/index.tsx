import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "zmp-ui";
import { getAccessToken, getUserInfo, getPhoneNumber } from "zmp-sdk";
import { useAuthStore } from "@/stores/auth.store";
import { copy } from "@/constants/copy";

function ZaloLogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2C6.48 2 2 6.04 2 11c0 2.66 1.23 5.04 3.18 6.69L4 22l4.53-1.21c1.07.3 2.2.46 3.47.46 5.52 0 10-4.04 10-9S17.52 2 12 2Z" fill="#0068FF"/>
      <path d="M10.15 11.36c-.13.49-.61 1.06-1.29 1.06-.67 0-.93-.42-.93-.84 0-.42.25-1.2.8-1.82.59-.66 2.3-2.23 2.88-2.57.58-.34.93-.17 1.07 0l.59.96c.14.22.11.45-.04.56-.16.11-.45.35-.93.68-.11.07-.14.13-.11.19Z" fill="#fff"/>
      <path d="M15.93 10.3c.14.35.3 1.15.16 1.87-.13.73-.76 1.3-1.51 1.3-.61 0-1.04-.36-1.26-.64l-.54-.77c-.22-.31-.35-.4-.48-.46-.13-.06-.22-.06-.26-.06-.23 0-.45.22-.45.86 0 .64.24 1.57.74 2.17.5.59 1.22.98 2.07.98.95 0 1.9-.52 2.36-1.46.54-1.1.25-2.37-.11-2.98-.12-.19-.43-.4-.73-.41l.01.1Z" fill="#fff"/>
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2L4 5v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5l-8-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M3 13H21" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 8V21" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 8c0-3-4-6-7-3-3 3 0 3 7 3Zm0 0c0-3 4-6 7-3 3 3 0 3-7 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22 16.92V21a1 1 0 0 1-1.11 1 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.18 4.11 1 1 0 0 1 4.18 3h4.09a1 1 0 0 1 1 .75c.12.91.33 1.8.62 2.65a1 1 0 0 1-.23 1.05L8 9.09a16 16 0 0 0 6 6l1.64-1.64a1 1 0 0 1 1.05-.23c.85.29 1.74.5 2.65.62a1 1 0 0 1 .75 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.7L6 22l1.5-7.2L2 10l7.1-1.1L12 2z"/>
    </svg>
  );
}

function CheckBadgeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2 4 6v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V6l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function MedalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7.5 3h9l-2 7H9.5l-2-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="17" r="5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 15.5 13 17l-1 1.5-1-1 1-2Z" fill="currentColor"/>
    </svg>
  );
}

function ArrowLongIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { login } = useAuthStore();
  const [method, setMethod] = useState<"zalo" | "phone">("zalo");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const benefits = [
    { icon: <ClockIcon />, title: copy.login.benefit1, num: "01" },
    { icon: <GiftIcon />, title: copy.login.benefit2, num: "02" },
    { icon: <HeartIcon />, title: copy.login.benefit3, num: "03" },
    { icon: <ShieldCheckIcon />, title: copy.login.benefit4, num: "04" },
  ];

  const otpValue = otp.join("");

  useEffect(() => {
    if (countdown === 0) return;
    const t = setInterval(() => {
      setCountdown((c) => (c <= 1 ? (clearInterval(t), 0) : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    if (step === "otp" && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    }
  }, [step]);

  const handleZaloLogin = async () => {
    setIsLoading(true);
    try {
      let zmpToken: string | null = null;
      let zmpUser: Record<string, any> | null = null;
      let zmpPhone = "";
      let sdkAvailable = true;

      try {
        const tokenRes = await getAccessToken({});
        zmpToken = tokenRes?.token || null;
      } catch (_sdkErr) {
        sdkAvailable = false;
      }

      if (sdkAvailable && zmpToken) {
        try {
          const infoRes = await getUserInfo({});
          zmpUser = infoRes || null;
        } catch (_infoErr) {}
        try {
          const phoneRes = await getPhoneNumber({});
          zmpPhone = phoneRes?.phone || phoneRes?.number || "";
        } catch (_phoneErr) {}
      }

      if (sdkAvailable && zmpUser) {
        login({
          zaloId: String(zmpUser.id || zmpUser.userId || ""),
          readOnlyFields: ["name", "avatar", ...(zmpPhone ? ["phone" as const] : [])],
          name: zmpUser.name || zmpUser.displayName || "Khách hàng Hương Việt",
          avatar: zmpUser.avatar || zmpUser.picture || "",
          phone: zmpPhone || zmpUser.phone || "",
          email: (zmpUser as any).email || "",
          loyaltyLevel: "gold",
          points: 0,
        });
        openSnackbar({
          text: `Xin chào ${zmpUser.name || zmpUser.displayName || ""}!`,
          type: "success",
        });
        setIsLoading(false);
        navigate("/");
        return;
      }

      setTimeout(() => {
        login({
          name: "Bình Nguyễn",
          phone: "0901234567",
          email: "binh.nguyen@example.com",
          avatar: "",
          zaloId: "zalo-" + Date.now(),
          loyaltyLevel: "gold",
          points: 2580,
        });
        setIsLoading(false);
        openSnackbar({
          text: sdkAvailable
            ? "Đăng nhập Zalo thành công!"
            : "Chế độ xem trước dành cho phát triển · Đăng nhập thử",
          type: "success",
        });
        navigate("/");
      }, 1100);
    } catch (err: any) {
      console.error("Zalo login error:", err);
      setIsLoading(false);
      openSnackbar({
        text: err?.message || "Đăng nhập Zalo thất bại",
        type: "error",
      });
    }
  };

  const handleSendOtp = () => {
    if (!phone.trim() || phone.length < 9) {
      openSnackbar({ text: "Vui lòng nhập số điện thoại hợp lệ", type: "warning" });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setStep("otp");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setIsLoading(false);
      openSnackbar({ text: "Mã OTP đã được gửi (mẫu: 123456)", type: "info" });
    }, 600);
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text) {
      e.preventDefault();
      const digits = text.split("");
      const next = [...otp];
      for (let i = 0; i < 6 && i < digits.length; i++) next[i] = digits[i];
      setOtp(next);
      const focusIdx = Math.min(digits.length, 5);
      otpRefs.current[focusIdx]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otpValue.length !== 6) {
      openSnackbar({ text: "Vui lòng nhập mã OTP gồm 6 chữ số", type: "warning" });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      login({
        name: "Khách hàng " + phone.slice(-4),
        phone,
        email: "",
        avatar: "",
        zaloId: "",
        loyaltyLevel: "silver",
        points: 120,
      });
      setIsLoading(false);
      openSnackbar({ text: "Đăng nhập thành công!", type: "success" });
      navigate("/");
    }, 700);
  };

  const handleSkip = () => navigate("/");

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fbf7ee]">
      {/* ===== HERO ===== */}
      <div className="relative w-full overflow-hidden" style={{ height: 360 }}>
        <img
          src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=luxury%20fine%20dining%20restaurant%20interior%20golden%20chandeliers%20dark%20wood%20velvet%20chairs%20candle%20light%20ambient%20warm%20editorial%20architecture%20photography&image_size=landscape_16_9"
          alt="Hương Việt"
          className="absolute inset-0 h-full w-full object-cover animate-kenburns"
          style={{ animationDuration: "22s" }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#1a0f08]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(at_30%_15%,rgba(232,196,138,0.28)_0px,transparent_45%),radial-gradient(at_70%_85%,rgba(201,107,63,0.22)_0px,transparent_50%)]" />
        <div className="hero-overlay-pattern-grid absolute inset-0" />
        <div className="hero-glow-a" />
        <div className="hero-glow-b" />

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
          <div className="login-brand-chip fade-in-down stagger-1">
            <SparkleIcon className="spark" />
            <span className="label">{copy.brand.nameShort}</span>
            <SparkleIcon className="spark" />
          </div>

          <div className="mt-5 flex flex-col items-center fade-in-up stagger-2">
            <h1 className="font-serif text-[40px] font-bold leading-[1.08] text-white">
              Chào mừng đến với{" "}
              <span className="relative inline-block">
                <span className="gold-gradient-text drop-shadow-[0_2px_16px_rgba(232,196,138,0.35)]">
                  Hương Việt
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="10"
                  viewBox="0 0 240 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 6 Q 60 0, 120 5 T 240 4"
                    stroke="#E8C989"
                    strokeWidth="2.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-3 max-w-[300px] font-serif text-[14px] italic leading-relaxed text-yellow100/85">
              {copy.login.description}
            </p>
          </div>

          <div className="login-rating-bar mt-5 fade-in-up stagger-3">
            <span className="stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon key={i} />
              ))}
            </span>
            <span className="txt">4,9 · Hơn 12.000 khách hài lòng</span>
          </div>

          <div className="mt-5 grid w-full max-w-[320px] grid-cols-3 gap-2 fade-in-up stagger-4">
            {[
              { v: "12+", l: "Năm" },
              { v: "50+", l: "Món đặc trưng" },
              { v: "Top", l: "Nhà hàng" },
            ].map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-2 py-2.5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-gold400/30"
              >
                <span className="font-serif text-[20px] font-bold gold-gradient-text drop-shadow-sm">
                  {s.v}
                </span>
                <span className="text-center text-[10.5px] font-medium leading-tight text-yellow100/80">
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== BODY SHEET ===== */}
      <div className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[32px] bg-gradient-to-b from-[#fbf7ee] via-[#faf5ec] to-[#f7f0e2] px-5 pt-4 pb-8">
        <div className="sheet-handle" />

        {/* Benefits section label */}
        <div className="login-section-label stagger-1">
          <div className="line" />
          <span className="text">Trải nghiệm thành viên</span>
          <div className="line right" />
        </div>

        {/* Benefit 2-col premium grid */}
        <div className="benefit-grid">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="benefit-card"
              data-num={b.num}
              style={{ animationDelay: `${80 + i * 70}ms` }}
            >
              <div className="icon-wrap">{b.icon}</div>
              <div className="title">{b.title}</div>
            </div>
          ))}
        </div>

        {/* Auth section label */}
        <div className="login-section-label" style={{ marginBottom: "14px" }}>
          <div className="line" />
          <span className="text">Đăng nhập để bắt đầu</span>
          <div className="line right" />
        </div>

        {/* AUTH PANEL */}
        <div className="auth-panel slide-up">
          {method === "zalo" ? (
            <div className="relative z-10 flex flex-col gap-3">
              <div className="auth-panel-header">
                <h3 className="auth-panel-title">Chào mừng quay trở lại</h3>
                <p className="auth-panel-sub">
                  Đăng nhập để nhận ưu đãi đặc biệt & tích điểm thưởng
                </p>
              </div>

              <button
                disabled={isLoading}
                onClick={handleZaloLogin}
                className="btn-solid btn-zalo"
              >
                <ZaloLogoIcon width={20} height={20} />
                <span>{isLoading ? "Đang kết nối Zalo…" : copy.login.withZalo}</span>
              </button>

              <div className="divider-lux">
                <div className="line" />
                <span className="ornament">{copy.login.or}</span>
                <div className="line" />
              </div>

              <button onClick={() => setMethod("phone")} className="btn-solid btn-light">
                <PhoneIcon />
                <span>{copy.login.withPhone}</span>
              </button>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col gap-3">
              {step === "phone" ? (
                <>
                  <div className="auth-panel-header">
                    <h3 className="auth-panel-title">Đăng nhập bằng SĐT</h3>
                    <p className="auth-panel-sub">
                      Nhập số điện thoại để nhận mã OTP xác minh
                    </p>
                  </div>
                  <div className="phone-field">
                    <span className="cc">
                      <span className="dot" />
                      +84
                    </span>
                    <input
                      type="tel"
                      placeholder={copy.login.phonePlaceholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={10}
                    />
                  </div>
                  <button
                    disabled={isLoading}
                    onClick={handleSendOtp}
                    className="btn-solid btn-gold"
                  >
                    <span>{isLoading ? copy.common.loading : copy.login.sendOtp}</span>
                    <ArrowRightIcon />
                  </button>
                  <button
                    onClick={() => setMethod("zalo")}
                    className="back-link"
                  >
                    <ChevronLeftIcon />
                    Quay lại đăng nhập Zalo
                  </button>
                </>
              ) : (
                <>
                  <div className="auth-panel-header">
                    <h3 className="auth-panel-title">Nhập mã OTP</h3>
                    <p className="auth-panel-sub">
                      Gửi đến <span className="phone">+84 {phone.slice(1)}</span>
                    </p>
                  </div>

                  <div className="otp-row">
                    {otp.map((d, i) => (
                      <div key={i} className={`otp-cell ${d ? "fill" : ""}`}>
                        <input
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          value={d}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          onFocus={(e) => {
                            const wrap = e.currentTarget.closest(".otp-cell");
                            wrap?.classList.add("focus");
                          }}
                          onBlur={(e) => {
                            const wrap = e.currentTarget.closest(".otp-cell");
                            wrap?.classList.remove("focus");
                          }}
                          maxLength={1}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-[12px] text-neutral600 pt-0.5">
                    {countdown > 0 ? (
                      <span>
                        Gửi lại sau{" "}
                        <span className="font-bold text-gold700">{countdown}s</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleSendOtp}
                        className="font-semibold text-[#8a6e3c] hover:underline underline-offset-2"
                      >
                        {copy.login.resend}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        setStep("phone");
                        setOtp(["", "", "", "", "", ""]);
                        setMethod("zalo");
                      }}
                      className="btn-solid btn-light flex-1 !py-[14px] !text-[13.5px]"
                    >
                      Quay lại
                    </button>
                    <button
                      disabled={isLoading || otpValue.length !== 6}
                      onClick={handleVerifyOtp}
                      className="btn-solid btn-gold flex-[1.4]"
                    >
                      {isLoading ? copy.common.loading : copy.login.verify}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="trust-row slide-up" style={{ animationDelay: "120ms" }}>
          <div className="trust-badge">
            <CheckBadgeIcon />
            <span>Bảo mật SSL</span>
          </div>
          <div className="trust-badge">
            <LockIcon />
            <span>An toàn dữ liệu</span>
          </div>
          <div className="trust-badge">
            <MedalIcon />
            <span>Chính hãng 100%</span>
          </div>
        </div>

        {/* Terms */}
        <p className="terms-text">
          {copy.login.terms}{" "}
          <span className="link">{copy.login.termsOfService}</span>
          {" "}{copy.login.and}{" "}
          <span className="link">{copy.login.privacyPolicy}</span>
        </p>

        {/* Skip */}
        <button onClick={handleSkip} className="skip-link">
          <span>{copy.login.skip}</span>
          <span className="arrow">
            <ArrowLongIcon />
          </span>
        </button>
      </div>
    </div>
  );
}
