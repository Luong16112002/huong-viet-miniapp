import { requireDiagnostics } from "@/services/diagnostics";
import { apiFetch } from "@/services/apiClient";
﻿import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Product } from "@/types/product.types";
import { mockListOfProduct } from "@/services/product/product.mock";
import { useCartStore } from "@/stores/cart.store";
import { getDefaultVariants } from "@/utils/product";
import { formatCurrency } from "@/utils/format";
import "./food-ai.css";
const questions = [
  "Món này có cay không?",
  "Món này gồm những gì?",
  "Có dị ứng gì cần lưu ý không?",
  "Món này hợp với ai?",
  "Món này hợp với đồ uống nào?",
  "Món này phù hợp cho mấy người?",
  "Gợi ý món ăn kèm",
  "Có thể thay đổi nguyên liệu không?",
  "Món này có phù hợp cho trẻ em không?",
  "Có thể làm ít cay không?",
];
const followups = [
  "Món này hợp với đồ uống nào?",
  "Có phù hợp cho trẻ em không?",
  "Có thể làm ít cay không?",
  "Gợi ý món ăn kèm",
];
interface Turn {
  id?: string;
  role: "user" | "ai";
  text: string;
  items?: { id: number; quantity: number }[];
  failed?: boolean;
}
const busyMessage = "AI Chef đang tạm thời bận. Bạn thử lại sau một chút nhé.";
function requestErrorMessage(status: number, code?: string) {
  if (code === 'FOOD_NOT_FOUND') return 'Không tìm thấy thông tin món ăn.';
  if (code === 'AI_CONFIGURATION_ERROR' || [401, 403].includes(status)) return 'Dịch vụ AI hiện chưa được cấu hình đúng.';
  if ([429, 503, 504].includes(status)) return busyMessage;
  if (status === 400) return 'Yêu cầu AI không hợp lệ. Bạn vui lòng kiểm tra món và câu hỏi.';
  if (status === 404) return 'Không tìm thấy dịch vụ hoặc thông tin món ăn. Bạn vui lòng tải lại trang.';
  if (status >= 500) return 'Dịch vụ AI gặp lỗi xử lý. Bạn vui lòng thử lại.';
  return 'AI trả về phản hồi không hợp lệ. Bạn vui lòng thử lại.';
}
export default function FoodAI({
  product,
  onAddCurrent,
  editMode,
}: {
  product: Product;
  onAddCurrent: () => boolean;
  editMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [bottom, setBottom] = useState(90);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [turns, setTurns] = useState<Turn[]>(() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem("food-ai-chat:" + product.id) || "[]",
      );
      return Array.isArray(stored)
        ? stored
            .filter(
              (t) =>
                t &&
                !t.failed &&
                ["user", "ai"].includes(t.role) &&
                typeof t.text === "string",
            )
            .slice(-60)
            .filter((t, i, list) => !(t.role === 'ai' && list[i - 1]?.role === 'ai' && list[i - 1]?.text === t.text))
            .map((t) => ({
              ...t,
              items: Array.isArray(t.items)
                ? t.items.filter(
                    (i: any) =>
                      mockListOfProduct.some((p) => p.id === i.id) &&
                      Number.isInteger(i.quantity) &&
                      i.quantity > 0 &&
                      i.quantity <= 20,
                  )
                : [],
            }))
        : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "food-ai-chat:" + product.id,
        JSON.stringify(turns.slice(-60)),
      );
    } catch {}
  }, [turns, product.id]);
  useEffect(() => {
    if (!open) return;
    const bar = document.querySelector(".dish-order-bar");
    const update = () =>
      setBottom(
        bar
          ? Math.max(0, window.innerHeight - bar.getBoundingClientRect().top) +
              8
          : 16,
      );
    update();
    const observer = new ResizeObserver(update);
    if (bar) observer.observe(bar);
    window.addEventListener("resize", update);
    panel.current?.focus();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [open]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = useRef<AbortController | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const add = useCartStore((s) => s.addToCart);
  const close = () => {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setOpen(false);
    trigger.current?.focus();
  };
  useEffect(() => () => {
    pending.current?.abort();
    pending.current = null;
  }, []);
  useEffect(() => {
    if (open)
      scroll.current?.scrollTo({
        top: scroll.current.scrollHeight,
        behavior: "auto",
      });
  }, [turns.length, busy, open]);
  async function send(message: string) {
    const text = message.trim();
    if (!text || busy || pending.current) return;
    if (product?.id == null || !String(product.id).trim()) {
      setNotice('Không tìm thấy thông tin món ăn. Bạn vui lòng tải lại trang.');
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setInput("");
    setNotice("");
    setTurns((old) => [...old, { role: "user", text }]);
    const timer = window.setTimeout(() => controller.abort("timeout"), 30000);
    let answer: Turn | undefined;
    try {
      await requireDiagnostics();
      const base = "/api/ai/chat";
      const endpoint =
        
        base
          .replace(/\/api\/gemini\/?$/, "/api/ai/food-detail-chat")
          .replace(/\/chat\/?$/, "/food-detail-chat");
      console.log('[AI SEND]', { foodId: product.id, message: text });
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          foodId: product.id,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(requestErrorMessage(response.status, data?.error));
      if (!data || data.success === false || typeof data.reply !== 'string' || !data.reply.trim())
        throw new Error('AI trả về phản hồi trống hoặc không hợp lệ. Bạn vui lòng thử lại.');
      if (pending.current !== controller) return;
      const items = Array.isArray(data.recommendations)
        ? data.recommendations.filter(
            (p: any) =>
              Number.isInteger(p.id) &&
              Number.isInteger(p.quantity) &&
              p.quantity >= 1 &&
              p.quantity <= 20 &&
              mockListOfProduct.some((food) => food.id === p.id),
          )
        : [];
      answer = { id: crypto.randomUUID(), role: 'ai', text: data.reply.trim(), items };
    } catch (error) {
      answer = {
        id: crypto.randomUUID(), role: 'ai', failed: true,
        text: controller.signal.reason === 'timeout' ? busyMessage :
          error instanceof TypeError ? 'Không thể kết nối dịch vụ AI. Bạn kiểm tra kết nối mạng rồi thử lại nhé.' :
          error instanceof Error ? error.message : 'Không thể xử lý câu hỏi. Bạn vui lòng thử lại.',
      };
    } finally {
      clearTimeout(timer);
      if (pending.current === controller) {
        const completed = answer;
        if (completed) setTurns(old => {
          const last = old[old.length - 1];
          if (old.some(t => t.id === completed.id) || (last?.role === 'ai' && last.text === completed.text)) return old;
          return [...old, completed];
        });
        pending.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <>
      <button
        ref={trigger}
        className="food-ai-trigger"
        onClick={() => setOpen(true)}
      >
        🤖 Hỏi AI về món này
      </button>
      {open &&
        createPortal(
          <div className="food-ai-layer" style={{ bottom }}>
            <button
              className="food-ai-backdrop"
              aria-label="Đóng khung hỏi AI"
              tabIndex={-1}
              onClick={close}
            />
            <section
              className="food-ai-panel food-ai-sheet"
              style={{
                maxHeight: "min(75dvh, calc(100dvh - " + bottom + "px - 12px))",
              }}
              ref={panel}
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
              }}
              role="dialog"
              aria-label={"Hỏi AI về " + product.name}
            >
              <div className="food-ai-handle" aria-hidden="true" />
              <header>
                <div>
                  <strong>Hỏi AI về món này</strong>
                  <span>{product.name}</span>
                </div>
                <button aria-label="Đóng hỏi AI" onClick={close}>
                  ×
                </button>
              </header>
              <div className="food-ai-scroll food-ai-body" ref={scroll}>
                <p className="food-ai-intro">
                  Hỏi về thành phần, khẩu vị hoặc món ăn kèm của {product.name}.
                </p>
                <div className="food-ai-chips">
                  {(product.subCategoryId === "lau" ? ["Lẩu này phù hợp mấy người?", "Có cay không?", "Có hải sản không?", "Nên gọi thêm topping gì?", "Combo nào phù hợp ngân sách?"] : expanded ? questions : questions.slice(0, 4)).map((q) => (
                    <button disabled={busy} key={q} onClick={() => send(q)}>
                      {q}
                    </button>
                  ))}
                </div>
                <button
                  className="food-ai-expand"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((x) => !x)}
                >
                  {expanded ? "Thu gọn câu hỏi" : "Xem thêm câu hỏi"}
                </button>
                {turns.map((turn, index) => (
                  <div className={"food-ai-turn " + turn.role} key={turn.id ?? index}>
                    {turn.role === "ai" && (
                      <span className="food-ai-author">✨ AI Chef</span>
                    )}
                    <p>{turn.text}</p>
                    {turn.items?.map((item) => {
                      const p = mockListOfProduct.find(
                        (p) => p.id === item.id,
                      )!;
                      return (
                        <article className="food-ai-card" key={p.id}>
                          <img src={p.image} alt={p.name} />
                          <div>
                            <strong>{p.name}</strong>
                            <span>
                              {formatCurrency(p.price)}đ / phần ·{" "}
                              {item.quantity} phần
                            </span>
                            <div>
                              <button
                                onClick={() => {
                                  close();
                                  navigate("/product/" + p.id);
                                }}
                              >
                                Xem món
                              </button>
                              <button
                                aria-label={"Thêm " + p.name + " vào giỏ"}
                                onClick={() => {
                                  add({
                                    productId: p.id,
                                    productName: p.name,
                                    productImage: p.image,
                                    basePrice: p.price,
                                    selectedVariants: getDefaultVariants(p),
                                    quantity: item.quantity,
                                  });
                                  setNotice("Đã thêm " + p.name + " vào giỏ.");
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                    {turn.role === "ai" && (
                      <>
                        <div className="food-ai-actions">
                          <button
                            onClick={() => {
                              if (onAddCurrent())
                                setNotice(
                                  editMode
                                    ? "Đã cập nhật món trong giỏ."
                                    : "Đã thêm món với lựa chọn hiện tại vào giỏ.",
                                );
                              else close();
                            }}
                          >
                            {editMode
                              ? "Cập nhật món trong giỏ"
                              : "+ Thêm món vào giỏ"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => send("Gợi ý món ăn kèm")}
                          >
                            🍽 Xem món ăn kèm
                          </button>
                          <button onClick={() => field.current?.focus()}>
                            💬 Hỏi tiếp
                          </button>
                        </div>
                        <div className="food-ai-chips followup">
                          {followups.map((q) => (
                            <button
                              disabled={busy}
                              key={q}
                              onClick={() => send(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {busy && (
                  <p className="food-ai-loading" role="status">
                    ✨ AI Chef đang phân tích món và khẩu vị phù hợp...
                    <span />
                    <span />
                    <span />
                  </p>
                )}
              </div>
              {notice && (
                <p className="food-ai-notice" role="status">
                  {notice}
                </p>
              )}
              <form
                className="food-ai-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <textarea
                  ref={field}
                  aria-label="Câu hỏi về món"
                  placeholder="Hỏi thêm về món này…"
                  value={input}
                  maxLength={4000}
                  rows={1}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Gửi câu hỏi"
                >
                  ➤
                </button>
              </form>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
