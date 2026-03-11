import { useCallback, useState } from "react";
import type { Pending, SearchHit } from "../types";

export function usePending() {
  const [selectMode, setSelectMode] = useState(false);
  const [manualConfirm, setManualConfirm] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) setPending(null);
      return !prev;
    });
  }, []);

  const setPendingFromHit = useCallback((hit: SearchHit) => {
    setPending({ hit });
  }, []);

  const clearPending = useCallback(() => {
    setPending(null);
  }, []);

  const toggleManualConfirm = useCallback(() => {
    setManualConfirm((prev) => {
      if (prev) setPending(null);
      return !prev;
    });
  }, []);

  const shouldStage = selectMode || manualConfirm;

  return {
    selectMode,
    toggleSelectMode,
    manualConfirm,
    toggleManualConfirm,
    shouldStage,
    pending,
    setPendingFromHit,
    clearPending,
  };
}
