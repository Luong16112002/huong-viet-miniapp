import { api, API_BASE_URL } from "@/services/apiClient";
import { requireDiagnostics } from "./diagnostics";
export interface BookingAvailability {
  tables: {id:string;name:string;area:string;capacity:number;status:string}[];
  suggestions?: {time:string;area:string;count:number}[];
  available: boolean | null;
  canRequest?: boolean;
  message: string;
  alternatives: string[];
}
const base = ("/api/commerce").replace(
  /\/commerce\/?$/,
  "",
);
export async function checkAvailability(
  input: { date: string; time: string; guests: number; area: string },
  signal: AbortSignal,
): Promise<BookingAvailability> {
  console.log("[AVAILABLE TABLES REQUEST]", { baseURL: API_BASE_URL, ...input });
  try {
    await requireDiagnostics(signal);
    const data = await api.post<BookingAvailability>(`${base}/bookings/available-tables`, input, { signal });
    console.log("[AVAILABLE TABLES RESPONSE]", data);
    return data;
  } catch (error) {
    if (!signal.aborted) console.error("[AVAILABLE TABLES ERROR]", error);
    throw error;
  }
}
