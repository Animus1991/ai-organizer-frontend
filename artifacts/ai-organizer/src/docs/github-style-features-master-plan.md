# GitHub-Style Features Master Plan for Think!Hub
## Comprehensive Academic Collaboration Hub

---

## Market Analysis: Existing Tools

### Closest Competitors
| Tool | Strengths | Weaknesses vs Think!Hub Vision |
|------|-----------|-------------------------------|
| **Overleaf** | Real-time LaTeX collaboration, version history | No theory validation tools, no claim tracking, no scientific workflow phases |
| **Notion** | Flexible workspace, collaboration | No scientific rigor tools, no segmentation, no evidence chain building |
| **Zotero/Mendeley** | Reference management, group libraries | No document analysis, no theory development, no contribution tracking |
| **GitHub** | Version control, contribution graphs, PRs, issues | Not designed for academic writing, no scientific validation tools |
| **ResearchGate** | Academic networking, paper sharing | No collaborative editing, no theory construction tools |
| **Manuscripts.io** | Academic writing workflow | Limited collaboration, no theory validation |
| **Authorea** | Scientific writing + data | No claim verification, no falsification tools |

### Gap Analysis
**No existing tool combines ALL of:**
1. Document management + segmentation
2. Scientific theory development workflow (claims → evidence → validation → refinement)
3. GitHub-style contribution tracking & version control
4. Real-time collaboration with role-based access
5. AI-powered analysis and insights

**Think!Hub's unique position:** The only platform that treats academic collaboration as a *scientific process* with built-in epistemological rigor (ΘΘΑ/ΨΕ/g*EM*S principles).

---

## Existing GitHub-Style Components (Already Implemented)

| Component | File | Status |
|-----------|------|--------|
| `ContributionGraph` | `src/components/ContributionGraph.tsx` | ✅ Functional — GitHub-style heatmap with color schemes |
| `ActivityFeed` | `src/components/ActivityFeed.tsx` | ✅ Functional — activity stream with action types |
| `TheoryVersionManager` | `src/components/TheoryVersionManager.tsx` | ✅ Functional — version management with status tracking |
| `ClaimChangelog` | `src/components/ClaimChangelog.tsx` | ✅ Functional — change history for claims |
| `TheoryEvolutionTimeline` | `src/components/TheoryEvolutionTimeline.tsx` | ✅ Functional — visual timeline of theory evolution |
| `CollaborationHub` | `src/components/CollaborationHub.tsx` | ✅ Functional — collaboration center |
| `CollaborationPanel` | `src/components/CollaborationPanel.tsx` | ✅ Basic — collaboration sidebar |
| `CollaborationProvider` | `src/components/CollaborationProvider.tsx` | ✅ Context — collaboration state management |
| `CollaborationCursor` | `src/components/CollaborationCursor.tsx` | ✅ Basic — real-time cursor display |
| `AuditTrail` | `src/components/AuditTrail.tsx` | ✅ Basic — action audit logging |

---

## Comprehensive Enhancement Plan by Page/Component

### A. HOME PAGE (`/`) — Central Dashboard

#### A1. Contribution Graph Enhancement
- **Current:** Shows activity heatmap from localStorage
- **Enhance:**
  - Add **per-project filtering** (filter by document, theory, or research project)
  - Add **contribution type breakdown** (uploads, edits, reviews, comments) with color-coded layers
  - Add **streak counter** ("🔥 12-day research streak")
  - Add **yearly summary stats** (total contributions, most active day, longest streak)
  - Add **comparison mode** — compare your activity with project averages

#### A2. Activity Feed Enhancement
- **Current:** Shows recent activities with icons
- **Enhance:**
  - Add **threaded comments** on activities (like GitHub issue comments)
  - Add **@mentions** with notification triggers
  - Add **activity filtering** by type (uploads, edits, reviews, theory changes)
  - Add **"pin" important activities** to top of feed
  - Add **activity reactions** (👍 🎯 💡 🔬) for quick feedback
  - Add **diff preview** inline — show what changed when hovering over edit activities

#### A3. Document Cards — Git-Style Metadata
- **Current:** Shows filename, parse status, size
- **Enhance:**
  - Add **last modified by** (contributor avatar + name)
  - Add **change count badge** ("23 changes")
  - Add **branch indicator** if document has multiple versions
  - Add **"contributors" mini-avatars** row (like GitHub repo contributors)
  - Add **status badges** (Draft, In Review, Published, Archived)

#### A4. New Widget: Project Overview Dashboard
- Add a **repository-style overview** widget showing:
  - Total documents, segments, claims, evidence items
  - Active contributors count
  - Open issues / unresolved contradictions
  - Recent merge/review activity
  - Theory health score trend graph

---

### B. THEORY HUB (`/theory-hub`) — Scientific Workflow

#### B1. Theory Branches (Git Branching for Theories)
- **New feature:** Allow creating **theory branches** — alternative formulations that can be developed in parallel
- Each branch tracks its own claims, evidence, and validation status
- **Merge mechanism:** When a branch proves superior, merge its claims into the main theory
- **Visual branch graph** (like `git log --graph`) showing theory evolution

#### B2. Pull Request System for Theory Changes
- **New feature:** When a collaborator proposes changes to claims or evidence:
  1. Changes go into a **"Proposed Changes" queue** (like a PR)
  2. Other collaborators can **review, comment, approve, or request changes**
  3. Approved changes get **merged** into the main theory
  4. Rejected changes are archived with rationale
- **Diff view** for claim changes (old text vs new text, side-by-side)

#### B3. Issue Tracker for Research Questions
- **New feature:** GitHub-style **issues** for:
  - Open research questions
  - Unresolved contradictions (auto-generated from ContradictionFinder)
  - Missing evidence requirements (auto-generated from EvidenceRequirementsGenerator)
  - Peer review feedback items
- Issues can be **assigned**, **labeled** (bug, enhancement, question, evidence-needed), and **milestoned**
- **Auto-close** issues when corresponding evidence is found or contradiction is resolved

#### B4. Enhanced Contribution Tracking
- **Per-tool contribution tracking:** Track who used which scientific tool and what they produced
- **Contribution categories:**
  - 📝 Claims authored
  - 🔍 Evidence found
  - 🧪 Validations performed
  - 💬 Reviews given
  - 🔗 References added
  - 🏷️ Categorizations made
- **Leaderboard** (optional, toggleable) showing top contributors per category

---

### C. RESEARCH LAB (`/research-lab`) — 4-Panel Scientific Workspace

#### C1. Panel-Level Version History
- Each panel (Documents, Claims, Evidence, Analytics) maintains its own **change history**
- **Undo/redo** with full state snapshots
- **Timeline scrubber** to view panel state at any point in time

#### C2. Chunk Editor — Diff View
- **Current:** Rich text editor with autosave
- **Enhance:**
  - Add **diff view toggle** — show changes since last save (red/green highlighting)
  - Add **revision history** per chunk — list of all saves with timestamps
  - Add **compare revisions** — select two revisions and see side-by-side diff
  - Add **restore revision** — revert to any previous version
  - Add **collaborative editing indicators** — show who else is editing this chunk

#### C3. Document Panel — Git-Style File Browser
- **Enhance document list** to show:
  - File tree with folders (like GitHub repo file browser)
  - Last commit message equivalent ("Added evidence for claim #3")
  - Modified date with relative time ("2 hours ago")
  - Contributor avatars per document

#### C4. Claims Panel — Issue-Like Tracking
- Each claim gets a **status workflow:** Draft → Under Review → Validated → Published
- **Labels system:** categorize claims (axiom, hypothesis, theorem, lemma, corollary)
- **Assignees:** who is responsible for validating each claim
- **Linked evidence:** show evidence items linked to each claim (like PR linked issues)

---

### D. THINKING WORKSPACE (`/frontend`) — Document Analysis

#### D1. Segment Annotations with Comments
- **New feature:** Add **inline comments** on segments (like GitHub code review comments)
- Comments can be **resolved** or **replied to**
- **Suggestion mode:** propose text changes within comments (like GitHub suggested changes)

#### D2. Segment Version Tracking
- Track **all edits** to each segment with full history
- **Blame view:** show who last modified each paragraph/sentence
- **Diff between segment versions**

---

### E. LIBRARY PAGE (`/library`) — Document Repository

#### E1. Repository-Style Organization
- **Enhance** to look like a GitHub organization page:
  - Documents grouped by project/topic (like repos in an org)
  - **Star/favorite** documents
  - **Fork** a document (create a personal copy for editing)
  - **Watch** a document (get notifications on changes)

#### E2. Document README
- Each document can have a **README-style overview** showing:
  - Abstract/summary
  - Key claims extracted
  - Segmentation status
  - Contributors list
  - Related documents

---

### F. SETTINGS PAGE (`/settings`) — User Preferences

#### F1. Collaboration Settings
- **Profile:** Display name, avatar, bio, affiliation, ORCID
- **Notification preferences:** Per-activity-type notification toggles
- **Privacy:** Control what activities are visible to collaborators
- **API tokens:** Generate personal access tokens for API integration

#### F2. Project Settings
- **Collaborator management:** Invite, remove, change roles (Owner, Maintainer, Contributor, Viewer)
- **Branch protection rules:** Require reviews before merging theory changes
- **Auto-merge settings:** Auto-merge when all checks pass

---

### G. GLOBAL COMPONENTS (All Pages)

#### G1. Global Notification Bell
- **Enhance** `NotificationCenter` with GitHub-style notifications:
  - Unread count badge in header
  - Grouped by project/document
  - Mark as read/unread
  - Filter by type (mentions, reviews, assignments)

#### G2. Command Palette Enhancement
- **Current:** Basic command palette with Ctrl+K
- **Enhance:**
  - Add **"Go to..." shortcuts** (go to document, claim, segment by ID)
  - Add **recent activity quick-jump**
  - Add **collaborator search** ("@username")
  - Add **issue/PR search** ("#123")

#### G3. Global Activity Bar
- **New:** Persistent bottom bar or sidebar showing:
  - Current active collaborators (green dots)
  - Recent activity stream (compact)
  - Quick-action buttons (new document, new claim, new issue)

#### G4. Breadcrumb Navigation with Context
- **Enhance** navigation to show:
  - Current project → document → segment path
  - Branch indicator if on a theory branch
  - Quick-switch between recent documents

---

### H. NEW DEDICATED PAGES

#### H1. `/collaboration` — Collaboration Dashboard
- **Overview:** All active projects with contributor counts
- **Activity feed:** Cross-project activity stream
- **Pending reviews:** PRs/changes awaiting your review
- **Your contributions:** Personal contribution summary across all projects
- **Team insights:** Who's working on what, workload distribution

#### H2. `/diff/:id` — Diff Viewer
- **Full-page diff view** for:
  - Document version comparisons
  - Claim change reviews
  - Theory branch comparisons
- **Side-by-side** and **unified** diff modes
- **Comment on specific lines/changes**

#### H3. `/history/:documentId` — Version History
- **Full version history** for any document/theory
- **Visual timeline** with branching
- **Restore any version**
- **Compare any two versions**

---

## Implementation Priority

### Phase 1 — Foundation (Immediate)
1. Enhance `ContributionGraph` with per-project filtering and streak counter
2. Enhance `ActivityFeed` with filtering and reactions
3. Add diff view to chunk editor in Research Lab
4. Add status badges to document cards on Home

### Phase 2 — Collaboration Core (Short-term)
5. Implement theory branching in `TheoryVersionManager`
6. Add inline comments on segments (Thinking Workspace)
7. Create issue tracker component for research questions
8. Add collaborator avatars and "last modified by" to document cards

### Phase 3 — Review System (Medium-term)
9. Implement PR-style review system for theory changes
10. Add suggestion mode to segment comments
11. Create `/collaboration` dashboard page
12. Add `/diff/:id` viewer page

### Phase 4 — Advanced (Long-term)
13. Real-time collaborative editing (WebSocket-based)
14. Full `/history/:documentId` page with visual timeline
15. Branch protection rules and auto-merge
16. API tokens and external integrations (Zotero, ORCID, CrossRef)

---

## Technical Architecture Notes

- **State management:** Extend existing localStorage-based state with optional backend sync
- **Real-time:** WebSocket layer for collaborative features (can use existing AIChatManager WebSocket pattern)
- **Diff engine:** Use `diff-match-patch` library for text diffing
- **Contribution tracking:** Extend existing `ActivityFeed` data model with structured event types
- **Branch model:** Extend `TheoryVersionManager` with branch/merge semantics
- **Permissions:** Role-based access control (RBAC) with Owner/Maintainer/Contributor/Viewer roles
