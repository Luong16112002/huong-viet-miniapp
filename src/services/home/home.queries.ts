import { apiFetch, apiUrl } from "@/services/apiClient";
import { useQuery } from "@tanstack/react-query";
import type { HomeContent } from "./home-content";
const apiBase = (
  
  ("/api/commerce").replace(
    /\/commerce\/?$/,
    "",
  )
).replace(/\/$/, "");
export function useHome() {
  return useQuery({
    queryKey: ["restaurant-home"],
    queryFn: async ({ signal }): Promise<HomeContent> => {
      const timeout = new AbortController();
      const abort = () => timeout.abort();
      signal.addEventListener("abort", abort, { once: true });
      const timer = setTimeout(abort, 10000);
      try {
        const response = await apiFetch(`${apiBase}/home`, {
          signal: timeout.signal,
        });
        if (!response.ok) throw new Error("Chưa tải được thông tin nhà hàng.");
        const data: HomeContent = await response.json();
        if (
          !Array.isArray(data.featured) ||
          !Array.isArray(data.categories) ||
          !Array.isArray(data.promotions) ||
          !data.restaurant?.name
        )
          throw new Error("Dữ liệu nhà hàng chưa hợp lệ.");
        return {
          ...data,
          featured: data.featured.map((p) => {
            const image = typeof p.imageUrl === "string" && p.imageUrl.trim() ? p.imageUrl : `/api/foods/${p.id}/image`;
            return ({
            ...p,
            imageUrl: image.startsWith("/") ? apiUrl(image) : image,
            image: image.startsWith("/") ? apiUrl(image) : image,
          }); }),
        };
      } finally {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
      }
    },
    staleTime: 60000,
    retry: 1,
  });
}
