/**
 * ProfileDetail — full researcher profile view
 * v2: tighter spacing, propose collab CTA, compact stats
 */
import React, { useMemo } from "react";
import {
  ArrowLeft, MapPin, ExternalLink, Fingerprint, FolderOpen, Handshake,
} from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { useIsMobile } from "../../../hooks/useMediaQuery";
import { TrustBadge } from "../../../components/TrustBadge";
import { ScoreBadge } from "./ScoreBadge";
import { FIELD_COLORS } from "../constants";
import { formatNumber, loadMySkillsProfile, computeCompatibility } from "../helpers";
import type { CommunityProfile } from "../types";

interface Props {
  profile: CommunityProfile;
  onBack: () => void;
  onToggleFollow: (id: string) => void;
}

export const ProfileDetail: React.FC<Props> = ({ profile, onBack, onToggleFollow }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const fieldColor = FIELD_COLORS[profile.field] || "hsl(var(--primary))";
  const mySkillsProfile = useMemo(() => loadMySkillsProfile(), []);
  const compatScore = mySkillsProfile ? computeCompatibility(mySkillsProfile, profile.expertise) : 0;

  const stats = [
    { label: t("community.publications"), value: profile.publications },
    { label: t("community.citations"), value: formatNumber(profile.citations) },
    { label: "h-index", value: profile.hIndex },
    { label: t("community.followers"), value: formatNumber(profile.followers) },
    { label: t("community.followingCount"), value: profile.following },
    { label: t("community.contributions"), value: profile.contributionCount },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-5 sm:p-7">
      <div className="max-w-[800px] mx-auto">
        {/* Back */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-transparent text-muted-foreground text-xs cursor-pointer mb-4 hover:bg-accent transition-colors"
        >
          <ArrowLeft size={13} />
          {t("common.back") || "Back"}
        </button>

        <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
          {/* Header */}
          <div className={`flex gap-4 ${isMobile ? "flex-col" : ""} mb-4`}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0 border border-border/50"
              style={{ background: `color-mix(in srgb, ${fieldColor} 10%, hsl(var(--muted)))` }}
            >
              {profile.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h1 className="text-lg font-bold text-foreground m-0">{profile.name}</h1>
                {profile.verifiedEmail && <TrustBadge level="verified" size="sm" showLabel />}
                {compatScore > 0 && <ScoreBadge score={compatScore} />}
                {profile.openToCollaboration && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-success/10 text-success border border-success/20 inline-flex items-center gap-0.5">
                    <Handshake size={10} />
                    {t("community.openToCollab")}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground text-xs mb-1">
                @{profile.username} · {profile.institution} · {profile.department}
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed my-1.5">{profile.bio}</p>
              <div className="flex gap-3 text-[11px] text-muted-foreground flex-wrap">
                {profile.location && (
                  <span className="inline-flex items-center gap-1"><MapPin size={11} />{profile.location}</span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink size={11} />{new URL(profile.website).hostname}
                  </a>
                )}
                {profile.orcid && (
                  <span className="inline-flex items-center gap-1"><Fingerprint size={11} />ORCID: {profile.orcid}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 items-start shrink-0">
              <button
                onClick={() => onToggleFollow(profile.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                  profile.isFollowing
                    ? "border-border bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    : "border-primary bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {profile.isFollowing ? t("community.following") : t("community.follow")}
              </button>
            </div>
          </div>

          {/* Stats grid — horizontal compact */}
          <div
            className="grid gap-1.5 mb-4 p-3 bg-muted/20 rounded-lg border border-border/50"
            style={{ gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)" }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-bold text-sm text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Expertise */}
          <section className="mb-4">
            <h2 className="text-xs font-semibold mb-1.5 text-foreground">{t("community.expertise")}</h2>
            <div className="flex gap-1.5 flex-wrap">
              {profile.expertise.map((exp) => (
                <span
                  key={exp}
                  className="text-[11px] px-2 py-0.5 rounded-lg border"
                  style={{
                    color: fieldColor,
                    background: `color-mix(in srgb, ${fieldColor} 8%, transparent)`,
                    borderColor: `color-mix(in srgb, ${fieldColor} 20%, transparent)`,
                  }}
                >
                  {exp}
                </span>
              ))}
            </div>
          </section>

          {/* Recent Projects */}
          <section>
            <h2 className="text-xs font-semibold mb-1.5 text-foreground">{t("community.recentProjects")}</h2>
            <div className="flex flex-col gap-1">
              {profile.recentProjects.map((proj) => (
                <div key={proj} className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-muted/20 rounded-lg text-xs border border-border/50 text-foreground">
                  <FolderOpen size={12} className="text-muted-foreground shrink-0" />
                  {proj}
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
