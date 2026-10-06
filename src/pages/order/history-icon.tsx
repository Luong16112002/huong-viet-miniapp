export function HistoryIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    bag: "M5 7h14v14H5z M8 7V5a4 4 0 0 1 8 0v2",
    clock: "M12 7v5l4 3 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    check: "m5 12 4 4L19 5",
    calendar: "M4 5h16v16H4z M4 10h16 M8 2v6 M16 2v6 M8 14h2 M14 14h2 M8 17h2",
    food: "M4 3v6q3 4 6 0V3 M7 3v18 M18 3c-4 2-4 9 0 9h2 M20 3v18",
    bell: "M5 17h14l-2-4V9a5 5 0 0 0-10 0v4z M10 21h4 M12 2v2",
    search: "M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    menu: "M4 6h16 M4 12h16 M4 18h16",
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
