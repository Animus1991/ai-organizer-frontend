/**
 * ScoreBadge — circular compatibility score indicator
 */
import React from "react";

interface Props {
  score: number;
}

export const ScoreBadge: React.FC<Props> = ({ score }) => {
  const color =
    score >= 70
      ? "hsl(var(--success))"
      : score >= 40
        ? "hsl(var(--warning))"
        : "hsl(var(--muted-foreground))";
  const dim = 30;
  const r = 12;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div
      title={`${score}% compatibility match`}
      className="relative shrink-0"
      style={{ width: dim, height: dim }}
    >
      <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={15} cy={15} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={2.5} />
        <circle
          cx={15} cy={15} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ fontSize: "8px", color }}
      >
        {score}
      </span>
    </div>
  );
};
