/**
 * ProfilePage — GitHub-style academic researcher profile
 * Delegates rendering to extracted sub-components.
 * Owns: profile state, edit modal, cover image.
 */
import { useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { useFavorites } from "../context/FavoritesContext";
import { useDocumentStatus } from "../hooks/useDocumentStatus";
import { ContributionGraph } from "../components/ContributionGraph";
import { ActivityFeed } from "../components/ActivityFeed";
import { PageShell } from "../components/layout/PageShell";
import { ProfileHeader, AcademicProfile } from "../components/profile/ProfileHeader";
import { ProfileEditForm } from "../components/profile/ProfileEditForm";
import { SkillsPanel } from "../components/profile/SkillsPanel";
import { IntentCards } from "../components/profile/IntentCards";
import { DocumentStatusGrid } from "../components/profile/DocumentStatusGrid";
import { StarredDocsList } from "../components/profile/StarredDocsList";
import { useIsMobile } from "../hooks/useMediaQuery";

function loadProfile(): AcademicProfile {
  try { const raw = localStorage.getItem("academic-profile"); if (raw) return JSON.parse(raw); } catch {}
  return { bio: "", institution: "", department: "", position: "", website: "", orcid: "", expertise: [], researchInterests: [], followers: 0, following: 0 };
}
function saveProfile(p: AcademicProfile) {
  try { localStorage.setItem("academic-profile", JSON.stringify(p)); } catch {}
}

const COVER_KEY = "academic-profile-cover";
function loadCoverImage(): string | null { try { return localStorage.getItem(COVER_KEY); } catch { return null; } }
function saveCoverImage(dataUrl: string | null) {
  try { if (dataUrl) localStorage.setItem(COVER_KEY, dataUrl); else localStorage.removeItem(COVER_KEY); } catch {}
}

/** Staggered fade-in wrapper with theme transition support */
function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`animate-fade-in transition-colors duration-500 ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { getFavoritesByType } = useFavorites();
  const { statuses } = useDocumentStatus();

  const [profile, setProfile] = useState<AcademicProfile>(loadProfile);
  const [coverImage, setCoverImage] = useState<string | null>(loadCoverImage);
  const [editMode, setEditMode] = useState(false);

  const handleSave = (draft: AcademicProfile) => {
    setProfile(draft);
    saveProfile(draft);
    setEditMode(false);
  };

  const handleCoverImageChange = (dataUrl: string | null) => {
    setCoverImage(dataUrl);
    saveCoverImage(dataUrl);
  };

  const handleEditToggle = () => setEditMode(prev => !prev);

  const starredDocs = getFavoritesByType("document");
  const totalDocuments = Object.keys(statuses).length;

  const joinDate = useMemo(() => {
    const stored = localStorage.getItem("user-join-date");
    if (stored) return new Date(stored);
    const d = new Date();
    localStorage.setItem("user-join-date", d.toISOString());
    return d;
  }, []);

  const memberSince = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[joinDate.getMonth()]} ${joinDate.getFullYear()}`;
  }, [joinDate]);

  return (
    <PageShell>
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Profile Header */}
        <AnimatedSection delay={0}>
          <ProfileHeader
            userEmail={user?.email}
            profile={profile}
            memberSince={memberSince}
            starredCount={starredDocs.length}
            totalDocuments={totalDocuments}
            editMode={editMode}
            onEditToggle={handleEditToggle}
            coverImage={coverImage}
            onCoverImageChange={handleCoverImageChange}
          />
        </AnimatedSection>

        {/* Edit Profile Panel */}
        {editMode && (
          <AnimatedSection delay={50}>
            <ProfileEditForm
              profile={profile}
              onSave={handleSave}
              onCancel={() => setEditMode(false)}
            />
          </AnimatedSection>
        )}

        {/* Skills & Intent Cards */}
        <AnimatedSection delay={100}>
          <div className={`mb-8 grid gap-5 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <SkillsPanel />
            <IntentCards />
          </div>
        </AnimatedSection>

        {/* Document Status */}
        <AnimatedSection delay={200}>
          <DocumentStatusGrid />
        </AnimatedSection>

        {/* Contribution Graph */}
        <AnimatedSection delay={300}>
          <div className="mb-8">
            <ContributionGraph
              title={t("profile.contributions") || "Contribution Activity"}
              subtitle={t("profile.contributionsSubtitle") || "Your research activity over time"}
              colorScheme="green"
              weeks={52}
              showYearSelector
              showColorToggle
              projects={["My Research", "Theory Repo", "Reviews"]}
            />
          </div>
        </AnimatedSection>

        {/* Activity + Starred */}
        <AnimatedSection delay={400}>
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"} items-stretch`}>
            <div className="min-h-[520px] flex flex-col">
              <ActivityFeed
                title={t("profile.recentActivity") || "Recent Activity"}
                maxItems={20}
                compact={false}
                style={{ flex: 1, maxHeight: "520px", overflowY: "auto" }}
              />
            </div>
            <div className="min-h-[520px] flex flex-col">
              <StarredDocsList />
            </div>
          </div>
        </AnimatedSection>
      </div>
    </PageShell>
  );
}
