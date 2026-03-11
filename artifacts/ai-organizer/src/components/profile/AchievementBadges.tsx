/**
 * AchievementBadges — Displays unlockable research achievements
 * with lucide icons and proper semantic tokens.
 */
import { useMemo } from "react";
import { useUserData } from "../../context/UserDataContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  Upload, Scissors, Users, FolderOpen, Tag,
  MessageSquare, Star, Microscope, Lock, Check
} from "lucide-react";

interface Achievement {
  icon: React.ReactNode;
  label: string;
  unlocked: boolean;
  hint: string;
}

interface AchievementBadgesProps {
  starredCount: number;
}

export function AchievementBadges({ starredCount }: AchievementBadgesProps) {
  const { stats } = useUserData();
  const { t } = useLanguage();

  const achievements = useMemo<Achievement[]>(() => [
    { icon: <Upload className="w-3.5 h-3.5" />, label: "First Upload", unlocked: stats.documentsUploaded >= 1, hint: "Upload your first document" },
    { icon: <Scissors className="w-3.5 h-3.5" />, label: "Segmenter", unlocked: stats.segmentsCreated >= 1, hint: "Segment a document" },
    { icon: <Users className="w-3.5 h-3.5" />, label: "Networker", unlocked: stats.followingCount >= 3, hint: "Follow 3 researchers" },
    { icon: <FolderOpen className="w-3.5 h-3.5" />, label: "Collector", unlocked: stats.collectionsCreated >= 1, hint: "Create a collection" },
    { icon: <Tag className="w-3.5 h-3.5" />, label: "Team Player", unlocked: stats.teamsJoined >= 1, hint: "Join a team" },
    { icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Commenter", unlocked: stats.commentsPosted >= 5, hint: "Post 5 comments" },
    { icon: <Star className="w-3.5 h-3.5" />, label: "Curator", unlocked: starredCount >= 3, hint: "Star 3 documents" },
    { icon: <Microscope className="w-3.5 h-3.5" />, label: "Researcher", unlocked: stats.documentsUploaded >= 5, hint: "Upload 5 documents" },
  ], [stats, starredCount]);

  return (
    <div>
      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
        {t("profile.achievements") || "Achievements"}
      </div>
      <div className="flex gap-2 flex-wrap">
        {achievements.map(a => (
          <div
            key={a.label}
            title={a.unlocked ? a.label : a.hint}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-default
              ${a.unlocked
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/30 border-border text-muted-foreground opacity-45"
              }`}
          >
            {a.unlocked ? a.icon : <Lock className="w-3 h-3" />}
            <span>{a.label}</span>
            {a.unlocked && (
              <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ml-0.5">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
