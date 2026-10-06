import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./chat-float-button.css";

type Point = { x: number; y: number };
const SIZE = 52;
function clampPosition(point: Point): Point {
  const inset = Math.max(12, (window.innerWidth - 430) / 2 + 12);
  return {
    x: Math.max(inset, Math.min(point.x, window.innerWidth - inset - SIZE)),
    y: Math.max(64, Math.min(point.y, Math.max(64, window.innerHeight - SIZE - 90))),
  };
}

export default function ChatFloatButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [position, setPosition] = useState<Point>(() => {
    const initial = { x: window.innerWidth - 64, y: window.innerHeight - 210 };
    try {
      const saved = JSON.parse(sessionStorage.getItem("chef-button-position") || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return clampPosition(saved);
    } catch { /* Storage is optional in the embedded browser. */ }
    return clampPosition(initial);
  });
  const drag = useRef<{ id: number; start: Point; origin: Point; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const resize = () => setPosition(current => clampPosition(current));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem("chef-button-position", JSON.stringify(position)); } catch { /* Optional persistence. */ }
  }, [position]);
  if (pathname === "/ai-chat") return null;
  return (
    <button
      type="button"
      className={`chef-float-button${dragging ? " is-dragging" : ""}`}
      style={{ left: position.x, top: position.y }}
      aria-label="Mở trợ lý ẩm thực AI"
      title="Trợ lý ẩm thực AI · Kéo để di chuyển"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        drag.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: position, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        const dx = event.clientX - current.start.x, dy = event.clientY - current.start.y;
        if (Math.hypot(dx, dy) > 6) current.moved = true;
        if (current.moved) {
          setDragging(true);
          setPosition(clampPosition({ x: current.origin.x + dx, y: current.origin.y + dy }));
        }
      }}
      onPointerUp={event => {
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        suppressClick.current = current.moved;
        drag.current = null;
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { drag.current = null; suppressClick.current = true; setDragging(false); }}
      onLostPointerCapture={() => { if (drag.current) { suppressClick.current = true; drag.current = null; setDragging(false); } }}
      onClick={event => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
        suppressClick.current = false;
        navigate("/ai-chat");
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17.5 3 21v-9a9 9 0 1 1 4 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 11h.01M12 11h.01M16 11h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg>
      <span>AI</span>
    </button>
  );
}
