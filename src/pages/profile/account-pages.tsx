import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { PersonalReview, useReviewStore } from "@/stores/review.store";
import { normalizeReservationPhone } from "@/utils/reservation";
import "./account.css";

function SignedOut() {
  return (
    <div className="account-empty">
      <span aria-hidden="true">⌂</span>
      <h2>Chào bạn đến với Hương Việt</h2>
      <p>Đăng nhập để quản lý thông tin và đánh giá của bạn.</p>
      <Link className="account-primary" to="/login">
        Đăng nhập
      </Link>
    </div>
  );
}

export function PersonalInfoPage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const dirty =
    !!user &&
    (name !== user.name ||
      phone !== user.phone ||
      email !== (user.email || "") ||
      birthday !== (user.birthday || "") ||
      gender !== (user.gender || "") ||
      avatar !== (user.avatar || ""));
  function save(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2 || name.trim().length > 80)
      next.name = "Nhập họ tên từ 2 đến 80 ký tự.";
    const normalized = normalizeReservationPhone(phone);
    if (!/^0[35789]\d{8}$/.test(normalized))
      next.phone =
        "Nhập số điện thoại di động hợp lệ (10 chữ số hoặc dùng mã quốc gia +84).";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Email chưa đúng định dạng.";
    if (
      birthday &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(birthday) ||
        birthday > new Date().toLocaleDateString("sv-SE") ||
        !Number.isFinite(Date.parse(birthday)) || new Date(birthday).toISOString().slice(0,10) !== birthday)
    )
      next.birthday = "Ngày sinh không hợp lệ.";
    setErrors(next);
    setSaved(false);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLInputElement>(".account-page [aria-invalid=true]")
          ?.focus(),
      );
      return;
    }
    try {
      updateUser({
        name: name.trim(),
        phone: normalized,
        email: email.trim() || undefined,
        birthday,
        gender,
        avatar,
      });
      setName(name.trim());
      setPhone(normalized);
      setEmail(email.trim());
      setSaved(true);
    } catch {
      setErrors({ submit: "Chưa lưu được thông tin. Vui lòng thử lại." });
    }
  }
  return (
    <div className="account-page">
      {!user ? (
        <SignedOut />
      ) : (
        <>
          <header className="account-intro">
            <span className="account-eyebrow">HỒ SƠ CỦA BẠN</span>
            <h1>Thông tin cá nhân</h1>
            <p>
              Cập nhật thông tin để những lần đặt món, đặt bàn thuận tiện hơn.
            </p>
          </header>
          <form className="account-card" onSubmit={save} noValidate>
            <div className="account-identity">
              <span className="account-avatar">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{user.name}</strong>
                <small>Thành viên Hương Việt</small>
              </div>
            </div>
            {[
              {
                key: "name",
                label: "Họ và tên",
                value: name,
                set: setName,
                type: "text",
                autocomplete: "name",
                max: 80,
              },
              {
                key: "phone",
                label: "Số điện thoại",
                value: phone,
                set: setPhone,
                type: "tel",
                autocomplete: "tel",
                max: 20,
              },
              {
                key: "email",
                label: "Email (tùy chọn)",
                value: email,
                set: setEmail,
                type: "email",
                autocomplete: "email",
                max: 120,
              },
            ].map((field) => (
              <label
                key={field.key}
                className="account-field"
                htmlFor={`profile-${field.key}`}
              >
                {field.label}
                <input
                  id={`profile-${field.key}`}
                  type={field.type}
                  autoComplete={field.autocomplete}
                  value={field.value}
                  maxLength={field.max}
                  readOnly={user.readOnlyFields?.includes(
                    field.key as "name" | "phone",
                  )}
                  required={field.key !== "email"}
                  onChange={(event) => {
                    field.set(event.target.value);
                    setSaved(false);
                  }}
                  aria-invalid={!!errors[field.key]}
                  aria-describedby={
                    errors[field.key] ? `profile-error-${field.key}` : undefined
                  }
                />
                {errors[field.key] && (
                  <span
                    role="alert"
                    id={`profile-error-${field.key}`}
                    className="account-error"
                  >
                    {errors[field.key]}
                  </span>
                )}
              </label>
            ))}
            <label className="account-field" htmlFor="profile-birthday">
              Ngày sinh
              <input
                id="profile-birthday"
                type="date"
                value={birthday}
                max={new Date().toLocaleDateString("sv-SE")}
                onChange={(e) => {
                  setBirthday(e.target.value);
                  setSaved(false);
                }}
                aria-invalid={!!errors.birthday}
              />
              {errors.birthday && (
                <span className="account-error" role="alert">
                  {errors.birthday}
                </span>
              )}
            </label>
            <label className="account-field" htmlFor="profile-gender">
              Giới tính
              <select
                id="profile-gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value as typeof gender);
                  setSaved(false);
                }}
              >
                <option value="">Không muốn cung cấp</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </label>
            <label className="account-field" htmlFor="profile-avatar">
              Ảnh đại diện
              {avatar && (
                <img
                  src={avatar}
                  alt="Ảnh đại diện hiện tại"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}
              <input
                id="profile-avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={user.readOnlyFields?.includes("avatar")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (
                    !["image/png", "image/jpeg", "image/webp"].includes(
                      file.type,
                    ) ||
                    file.size > 1024 * 1024
                  ) {
                    setErrors((v) => ({
                      ...v,
                      avatar: "Chọn ảnh PNG, JPG hoặc WebP không quá 1 MB.",
                    }));
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setAvatar(String(reader.result));
                    setSaved(false);
                    setErrors((v) => ({ ...v, avatar: "" }));
                  };
                  reader.onerror = () =>
                    setErrors((v) => ({
                      ...v,
                      avatar: "Chưa đọc được ảnh. Vui lòng chọn lại.",
                    }));
                  reader.readAsDataURL(file);
                }}
              />
              {errors.avatar && (
                <span role="alert" className="account-error">
                  {errors.avatar}
                </span>
              )}
            </label>
            {!!user.readOnlyFields?.length && (
              <p className="account-footnote">
                Các thông tin đã xác thực từ Zalo được giữ ở chế độ chỉ đọc.
              </p>
            )}
            {errors.submit && (
              <p role="alert" className="account-error">
                {errors.submit}
              </p>
            )}
            {saved && (
              <p role="status" className="account-success">
                ✓ Đã lưu thông tin cá nhân.
              </p>
            )}
            <div className="account-actions">
              <button
                type="button"
                className="account-secondary"
                disabled={!dirty}
                onClick={() => {
                  setName(user.name);
                  setPhone(user.phone);
                  setEmail(user.email || "");
                  setBirthday(user.birthday || "");
                  setGender(user.gender || "");
                  setAvatar(user.avatar || "");
                  setErrors({});
                  setSaved(false);
                }}
              >
                Hoàn tác
              </button>
              <button
                className="account-primary"
                type="submit"
                disabled={!dirty}
              >
                Lưu thay đổi
              </button>
            </div>
            <p className="account-footnote">
              Thông tin được lưu trên thiết bị này.
            </p>
          </form>
        </>
      )}
    </div>
  );
}

export function MyReviewsPage() {
  const user = useAuthStore((state) => state.user);
  const { reviews, saveReview, deleteReview } = useReviewStore();
  const mine = reviews.filter((review) => review.userId === user?.id);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState(0);
  function edit(review?: PersonalReview) {
    setOpen(true);
    setEditing(review?.id || null);
    setRating(review?.rating || 0);
    setContent(review?.content || "");
    setError("");
    setMessage("");
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>("#review-editor")
        ?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    try {
      saveReview(user.id, rating, content, editing || undefined);
      setOpen(false);
      setFilter(0);
      setMessage(
        editing ? "Đã cập nhật đánh giá." : "Đã lưu đánh giá của bạn.",
      );
      setEditing(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Chưa lưu được đánh giá.",
      );
    }
  }
  const visible = mine.filter((review) => !filter || review.rating === filter);
  return (
    <div className="account-page">
      {!user ? (
        <SignedOut />
      ) : (
        <>
          <header className="account-intro">
            <span className="account-eyebrow">TRẢI NGHIỆM CỦA BẠN</span>
            <h1>Đánh giá của tôi</h1>
            <p>Lưu lại cảm nhận về những bữa ngon tại Hương Việt.</p>
          </header>
          <div className="account-review-summary">
            <div>
              <strong>
                {mine.length
                  ? (
                      mine.reduce((sum, review) => sum + review.rating, 0) /
                      mine.length
                    ).toFixed(1)
                  : "—"}
                <span> / 5</span>
              </strong>
              <small>{mine.length} đánh giá cá nhân</small>
            </div>
            <button
              className="account-primary"
              disabled={open}
              onClick={() => edit()}
            >
              ＋ Viết đánh giá
            </button>
          </div>
          <p className="account-footnote">
            Đánh giá lưu trên thiết bị, chưa được đăng công khai.
          </p>
          {message && (
            <p role="status" className="account-success">
              ✓ {message}
            </p>
          )}
          {open && (
            <form id="review-editor" className="account-card" onSubmit={submit}>
              <h2>
                {editing ? "Chỉnh sửa đánh giá" : "Bữa ăn của bạn thế nào?"}
              </h2>
              <fieldset className="account-rating">
                <legend>Chọn mức độ hài lòng</legend>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="review-rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
                      aria-label={`${value} sao`}
                    />
                    <span
                      className={value <= rating ? "selected" : ""}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  </label>
                ))}
                <p>
                  {
                    [
                      "Chọn từ 1 đến 5 sao",
                      "Chưa hài lòng",
                      "Cần cải thiện",
                      "Khá ổn",
                      "Hài lòng",
                      "Rất hài lòng",
                    ][rating]
                  }
                </p>
              </fieldset>
              <label className="account-field" htmlFor="review-content">
                Chia sẻ cảm nhận
                <textarea
                  id="review-content"
                  rows={4}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={1000}
                  placeholder="Món ăn, không gian hoặc cách phục vụ khiến bạn nhớ nhất…"
                />
                <small>{content.length}/1.000 ký tự · Tối thiểu 10 ký tự</small>
              </label>
              {error && (
                <p role="alert" className="account-error">
                  {error}
                </p>
              )}
              <div className="account-actions">
                <button
                  type="button"
                  className="account-secondary"
                  onClick={() => {
                    setOpen(false);
                    setError("");
                  }}
                >
                  Hủy
                </button>
                <button className="account-primary" type="submit">
                  Lưu đánh giá
                </button>
              </div>
            </form>
          )}
          {!!mine.length && (
            <div
              className="account-filters"
              role="group"
              aria-label="Lọc đánh giá"
            >
              {[0, 5, 4, 3, 2, 1].map((value) => (
                <button
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value ? `${value} ★` : "Tất cả"}
                </button>
              ))}
            </div>
          )}
          {!visible.length && !open && (
            <div className="account-empty">
              <span aria-hidden="true">☆</span>
              <h2>
                {mine.length
                  ? "Chưa có đánh giá ở mức này"
                  : "Câu chuyện bắt đầu từ bạn"}
              </h2>
              <p>
                {mine.length
                  ? "Chọn mức sao khác để xem đánh giá."
                  : "Viết cảm nhận đầu tiên về trải nghiệm tại nhà hàng."}
              </p>
            </div>
          )}
          {visible.map((review) => (
            <article className="account-card account-review" key={review.id}>
              <div className="account-review-top">
                <span
                  className="account-stars"
                  aria-label={`${review.rating} trên 5 sao`}
                >
                  {"★".repeat(review.rating)}
                  <span>{"★".repeat(5 - review.rating)}</span>
                </span>
                <time dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                </time>
              </div>
              <h2>Nhà hàng Hương Việt</h2>
              <p>{review.content}</p>
              {review.updatedAt !== review.createdAt && (
                <small>Đã chỉnh sửa</small>
              )}
              <div className="account-review-tools">
                <button disabled={open} onClick={() => edit(review)}>
                  Chỉnh sửa
                </button>
                <button onClick={() => setDeleting(review.id)}>Xóa</button>
              </div>
              {deleting === review.id && (
                <div
                  className="account-delete"
                  role="group"
                  aria-label="Xác nhận xóa đánh giá"
                >
                  <p>Xóa đánh giá này khỏi thiết bị?</p>
                  <button
                    className="account-secondary"
                    onClick={() => setDeleting(null)}
                  >
                    Giữ lại
                  </button>
                  <button
                    className="account-danger"
                    onClick={() => {
                      deleteReview(user.id, review.id);
                      setDeleting(null);
                      if (editing === review.id) {
                        setOpen(false);
                        setEditing(null);
                      }
                      setMessage("Đã xóa đánh giá.");
                    }}
                  >
                    Xóa đánh giá
                  </button>
                </div>
              )}
            </article>
          ))}
        </>
      )}
    </div>
  );
}

const faqs = [
  {
    category: "Đặt bàn",
    question: "Làm thế nào để đặt bàn?",
    answer:
      "Mở mục Đặt bàn, chọn ngày, giờ đến, số khách và không gian mong muốn. Sau đó điền thông tin liên hệ, kiểm tra và lưu yêu cầu.",
    link: "/reservation",
    action: "Đặt bàn ngay",
  },
  {
    category: "Đặt bàn",
    question: "Lưu yêu cầu có nghĩa là bàn đã được xác nhận?",
    answer:
      "Chưa. Yêu cầu hiện được lưu trên thiết bị với trạng thái Chờ xác nhận. Bạn cần liên hệ nhà hàng để xác nhận bàn trước khi đến.",
  },
  {
    category: "Đặt bàn",
    question: "Tôi có thể chọn giờ đến và số khách như thế nào?",
    answer:
      "Bạn có thể chọn lịch trong 30 ngày tới, từ 10:00 đến 21:00, cách thời điểm hiện tại ít nhất 30 phút. Mỗi yêu cầu hỗ trợ từ 1 đến 20 khách.",
  },
  {
    category: "Đặt bàn",
    question: "Xem hoặc hủy lịch đặt bàn ở đâu?",
    answer:
      "Mở Lịch đặt bàn trong mục Đơn hàng để xem yêu cầu đã lưu. Với yêu cầu có nút Hủy, bạn có thể hủy tại đó. Việc hủy trong bản hiện tại chỉ cập nhật dữ liệu trên thiết bị.",
    link: "/order?tab=reservation",
    action: "Xem lịch đặt bàn",
  },
  {
    category: "Tài khoản",
    question: "Làm sao thay đổi tên và số điện thoại?",
    answer:
      "Vào Thông tin cá nhân, chỉnh sửa họ tên, số điện thoại hoặc email rồi chọn Lưu thay đổi. Thông tin mới sẽ được dùng khi bạn mở biểu mẫu đặt bàn lần sau.",
    link: "/profile/info",
    action: "Cập nhật thông tin",
  },
  {
    category: "Tài khoản",
    question: "Thông tin của tôi có còn khi tải lại trang không?",
    answer:
      "Thông tin cá nhân, lịch đặt bàn và đánh giá được lưu trên trình duyệt của thiết bị này. Xóa dữ liệu trình duyệt hoặc chuyển sang thiết bị khác có thể khiến bạn không thấy dữ liệu đã lưu.",
  },
  {
    category: "Đánh giá",
    question: "Tôi có thể sửa hoặc xóa đánh giá không?",
    answer:
      "Có. Trong Đánh giá của tôi, chọn Chỉnh sửa để đổi số sao và nội dung. Chọn Xóa và xác nhận nếu muốn bỏ đánh giá.",
    link: "/profile/reviews",
    action: "Xem đánh giá của tôi",
  },
  {
    category: "Đánh giá",
    question: "Đánh giá có được đăng công khai không?",
    answer:
      "Hiện đánh giá chỉ được lưu trên thiết bị cho tài khoản của bạn, chưa gửi tới nhà hàng hoặc đăng công khai.",
  },
  {
    category: "Thực đơn",
    question: "Xem thành phần và ảnh món ăn ở đâu?",
    answer:
      "Mở Thực đơn và chọn món để xem ảnh minh họa, mô tả và giá. Nếu có dị ứng hoặc yêu cầu ăn uống đặc biệt, bạn nên trao đổi trực tiếp với nhà hàng trước khi gọi món.",
    link: "/menu",
    action: "Khám phá thực đơn",
  },
];
const searchable = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
export function FAQPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const visible = faqs.filter(
    (item) =>
      (category === "Tất cả" || item.category === category) &&
      searchable(`${item.question} ${item.answer}`).includes(
        searchable(query.trim()),
      ),
  );
  return (
    <div className="account-page">
      <header className="account-intro">
        <span className="account-eyebrow">CHÚNG MÌNH Ở ĐÂY ĐỂ GIÚP</span>
        <h1>Bạn cần tìm hiểu điều gì?</h1>
        <p>Giải đáp nhanh để trải nghiệm Hương Việt dễ dàng hơn.</p>
      </header>
      <label className="account-field account-search" htmlFor="faq-search">
        Tìm câu hỏi
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm về đặt bàn, tài khoản, đánh giá…"
        />
      </label>
      <div className="account-filters" role="group" aria-label="Nhóm câu hỏi">
        {["Tất cả", "Đặt bàn", "Tài khoản", "Đánh giá", "Thực đơn"].map(
          (value) => (
            <button
              key={value}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ),
        )}
      </div>
      <p className="account-footnote" role="status">
        {visible.length} câu hỏi phù hợp
      </p>
      <div className="account-faq">
        {visible.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
            {item.link && <Link to={item.link}>{item.action} →</Link>}
          </details>
        ))}
      </div>
      {!visible.length && (
        <div className="account-empty">
          <span aria-hidden="true">⌕</span>
          <h2>Chưa tìm thấy câu hỏi</h2>
          <p>Thử từ khóa ngắn hơn hoặc chọn nhóm khác.</p>
          <button
            className="account-secondary"
            onClick={() => {
              setQuery("");
              setCategory("Tất cả");
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
