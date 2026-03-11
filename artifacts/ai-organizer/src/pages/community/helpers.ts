/**
 * Community module — helpers & utilities
 */
import type { StoredData, CollabProposal } from "./types";
import { STORAGE_KEY, PROPOSALS_KEY } from "./constants";
import { createSampleData } from "./sampleData";

// ─── Data persistence ────────────────────────────────────────
export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createSampleData();
}

export function saveData(data: StoredData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Proposal persistence ────────────────────────────────────
export function loadProposals(): CollabProposal[] {
  try {
    const r = localStorage.getItem(PROPOSALS_KEY);
    if (r) return JSON.parse(r);
  } catch { /* ignore */ }
  return [];
}

export function saveProposals(d: CollabProposal[]) {
  try { localStorage.setItem(PROPOSALS_KEY, JSON.stringify(d)); } catch { /* ignore */ }
}

// ─── Formatting ──────────────────────────────────────────────
export function formatDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function formatNumber(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

// ─── Compatibility scoring ───────────────────────────────────
export function loadMySkillsProfile() {
  try {
    const r = localStorage.getItem("profile_skills_v1");
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

export function computeCompatibility(
  myProfile: { skills?: { name: string }[]; intents?: unknown[]; availableForCollab?: boolean } | null,
  expertise: string[]
): number {
  if (!myProfile?.skills) return 0;
  const mySkillNames = new Set(myProfile.skills.map((s: { name: string }) => s.name.toLowerCase()));
  const overlap = expertise.filter((t) => mySkillNames.has(t.toLowerCase())).length;
  let score = Math.min(60, overlap * 15);
  if (myProfile.availableForCollab) score += 10;
  if (myProfile.skills.length > 0) score += 10;
  if (myProfile.intents && (myProfile.intents as unknown[]).length > 0) score += 20;
  return Math.min(100, score);
}
