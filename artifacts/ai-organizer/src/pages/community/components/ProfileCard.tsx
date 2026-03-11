/**
 * ProfileCard — compact researcher card for grid listing
 * Industry-standard: clean hierarchy, field indicator, accessible, minimal visual noise
 */
import React from "react";
import { FileText, BookOpen, Users, Clock, Handshake, MoreHorizontal, Flag, ShieldBan } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { TrustBadge } from "../../../components/TrustBadge";
import { ScoreBadge } from "./ScoreBadge";
import { FIELD_COLORS } from "../constants";
import { formatDate, formatNumber, computeCompatibility } from "../helpers";
import type { CommunityProfile } from "../types";

interface Props {
  profile: CommunityProfile;
  mySkillsProfile: ReturnType<typeof import("../helpers").loadMySkillsProfile>;
  onSelect: (id: string) => void;
  onToggleFollow: (id: string) => void;
  onPropose: (e: React.MouseEvent, id: string, name: string) => void;
  hasSentProposal: boolean;
}

export const ProfileCard: React.FC<Props> = ({
  profile,
  mySkillsProfile,
  onSelect,
  onToggleFollow,
  onPropose,
  hasSentProposal,
}) => {
  const { t } = useLanguage();
  const fieldColor = FIELD_COLORS[profile.field] || "hsl(var(--primary))";
  const compatScore = mySkillsProfile ? computeCompatibility(mySkillsProfile, profile.expertise) : 0;
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(profile.id)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(profile.id)}
      className="group relative rounded-xl border border-border bg-card cursor-pointer transition-all hover:shadow-md hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none overflow-hidden"
    >
      {/* Field color indicator — left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-opacity opacity-60 group-hover:opacity-100"
        style={{ background: fieldColor }}
      />

      <div className="p-4 pl-5">
        {/* Header row */}
        <div className="flex gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border border-border/50"
            style={{ background: `color-mix(in srgb, ${fieldColor} 10%, hsl(var(--muted)))` }}
          >
            {profile.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate">{profile.name}</span>
              {profile.verifiedEmail && <TrustBadge level="verified" size="xs" showLabel={false} />}
              {compatScore > 0 && <ScoreBadge score={compatScore} />}
            </div>
            <div className="text-muted-foreground text-xs truncate mt-0.5">
              @{profile.username} · {profile.institution}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0 items-end">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFollow(profile.id); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                profile.isFollowing
                  ? "border-border bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  : "border-primary bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {profile.isFollowing ? t("community.following") : t("community.follow")}
            </button>
          </div>
        </div>

        {/* Bio — 2 lines max */}
        <p className="text-muted-foreground text-xs mb-2 leading-relaxed line-clamp-2">{profile.bio}</p>

        {/* Expertise tags + field badge */}
        <div className="flex gap-1.5 mb-2 flex-wrap items-center">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
            style={{ color: fieldColor, background: `color-mix(in srgb, ${fieldColor} 12%, transparent)` }}
          >
            {profile.field}
          </span>
          {profile.expertise.slice(0, 2).map((exp) => (
            <span
              key={exp}
              className="text-[10px] px-1.5 py-0.5 rounded-md border"
              style={{ color: fieldColor, background: `color-mix(in srgb, ${fieldColor} 6%, transparent)`, borderColor: `color-mix(in srgb, ${fieldColor} 15%, transparent)` }}
            >
              {exp}
            </span>
          ))}
          {profile.expertise.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{profile.expertise.length - 2}</span>
          )}
        </div>

        {/* Collab + Propose row */}
        {profile.openToCollaboration && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-success/10 text-success border border-success/20 inline-flex items-center gap-0.5">
              <Handshake size={9} />
              {t("community.openToCollab")}
            </span>
            <button
              onClick={(e) => onPropose(e, profile.id, profile.name)}
              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold cursor-pointer border transition-colors ${
                hasSentProposal
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:text-primary"
              }`}
            >
              {hasSentProposal ? `✓ ${t("community.proposed") || "Sent"}` : t("community.propose") || "Propose"}
            </button>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
          <span className="inline-flex items-center gap-1" title={t("community.publications")}><FileText size={11} />{profile.publications}</span>
          <span className="inline-flex items-center gap-1" title={t("community.citations")}><BookOpen size={11} />{formatNumber(profile.citations)}</span>
          <span className="font-mono" title="h-index">h:{profile.hIndex}</span>
          <span className="inline-flex items-center gap-1" title={t("community.followers")}><Users size={11} />{formatNumber(profile.followers)}</span>
          <span className="ml-auto inline-flex items-center gap-1 opacity-60" title={t("community.lastActive") || "Last active"}>
            <Clock size={10} />{formatDate(profile.lastActiveAt)}
          </span>

          {/* Kebab menu for Report/Block — reduces visual noise */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
              className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors cursor-pointer bg-transparent border-none"
              aria-label="More options"
            >
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute bottom-full right-0 mb-1 z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); /* Report logic handled externally */ }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left cursor-pointer bg-transparent border-none transition-colors"
                  >
                    <Flag size={11} /> {t("action.report") || "Report"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full text-left cursor-pointer bg-transparent border-none transition-colors"
                  >
                    <ShieldBan size={11} /> {t("action.block") || "Block"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
