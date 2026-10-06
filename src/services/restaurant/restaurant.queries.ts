import { useQuery } from "@tanstack/react-query";
import { fetchRestaurant } from "./restaurant.api";

export function useRestaurant() {
  return useQuery({
    queryKey: ["restaurant"],
    queryFn: fetchRestaurant,
    staleTime: 5 * 60 * 1000,
  });
}
