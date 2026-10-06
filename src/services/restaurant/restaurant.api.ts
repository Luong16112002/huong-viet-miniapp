import { mockRestaurant } from "./restaurant.mock";

export async function fetchRestaurant() {
  await new Promise((res) => setTimeout(res, 200));
  return mockRestaurant;
}
