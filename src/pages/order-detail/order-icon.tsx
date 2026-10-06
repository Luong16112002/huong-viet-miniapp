const paths: Record<string, string> = {
  clock: "M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3 M9 7h6 M9 11h6 M9 15h3",
  card: "M3 8h18 M3 11h18 M6 16h4 M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1",
  food: "M4 3v6a3 3 0 0 0 6 0V3 M7 3v18 M16 3v8h4 M20 3v18 M16 3v8",
  support: "M4 13v-2a8 8 0 0 1 16 0v6c0 3-3 4-6 4 M3 12h4v6H3z M17 12h4v6h-4z",
  phone:
    "M5 3l4 4-2 3a15 15 0 0 0 7 7l3-2 4 4c-1 3-4 3-6 2C8 19 5 16 3 9 2 7 2 4 5 3",
  sparkle: "M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
  cart: "M2 3h3l3 12h11l3-9H6 M9 20h.01 M18 20h.01",
  map: "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16",
};
export function OrderIcon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name] || paths.receipt} />
    </svg>
  );
}
