import React, { useState } from "react";

interface DangerZoneProps {
  title: string;
  description: string;
  buttonLabel: string;
  confirmText?: string;
  successMessage?: string;
  onConfirm: () => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  title,
  description,
  buttonLabel,
  confirmText,
  successMessage = "Action completed successfully.",
  onConfirm,
}) => {
  const [phase, setPhase] = useState<"idle" | "confirming" | "done">("idle");
  const [inputValue, setInputValue] = useState("");

  const needsConfirmation = !!confirmText;
  const isConfirmed = !needsConfirmation || inputValue === confirmText;

  const handleAction = () => {
    if (needsConfirmation) {
      setPhase("confirming");
    } else {
      onConfirm();
      setPhase("done");
    }
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setPhase("done");
      setInputValue("");
    }
  };

  return (
    <div style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))", borderRadius: "12px", padding: "18px 20px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: "12px" }}>{title}</div>
      <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.6, margin: "0 0 12px" }}>{description}</p>

      {phase === "idle" && (
        <button
          onClick={handleAction}
          style={{
            padding: "9px 18px", borderRadius: "8px",
            border: "1px solid hsl(var(--destructive) / 0.4)",
            background: "hsl(var(--destructive) / 0.08)",
            color: "hsl(var(--destructive))",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}
        >
          {buttonLabel}
        </button>
      )}

      {phase === "confirming" && (
        <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid hsl(var(--destructive) / 0.35)", background: "hsl(var(--destructive) / 0.06)" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "hsl(var(--destructive))", marginBottom: "8px" }}>⚠ This cannot be undone</div>
          <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "10px" }}>
            Type <strong>{confirmText}</strong> to confirm.
          </p>
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={`Type ${confirmText} to confirm`}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: "7px",
              border: "1px solid hsl(var(--destructive) / 0.4)",
              background: "hsl(var(--input))", color: "hsl(var(--foreground))",
              fontSize: "13px", marginBottom: "10px", boxSizing: "border-box", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              style={{
                padding: "8px 18px", borderRadius: "7px", border: "none",
                background: isConfirmed ? "hsl(var(--destructive))" : "hsl(var(--muted))",
                color: isConfirmed ? "hsl(var(--destructive-foreground))" : "hsl(var(--muted-foreground))",
                fontSize: "12px", fontWeight: 600, cursor: isConfirmed ? "pointer" : "default",
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => { setPhase("idle"); setInputValue(""); }}
              style={{
                padding: "8px 14px", borderRadius: "7px",
                border: "1px solid hsl(var(--border))",
                background: "transparent", color: "hsl(var(--muted-foreground))",
                fontSize: "12px", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px",
          background: "hsl(var(--success) / 0.1)",
          border: "1px solid hsl(var(--success) / 0.3)",
          fontSize: "13px", color: "hsl(var(--success))", fontWeight: 600,
        }}>
          ✓ {successMessage}
        </div>
      )}
    </div>
  );
};
