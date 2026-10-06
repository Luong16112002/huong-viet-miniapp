export function CartIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    back: "m14 5-7 7 7 7 M7 12h14",
    bag: "M5 7h14v14H5z M8 7V5a4 4 0 0 1 8 0v2",
    trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
    note: "M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5",
    tag: "M3 3h8l10 10-8 8L3 11z M7 7h.01",
    truck:
      "M2 5h12v12H2z M14 9h4l4 5v3h-8 M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
    store: "M3 10h18l-2-7H5z M5 10v11h14V10 M9 21v-7h6v7",
    table: "M5 10h14 M8 10v11 M16 10v11 M2 5v10h4v6 M22 5v10h-4v6",
    leaf: "M4 20C0 5 10 3 21 3c0 13-5 18-17 17z M3 22 16 9",
    plus: "M12 5v14 M5 12h14",
    minus: "M5 12h14",
    arrow: "m9 5 7 7-7 7",
    check: "m5 12 4 4L19 5",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.bag} />
    </svg>
  );
}
