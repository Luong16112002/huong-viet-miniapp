import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { heroRoutes, heroSlides } from "./hero-slides";

export function HomeHeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      // Avoid moving a CTA while the user is touching the banner.
      if (!touch.current && !document.hidden) {
        setCurrentIndex((previous) => (previous + 1) % heroSlides.length);
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      className="hv-home-hero hv-home-hero-slider"
      aria-label="Khám phá Hương Việt"
      aria-roledescription="carousel"
      onTouchStart={(event) => {
        const point = event.touches[0];
        touch.current = { x: point.clientX, y: point.clientY };
        swiped.current = false;
      }}
      onTouchCancel={() => {
        touch.current = null;
        swiped.current = false;
      }}
      onTouchEnd={(event) => {
        if (!touch.current) return;
        const point = event.changedTouches[0];
        const dx = point.clientX - touch.current.x;
        const dy = point.clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          swiped.current = true;
          setCurrentIndex(
            (previous) =>
              (previous + (dx < 0 ? 1 : heroSlides.length - 1)) %
              heroSlides.length,
          );
        }
      }}
      onClickCapture={(event) => {
        if (swiped.current) {
          event.preventDefault();
          event.stopPropagation();
          swiped.current = false;
        }
      }}
    >
      <div
        className="hv-hero-slides"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {heroSlides.map((slide, index) => (
          <div
            className="hv-hero-slide"
            key={slide.id}
            aria-hidden={index !== currentIndex}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${heroSlides.length}`}
          >
            <img
              className="hv-hero-slide-image"
              src={slide.image}
              alt={slide.imageAlt}
              fetchPriority={index === 0 ? "high" : "auto"}
              draggable={false}
            />
            <div className="hv-hero-shade" />
            <span>{slide.subtitle}</span>
            {index === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}
            <p>{slide.description}</p>
            <Link
              tabIndex={index === currentIndex ? 0 : -1}
              to={heroRoutes[slide.action]}
            >
              {slide.buttonText} <b aria-hidden="true">→</b>
            </Link>
          </div>
        ))}
      </div>
      <div className="hv-hero-dots" aria-label="Chọn banner">
        {heroSlides.map((slide, index) => (
          <button
            type="button"
            key={slide.id}
            aria-label={`Banner ${index + 1}: ${slide.title}`}
            aria-pressed={index === currentIndex}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
