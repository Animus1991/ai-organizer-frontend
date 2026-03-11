/**
 * MobileSwipeProvider — Registers global swipe gestures for burger menu & chat drawer.
 * Include once in the app root or per page that needs swipe nav.
 */
import React, { useCallback, useState, useEffect } from "react";
import { useSwipeGesture } from "../hooks/useSwipeGesture";
import MobileEdgeIndicators from "./MobileEdgeIndicators";

export const MobileSwipeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Swipe right from left edge → open burger menu (all viewports for mouse testing)
  useSwipeGesture({
    direction: "right",
    edgeZone: 30,
    threshold: 50,
    enabled: true,
    onSwipe: useCallback(() => {
      window.dispatchEvent(new CustomEvent("openBurgerMenu"));
    }, []),
  });

  // Swipe left from right edge → open chat drawer (all viewports for mouse testing)
  useSwipeGesture({
    direction: "left",
    edgeZone: 30,
    threshold: 50,
    enabled: true,
    onSwipe: useCallback(() => {
      window.dispatchEvent(new CustomEvent("openChatDrawer"));
    }, []),
  });

  return (
    <>
      {isMobile && <MobileEdgeIndicators />}
      {children}
    </>
  );
};

export default MobileSwipeProvider;
