import { requireDiagnostics } from "../diagnostics";
import { apiFetch } from "@/services/apiClient";
import { ownerToken } from "../commerce.api";
export interface SuggestedAction {
  type: string;
  id?: string | number;
  value?: string;
  bookingFilters?: {date?:string;time?:string;guests?:number;area?:string};
  label: string;
}
export interface ChefContext {
  currentFoodId?: number | null;
  lastIntent?: string;
  selectedGuests?: number;
  selectedDate?: string;
  selectedTime?: string;
  selectedArea?: string;
  bookingFilters?: { date?: string; time?: string; guests?: number; area?: string };
  people?: number | null;
  budget?: number | null;
  taste?: string;
  preferences?: string[];
  favorites?: number[];
  pastFoodIds?: number[];
  excludedIds?: number[];
}
export interface ChefItem {
  id: number;
  quantity: number;
  name?: string;
  price?: number;
  description?: string;
}
export interface ChefCombo {
  name: string;
  items: ChefItem[];
  total: number;
  remaining: number;
}
export interface ChefResponse {
  suggestedActions?: SuggestedAction[];
  reply: string;
  recommendations: ChefItem[];
  combos: ChefCombo[];
  type: string;
  context?: ChefContext;
}
export interface GeminiChatTurn {
  role: "user" | "model";
  text: string;
}
export interface GeminiChatRequest {
  cart?: { items: unknown[]; deliveryType?: string };
  message: string;
  history: GeminiChatTurn[];
  context?: ChefContext;
}
const proxyUrl = "/api/ai/chat";
export class AIChatError extends Error {
  constructor(public status: number, public code = `HTTP_${status}`, message = `AI request failed (${status})`) {
    super(message);
  }
}
export async function askGeminiPro(
  request: GeminiChatRequest,
): Promise<ChefResponse> {
  await requireDiagnostics();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await apiFetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken()}`,
      },
      body: JSON.stringify({ ...request, sessionId: chatSessionId() }),
      signal: controller.signal,
    }, 30000);
    const data = await response.json();
    if (
      !response.ok ||
      !data.success ||
      typeof data.reply !== "string" ||
      !data.reply.trim()
    )
      throw new AIChatError(response.status, data.code, data.message || data.error);
    const valid = (p: ChefItem) =>
      p &&
      Number.isInteger(p.id) &&
      Number.isInteger(p.quantity) &&
      p.quantity >= 1 &&
      p.quantity <= 20;
    return {
      reply: data.reply.trim(),
      suggestedActions: Array.isArray(data.suggestedActions)
        ? data.suggestedActions
            .filter(
              (a: SuggestedAction) =>
                a &&
                typeof a.label === "string" &&
                [
                  "OPEN_FOOD",
                  "OPEN_ORDER",
                  "BOOK_TABLE",
                  "OPEN_BOOKINGS",
                  "OPEN_CART",
                  "OPEN_PROMOTIONS",
                  "SELECT_AREA",
                  "OPEN_BOOKING",
                  "ADD_TO_CART",
                  "OPEN_MENU",
                  "OPEN_ORDERS",
                  "SELECT_TABLE",
                ].includes(a.type),
            )
            .slice(0, 5)
        : [],
      type: data.type || "text",
      context: data.context,
      recommendations: Array.isArray(data.recommendations)
        ? data.recommendations.filter(valid)
        : [],
      combos: Array.isArray(data.combos)
        ? data.combos.filter(
            (c: ChefCombo) =>
              Array.isArray(c.items) &&
              c.items.length &&
              c.items.every(valid) &&
              Number.isFinite(c.total) &&
              Number.isFinite(c.remaining) &&
              c.remaining >= 0,
          )
        : [],
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

function chatSessionId() {
  let id = sessionStorage.getItem("chef-session-id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("chef-session-id", id);
  }
  return id;
}
