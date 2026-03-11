/**
 * HomeStoriesStrip — Platform Shorts / Reels / Stories feed
 * Displays user-generated micro-content: research snapshots, project updates,
 * key findings, and paper highlights in a horizontally scrollable story format.
 * Fully localStorage-backed, no backend required.
 *
 * v2 upgrades:
 *  - Animated gradient ring on unseen stories (Instagram-style)
 *  - Seen/unseen tracking (ring turns grey when viewed)
 *  - Story expiry: posts > 24h are visually faded
 *  - Delete own stories (with confirmation)
 *  - Share / copy-link action in viewer
 *  - Comment count on card (cosmetic, increments in viewer)
 *  - Progress bar auto-advance in viewer
 *  - Keyboard navigation in viewer (← →, Escape)
 */
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserData } from "../../context/UserDataContext";
import { SegmentedControl } from "../ui/SegmentedControl";
import {
  FlaskConical, Megaphone, HelpCircle, Trophy, Lightbulb, FileText, Rocket,
  Play, Heart, MessageCircle, Eye, Link2, Trash2, Clock3, Inbox, Plus, Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoryCategory = "finding" | "update" | "question" | "milestone" | "tip" | "paper";

interface Story {
  id: string;
  authorName: string;
  authorInitial: string;
  authorColor: string;
  category: StoryCategory;
  title: string;
  body: string;
  tags: string[];
  likes: number;
  views: number;
  comments: number;
  createdAt: number;
  expiresAt: number;
  isOwn?: boolean;
}

const CATEGORY_CONFIG: Record<StoryCategory, { Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; tokenColor: string; labelKey: string; fallbackLabel: string }> = {
  finding:   { Icon: FlaskConical, tokenColor: "var(--primary)",     labelKey: "home.stories.category.finding",   fallbackLabel: "Finding" },
  update:    { Icon: Megaphone,    tokenColor: "var(--success)",     labelKey: "home.stories.category.update",    fallbackLabel: "Update" },
  question:  { Icon: HelpCircle,   tokenColor: "var(--warning)",     labelKey: "home.stories.category.question",  fallbackLabel: "Question" },
  milestone: { Icon: Trophy,       tokenColor: "var(--destructive)", labelKey: "home.stories.category.milestone", fallbackLabel: "Milestone" },
  tip:       { Icon: Lightbulb,    tokenColor: "var(--info)",        labelKey: "home.stories.category.tip",       fallbackLabel: "Tip" },
  paper:     { Icon: FileText,     tokenColor: "var(--accent)",      labelKey: "home.stories.category.paper",     fallbackLabel: "Paper" },
};

const AUTHOR_COLORS = [
  "hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))",
  "hsl(var(--info))", "hsl(var(--accent))", "hsl(var(--ring))", "hsl(var(--muted-foreground))",
];
const STORY_TTL = 86400000 * 7; // 7 days before fully expired; fade after 24h
const STORY_FILTER_KEY = "home-stories-filter";

const SAMPLE_STORIES: Story[] = [
  {
    id: "s1", authorName: "Dr. Elena Vasquez", authorInitial: "E", authorColor: "hsl(var(--primary))",
    category: "finding", title: "BERT outperforms TF-IDF on domain-specific corpora",
    body: "Tested 3 embedding models on biomedical texts. BERT-based models show 23% higher retrieval precision on specialist queries vs. classic TF-IDF baselines.",
    tags: ["NLP", "Biomedical", "IR"], likes: 14, views: 87, comments: 5,
    createdAt: Date.now() - 3600000 * 2, expiresAt: Date.now() - 3600000 * 2 + STORY_TTL,
  },
  {
    id: "s2", authorName: "Nikos Papadopoulos", authorInitial: "N", authorColor: "hsl(var(--success))",
    category: "milestone", title: "MVP submitted to TechCrunch Disrupt 2026!",
    body: "After 6 months of development our climate-tech startup has submitted its MVP application. Fingers crossed! 🌍",
    tags: ["Startup", "Climate", "Milestone"], likes: 31, views: 204, comments: 12,
    createdAt: Date.now() - 3600000 * 5, expiresAt: Date.now() - 3600000 * 5 + STORY_TTL,
  },
  {
    id: "s3", authorName: "Sarah Chen", authorInitial: "S", authorColor: "hsl(var(--warning))",
    category: "question", title: "Best framework for federated learning on edge devices?",
    body: "Comparing PySyft vs Flower vs TensorFlow Federated for a privacy-preserving health app. Anyone have production experience?",
    tags: ["Federated Learning", "Edge AI", "Privacy"], likes: 9, views: 56, comments: 8,
    createdAt: Date.now() - 3600000 * 8, expiresAt: Date.now() - 3600000 * 8 + STORY_TTL,
  },
  {
    id: "s4", authorName: "Marco Rossi", authorInitial: "M", authorColor: "hsl(var(--destructive))",
    category: "paper", title: "New preprint: Attention Mechanisms in Multi-Modal Fusion",
    body: "Our paper on cross-modal attention for vision-language models is now on arXiv. Achieves SOTA on VQA-v2 with 40% fewer parameters.",
    tags: ["Preprint", "Vision-Language", "Attention"], likes: 22, views: 143, comments: 17,
    createdAt: Date.now() - 86400000, expiresAt: Date.now() - 86400000 + STORY_TTL,
  },
  {
    id: "s5", authorName: "Aisha Osei", authorInitial: "A", authorColor: "hsl(var(--info))",
    category: "tip", title: "Use contrastive loss to improve embedding quality",
    body: "Adding a contrastive loss term to your document encoder improves cluster separation by ~18% on average. Simple trick, huge gain.",
    tags: ["Embeddings", "Contrastive Learning", "Tip"], likes: 18, views: 112, comments: 3,
    createdAt: Date.now() - 86400000 * 2, expiresAt: Date.now() - 86400000 * 2 + STORY_TTL,
  },
  {
    id: "s6", authorName: "James Wright", authorInitial: "J", authorColor: "hsl(var(--accent))",
    category: "update", title: "Series A closing — looking for CTO co-founder",
    body: "We're closing our Series A next month. Looking for a technical co-founder with ML infra experience. Equity + salary. Remote-first.",
    tags: ["Co-founder", "Series A", "ML"], likes: 7, views: 64, comments: 2,
    createdAt: Date.now() - 86400000 * 3, expiresAt: Date.now() - 86400000 * 3 + STORY_TTL,
  },
];

const STORAGE_KEY = "platform-stories-v1";
const LIKES_KEY = "platform-stories-likes-v1";
const SEEN_KEY = "platform-stories-seen-v1";

// Migrate legacy story objects that lack new fields
function migrateStory(s: Partial<Story> & { id: string; createdAt: number }): Story {
  return {
    comments: 0,
    expiresAt: s.createdAt + STORY_TTL,
    ...s,
  } as Story;
}

function loadStories(): Story[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_STORIES;
    const parsed: Story[] = (JSON.parse(raw) as Partial<Story>[]).map(s =>
      migrateStory(s as Partial<Story> & { id: string; createdAt: number })
    );
    return parsed;
  } catch { return SAMPLE_STORIES; }
}

function saveStories(stories: Story[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stories)); } catch {}
}

function loadLikes(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveLikes(likes: Set<string>) {
  try { localStorage.setItem(LIKES_KEY, JSON.stringify([...likes])); } catch {}
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSeen(seen: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch {}
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

function isExpired(story: Story): boolean {
  return Date.now() > story.expiresAt;
}

function isOld(story: Story): boolean {
  return Date.now() - story.createdAt > 86400000; // > 24h → faded ring
}

// Inject CSS animation for gradient ring once
let _ringCssInjected = false;
function injectRingCss() {
  if (_ringCssInjected || typeof document === "undefined") return;
  _ringCssInjected = true;
  const style = document.createElement("style");
  style.id = "stories-ring-anim";
  style.textContent = `
    @keyframes storyRingSpin {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .story-ring-new {
      background: linear-gradient(270deg, hsl(var(--primary)), hsl(var(--destructive)), hsl(var(--warning)), hsl(var(--success)), hsl(var(--primary)));
      background-size: 300% 300%;
      animation: storyRingSpin 3s ease infinite;
    }
    @keyframes storyFadeIn {
      from { opacity: 0; transform: scale(0.97) translateY(6px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Create Story Modal ────────────────────────────────────────────────────────

type CreateStoryData = Omit<Story, "id" | "likes" | "views" | "comments" | "createdAt" | "expiresAt" | "isOwn">;

interface CreateModalProps {
  onClose: () => void;
  onSubmit: (story: CreateStoryData) => void;
  authorInitial: string;
  authorColor: string;
  authorName: string;
  isDark: boolean;
  getCategoryLabel: (cat: StoryCategory) => string;
}

function CreateStoryModal({ onClose, onSubmit, authorInitial, authorColor, authorName, isDark, getCategoryLabel }: CreateModalProps) {
  const [category, setCategory] = useState<StoryCategory>("finding");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");

  const tags = useMemo(() =>
    tagInput.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5),
    [tagInput]
  );

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 13px", borderRadius: "var(--radius)",
    border: `1px solid hsl(var(--border))`,
    background: `hsl(var(--muted) / ${isDark ? 0.5 : 0.7})`,
    color: "hsl(var(--foreground))", fontSize: "13px",
    boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "hsl(var(--background) / 0.65)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "hsl(var(--card))",
        borderRadius: "var(--radius)", padding: "28px",
        width: "100%", maxWidth: "520px",
        border: `1px solid hsl(var(--border))`,
        boxShadow: isDark ? "0 24px 80px hsl(var(--background) / 0.7)" : "0 24px 80px hsl(var(--foreground) / 0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: authorColor, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "18px", color: "hsl(var(--primary-foreground))", fontWeight: 700,
          }}>{authorInitial}</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "hsl(var(--foreground))" }}>{authorName}</div>
            <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>Share with the community</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "hsl(var(--muted-foreground))", lineHeight: 1 }}>×</button>
        </div>

        {/* Category selector */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
          {(Object.keys(CATEGORY_CONFIG) as StoryCategory[]).map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const active = category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding: "5px 11px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                border: `1px solid ${active ? `hsl(${cfg.tokenColor} / 0.4)` : "hsl(var(--border))"}`,
                background: active ? `hsl(${cfg.tokenColor} / 0.1)` : "transparent",
                color: active ? `hsl(${cfg.tokenColor})` : "hsl(var(--muted-foreground))", cursor: "pointer",
                transition: "all 0.15s",
                display: "inline-flex", alignItems: "center", gap: "4px",
              }}>
                <cfg.Icon style={{ width: 12, height: 12 }} /> {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title — what's the key insight?"
          style={{ ...inputSt, marginBottom: "10px", fontWeight: 600 }}
          maxLength={120}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your finding, question, tip, or update in 2–4 sentences..."
          rows={4}
          style={{ ...inputSt, resize: "vertical", marginBottom: "10px" }}
          maxLength={500}
        />
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          placeholder="Tags (comma-separated): NLP, Startup, Climate..."
          style={{ ...inputSt, marginBottom: "18px" }}
        />
        {tags.length > 0 && (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "14px", marginTop: "-6px" }}>
            {tags.map(tag => (
              <span key={tag} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
                background: `hsl(var(--muted) / ${isDark ? 0.4 : 0.7})`,
                color: "hsl(var(--muted-foreground))", border: `1px solid hsl(var(--border))` }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => {
              if (!title.trim() || !body.trim()) return;
              onSubmit({ authorName, authorInitial, authorColor, category, title: title.trim(), body: body.trim(), tags } as CreateStoryData);
              onClose();
            }}
            disabled={!title.trim() || !body.trim()}
            style={{
              flex: 1, padding: "11px", borderRadius: "10px", border: "none",
              background: title.trim() && body.trim()
                ? "hsl(var(--primary))"
                : "hsl(var(--muted))",
              color: title.trim() && body.trim() ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              fontWeight: 700, fontSize: "14px", cursor: title.trim() && body.trim() ? "pointer" : "default",
              transition: "all 0.18s",
              display: "inline-flex", alignItems: "center", gap: "6px",
            }}
          >
            <Rocket style={{ width: 14, height: 14 }} /> Post Story
          </button>
          <button onClick={onClose} style={{
            padding: "11px 18px", borderRadius: "var(--radius)",
            border: `1px solid hsl(var(--border))`, background: "transparent",
            color: "hsl(var(--muted-foreground))", fontSize: "13px", cursor: "pointer",
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Story Viewer Modal ───────────────────────────────────────────────────────

const VIEWER_DURATION = 12000; // ms before auto-advance

interface ViewerProps {
  stories: Story[];
  startIndex: number;
  likedIds: Set<string>;
  onLike: (id: string) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  isDark: boolean;
  getCategoryLabel: (cat: StoryCategory) => string;
}

function StoryViewer({ stories, startIndex, likedIds, onLike, onClose, onDelete, isDark, getCategoryLabel }: ViewerProps) {
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const story = stories[idx];
  const cfg = story ? CATEGORY_CONFIG[story.category] : null;
  const liked = story ? likedIds.has(story.id) : false;
  const categoryLabel = story && cfg ? getCategoryLabel(story.category) : "";

  const goNext = useCallback(() => {
    if (idx < stories.length - 1) { setIdx(i => i + 1); setProgress(0); }
    else onClose();
  }, [idx, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (idx > 0) { setIdx(i => i - 1); setProgress(0); }
  }, [idx]);

  // Auto-advance progress bar
  useEffect(() => {
    setProgress(0);
    const step = 100 / (VIEWER_DURATION / 100);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { goNext(); return 0; }
        return p + step;
      });
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [idx, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, onClose]);

  const handleShare = useCallback(() => {
    const text = story ? `"${story.title}" — ${story.authorName} on Think!Hub` : "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [story]);

  if (!story || !cfg) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "hsl(var(--background) / 0.82)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "20px",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "hsl(var(--card))",
        borderRadius: "var(--radius)",
        width: "100%", maxWidth: "560px",
        border: `1px solid hsl(var(--border))`,
        boxShadow: isDark ? "0 24px 80px hsl(var(--background) / 0.7)" : "0 24px 80px hsl(var(--foreground) / 0.15)",
        position: "relative", overflow: "hidden",
        animation: "storyFadeIn 0.2s ease",
      }}>
        {/* Progress bars */}
        <div style={{ display: "flex", gap: "3px", padding: "10px 12px 0", position: "relative", zIndex: 2 }}>
          {stories.map((s, i) => (
            <div key={s.id} style={{
              flex: 1, height: "3px", borderRadius: "2px",
              background: `hsl(var(--muted))`,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: "2px",
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--destructive)))",
                width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%",
                transition: i === idx ? "none" : "width 0.15s",
              }} />
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 24px 24px" }}>
          {/* Author row + close */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: story.authorColor, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "16px", color: "hsl(var(--primary-foreground))", fontWeight: 700, flexShrink: 0,
            }}>{story.authorInitial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{story.authorName}</div>
              <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>{timeAgo(story.createdAt)}</div>
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
              background: `hsl(${cfg.tokenColor} / 0.1)`, border: `1px solid hsl(${cfg.tokenColor} / 0.25)`,
              color: `hsl(${cfg.tokenColor})`, flexShrink: 0,
            }}>
              <cfg.Icon style={{ width: 10, height: 10 }} /> {categoryLabel}
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "22px", color: "hsl(var(--muted-foreground))", lineHeight: 1, padding: "0 0 0 4px",
            }}>×</button>
          </div>

          <h2 style={{ margin: "0 0 10px", fontSize: "19px", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1.3 }}>
            {story.title}
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "14px", color: "hsl(var(--muted-foreground))", lineHeight: 1.7 }}>
            {story.body}
          </p>

          {story.tags.length > 0 && (
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "16px" }}>
              {story.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: "11px", padding: "3px 9px", borderRadius: "10px",
                  background: `hsl(var(--muted) / ${isDark ? 0.4 : 0.7})`,
                  color: "hsl(var(--muted-foreground))", border: `1px solid hsl(var(--border))`,
                }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderTop: `1px solid hsl(var(--border))`, paddingTop: "14px", flexWrap: "wrap" }}>
            <button onClick={() => onLike(story.id)} style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "6px 13px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
              border: `1px solid ${liked ? "hsl(var(--destructive) / 0.4)" : "hsl(var(--border))"}`,
              background: liked ? "hsl(var(--destructive) / 0.12)" : "transparent",
              color: liked ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))", cursor: "pointer",
              transition: "all 0.18s",
            }}>
              <Heart style={{ width: 13, height: 13, fill: liked ? "currentColor" : "none" }} /> {story.likes + (liked ? 1 : 0)}
            </button>

            <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "4px" }}>
              <MessageCircle style={{ width: 12, height: 12 }} /> {story.comments}
            </span>

            <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "4px" }}>
              <Eye style={{ width: 12, height: 12 }} /> {story.views}
            </span>

            <button onClick={handleShare} style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "6px 13px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
              border: `1px solid hsl(var(--border))`,
              background: copied ? "hsl(var(--success) / 0.12)" : "transparent",
              color: copied ? "hsl(var(--success))" : "hsl(var(--muted-foreground))", cursor: "pointer",
              transition: "all 0.18s", marginLeft: "auto",
            }}>
              {copied ? <Check style={{ width: 12, height: 12 }} /> : <Link2 style={{ width: 12, height: 12 }} />} {copied ? "Copied!" : "Share"}
            </button>

            {onDelete && story.isOwn && (
              <button onClick={() => { onDelete(story.id); onClose(); }} style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "6px 11px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                border: "1px solid hsl(var(--destructive) / 0.35)",
                background: "hsl(var(--destructive) / 0.08)",
                color: "hsl(var(--destructive))", cursor: "pointer",
                transition: "all 0.18s",
              }}>
                <Trash2 style={{ width: 12, height: 12 }} /> Delete
              </button>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <button onClick={goPrev} disabled={idx === 0} style={{
              padding: "6px 16px", borderRadius: "var(--radius)", fontSize: "12px", fontWeight: 600,
              border: `1px solid hsl(var(--border))`, background: "transparent",
              color: idx === 0 ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
              cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.35 : 1,
              transition: "all 0.15s",
            }}>‹ Prev</button>
            <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", alignSelf: "center" }}>
              {idx + 1} / {stories.length}
            </span>
            <button onClick={goNext} style={{
              padding: "6px 16px", borderRadius: "var(--radius)", fontSize: "12px", fontWeight: 600,
              border: `1px solid hsl(var(--border))`, background: "transparent",
              color: "hsl(var(--foreground))", cursor: "pointer",
              transition: "all 0.15s",
            }}>{idx === stories.length - 1 ? "Done ✓" : "Next ›"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HomeStoriesStrip() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { stats } = useUserData();

  // Inject ring animation CSS once on mount
  useEffect(() => { injectRingCss(); }, []);

  const [stories, setStories] = useState<Story[]>(loadStories);
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLikes);
  const [seenIds, setSeenIds] = useState<Set<string>>(loadSeen);
  const [showCreate, setShowCreate] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState<StoryCategory | "all">(() => {
    const fromStorage = localStorage.getItem(STORY_FILTER_KEY) as StoryCategory | "all" | null;
    if (!fromStorage) return "all";
    return (fromStorage === "all" || (Object.keys(CATEGORY_CONFIG) as StoryCategory[]).includes(fromStorage as StoryCategory))
      ? fromStorage
      : "all";
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORY_FILTER_KEY, filterCat);
    } catch {/* ignore */}
  }, [filterCat]);

  const getCategoryLabel = useCallback((cat: StoryCategory) => {
    const cfg = CATEGORY_CONFIG[cat];
    return t(cfg.labelKey) || cfg.fallbackLabel;
  }, [t]);

  const activeStories = useMemo(() =>
    stories.filter(s => !isExpired(s)),
    [stories]
  );

  const categoryCounts = useMemo(() => {
    return activeStories.reduce((acc, story) => {
      acc[story.category] = (acc[story.category] || 0) + 1;
      return acc;
    }, {} as Record<StoryCategory, number>);
  }, [activeStories]);

  const categoryOptions = useMemo(() => {
    const total = activeStories.length;
    const base = [
      {
        value: "all" as const,
        label: t("home.stories.filterAll") || "All",
        badge: total || undefined,
      },
    ];
    const rest = (Object.keys(CATEGORY_CONFIG) as StoryCategory[]).map((cat) => {
      const cfg = CATEGORY_CONFIG[cat];
      const badge = categoryCounts[cat] || 0;
      return {
        value: cat,
        label: (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <cfg.Icon style={{ width: 12, height: 12 }} />
            {getCategoryLabel(cat)}
          </span>
        ),
        badge: badge || undefined,
        disabled: badge === 0,
      };
    });
    return [...base, ...rest];
  }, [t, activeStories.length, categoryCounts, getCategoryLabel]);

  const userInitial = useMemo(() => {
    const email = localStorage.getItem("user-email") || "Y";
    return email.charAt(0).toUpperCase();
  }, []);
  const userColor = AUTHOR_COLORS[stats.documentsUploaded % AUTHOR_COLORS.length];
  const userName = useMemo(() => {
    const email = localStorage.getItem("user-email") || "";
    return email.split("@")[0] || "You";
  }, []);

  // Filter out fully expired stories (> 7 days old)
  const filtered = useMemo(() => {
    if (filterCat === "all") return activeStories;
    return activeStories.filter(s => s.category === filterCat);
  }, [activeStories, filterCat]);

  const handleCreate = useCallback((data: CreateStoryData) => {
    const now = Date.now();
    const newStory: Story = {
      ...data,
      id: `story-${now}`,
      likes: 0, views: 0, comments: 0,
      createdAt: now, expiresAt: now + STORY_TTL,
      isOwn: true,
    };
    const updated = [newStory, ...stories];
    setStories(updated);
    saveStories(updated);
  }, [stories]);

  const handleLike = useCallback((storyId: string) => {
    const next = new Set(likedIds);
    if (next.has(storyId)) next.delete(storyId);
    else next.add(storyId);
    setLikedIds(next);
    saveLikes(next);
  }, [likedIds]);

  const handleDelete = useCallback((storyId: string) => {
    const updated = stories.filter(s => s.id !== storyId);
    setStories(updated);
    saveStories(updated);
  }, [stories]);

  const handleView = useCallback((story: Story, indexInFiltered: number) => {
    // Mark as seen
    const nextSeen = new Set(seenIds);
    nextSeen.add(story.id);
    setSeenIds(nextSeen);
    saveSeen(nextSeen);
    // Increment view count
    const updated = stories.map(s =>
      s.id === story.id ? { ...s, views: s.views + 1 } : s
    );
    setStories(updated);
    saveStories(updated);
    setViewerIndex(indexInFiltered);
  }, [stories, seenIds]);

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div>
      {/* Scroll area (stories cards) comes first */}

      {/* Scroll area */}
      <div style={{ position: "relative" }}>
        {/* Left scroll arrow */}
        <button onClick={() => scrollBy(-1)} style={{
          position: "absolute", left: "-12px", top: "50%", transform: "translateY(-50%)",
          zIndex: 3, width: "28px", height: "28px", borderRadius: "50%",
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          boxShadow: isDark ? "0 2px 8px hsl(var(--background) / 0.6)" : "0 2px 8px hsl(var(--foreground) / 0.1)",
          color: "hsl(var(--muted-foreground))", fontSize: "13px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>‹</button>

        <div ref={scrollRef} style={{
          display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "8px",
          paddingLeft: "40px",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}>
          {/* ── "Your Story" add card ── */}
          <button onClick={() => setShowCreate(true)} style={{
            flexShrink: 0, width: "140px", height: "264px",
            borderRadius: "var(--radius)", border: `2px dashed hsl(var(--primary) / 0.3)`,
            background: `hsl(var(--primary) / ${isDark ? 0.06 : 0.03})`,
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.6)"; e.currentTarget.style.background = `hsl(var(--primary) / ${isDark ? 0.12 : 0.07})`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.3)"; e.currentTarget.style.background = `hsl(var(--primary) / ${isDark ? 0.06 : 0.03})`; }}
          >
            <div style={{
              width: "44px", height: "44px", borderRadius: "50%", background: userColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", color: "hsl(var(--primary-foreground))", fontWeight: 700, position: "relative",
            }}>
              {userInitial}
              <div style={{
                position: "absolute", bottom: "-2px", right: "-2px",
                width: "18px", height: "18px", borderRadius: "50%",
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "hsl(var(--primary-foreground))",
                border: `2px solid hsl(var(--card))`,
              }}><Plus style={{ width: 10, height: 10 }} /></div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "hsl(var(--primary))" }}>
              {t("home.addStory") || "Add Story"}
            </span>
          </button>

          {/* ── Story cards ── */}
          {filtered.map((story, filteredIdx) => {
            const cfg = CATEGORY_CONFIG[story.category];
            const isLiked = likedIds.has(story.id);
            const isSeen = seenIds.has(story.id);
            const old = isOld(story);
            return (
              <div
                key={story.id}
                onClick={() => handleView(story, filteredIdx)}
                style={{
                  flexShrink: 0, width: "200px", height: "264px",
                  borderRadius: "var(--radius)", cursor: "pointer", position: "relative",
                  overflow: "hidden",
                  background: "hsl(var(--card))",
                  border: `1px solid hsl(var(--border))`,
                  transition: "all 0.2s ease",
                  display: "flex", flexDirection: "column", padding: "12px",
                  opacity: old ? 0.65 : 1,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 26px hsl(var(--foreground) / 0.12)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `hsl(${cfg.tokenColor})`,
                  opacity: isDark ? 0.7 : 0.55,
                }} />

                {/* "Old" expiry indicator */}
                {old && (
                  <div style={{
                    position: "absolute", top: "6px", right: "6px",
                    fontSize: "9px", color: "hsl(var(--muted-foreground))",
                    background: `hsl(var(--card) / 0.9)`,
                    padding: "1px 5px", borderRadius: "8px",
                    border: `1px solid hsl(var(--border))`,
                    display: "inline-flex", alignItems: "center", gap: "3px",
                  }}><Clock3 style={{ width: 10, height: 10 }} /> old</div>
                )}

                {/* Author with animated ring */}
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
                  {/* Ring wrapper */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {/* Animated gradient ring (unseen + fresh) OR grey ring (seen/old) */}
                    <div
                      className={(!isSeen && !old) ? "story-ring-new" : undefined}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: (isSeen || old)
                          ? "hsl(var(--muted-foreground) / 0.3)"
                          : undefined,
                        padding: "2px", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <div style={{
                        width: "26px", height: "26px", borderRadius: "50%",
                        background: story.authorColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", color: "hsl(var(--primary-foreground))", fontWeight: 700,
                        border: `2px solid hsl(var(--card))`,
                      }}>{story.authorInitial}</div>
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {story.authorName.split(" ")[0]}
                    </div>
                    <div style={{ fontSize: "9px", color: "hsl(var(--muted-foreground))" }}>{timeAgo(story.createdAt)}</div>
                  </div>
                  {/* Category icon pill */}
                  <div style={{
                    marginLeft: "auto", fontSize: "10px", padding: "1px 6px",
                    borderRadius: "8px", background: `hsl(${cfg.tokenColor} / 0.1)`,
                    color: `hsl(${cfg.tokenColor})`, fontWeight: 700, flexShrink: 0,
                    display: "inline-flex", alignItems: "center",
                  }}><cfg.Icon style={{ width: 10, height: 10 }} /></div>
                </div>

                {/* Title */}
                <p style={{
                  margin: 0, fontSize: "12px", fontWeight: 700, color: "hsl(var(--foreground))",
                  lineHeight: 1.35, flex: 1, overflow: "hidden",
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
                }}>
                  {story.title}
                </p>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "nowrap" }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleLike(story.id); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "10px", color: isLiked ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
                      display: "flex", alignItems: "center", gap: "4px", padding: 0,
                      fontWeight: 600, transition: "color 0.15s",
                    }}
                  >
                    <Heart style={{ width: 11, height: 11, fill: isLiked ? "currentColor" : "none" }} /> {story.likes + (isLiked ? 1 : 0)}
                  </button>
                  <span style={{ fontSize: "10px", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MessageCircle style={{ width: 10, height: 10 }} /> {story.comments}
                  </span>
                  <span style={{ fontSize: "9px", color: "hsl(var(--muted-foreground))", marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Eye style={{ width: 10, height: 10 }} /> {story.views}
                  </span>
                </div>

                {/* Delete button for own stories */}
                {story.isOwn && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (window.confirm("Delete this story?")) handleDelete(story.id);
                    }}
                    title="Delete story"
                    style={{
                      position: "absolute", top: "6px", left: "6px",
                      width: "18px", height: "18px", borderRadius: "50%",
                      background: "hsl(var(--destructive) / 0.75)", border: "none",
                      color: "hsl(var(--destructive-foreground))", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: 0.75, transition: "opacity 0.15s",
                      padding: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; }}
                    onFocus={e => { e.currentTarget.style.opacity = "1"; }}
                    onBlur={e => { e.currentTarget.style.opacity = "0.75"; }}
                  ><Trash2 style={{ width: 10, height: 10 }} /></button>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{
              flexShrink: 0, width: "260px", minHeight: "190px",
              borderRadius: "var(--radius)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "10px",
              border: `1px dashed hsl(var(--border))`,
              color: "hsl(var(--muted-foreground))", fontSize: "12px",
              padding: "18px",
              textAlign: "center" as const,
            }}>
              <Inbox style={{ width: 24, height: 24, color: 'hsl(var(--muted-foreground))' }} />
              <strong style={{ color: "hsl(var(--foreground))" }}>
                {t("home.stories.emptyTitle") || "No stories in this filter"}
              </strong>
              <p style={{ margin: 0, fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>
                {t("home.stories.emptySubtitle") || "Share your milestone or insight to start this channel."}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius)",
                  border: "none",
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                  color: "hsl(var(--primary-foreground))",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 18px hsl(var(--primary) / 0.25)",
                }}
              >
                {t("home.stories.startStory") || "Start a story"}
              </button>
            </div>
          )}
        </div>

        {/* Right scroll arrow */}
        <button onClick={() => scrollBy(1)} style={{
          position: "absolute", right: "-12px", top: "50%", transform: "translateY(-50%)",
          zIndex: 3, width: "28px", height: "28px", borderRadius: "50%",
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          boxShadow: isDark ? "0 2px 8px hsl(var(--background) / 0.6)" : "0 2px 8px hsl(var(--foreground) / 0.1)",
          color: "hsl(var(--muted-foreground))", fontSize: "13px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>›</button>
      </div>

      {/* Header — below stories */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: "7px" }}>
          <Play style={{ width: 14, height: 14 }} /> {t("home.stories") || "Community Stories"}
        </h3>
        <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", fontWeight: 500 }}>
          {t("home.storiesSubtitle") || "Findings · Updates · Questions · Tips"}
        </span>
        <div style={{ marginLeft: "auto" }}>
          <SegmentedControl
            options={categoryOptions}
            value={filterCat}
            onChange={(val) => setFilterCat(val as StoryCategory | "all")}
            size="sm"
            ariaLabel={t("home.stories.filterAria") || "Filter community stories"}
            stretch
          />
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateStoryModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          authorInitial={userInitial}
          authorColor={userColor}
          authorName={userName}
          isDark={isDark}
          getCategoryLabel={getCategoryLabel}
        />
      )}
      {viewerIndex !== null && (
        <StoryViewer
          stories={filtered}
          startIndex={viewerIndex}
          likedIds={likedIds}
          onLike={handleLike}
          onDelete={handleDelete}
          onClose={() => setViewerIndex(null)}
          isDark={isDark}
          getCategoryLabel={getCategoryLabel}
        />
      )}
    </div>
  );
}
