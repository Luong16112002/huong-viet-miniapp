import { copy } from "@/constants/copy";

export default function Logo() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-[28px]"
      aria-label={copy.brand.name}
    >
      <defs>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#89CF9D" />
          <stop offset="50%" stopColor="#2F8A4F" />
          <stop offset="100%" stopColor="#18552F" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#leafGrad)" />
      <path
        d="M16 6 C11 8 8 13 8 17 C8 21 11.5 25 16 26 C20.5 25 24 21 24 17 C24 13 21 8 16 6 Z"
        fill="#EEF8F0"
        opacity="0.92"
      />
      <path
        d="M16 9 L16 24"
        stroke="#18552F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 13 C13 14 11 16 10 18"
        stroke="#18552F"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 13 C19 14 21 16 22 18"
        stroke="#18552F"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 18 C14 19 13 20.5 12.5 22"
        stroke="#18552F"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 18 C18 19 19 20.5 19.5 22"
        stroke="#18552F"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
