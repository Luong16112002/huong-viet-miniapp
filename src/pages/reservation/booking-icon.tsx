const paths: Record<string, string> = {
  calendar: "M4 5h16v16H4z M4 10h16 M8 2v6 M16 2v6 M8 14h2 M14 14h2 M8 17h2",
  clock: "M12 7v5l4 3 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  guests:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21v-3c0-6 14-6 14 0v3H2 M17 4c5 0 5 7 0 7 M19 14c3 1 3 3 3 7",
  home: "m2 11 10-9 10 9 M5 9v12h14V9 M10 21v-8h4v8",
  leaf: "M12 22V11 M12 16C3 17 2 9 3 5c7 1 10 6 9 11Z M12 11c0-7 5-10 10-10 1 6-3 11-10 10",
  phone: "M7 2h10v20H7z M10 5h4 M11 19h2",
  info: "M12 11v6 M12 7h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};
export function BookingIcon({ name }: { name: string }) {
  return (
    <svg
      className="reserve-line-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.home} />
    </svg>
  );
}
