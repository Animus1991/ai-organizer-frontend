import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      style={{
        position: "fixed",
        bottom: "80px",
        left: "16px",
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: "hsl(var(--muted-foreground) / 0.18)",
        color: "hsl(var(--muted-foreground))",
        border: "1px solid hsl(var(--border) / 0.4)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        transition: "all 0.25s ease",
        zIndex: 50,
        opacity: 0.5,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = "0.85";
        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
        e.currentTarget.style.background = "hsl(var(--primary) / 0.15)";
        e.currentTarget.style.color = "hsl(var(--foreground))";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = "0.5";
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.background = "hsl(var(--muted-foreground) / 0.18)";
        e.currentTarget.style.color = "hsl(var(--muted-foreground))";
      }}
    >
      <ArrowUp style={{ width: 14, height: 14 }} />
    </button>
  );
}
