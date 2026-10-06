import { useRef, useState } from "react";
export function ReviewImageUploader({
  images,
  onChange,
  disabled,
  onProcessing,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  disabled: boolean;
  onProcessing: (processing: boolean) => void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  async function upload(files: File[]) {
    if (lock.current) return;
    setError("");
    if (files.length + images.length > 3) {
      setError("Bạn chỉ có thể đính kèm tối đa 3 ảnh.");
      return;
    }
    lock.current = true;
    setLoading(true);
    onProcessing(true);
    try {
      const converted = await Promise.all(
        files.map(async (file) => {
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 10 * 1024 * 1024
          )
            throw Error("Chọn ảnh JPG, PNG hoặc WebP không quá 10 MB.");
          const url = URL.createObjectURL(file);
          try {
            const image = await new Promise<HTMLImageElement>(
              (resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () =>
                  reject(Error("Không đọc được ảnh. Vui lòng chọn ảnh khác."));
                img.src = url;
              },
            );
            const ratio = Math.min(
              1,
              1000 / Math.max(image.naturalWidth, image.naturalHeight),
            );
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
            canvas.height = Math.max(
              1,
              Math.round(image.naturalHeight * ratio),
            );
            const context = canvas.getContext("2d");
            if (!context) throw Error("Thiết bị chưa hỗ trợ xử lý ảnh.");
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            let result = canvas.toDataURL("image/jpeg", 0.8);
            if (result.length > 420000)
              result = canvas.toDataURL("image/jpeg", 0.5);
            if (result.length > 420000)
              throw Error("Ảnh quá chi tiết. Vui lòng chọn ảnh nhỏ hơn.");
            return result;
          } finally {
            URL.revokeObjectURL(url);
          }
        }),
      );
      onChange([...images, ...converted]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa thêm được ảnh.");
    } finally {
      setLoading(false);
      onProcessing(false);
      lock.current = false;
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="rv-upload">
      <h3>
        Thêm ảnh <small>(tối đa 3 ảnh)</small>
      </h3>
      <div className="rv-image-slots">
        {images.map((src, i) => (
          <div className="rv-preview" key={i}>
            <img src={src} alt={`Ảnh đính kèm ${i + 1}`} />
            <button
              type="button"
              disabled={disabled || loading}
              aria-label={`Xóa ảnh ${i + 1}`}
              onClick={() => onChange(images.filter((_, n) => n !== i))}
            >
              ×
            </button>
          </div>
        ))}
        {images.length < 3 && (
          <button
            type="button"
            className="rv-upload-button"
            disabled={disabled || loading}
            onClick={() => input.current?.click()}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 13v8H3V4h10 M3 18l5-6 4 4 3-3 5 6 M18 1v8 M14 5h8" />
              <circle cx="8" cy="8" r="1" />
            </svg>
            <span>{loading ? "Đang xử lý…" : "Thêm ảnh"}</span>
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={disabled || loading}
        onChange={(e) => void upload(Array.from(e.target.files || []))}
      />
      {error && (
        <p className="rv-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
