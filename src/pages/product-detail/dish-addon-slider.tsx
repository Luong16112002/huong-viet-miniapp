import { useRef, type PropsWithChildren } from "react";

export default function DishAddonSlider({ children }: PropsWithChildren) {
  const drag = useRef<{ x: number; scroll: number; moved: boolean; id: number } | null>(null);
  const suppressClick = useRef(0);
  return <div className="dish-addon-wrapper"><div className="dish-related-list no-scrollbar" aria-label="Món ăn kèm, vuốt ngang để xem thêm"
    onPointerDown={event => {
      suppressClick.current = 0;
      if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as Element).closest(".dish-quick-add")) return;
      drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false, id: event.pointerId };
    }}
    onPointerMove={event => {
      const current = drag.current;
      if (!current || current.id !== event.pointerId) return;
      const delta = event.clientX - current.x;
      if (Math.abs(delta) > 6 && !current.moved) {
        current.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.classList.add("is-dragging");
      }
      if (current.moved) event.currentTarget.scrollLeft = current.scroll - delta;
    }}
    onPointerUp={event => {
      suppressClick.current = drag.current?.moved ? Date.now() + 350 : 0;
      drag.current = null;
      event.currentTarget.classList.remove("is-dragging");
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onPointerLeave={() => { if (!drag.current?.moved) drag.current = null; }}
    onPointerCancel={event => { drag.current = null; suppressClick.current = 0; event.currentTarget.classList.remove("is-dragging"); }}
    onDragStart={event => event.preventDefault()}
    onClickCapture={event => { if (event.detail > 0 && Date.now() < suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
  >{children}</div></div>;
}
