/**
 * XPRing — Circular progress ring around the profile avatar
 * showing user XP level and progress to next level.
 */
import { useUserData } from "../../context/UserDataContext";

export function XPRing() {
  const { stats } = useUserData();

  const totalXP = (stats.documentsUploaded || 0) * 100
    + (stats.segmentsCreated || 0) * 20
    + (stats.reviewsCompleted || 0) * 50;
  const level = Math.min(10, Math.floor(totalXP / 300) + 1);
  const levelXP = (level - 1) * 300;
  const nextXP = level * 300;
  const pct = Math.min(1, (totalXP - levelXP) / (nextXP - levelXP));

  const r = 57;
  const dim = 116;
  const circ = 2 * Math.PI * r;

  // Color based on level tier
  const ringColorVar = level >= 7 ? "var(--warning)" : level >= 4 ? "var(--primary)" : "var(--success)";
  const ringColor = `hsl(${ringColorVar})`;

  return (
    <>
      <svg
        width={dim}
        height={dim}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[3]"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle cx={58} cy={58} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
        {/* Progress arc */}
        <circle
          cx={58} cy={58} r={r} fill="none"
          stroke={ringColor} strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={circ - pct * circ}
          strokeLinecap="round"
          transform="rotate(-90 58 58)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-[4] px-2 py-0.5 rounded-full text-[9.5px] font-extrabold text-primary-foreground whitespace-nowrap shadow-sm"
        style={{ background: ringColor }}
        title={`Level ${level} · ${totalXP} XP`}
      >
        Lv {level}
      </div>
    </>
  );
}
