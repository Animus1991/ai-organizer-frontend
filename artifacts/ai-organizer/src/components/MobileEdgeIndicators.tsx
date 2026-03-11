/**
 * MobileEdgeIndicators — Subtle visual hints on left/right screen edges
 * indicating swipe gestures are available (burger menu & chat drawer).
 * Only visible on mobile viewports.
 */
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export const MobileEdgeIndicators: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("edge_hints_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-dismiss after 8 seconds on first load
  useEffect(() => {
    if (!isMobile || dismissed) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      localStorage.setItem("edge_hints_dismissed", "1");
    }, 8000);
    return () => clearTimeout(timer);
  }, [isMobile, dismissed]);

  if (!isMobile || dismissed) return null;

  const indicatorStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 9990,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 48,
    borderRadius: "0 10px 10px 0",
    opacity: 0.4,
    animation: "edgePulse 2.5s ease-in-out infinite",
    pointerEvents: "none",
  };

  return (
    <>
      {/* Left edge — swipe right for burger menu */}
      <div
        style={{
          ...indicatorStyle,
          left: 0,
          background: "hsl(var(--primary) / 0.15)",
          borderLeft: "2px solid hsl(var(--primary) / 0.3)",
        }}
      >
        <ChevronRight
          style={{ width: 14, height: 14, color: "hsl(var(--primary))" }}
        />
      </div>

      {/* Right edge — swipe left for chat drawer */}
      <div
        style={{
          ...indicatorStyle,
          right: 0,
          left: "auto",
          borderRadius: "10px 0 0 10px",
          borderRight: "2px solid hsl(var(--primary) / 0.3)",
          borderLeft: "none",
          background: "hsl(var(--primary) / 0.15)",
        }}
      >
        <ChevronLeft
          style={{ width: 14, height: 14, color: "hsl(var(--primary))" }}
        />
      </div>

      <style>{`
        @keyframes edgePulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </>
  );
};

export default MobileEdgeIndicators;
