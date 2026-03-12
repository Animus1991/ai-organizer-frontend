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

  const completenessScore = useMemo(() => {
    let pts = 0;
    if (profile.bio)                           pts += 15;
    if (profile.institution)                   pts += 15;
    if (profile.department)                    pts += 10;
    if (profile.position)                      pts += 10;
    if (profile.website)                       pts += 10;
    if (profile.orcid)                         pts += 10;
    if ((profile.expertise ?? []).length > 0)          pts += 15;
    if ((profile.researchInterests ?? []).length > 0)  pts += 15;
    return pts;
  }, [profile]);

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

        {/* ── Profile Completeness Bar ── */}
        {!editMode && (
          <AnimatedSection delay={20}>
            <div style={{
              padding: "14px 20px",
              background: "hsl(var(--card))",
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}>
                  {t("profile.completeness") || "Profile Completeness"}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: completenessScore === 100
                    ? "hsl(var(--success))"
                    : completenessScore > 60 ? "hsl(var(--primary))" : "hsl(var(--warning))",
                }}>
                  {completenessScore}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "hsl(var(--muted))", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  width: `${completenessScore}%`,
                  background: completenessScore === 100
                    ? "hsl(var(--success))"
                    : completenessScore > 60 ? "hsl(var(--primary))" : "hsl(var(--warning))",
                  transition: "width 0.9s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              {completenessScore < 100 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                    {completenessScore < 60
                      ? (t("profile.completenessLow") || "Complete your profile to increase visibility in the research community.")
                      : (t("profile.completenessHigh") || "Almost there! Fill in the remaining fields to maximise your profile.")}
                  </p>
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      flexShrink: 0, marginLeft: 12,
                      padding: "5px 12px", borderRadius: 999,
                      border: "1px solid hsl(var(--primary) / 0.4)",
                      background: "hsl(var(--primary) / 0.1)",
                      color: "hsl(var(--primary))",
                      fontSize: 11, fontWeight: 700,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    Complete →
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

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
