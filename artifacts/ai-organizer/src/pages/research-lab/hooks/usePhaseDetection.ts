/**
 * usePhaseDetection - Auto-detect current theory phase based on localStorage state
 */

import { useEffect } from "react";
import type { TheoryPhase } from "../types";

export function usePhaseDetection(onPhaseDetected: (phase: TheoryPhase) => void) {
  useEffect(() => {
    try {
      const claims = JSON.parse(localStorage.getItem("thinkspace-claim-builder") || "[]");
      const contradictions = JSON.parse(localStorage.getItem("thinkspace-contradictions") || "{}");
      const evidence = JSON.parse(localStorage.getItem("thinkspace-evidence-requirements") || "[]");

      let detected: TheoryPhase = "discovery";

      if (claims.length >= 3 && contradictions.contradictions?.length === 0) {
        detected = "formulation";
      } else if (contradictions.contradictions?.length > 0 && evidence.length < claims.length) {
        detected = "validation";
      } else if (evidence.length >= claims.length && contradictions.contradictions?.some((c: any) => c.status === "resolved")) {
        detected = "refinement";
      }

      onPhaseDetected(detected);
    } catch {
      // Ignore parse errors
    }
  }, []); // Run once on mount
}
