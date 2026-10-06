import "./ai-chat.css";
import {
  useState,
  useRef,
  useEffect,
  Children,
  cloneElement,
  isValidElement,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { copy } from "@/constants/copy";
import { useCartStore } from "@/stores/cart.store";
import { mockListOfProduct } from "@/services/product/product.mock";
import { useProducts } from "@/services/product/product.queries";
import { formatCurrency } from "@/utils/format";
import { getDefaultVariants } from "@/utils/product";
import {
  ChefPreferences,
  ChefFoodSheet,
  ChefBooking,
  ChefVoice,
} from "./chef-tools";
import { orderService } from "@/services/order/order.api";
import {
  ChefContext,
  ChefCombo,
  askGeminiPro,
  AIChatError,
} from "@/services/ai/gemini.api";

const chefWelcome =
  "Xin chào 👋\nMình là AI Chef của Hương Việt.\nHôm nay bạn muốn ăn gì?\n\nMình có thể gợi ý món theo khẩu vị, ngân sách hoặc số người.";
function ChefIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 15H6a4 4 0 0 1-1-7.87 5 5 0 0 1 9.6-1.7A4 4 0 1 1 18 15h-1M7 13v7h10v-7M7 17h10M10 12v3M14 12v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      <path
        d="M19 15L20 17.5L22.5 18.5L20 19.5L19 22L18 19.5L15.5 18.5L18 17.5L19 15Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2 15 22l-4-9-9-4 20-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ChatMessage {
  suggestedActions?: import("@/services/ai/gemini.api").SuggestedAction[];
  id: string;
  role: "user" | "ai";
  content: string;
  source?: "gemini" | "fallback";
  retryMessage?: string;
  request?: string;
  combos?: ChefCombo[];
  intent?: string;
  people?: number | null;
  feedback?: "up" | "down";
  suggestions?: string[];
  products?: {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    tag?: string;
  }[];
}

function renderInline(
  text: string,
  keyPrefix: string,
): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let idx = 0;

  const patterns: { regex: RegExp; tag: string; cls?: string }[] = [
    {
      regex: /\*\*([^*]+?)\*\*/g,
      tag: "strong",
      cls: "text-green800 font-extrabold",
    },
    {
      regex: /__([^_]+?)__/g,
      tag: "strong",
      cls: "text-green800 font-extrabold",
    },
    { regex: /\*([^*]+?)\*/g, tag: "em" },
    { regex: /_([^_]+?)_/g, tag: "em" },
  ];

  while (remaining.length > 0) {
    let earliest: {
      index: number;
      length: number;
      tag: string;
      cls?: string;
      inner: string;
    } | null = null;
    for (const p of patterns) {
      const reg = new RegExp(p.regex.source, p.regex.flags);
      const m = reg.exec(remaining);
      if (m && (earliest === null || m.index < earliest.index)) {
        earliest = {
          index: m.index,
          length: m[0].length,
          tag: p.tag,
          cls: p.cls,
          inner: m[1],
        };
      }
    }
    if (!earliest) {
      parts.push(remaining);
      break;
    }
    if (earliest.index > 0) {
      parts.push(remaining.slice(0, earliest.index));
    }
    const k = `${keyPrefix}-${idx++}`;
    if (earliest.tag === "strong") {
      parts.push(
        <strong key={k} className={earliest.cls}>
          {earliest.inner}
        </strong>,
      );
    } else {
      parts.push(
        <em key={k} className="italic text-espresso800/90">
          {earliest.inner}
        </em>,
      );
    }
    remaining = remaining.slice(earliest.index + earliest.length);
  }
  return parts;
}

function renderMarkdown(text: string): JSX.Element {
  // React escapes text nodes; keep punctuation intact without HTML injection.
  const rawLines = text.split(/\r?\n/);
  const blocks: JSX.Element[] = [];
  let ulBuffer: string[] = [];
  let olBuffer: string[] = [];

  const flushUl = () => {
    if (ulBuffer.length) {
      blocks.push(
        <ul
          key={`ul-${blocks.length}`}
          className="my-2 list-disc space-y-1 pl-5 marker:text-green600"
        >
          {ulBuffer.map((li, i) => (
            <li
              key={i}
              className="text-small leading-relaxed text-espresso900/95"
            >
              {renderInline(li, `uli-${i}`)}
            </li>
          ))}
        </ul>,
      );
      ulBuffer = [];
    }
  };
  const flushOl = () => {
    if (olBuffer.length) {
      blocks.push(
        <ol
          key={`ol-${blocks.length}`}
          className="my-2 list-decimal space-y-1 pl-5 marker:font-bold marker:text-green700"
        >
          {olBuffer.map((li, i) => (
            <li
              key={i}
              className="text-small leading-relaxed text-espresso900/95"
            >
              {renderInline(li, `oli-${i}`)}
            </li>
          ))}
        </ol>,
      );
      olBuffer = [];
    }
  };

  rawLines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    const ulMatch = trimmed.match(/^[-*+•]\s+(.+)$/);
    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (ulMatch) {
      flushOl();
      ulBuffer.push(ulMatch[1]);
    } else if (olMatch) {
      flushUl();
      olBuffer.push(olMatch[2]);
    } else if (trimmed === "") {
      flushUl();
      flushOl();
      blocks.push(<div key={`br-${lineIdx}`} className="h-2" />);
    } else {
      flushUl();
      flushOl();
      blocks.push(
        <p
          key={`p-${lineIdx}`}
          className="text-small leading-relaxed text-espresso900"
        >
          {renderInline(line, `p-${lineIdx}`)}
        </p>,
      );
    }
  });
  flushUl();
  flushOl();

  return <div className="md-content space-y-0.5">{blocks}</div>;
}

const suggestionChips = [
  { label: copy.ai.suggestByBudget, key: "budget" },
  { label: copy.ai.askIngredients, key: "ingredients" },
  { label: copy.ai.askPrice, key: "price" },
  { label: copy.ai.recommendPairing, key: "pairing" },
  { label: copy.ai.vegetarian, key: "veg" },
];

const quickActions = [
  { label: copy.ai.byPeople, value: "4 người", icon: "👥" },
  { label: copy.ai.byBudget, value: "1.000.000₫", icon: "💰" },
  { label: copy.ai.byOccasion, value: "Tình yêu", icon: "💝" },
  { label: copy.ai.pairDrink, value: "Rượu vang", icon: "🍷" },
];

function linkFoodNames(
  node: ReactNode,
  onFood: (id: number) => void,
): ReactNode {
  if (typeof node === "string") {
    const matches = mockListOfProduct
      .map((p) => ({
        p,
        index: node.toLocaleLowerCase().indexOf(p.name.toLocaleLowerCase()),
      }))
      .filter((x) => x.index >= 0)
      .sort((a, b) => a.index - b.index || b.p.name.length - a.p.name.length);
    if (!matches.length) return node;
    const { p, index } = matches[0];
    return (
      <>
        {node.slice(0, index)}
        <button className="chef-food-link" onClick={() => onFood(p.id)}>
          {node.slice(index, index + p.name.length)}
        </button>
        {linkFoodNames(node.slice(index + p.name.length), onFood)}
      </>
    );
  }
  if (isValidElement<{ children?: ReactNode }>(node))
    return cloneElement(
      node,
      {},
      Children.map(node.props.children, (child) =>
        linkFoodNames(child, onFood),
      ),
    );
  return node;
}
export default function AIChatPage() {
  const { data: liveProducts = [] } = useProducts("all", "");
  const mockListOfProduct = liveProducts;
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart, totalItems, totalAmount } = useCartStore();
  const [context, setContext] = useState<ChefContext>(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem("chef-preferences") || "{}");
      return c && typeof c === "object"
        ? {
            people:
              Number.isInteger(c.people) && c.people > 0 && c.people <= 20
                ? c.people
                : null,
            budget: Number.isFinite(c.budget) && c.budget > 0 ? c.budget : null,
            taste: typeof c.taste === "string" ? c.taste : "",
            preferences: Array.isArray(c.preferences)
              ? c.preferences.filter((p: unknown) => typeof p === "string")
              : [],
            favorites: Array.isArray(c.favorites)
              ? c.favorites.filter((id: unknown) => Number.isInteger(id))
              : [],
          }
        : {};
    } catch {
      return {};
    }
  });
  const [selectedFood, setSelectedFood] = useState<number | null>(null);
  const [historyFoods, setHistoryFoods] = useState<number[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    try {
      sessionStorage.setItem("chef-preferences", JSON.stringify(context));
    } catch {}
  }, [context]);
  useEffect(() => {
    let active = true;
    orderService
      .getAllOrders()
      .then((orders) => {
        if (active)
          setHistoryFoods([
            ...new Set(
              orders
                .filter((o) => ["completed", "delivered"].includes(o.state))
                .flatMap((o) =>
                  o.items
                    .map((i) => i.productId)
                    .filter((id): id is number => typeof id === "number"),
                ),
            ),
          ]);
      })
      .catch(() => {
        if (active) setHistoryError("Chưa tải được lịch sử món.");
      });
    return () => {
      active = false;
    };
  }, []);
  const location = useLocation();
  const [input, setInput] = useState(() =>
    typeof location.state?.orderPrompt === "string"
      ? location.state.orderPrompt.slice(0, 4000)
      : "",
  );
  const [isTyping, setIsTyping] = useState(false);
  const sending = useRef(false);
  useEffect(() => {
    if (!isTyping) {
      setProgress(0);
      return;
    }
    const timer = window.setInterval(
      () => setProgress((n) => (n + 1) % 3),
      1800,
    );
    return () => clearInterval(timer);
  }, [isTyping]);
  const loadingText = context.budget
    ? ["Đang xem thực đơn…", "Đang kiểm tra ngân sách…", "Đang tính combo…"][
        progress
      ]
    : "✨ AI Chef đang tìm món phù hợp…";
  const [geminiStatus, setGeminiStatus] = useState<
    "idle" | "connected" | "unavailable"
  >("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: chefWelcome,
      suggestions: suggestionChips.map((s) => s.label),
    },
  ]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: messages.length === 1 ? 0 : scrollRef.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [messages.length, isTyping]);

  const makeAIResponse = (_userMsg: string): ChatMessage => ({
    id: "ai-" + Date.now(),
    role: "ai",
    content:
      "AI đang tạm thời không phản hồi. Bạn vui lòng thử lại hoặc xem giá và mô tả món trong thực đơn. Với thành phần và dị ứng chưa được xác nhận, hãy liên hệ nhà hàng trước khi đặt món.",
    suggestions: suggestionChips.map((s) => s.label),
  });

  const sendMessage = async (text: string, excludedIds: number[] = [], contextOverride: Partial<ChefContext> = {}) => {
    const content = text.trim();
    if (!content || sending.current) return;
    sending.current = true;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages
        .filter(
          (message) =>
            message.content &&
            (message.role === "user" || message.source === "gemini"),
        )
        .slice(-10)
        .map((message) => ({
          role: message.role === "ai" ? ("model" as const) : ("user" as const),
          text:
            message.content +
            (message.products?.length
              ? "\nMón đã gợi ý: " +
                message.products
                  .map((p) => p.name + " × " + p.quantity)
                  .join(", ")
              : "") +
            (message.combos?.length
              ? "\nCombo đã gợi ý: " +
                message.combos
                  .map(
                    (c) =>
                      c.name +
                      ": " +
                      c.items
                        .map(
                          (i) =>
                            (mockListOfProduct.find((p) => p.id === i.id)
                              ?.name || "") +
                            " × " +
                            i.quantity,
                        )
                        .join(", "),
                  )
                  .join("; ")
              : ""),
        }));
      const response = await askGeminiPro({
        message: content,
        history,
        cart: {
          items: useCartStore
            .getState()
            .items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              options: i.selectedVariants.map((v) => ({
                name: v.groupTitle,
                value: v.optionName,
              })),
            })),
        },
        context: { ...context, ...contextOverride, pastFoodIds: historyFoods, excludedIds },
      });
      setIsTyping(false);
      if (response.type !== "BOOK_TABLE") setGeminiStatus("connected");
      if (response.context)
        setContext((current) => ({
          ...current,
          ...response.context,
          excludedIds: [],
        }));
      setMessages((m) => [
        ...m,
        {
          id: "ai-" + Date.now(),
          role: "ai",
          source: "gemini",
          content: response.reply,
          suggestedActions: response.suggestedActions,
          request: content,
          combos: response.combos,
          intent: response.type,
          people: response.context?.people,
          products: response.recommendations.flatMap((item) => {
            const product = mockListOfProduct.find((p) => p.id === item.id);
            return product
              ? [
                  {
                    id: product.id,
                    name: item.name || product.name,
                    price: item.price ?? product.price,
                    image: product.image,
                    quantity: item.quantity,
                  },
                ]
              : [];
          }),
          suggestions: suggestionChips.slice(0, 3).map((s) => s.label),
        },
      ]);
    } catch (error) {
      setIsTyping(false);
      setGeminiStatus("unavailable");
      const aiResp = makeAIResponse(content);
      aiResp.retryMessage = content;
      aiResp.suggestions = [];
      console.error("[AI CHAT ERROR]", error);
      if (error instanceof Error) aiResp.content = error.message;
      if (error instanceof AIChatError && error.status === 429) {
        aiResp.content =
          "AI Chef đang chạm giới hạn lượt sử dụng của dịch vụ AI. Bạn vui lòng thử lại sau hoặc mở thực đơn để chọn món và đặt hàng ngay nhé.";
      } else if (error instanceof Error && error.name === "AbortError") {
        aiResp.content =
          "AI phản hồi quá lâu. Bạn có thể thử lại câu hỏi hoặc mở thực đơn để tiếp tục đặt món.";
      }
      setMessages((m) => [...m, { ...aiResp, source: "fallback" }]);
    }
    sending.current = false;
  };

  const changeQuantity = (
    messageId: string,
    productId: number,
    delta: number,
  ) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              products: message.products?.map((product) =>
                product.id === productId
                  ? {
                      ...product,
                      quantity: Math.min(
                        20,
                        Math.max(1, product.quantity + delta),
                      ),
                    }
                  : product,
              ),
            }
          : message,
      ),
    );
  };

  const handleAddAllToCart = (prods: ChatMessage["products"]) => {
    if (!prods) return;
    prods.forEach((p) => {
      const product = mockListOfProduct.find((x) => x.id === p.id);
      if (!product) return;
      addToCart({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        basePrice: product.price,
        selectedVariants: getDefaultVariants(product),
        quantity: p.quantity,
      });
    });
  };

  const displayedQuickActions = quickActions.slice(0, 3).map((a) =>
    a.label === copy.ai.byPeople
      ? {
          ...a,
          value: context.people ? context.people + " người" : "Chọn số người",
        }
      : a.label === copy.ai.byBudget
        ? {
            ...a,
            value: context.budget
              ? formatCurrency(context.budget)
              : "Chọn ngân sách",
          }
        : a,
  );
  return (
    <div className="chef-page relative flex h-full min-h-0 flex-col bg-gradient-to-b from-yellow50 via-cream100 to-background">
      <div className="chef-top relative flex-shrink-0 border-b border-divider02 bg-white/85 backdrop-blur-lg">
        <div className="chef-profile ai-profile-card flex items-center justify-between px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="chef-avatar ai-avatar relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow100 via-yellow50 to-cream100 shadow-inner ring-1 ring-gold400/30">
              <ChefIcon />
              <span
                className={`absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full ${geminiStatus === "connected" ? "bg-green500" : "bg-neutral400"} ring-2 ring-white`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <div className="flex flex-col">
              <h2 className="heading_serif leading-none text-espresso900">
                AI Chef Assistant
              </h2>
              <span
                role="status"
                className={`mt-1 text-[11px] font-medium ${geminiStatus === "connected" ? "text-green600" : "text-neutral600"}`}
              >
                {isTyping
                  ? "AI đang suy nghĩ…"
                  : geminiStatus === "connected"
                    ? "AI Chef • Đang trực tuyến"
                    : "AI Chef • Tư vấn từ thực đơn Hương Việt"}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('chef-session-id');
              setContext(c=>({...c,currentFoodId:null,lastIntent:undefined,people:null,budget:null}));
              setMessages([
                {
                  id: "welcome",
                  role: "ai",
                  content: chefWelcome,
                  suggestions: suggestionChips.map((s) => s.label),
                },
              ]);
            }}
            className="hover:border-red300 flex h-9 w-9 items-center justify-center rounded-xl border border-divider02 bg-white text-neutral600 transition-all hover:bg-red50 hover:text-red600"
            aria-label="Xóa hội thoại"
            disabled={isTyping}
          >
            <TrashIcon />
          </button>
        </div>

        <div className="chef-context context-row no-scrollbar -mx-0.5 flex gap-2 overflow-x-auto px-4 pb-3 pt-1">
          {displayedQuickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => sendMessage(`${a.label}: ${a.value}`)}
              className="context-chip flex shrink-0 items-center gap-1.5 rounded-full border border-gold400/30 bg-gradient-to-r from-yellow50 to-cream100 px-3.5 py-1.5 text-[11px] font-semibold text-gold700 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-95"
            >
              <span>{a.icon}</span>
              <span className="context-label">{a.label}</span>
              <span className="context-value">{a.value}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="chef-chat chat-scroll no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 pb-28"
      >
        <ChefPreferences
          context={context}
          onChange={setContext}
          onSend={sendMessage}
          disabled={isTyping}
        />
        {historyFoods.length > 0 && (
          <button
            className="chef-personal"
            disabled={isTyping}
            onClick={() =>
              sendMessage(
                "Gợi ý món tương tự hoặc món kèm từ các món tôi từng gọi",
              )
            }
          >
            ✨ Dành cho bạn · Từ món từng gọi
          </button>
        )}
        {historyError && <p className="chef-helper">{historyError}</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "user-message-row flex justify-end"
                : `ai-message-row flex justify-start ${m.id === "welcome" ? "chef-welcome-row" : ""}`
            }
          >
            {m.role === "ai" && (
              <div className="to-gold-gradient-soft mr-2 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow100 shadow-sm ring-1 ring-gold400/20">
                <SparklesIcon className="h-4 w-4 text-gold700" />
              </div>
            )}
            <div className="max-w-[86%]">
              {m.id !== "welcome" && (
                <div
                  className={
                    m.role === "user"
                      ? "bubble-user whitespace-pre-wrap"
                      : `bubble-ai ${m.id === "welcome" ? "welcome-message" : ""}`
                  }
                >
                  {m.source === "fallback" && (
                    <span className="ai-fallback-note">
                      <SparklesIcon />
                      AI Chef tạm thời gián đoạn
                    </span>
                  )}
                  {m.role === "ai"
                    ? linkFoodNames(renderMarkdown(m.content), setSelectedFood)
                    : m.content}
                </div>
              )}

              {m.retryMessage && (
                <div className="chef-suggestions">
                  <button
                    disabled={isTyping}
                    onClick={() => sendMessage(m.retryMessage!)}
                  >
                    Thử lại câu hỏi
                  </button>
                  <button onClick={() => navigate("/menu")}>
                    Mở thực đơn · Đặt món
                  </button>
                </div>
              )}
              {m.intent === "BOOK_TABLE" && <ChefBooking people={m.people} />}
              {!!m.suggestedActions?.length && (
                <div className="chef-suggestions">
                  {m.suggestedActions.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (a.type === "SELECT_AREA" && a.value) {
                          const labels: Record<string,string> = {indoor:"Trong nhà",garden:"Sân vườn",private:"Phòng riêng",floor1:"Tầng 1",floor2:"Tầng 2"};
                          if (!labels[a.value]) return;
                          void sendMessage(labels[a.value], [], {lastIntent:"TABLE_AVAILABILITY",bookingFilters:{...context.bookingFilters,area:a.value}});
                          return;
                        }
                        if (a.type === "ADD_TO_CART" && a.id) {
                          setSelectedFood(Number(a.id));
                          return;
                        }
                        if (a.type === "SELECT_TABLE" && a.id && a.bookingFilters) {
                          navigate("/reservation", {state:{chefBooking:{...a.bookingFilters,tableId:String(a.id)}}});
                          return;
                        }
                        if (a.type === "OPEN_BOOKING") {
                          navigate("/reservation", {state:{chefBooking:context.bookingFilters}});
                          return;
                        }
                        if (a.type === "OPEN_FOOD" && a.id)
                          navigate("/product/" + encodeURIComponent(a.id));
                        else if (a.type === "OPEN_ORDER" && a.id)
                          navigate("/order/" + encodeURIComponent(a.id));
                        else
                          navigate(
                            (
                              {
                                BOOK_TABLE: "/reservation",
                                OPEN_BOOKING: "/reservation",
                                OPEN_BOOKINGS: "/order?tab=reservation",
                                OPEN_CART: "/cart",
                                OPEN_MENU: "/menu",
                                OPEN_ORDERS: "/order",
                                OPEN_PROMOTIONS: "/promotions",
                              } as Record<string, string>
                            )[a.type] || "/menu",
                          );
                      }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
              {m.combos?.map((combo, index) => (
                <div className="chef-combo" key={index}>
                  <h3>{combo.name}</h3>
                  {combo.items.map((item) => {
                    const food = mockListOfProduct.find(
                      (p) => p.id === item.id,
                    );
                    return food ? (
                      <div className="chef-combo-item" key={item.id}>
                        <img src={food.image} alt="" />
                        <button onClick={() => setSelectedFood(food.id)}>
                          {food.name} × {item.quantity}
                        </button>
                        <span>
                          {formatCurrency(
                            (item.price ?? food.price) * item.quantity,
                          )}
                        </span>
                      </div>
                    ) : null;
                  })}
                  <p>
                    Tổng tiền <strong>{formatCurrency(combo.total)}</strong>
                  </p>
                  <p>
                    Còn lại <strong>{formatCurrency(combo.remaining)}</strong>
                  </p>
                  <button
                    onClick={() =>
                      handleAddAllToCart(
                        combo.items.flatMap((item) => {
                          const p = mockListOfProduct.find(
                            (p) => p.id === item.id,
                          );
                          return p ? [{ ...p, quantity: item.quantity }] : [];
                        }),
                      )
                    }
                  >
                    Chọn combo · Thêm toàn bộ vào giỏ
                  </button>
                </div>
              ))}
              {m.products && m.products.length > 0 && (
                <div className="chef-food-list mt-3 flex flex-col gap-2.5">
                  <span className="chef-section-label">THỰC ĐƠN GỢI Ý</span>
                  {m.products.map((p) => (
                    <div
                      key={p.id}
                      className="chef-food ai-food-card flex gap-3 rounded-2xl border border-divider02 bg-white p-2.5 shadow-card-sm transition-all hover:shadow-card"
                    >
                      <div className="relative h-[76px] w-[76px] flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-gold400/20">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex flex-col gap-1">
                          <h4 className="ai-food-name line-clamp-2 text-small-sb leading-snug text-espresso900">
                            <button
                              className="chef-food-link"
                              onClick={() => setSelectedFood(p.id)}
                            >
                              {p.name}
                            </button>
                          </h4>
                          <p className="chef-food-description">
                            {
                              mockListOfProduct.find((food) => food.id === p.id)
                                ?.description
                            }
                          </p>
                          <div
                            className="chef-quantity"
                            aria-label={"Số lượng " + p.name}
                          >
                            <button
                              aria-label={"Giảm " + p.name}
                              disabled={p.quantity <= 1}
                              onClick={() => changeQuantity(m.id, p.id, -1)}
                            >
                              −
                            </button>
                            <span aria-live="polite">{p.quantity}</span>
                            <button
                              aria-label={"Tăng " + p.name}
                              disabled={p.quantity >= 20}
                              onClick={() => changeQuantity(m.id, p.id, 1)}
                            >
                              +
                            </button>
                          </div>
                          {p.tag && (
                            <span className="chef-food-tag">{p.tag}</span>
                          )}
                          <span className="bg-gradient-to-r from-yellow500 via-gold500 to-gold700 bg-clip-text text-xsmall-b font-bold text-transparent">
                            {formatCurrency(p.price)} / phần
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedFood(p.id)}
                            className="ai-food-btn view flex items-center gap-1 rounded-lg border border-divider02 bg-cream50 px-2.5 py-1 text-[11px] font-semibold text-espresso700 hover:bg-white"
                          >
                            {copy.ai.seeDetails}
                            <ChevronRightIcon />
                          </button>
                          <button
                            onClick={() => {
                              const product = mockListOfProduct.find(
                                (x) => x.id === p.id,
                              );
                              if (product) {
                                addToCart({
                                  productId: product.id,
                                  productName: product.name,
                                  productImage: product.image,
                                  basePrice: product.price,
                                  selectedVariants: getDefaultVariants(product),
                                  quantity: p.quantity,
                                });
                              }
                            }}
                            className="ai-food-btn add flex items-center gap-1 rounded-lg bg-gradient-to-br from-yellow400 via-gold500 to-gold600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm active:scale-95"
                          >
                            <PlusIcon />
                            Thêm {p.quantity} phần
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {m.products.length > 1 && (
                    <button
                      onClick={() => handleAddAllToCart(m.products)}
                      className="chef-add-all mt-1 flex items-center justify-center gap-1.5 rounded-xl border border-gold400/40 bg-gradient-to-r from-yellow50 via-cream50 to-yellow50 py-2.5 text-small-sb text-gold700 transition-all hover:from-yellow100 hover:to-cream100 active:scale-[0.99]"
                    >
                      <PlusIcon />
                      Thêm tất cả ({m.products.length} món) vào giỏ
                    </button>
                  )}
                </div>
              )}

              {m.source === "gemini" && (
                <div className="chef-feedback">
                  <button
                    disabled={isTyping}
                    onClick={() =>
                      sendMessage(
                        "Gợi ý khác, giữ nguyên số người, ngân sách và sở thích. Yêu cầu trước: " +
                          (m.request || ""),
                        [
                          ...(m.products || []).map((p) => p.id),
                          ...(m.combos || []).flatMap((c) =>
                            c.items.map((p) => p.id),
                          ),
                        ],
                      )
                    }
                  >
                    ↻ Gợi ý khác
                  </button>
                  <button
                    aria-pressed={m.feedback === "up"}
                    onClick={() =>
                      setMessages((all) =>
                        all.map((x) =>
                          x.id === m.id ? { ...x, feedback: "up" } : x,
                        ),
                      )
                    }
                  >
                    👍 Hữu ích
                  </button>
                  <button
                    aria-pressed={m.feedback === "down"}
                    onClick={() =>
                      setMessages((all) =>
                        all.map((x) =>
                          x.id === m.id ? { ...x, feedback: "down" } : x,
                        ),
                      )
                    }
                  >
                    👎 Chưa phù hợp
                  </button>
                  {m.feedback && (
                    <span role="status">Đã ghi nhận trong hội thoại.</span>
                  )}
                  {!!m.products?.length && (
                    <button
                      disabled={isTyping}
                      onClick={() =>
                        sendMessage("Gợi ý món ăn kèm " + m.products![0].name)
                      }
                    >
                      Gợi ý món kèm
                    </button>
                  )}
                </div>
              )}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="chef-suggestions quick-actions mt-3 flex flex-wrap gap-2">
                  {m.id === "welcome" && (
                    <span className="chef-section-label">
                      BẮT ĐẦU VỚI MỘT GỢI Ý
                    </span>
                  )}
                  {m.suggestions.map((s, i) => (
                    <button
                      key={i}
                      aria-label={s}
                      onClick={() => {
                        if (s === "Thêm tất cả vào giỏ")
                          handleAddAllToCart(m.products);
                        else sendMessage(s);
                      }}
                      className="quick-action rounded-full border border-gold400/30 bg-gradient-to-r from-yellow50/80 to-cream100/80 px-3 py-1.5 text-[11px] font-semibold text-espresso800 transition-all hover:border-gold500/60 hover:from-yellow100 hover:to-cream200 active:scale-95"
                    >
                      <span>
                        {m.id === "welcome"
                          ? [
                              "Bữa ngon cho 4 người · 1 triệu",
                              "Thành phần món",
                              "Giá món ăn",
                              "Món ăn kèm",
                              "Khám phá món chay",
                            ][i] || s
                          : s}
                      </span>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.role === "user" && (
              <div className="ml-2 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-espresso700 to-espresso900 shadow-sm ring-1 ring-espresso800/30">
                <UserIcon className="h-4 w-4 text-yellow200" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="ai-message-row flex justify-start">
            <div className="to-gold-gradient-soft mr-2 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow100 shadow-sm ring-1 ring-gold400/20">
              <SparklesIcon className="h-4 w-4 text-gold700" />
            </div>
            <div className="bubble-ai chef-typing typing-bubble">
              <span>{loadingText}</span>
              <div
                className="typing"
                role="status"
                aria-label="AI đang suy nghĩ"
              >
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <p className="chef-helper ai-helper">
            Bạn có thể hỏi AI Chef về
            <br />
            khẩu vị · ngân sách · thành phần · món ăn kèm
          </p>
        )}
        <p className="chef-disclaimer ai-disclaimer mx-auto max-w-xs pt-2 text-center text-[10px] italic leading-relaxed text-neutral600/80">
          ⚠️ {copy.ai.disclaimer}
        </p>
      </div>

      <div className="chef-quick-toolbar">
        {[
          ["🍜 Gợi ý món", "Gợi ý món ngon trong thực đơn"],
          ["💰 Theo ngân sách", "Tư vấn món theo ngân sách tối đa"],
          ["👥 Theo số người", "Tư vấn món theo số người"],
          ["🥗 Ăn kiêng", "Gợi ý món thanh đạm theo sở thích của tôi"],
          [
            "⚠️ Dị ứng",
            "Tư vấn món theo dị ứng của tôi; nếu chưa biết hãy hỏi lại",
          ],
          ["❤️ Món yêu thích", "Gợi ý từ các món yêu thích của tôi"],
          ["🔥 Món bán chạy", "Gợi ý món có nhãn bán chạy trong thực đơn"],
        ].map(([label, prompt]) => (
          <button
            disabled={isTyping}
            key={label}
            onClick={() => sendMessage(prompt)}
          >
            {label}
          </button>
        ))}
      </div>
      <ChefFoodSheet
        id={selectedFood}
        onClose={() => setSelectedFood(null)}
        onPair={(name) => sendMessage("Gợi ý món ăn kèm " + name)}
        favorite={context.favorites?.includes(selectedFood || 0) || false}
        onFavorite={(id) =>
          setContext((c) => ({
            ...c,
            favorites: c.favorites?.includes(id)
              ? c.favorites.filter((x) => x !== id)
              : [...(c.favorites || []), id],
          }))
        }
      />
      {totalItems > 0 && (
        <button className="chef-cart-summary" onClick={() => navigate("/cart")}>
          <span>Giỏ hàng · {totalItems} phần</span>
          <strong>{formatCurrency(totalAmount)} · Xem giỏ →</strong>
        </button>
      )}
      <div className="chef-composer chat-input-shell absolute bottom-0 left-0 right-0 z-30 border-t border-divider02 bg-white/90 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-lg">
        <div className="focus-within:ring-gold500/14 flex items-end gap-2 rounded-2xl border border-divider02 bg-white p-1.5 shadow-card-sm transition-all focus-within:border-gold500 focus-within:ring-4">
          <ChefVoice onSend={setInput} disabled={isTyping} />
          <textarea
            aria-label="Tin nhắn cho AI Chef"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={copy.ai.inputPlaceholder}
            rows={1}
            className="chat-input max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2.5 py-2 text-small text-espresso900 outline-none placeholder:text-neutral600"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className={
              "send-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all " +
              (input.trim()
                ? "bg-gradient-to-br from-yellow400 via-gold500 to-gold600 text-white shadow-button active:scale-90"
                : "cursor-not-allowed bg-cream100 text-neutral500")
            }
            aria-label="Gửi"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
