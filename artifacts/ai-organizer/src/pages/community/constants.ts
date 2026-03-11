/**
 * Community module — constants & labels
 */
import type { ProposalRole, ProposalScope } from "./types";

export const STORAGE_KEY = "thinkspace-community-profiles";
export const PROPOSALS_KEY = "collab_proposals_v1";

export const FIELD_COLORS: Record<string, string> = {
  "Quantum Physics": "hsl(var(--primary))",
  "Molecular Biology": "hsl(var(--success))",
  "Computer Science": "hsl(var(--accent-foreground))",
  "Neuroscience": "#ec4899",
  "Chemistry": "hsl(var(--warning))",
  "Mathematics": "hsl(var(--info))",
  "Economics": "#f97316",
  "Medicine": "hsl(var(--destructive))",
  "Engineering": "hsl(var(--muted-foreground))",
  "Psychology": "#14b8a6",
  "Philosophy": "#a855f7",
  "Environmental Science": "hsl(var(--success))",
};

export const ROLE_LABELS: Record<ProposalRole, string> = {
  "co-author": "Co-author",
  collaborator: "Collaborator",
  "co-founder": "Co-founder",
  advisor: "Advisor",
  "peer-reviewer": "Peer Reviewer",
  "research-partner": "Research Partner",
};

export const SCOPE_LABELS: Record<ProposalScope, string> = {
  paper: "Research Paper",
  project: "Research Project",
  startup: "Startup",
  grant: "Grant Proposal",
  mentoring: "Mentoring",
  other: "Other",
};
