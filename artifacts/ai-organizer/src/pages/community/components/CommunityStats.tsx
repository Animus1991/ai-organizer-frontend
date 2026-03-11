/**
 * CommunityStats — compact top-level summary stats bar
 * Tighter padding per compact design system
 */
import React from "react";
import { Users, UserCheck, UserPlus, Handshake } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  total: number;
  following: number;
  followers: number;
  openCollab: number;
}

const STAT_CONFIG = [
  { key: "researchers", icon: Users, colorClass: "text-primary" },
  { key: "followingCount", icon: UserCheck, colorClass: "text-info" },
  { key: "followers", icon: UserPlus, colorClass: "text-success" },
  { key: "openToCollab", icon: Handshake, colorClass: "text-warning" },
] as const;

export const CommunityStats: React.FC<Props> = ({ total, following, followers, openCollab }) => {
  const { t } = useLanguage();
  const values = [total, following, followers, openCollab];

  return (
    <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
      {STAT_CONFIG.map((cfg, i) => {
        const Icon = cfg.icon;
        return (
          <div
            key={cfg.key}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent/20"
          >
            <Icon size={16} className={cfg.colorClass} strokeWidth={1.8} />
            <div>
              <div className="text-base font-bold text-foreground leading-none">{values[i]}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{t(`community.${cfg.key}`)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
