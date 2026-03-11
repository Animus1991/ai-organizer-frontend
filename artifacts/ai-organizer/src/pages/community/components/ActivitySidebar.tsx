/**
 * ActivitySidebar — following feed
 * Limits to 5 items (Miller's Law), action-specific colors, expandable
 */
import React, { useState } from "react";
import {
  FileText, MessageSquare, Star, GitFork, Tag, UserPlus, Radio, ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { formatDate } from "../helpers";
import type { FollowActivity } from "../types";

const ACTION_CONFIG: Record<string, { icon: typeof FileText; colorClass: string }> = {
  published: { icon: FileText, colorClass: "text-primary" },
  commented: { icon: MessageSquare, colorClass: "text-info" },
  starred: { icon: Star, colorClass: "text-warning" },
  forked: { icon: GitFork, colorClass: "text-success" },
  released: { icon: Tag, colorClass: "text-accent-foreground" },
  followed: { icon: UserPlus, colorClass: "text-muted-foreground" },
};

const INITIAL_LIMIT = 5;

interface Props {
  activities: FollowActivity[];
}

export const ActivitySidebar: React.FC<Props> = ({ activities }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const visibleActivities = expanded ? activities : activities.slice(0, INITIAL_LIMIT);
  const hasMore = activities.length > INITIAL_LIMIT;

  return (
    <aside className="w-full lg:w-[280px] shrink-0">
      <div className="rounded-xl border border-border bg-card p-3.5">
        <h3 className="text-xs font-semibold mb-2.5 text-foreground inline-flex items-center gap-1.5 uppercase tracking-wider">
          <Radio size={12} className="text-primary" />
          {t("community.activityFeed")}
        </h3>

        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <UserPlus size={20} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">{t("community.noActivity")}</p>
            <p className="text-[10px] mt-1 opacity-50">
              {t("community.noActivityHint") || "Follow researchers to see their activity"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-border/50">
              {visibleActivities.map((activity) => {
                const cfg = ACTION_CONFIG[activity.action] || { icon: FileText, colorClass: "text-muted-foreground" };
                const Icon = cfg.icon;
                return (
                  <div key={activity.id} className="flex gap-2 items-start py-2 first:pt-0 last:pb-0">
                    <span className="text-sm mt-0.5 shrink-0">{activity.userAvatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] leading-relaxed text-foreground">
                        <strong className="font-semibold">{activity.userName}</strong>{" "}
                        <span className={`inline-flex items-center gap-0.5 ${cfg.colorClass}`}>
                          <Icon size={10} className="inline" /> {activity.action}
                        </span>{" "}
                        <span className="text-primary truncate">{activity.targetTitle}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/70 mt-px">
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <button
                onClick={() => setExpanded((p) => !p)}
                className="mt-2 w-full text-center text-[11px] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none py-1 inline-flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                {expanded
                  ? (t("common.showLess") || "Show less")
                  : (t("common.showMore") || `Show all (${activities.length})`)}
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
