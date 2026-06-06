import { useEffect, useRef } from "react";

export function useFadeIn(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Usamos setTimeout en vez de IntersectionObserver para garantizar
    // que la animación dispare siempre, incluso cuando el elemento
    // ya está visible al montar (IntersectionObserver es asíncrono y
    // puede no disparar en producción en algunos browsers).
    const t = setTimeout(() => {
      if (el) el.classList.add("visible");
    }, delay + 80);
    return () => clearTimeout(t);
  }, [delay]);
  return ref;
}
