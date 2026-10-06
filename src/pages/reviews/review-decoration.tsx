/** Lightweight vector ornaments that stay crisp on mobile screens. */
export function ReviewLeaves({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`rv-leaves ${className}`}
      viewBox="0 0 140 160"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M127 4C92 47 66 99 29 153M92 54 35 44M71 89 119 63M50 120 10 92"
        stroke="#82996c"
        strokeWidth="1.4"
      />
      <g fill="#648c60" opacity=".7">
        <path d="M111 24Q66 16 43 5Q47 36 99 41Q77 43 36 29Q50 61 88 56Z" />
        <path d="M108 29Q135 42 125 83Q103 65 108 29ZM91 57Q110 77 90 122Q79 97 91 57Z" />
        <path d="M75 75Q43 50 9 59Q28 86 66 88ZM57 105Q35 83 2 92Q18 116 48 118Z" />
        <path d="M66 94Q83 120 55 156Q51 130 66 94ZM38 129Q20 117 4 124Q13 141 30 141Z" />
      </g>
      <g stroke="#ecf0da" strokeWidth=".7" opacity=".55">
        <path d="M46 8 99 35M42 33 87 51M110 36 123 75M91 65 92 111M16 62 65 84M8 95 47 114M66 105 58 144" />
      </g>
    </svg>
  );
}

export function ReviewLotus() {
  return (
    <svg
      className="rv-lotus"
      viewBox="0 0 64 48"
      aria-hidden="true"
      fill="currentColor"
      stroke="#fffaf0"
      strokeWidth="1.3"
    >
      <path d="M32 45C16 35 20 15 32 2C44 15 48 35 32 45Z" />
      <path d="M32 45C12 44 5 28 6 13C23 16 32 28 32 45ZM32 45C52 44 59 28 58 13C41 16 32 28 32 45Z" />
      <path d="M32 45C16 49 3 40 1 27C16 27 25 33 32 45ZM32 45C48 49 61 40 63 27C48 27 39 33 32 45Z" />
    </svg>
  );
}
