import { useEffect, useState } from "react";

export function useScrollSpy(ids: string[], options?: IntersectionObserverInit) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!ids.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      } else {
        // fallback: choose the closest entry above viewport
        const sorted = entries.sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));
        const above = sorted.find((entry) => entry.boundingClientRect.top < (options?.rootMargin ? parseInt(options.rootMargin, 10) || 0 : 0));
        if (above) setActiveId(above.target.id);
      }
    }, {
      rootMargin: options?.rootMargin || "-40% 0px -50% 0px",
      threshold: options?.threshold || [0, 0.25, 0.5, 0.75, 1],
    });

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids.join("|")]);

  return activeId;
}
