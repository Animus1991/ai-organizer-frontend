/**
 * ProfileHeader — LinkedIn / GitHub-style academic profile header
 * Cover banner · avatar upload · drag-drop cover · gradient presets · achievements
 * All data flows in via props — ProfilePage owns state.
 */
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserData } from "../../context/UserDataContext";
import { XPRing } from "./XPRing";
import { AchievementBadges } from "./AchievementBadges";
import {
  Upload, Palette, X, Camera, Pencil,
  Calendar, Globe, Hash, Image, Check
} from "lucide-react";

// ─── Cover gradient presets ─────────────────────────────────────────────
const COVER_GRADIENTS = [
  "linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(263 70% 50%) 45%, hsl(330 81% 60%) 100%)",
  "linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(213 47% 28%) 50%, hsl(217 91% 60%) 100%)",
  "linear-gradient(135deg, hsl(160 84% 15%) 0%, hsl(160 68% 21%) 40%, hsl(160 84% 39%) 100%)",
  "linear-gradient(135deg, hsl(244 55% 20%) 0%, hsl(244 47% 35%) 40%, hsl(239 84% 67%) 100%)",
  "linear-gradient(135deg, hsl(0 63% 31%) 0%, hsl(0 72% 43%) 45%, hsl(25 95% 53%) 100%)",
  "linear-gradient(135deg, hsl(202 80% 24%) 0%, hsl(202 89% 32%) 45%, hsl(199 89% 48%) 100%)",
  "linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(220 13% 26%) 50%, hsl(220 9% 46%) 100%)",
  "linear-gradient(135deg, hsl(293 74% 16%) 0%, hsl(293 75% 32%) 45%, hsl(292 91% 73%) 100%)",
];

const AVATAR_KEY = "academic-profile-avatar";
function loadAvatarImage(): string | null {
  try { return localStorage.getItem(AVATAR_KEY); } catch { return null; }
}
function saveAvatarImage(dataUrl: string | null) {
  try { if (dataUrl) localStorage.setItem(AVATAR_KEY, dataUrl); else localStorage.removeItem(AVATAR_KEY); } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────
export interface AcademicProfile {
  bio: string;
  institution: string;
  department: string;
  position: string;
  website: string;
  orcid: string;
  expertise: string[];
  researchInterests: string[];
  followers: number;
  following: number;
}

export interface ProfileHeaderProps {
  userEmail: string | null | undefined;
  profile: AcademicProfile;
  memberSince: string;
  starredCount: number;
  totalDocuments: number;
  editMode: boolean;
  onEditToggle: () => void;
  coverImage?: string | null;
  onCoverImageChange?: (dataUrl: string | null) => void;
}

// ─── Component ────────────────────────────────────────────────────────────
export function ProfileHeader({
  userEmail, profile, memberSince, starredCount, totalDocuments,
  editMode, onEditToggle, coverImage, onCoverImageChange,
}: ProfileHeaderProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { stats: userStats } = useUserData();

  // Avatar state
  const [avatarImage, setAvatarImage] = useState<string | null>(loadAvatarImage);
  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const r = ev.target?.result as string; setAvatarImage(r); saveAvatarImage(r); };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  // Cover drag-drop
  const [isDragging, setIsDragging] = useState(false);
  const [coverHovered, setCoverHovered] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const presetsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPresets) return;
    const handler = (e: MouseEvent) => { if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) setShowPresets(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPresets]);

  const handleCoverFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = ev => { onCoverImageChange?.(ev.target?.result as string); setSelectedPreset(null); };
    reader.readAsDataURL(file);
  }, [onCoverImageChange]);

  const handleCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCoverFile(file);
    e.target.value = "";
  }, [handleCoverFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCoverFile(file);
  }, [handleCoverFile]);

  const handlePresetSelect = useCallback((gradient: string) => {
    setSelectedPreset(gradient); onCoverImageChange?.(null); setShowPresets(false);
  }, [onCoverImageChange]);

  useEffect(() => {
    if (selectedPreset !== null) try { localStorage.setItem("academic-profile-cover-preset", selectedPreset); } catch {}
  }, [selectedPreset]);

  useEffect(() => {
    if (!coverImage) try { const stored = localStorage.getItem("academic-profile-cover-preset"); if (stored) setSelectedPreset(stored); } catch {}
  }, []);

  const coverBackground = coverImage
    ? `url(${coverImage}) center/cover no-repeat`
    : selectedPreset || COVER_GRADIENTS[0];

  const displayName = userEmail?.split("@")[0] || t("profile.researcher") || "Researcher";

  const statItems = useMemo(() => [
    { label: t("profile.followers") || "followers", value: userStats.followersCount || profile.followers },
    { label: t("profile.following") || "following", value: userStats.followingCount || profile.following },
    { label: t("nav.collections") || "collections", value: userStats.collectionsCreated },
    { label: t("profile.documents") || "documents", value: userStats.documentsUploaded || totalDocuments },
    { label: t("profile.starred") || "starred", value: starredCount },
  ], [userStats, profile, totalDocuments, starredCount, t]);

  return (
    <div className="mb-8">
      {/* Cover banner */}
      <div
        className="h-48 rounded-t-2xl relative overflow-visible transition-[filter] duration-200"
        style={{ background: coverBackground, filter: isDragging ? "brightness(1.15)" : "none" }}
        onMouseEnter={() => setCoverHovered(true)}
        onMouseLeave={() => setCoverHovered(false)}
        onDragOver={e => { e.preventDefault(); if (editMode) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={editMode ? handleDrop : undefined}
      >
        {coverImage && <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/30 rounded-t-2xl" />}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-t-2xl z-[5] bg-primary/20 border-2 border-dashed border-primary/60 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-primary-foreground">
              <Image className="w-8 h-8 mx-auto mb-1" />
              <div className="text-sm font-bold">Drop image to set cover</div>
            </div>
          </div>
        )}

        {/* Edit overlay */}
        {editMode && coverHovered && !isDragging && (
          <div className="absolute inset-0 rounded-t-2xl bg-black/40 z-[4] flex items-center justify-center gap-2.5 backdrop-blur-sm animate-in fade-in duration-150">
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white/20 border border-white/30 text-white cursor-pointer backdrop-blur-lg hover:bg-white/30 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {t("profile.uploadPhoto") || "Upload Photo"}
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>
            <button onClick={() => setShowPresets(v => !v)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-white/30 text-white cursor-pointer backdrop-blur-lg transition-colors
                ${showPresets ? "bg-primary/50" : "bg-white/20 hover:bg-white/30"}`}>
              <Palette className="w-3.5 h-3.5" />
              {t("profile.chooseGradient") || "Choose Gradient"}
            </button>
            {coverImage && (
              <button onClick={() => { onCoverImageChange?.(null); setSelectedPreset(null); try { localStorage.removeItem("academic-profile-cover-preset"); } catch {} }}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-bold bg-destructive/50 border border-white/25 text-white cursor-pointer backdrop-blur-lg hover:bg-destructive/70 transition-colors">
                <X className="w-3.5 h-3.5" />
                {t("profile.removeCover") || "Remove"}
              </button>
            )}
          </div>
        )}

        {/* Gradient presets panel */}
        {showPresets && editMode && (
          <div ref={presetsRef}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-popover/95 backdrop-blur-2xl border border-border rounded-xl p-3.5 shadow-2xl">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Cover Presets</div>
            <div className="flex gap-2 flex-wrap max-w-[280px]">
              {COVER_GRADIENTS.map((grad, i) => (
                <button key={i} onClick={() => handlePresetSelect(grad)} title={`Preset ${i + 1}`}
                  className={`w-[52px] h-8 rounded-lg cursor-pointer p-0 outline-none transition-transform hover:scale-110
                    ${selectedPreset === grad ? "border-[2.5px] border-primary" : "border-2 border-border"}`}
                  style={{ background: grad }} />
              ))}
            </div>
          </div>
        )}

        {/* Drag hint */}
        {!editMode && coverHovered && (
          <div className="absolute bottom-2.5 left-3.5 z-[3] px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/45 text-white/70 backdrop-blur-md border border-white/15 pointer-events-none flex items-center gap-1">
            <Pencil className="w-2.5 h-2.5" />
            {t("profile.editToChangeCover") || "Edit profile to change cover"}
          </div>
        )}
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border border-t-0 rounded-b-2xl px-7 pb-6 pt-2 relative z-[1]">
        {/* Avatar + actions */}
        <div className="flex justify-between items-end mb-4 flex-wrap gap-3">
          {/* Avatar */}
          <div className="relative -mt-[52px] flex-shrink-0">
            <XPRing />
            <div
              className="w-[100px] h-[100px] rounded-full flex items-center justify-center text-[40px] font-bold text-primary-foreground border-4 border-background shadow-lg overflow-hidden relative"
              style={{
                background: avatarImage
                  ? `url(${avatarImage}) center/cover no-repeat`
                  : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              }}
            >
              {!avatarImage && (userEmail || "U").charAt(0).toUpperCase()}
              {editMode && (
                <label
                  className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity text-[10px] text-white font-bold gap-0.5"
                  title="Upload avatar"
                >
                  <Camera className="w-5 h-5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              )}
            </div>
            {editMode && avatarImage && (
              <button
                onClick={() => { setAvatarImage(null); saveAvatarImage(null); }}
                title="Remove avatar"
                aria-label="Remove avatar"
                className="absolute -top-0.5 -right-0.5 w-[22px] h-[22px] rounded-full bg-destructive border-2 border-background text-destructive-foreground cursor-pointer flex items-center justify-center z-[2] p-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {/* Online dot */}
            <div className="absolute bottom-[5px] right-[3px] w-4 h-4 rounded-full bg-success border-[2.5px] border-background z-[2]" title="Online" />
          </div>

          {/* Edit action */}
          <div className="pb-1">
            <button
              onClick={onEditToggle}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border cursor-pointer transition-all flex items-center gap-1.5
                ${editMode
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-card text-foreground hover:bg-muted/50"
                }`}
            >
              {editMode
                ? <><Check className="w-3.5 h-3.5" />Done</>
                : <><Pencil className="w-3.5 h-3.5" />{t("profile.editProfile") || "Edit Profile"}</>
              }
            </button>
          </div>
        </div>

        {/* Name + position */}
        <h1 className="m-0 mb-0.5 text-2xl font-extrabold text-foreground">{displayName}</h1>
        {profile.position && (
          <p className="m-0 mb-0.5 text-sm text-muted-foreground font-medium">
            {profile.position}
            {profile.institution ? ` · ${profile.institution}` : ""}
            {profile.department ? ` · ${profile.department}` : ""}
          </p>
        )}
        <p className="m-0 mb-3 text-sm text-muted-foreground">{userEmail || ""}</p>

        {/* Bio */}
        {profile.bio && (
          <p className="m-0 mb-3.5 text-sm text-muted-foreground leading-relaxed max-w-[680px]">{profile.bio}</p>
        )}

        {/* Meta row */}
        <div className="flex gap-4 flex-wrap text-sm text-muted-foreground mb-3.5 items-center">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {t("profile.memberSince") || "Member since"} {memberSince}
          </span>
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="text-primary no-underline flex items-center gap-1 hover:underline">
              <Globe className="w-3.5 h-3.5" /> {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          {profile.orcid && (
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> {profile.orcid}
            </span>
          )}
        </div>

        {/* Social stats */}
        <div className="flex gap-5 flex-wrap text-sm text-muted-foreground mb-4">
          {statItems.map((s, i) => (
            <span key={s.label} className="flex items-center gap-1 transition-all duration-200 hover:text-foreground cursor-default group">
              <strong className="text-foreground font-bold transition-transform duration-200 group-hover:scale-110">{s.value}</strong> {s.label}
            </span>
          ))}
        </div>

        {/* Expertise tags */}
        {profile.expertise.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {profile.expertise.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium bg-primary/10 text-primary border border-primary/20
                transition-all duration-200 hover:scale-105 hover:shadow-sm hover:bg-primary/15 cursor-default">{tag}</span>
            ))}
          </div>
        )}

        {/* Research interests */}
        {profile.researchInterests.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {profile.researchInterests.map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium bg-success/10 text-success border border-success/20
                transition-all duration-200 hover:scale-105 hover:shadow-sm hover:bg-success/15 cursor-default">{tag}</span>
            ))}
          </div>
        )}

        {/* Achievements */}
        <AchievementBadges starredCount={starredCount} />
      </div>
    </div>
  );
}
