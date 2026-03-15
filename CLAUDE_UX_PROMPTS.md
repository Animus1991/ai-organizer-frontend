# Think!Hub — Comprehensive Claude Prompt Guide
## State-of-the-Art UI/UX Improvements — Page-by-Page

> **Purpose:** Each section below is a self-contained, ready-to-paste prompt for Claude.
> The target repo is `artifacts/ai-organizer/src/` in a pnpm monorepo React+Vite+Tailwind project.
> The design system uses HSL CSS custom properties (`hsl(var(--primary))`, etc.),
> a dark/light academic theme, and inline styles throughout (no Tailwind classes in new edits).
> Mobile breakpoint: `< 768px` via `useIsMobile()` from `../../hooks/use-mobile`.
> Tablet: `768–1023px` via `useIsTablet()` from `../../hooks/useMediaQuery`.

---

## 0 — GLOBAL SYSTEM-WIDE IMPROVEMENTS

```
You are improving Think!Hub, an AI-powered academic research organizer (React 18 + Vite + TypeScript).
Design language: dark-first, HSL tokens (--primary, --accent, --card, --muted, --border, --foreground, --destructive, --success, --warning, --info).
All new components use inline styles with HSL token references. No hardcoded hex values.

GLOBAL TASKS to apply across EVERY page and component:

1. FOCUS RINGS: Add `outline: "2px solid hsl(var(--primary))", outlineOffset: "2px"` on :focus-visible
   to every <button>, <input>, <select>, <textarea>, <a>. Remove outline:none globally.

2. TOUCH TARGETS: Every tappable element on mobile must be at minimum 44×44px
   (add padding or minHeight/minWidth as needed). No exception for icon-only buttons.

3. SKELETON LOADING: Replace every `loading && <Spinner />` pattern with a skeleton shimmer.
   Skeleton shimmer CSS: `background: linear-gradient(90deg, hsl(var(--muted)), hsl(var(--muted)/0.5), hsl(var(--muted))); background-size: 200%; animation: shimmer 1.5s infinite;`
   @keyframes shimmer { 0% { background-position: -200% } 100% { background-position: 200% } }

4. EMPTY STATES: Every list/grid empty state must have: icon (48px, muted), headline, subtext,
   and a primary CTA button. No raw "No items found" text without visual chrome.

5. ERROR STATES: Replace red "Network error" banners with a friendlier card:
   icon (AlertCircle, 32px warning color), "Could not load data" headline,
   subtext "Working offline — showing cached data if available", and a Retry button.
   In demo_mode (localStorage.getItem("demo_mode") === "true"), never show error banners at all.

6. PAGE TRANSITIONS: Wrap every <PageShell> child in:
   `<div style={{ animation: "pageFadeIn 0.25s ease", opacity: 1 }}>` with
   @keyframes pageFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }

7. TYPOGRAPHY SCALE: Apply consistent sizing:
   - Page title: 24px/800 desktop, 20px/800 mobile
   - Section header: 18px/700
   - Card title: 14px/700
   - Body: 13px/400
   - Caption/meta: 11px/500 muted

8. SCROLL RESTORATION: Add `useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);`
   to App.tsx using useLocation() so every page navigation starts at top.

9. REDUCED MOTION: Wrap all animations/transitions inside
   `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

10. ARIA LABELS: Every icon-only button must have `aria-label`. Every section must have `aria-labelledby`
    pointing to its heading. All loading spinners must have `role="status" aria-label="Loading..."`.
```

---

## 1 — HOME PAGE (`src/pages/Home.tsx` + `src/components/home/*`)

```
FILE: src/pages/Home.tsx
COMPONENT: Home (default export)
PURPOSE: Central research dashboard — uploads, segmentation, community stories, identity stack.

MOBILE IMPROVEMENTS (< 768px):
1. MobileGreetingBanner (already added) — add a pulsing green dot next to streak count
   if streak >= 3 to gamify daily research habit.

2. MobileBottomNav (`src/components/home/MobileBottomNav.tsx`):
   - Persist the nav always visible (remove the auto-hide timer entirely — it disorients users).
   - Add a badge dot on "Insights" tab when there are unread notifications (read from
     NotificationContext: unreadCount > 0).
   - Active tab should have a filled icon variant (use strokeWidth={2.5} for active, 1.5 for rest).
   - Add haptic feedback: `navigator.vibrate?.(8)` on each tab press.

3. Pull-to-refresh: The `usePullToRefresh` hook is already wired. Add a visible PTR indicator:
   a spinner that descends from top-0 when isPulling, with "Release to refresh" / "Pull to refresh" text.

4. AcademicQuickActions mobile (src/components/home/AcademicQuickActions.tsx):
   - Currently 2-col grid (done). NEXT: add a micro-progress badge on the Upload card
     showing "X docs uploaded" from useUserData().stats.documentsUploaded.
   - Long-press on any action card (200ms) should show a tooltip with the description text.

5. HomeStoriesStrip mobile (src/components/home/HomeStoriesStrip.tsx):
   - Add a horizontal scroll progress indicator: a thin bar below the strip showing
     scroll progress (scrollLeft / (scrollWidth - clientWidth)).
   - On mobile, replace the category segmented control with a horizontally scrollable
     chip row (overflow-x: auto, gap 8px, no wrap, snap scrolling).

TABLET IMPROVEMENTS (768–1023px):
6. HomeHeader (src/components/home/HomeHeader.tsx):
   - At tablet width, the 3-column (left/center/right) layout becomes cramped.
   - Detect tablet via `useIsTablet()` from ../../hooks/useMediaQuery.
   - At tablet: stack to 2 rows: row1 = logo+title full width, row2 = actions+time+avatar.
   - Reduce logo subtitle to 1 line, clip with ellipsis.

7. AcademicQuickActions tablet:
   - Use `gridTemplateColumns: "repeat(2, 1fr)"` for primary actions (vs 3 on desktop).
   - Secondary pills: reduce font to 11px, padding to 5px 10px.

DESKTOP IMPROVEMENTS (≥ 1024px):
8. AcademicHeroCard (src/components/home/AcademicHeroCard.tsx):
   - Add a "Last sync" timestamp below the identity sync button.
   - Make the 4 stat cards clickable: click on Documents → navigate to /library,
     Segments → navigate to /research, Processed → navigate to /activity,
     Accuracy → navigate to /benchmark.

9. HomeCarouselViews (src/components/home/HomeCarouselViews.tsx):
   - Grid view: add a "compact density" toggle (icon-only button in section header)
     that reduces card padding from 16px to 8px and font sizes by 1px.
   - 3D carousel: add keyboard navigation (← → arrow keys change active slide).

10. HomeCommunityStrip (src/components/home/HomeCommunityStrip.tsx):
    - Add XP breakdown tooltip on hover of the XP bar:
      show a mini popover listing Documents×20 + Segments×5 + Comments×8 etc.
    - Add a "Top Contributor" badge (flame icon) for any researcher with
      documentsUploaded ≥ 5.

ALL VIEWPORTS:
11. SectionShell (src/components/ui/SectionShell.tsx):
    - Add a collapse/expand toggle button (ChevronDown/ChevronUp) to every SectionShell.
    - Persist collapse state per-section in localStorage key "sectionCollapse_{sectionId}".

12. HomeNotificationsPanel (src/components/home/HomeNotificationsStrip.tsx):
    - Add "Mark all as read" button in the panel header.
    - Group notifications by day: "Today", "Yesterday", "Earlier this week".
    - Add swipe-to-dismiss on mobile (translateX animation on pointer events).
```

---

## 2 — LIBRARY PAGE (`src/pages/LibraryPage.tsx` + `src/pages/library/components/*`)

```
FILE: src/pages/LibraryPage.tsx
PURPOSE: Document repository — search, filter by category/tag, grade, export.

CRITICAL BUGS TO FIX:
1. Demo mode: When localStorage.getItem("demo_mode") === "true", never call the API.
   Immediately set items to DEMO_ITEMS (5 seeded academic papers) without showing error.
   (Fix already partially applied — complete it.)

2. LibraryItemCard (src/pages/library/components/LibraryItemCard.tsx):
   - On mobile, the card action buttons (Edit, Delete, Star) overflow outside the card.
   - Fix: on mobile, hide action buttons behind a "⋮" more menu (absolute positioned,
     z-index 10, opens on tap, closes on outside click via useRef + document listener).

MOBILE IMPROVEMENTS:
3. Add a sticky bottom action bar on mobile (fixed, above safe-area-inset-bottom):
   - Left: document count badge ("5 items")
   - Center: Sort pill selector (Recent | A-Z | Type)
   - Right: Upload button (primary color)
   This replaces the desktop filter bar which doesn't fit mobile.

4. LibraryEmptyState (src/pages/library/components/LibraryEmptyState.tsx):
   - Make the empty state full-screen centered with illustration (use a BookOpen
     Lucide icon at 80px, primary color, with a subtle pulsing glow animation).
   - Add two CTA buttons: "Upload Your First Document" and "Browse Demo Library".

5. Add a "Shelf View" kanban-style layout grouped by category:
   - Toggle between List and Shelf via two icon buttons in the header (List, Columns).
   - Shelf: horizontal scroll of category columns. Each column has a color-coded header
     and vertically stacked LibraryItemCards.
   - Persist view mode in localStorage key "library-view-mode".

TABLET/DESKTOP:
6. Add a left sidebar for filters (collapsible on tablet):
   - Categories checklist (multi-select with count badges).
   - Tags multi-select chip list.
   - Grade filter: A/B/C/D buttons.
   - Date range picker (custom, 2 date inputs).
   - "Reset filters" link at bottom.

7. Bulk actions: add a selection checkbox to each card (appears on hover desktop, always visible mobile).
   When ≥1 selected, show a bulk action bar at bottom: Export Selected, Delete Selected, Add Tag.

8. Sort bar: add a "Grade" sort mode that groups A+ > A > B+ > B > C etc.
   Show the grade as a colored badge: A+/A = green, B+/B = blue, C = yellow, D/F = red.
```

---

## 3 — RESEARCH HUB (`src/pages/research-hub/ResearchHubPage.tsx`)

```
FILE: src/pages/research-hub/ResearchHubPage.tsx
SECTIONS: Search | DOI | Results | Integrations | Context
PURPOSE: Academic literature discovery, citation management, paper import from OpenAlex/arXiv/Semantic Scholar.

MOBILE IMPROVEMENTS:
1. The page title "Research Hub" wraps to 2 lines on 390px.
   Fix: reduce title to 18px on mobile, collapse subtitle to 1 line max.

2. SectionTabs (src/pages/research-hub/components/SectionTabs.tsx):
   - On mobile, tabs overflow horizontally (5 tabs × min-width).
   - Fix: use a horizontally scrollable tab bar with `overflow-x: auto; scrollbar-width: none`.
   - Active tab should have a colored bottom border (2px solid primary) and bold label.
   - Tabs should snap to center on active tab change (scrollIntoView({ behavior: "smooth", inline: "center" })).

3. SearchSection (src/pages/research-hub/sections/SearchSection.tsx):
   - Search input on mobile: full width, 48px height (touch target).
   - "Export CSV" and "Export DOI" buttons: stack vertically on mobile below search input.
   - Add a voice search button (microphone icon) that uses the Web Speech API:
     `new window.webkitSpeechRecognition()` to fill the search input.

4. ResultsSection (src/pages/research-hub/sections/ResultsSection.tsx):
   - Result cards on mobile: reduce to 1 column, show only title + authors + year + venue.
   - Add "Import to Library" swipe action (right swipe reveals green Import button).
   - Add citation count as a badge on each card (cite: N format, colored by quartile).

5. Add an "AI Next Steps" panel below the search input:
   - Shows 3-5 contextual chip suggestions based on the last search query.
   - Store last 5 queries in localStorage key "rh-recent-queries".
   - Chips: "Related: {similar_term}", "Cite: {paper_title}", "Explore: {author_name}".
   - Each chip triggers a new search on click.

DESKTOP:
6. Add a split-view mode: left panel = search/filters (30%), right panel = results (70%).
   Toggle via a LayoutSplit icon button in the page header.

7. Results list: add a "Citation Network" button per paper that navigates to
   /segment-graph?paperId={id} with the paper's citation graph pre-loaded.

8. Context panel (src/pages/research-hub/sections/ContextSection.tsx):
   - Add a "Knowledge Gap" indicator: an AI-generated statement about what's missing
     from the current corpus based on the search topic.
   - Style: amber warning card at top of context panel.
```

---

## 4 — PROFILE PAGE (`src/pages/ProfilePage.tsx`)

```
FILE: src/pages/ProfilePage.tsx
COMPONENTS: src/components/profile/*
PURPOSE: GitHub-style researcher profile — bio, stats, achievements, activity graph.

MOBILE IMPROVEMENTS:
1. Cover image: on mobile, reduce cover height from 200px to 140px.
   The gradient cover should extend fully edge-to-edge (negative margin -8px left/right
   to bleed past the page padding).

2. Avatar: on mobile, reduce avatar circle from 80px to 64px.
   Move "Edit Profile" button to the top-right as a floating icon button (pencil icon only).

3. Stats row (Followers / Following / Collections / Documents):
   - On mobile, wrap into 2×2 grid instead of single row.
   - Each stat: bold number (18px) above label (11px muted).

4. Achievements section (src/components/profile/AchievementBadges.tsx):
   - The raw i18n key "PROFILE.ACHIEVEMENTS" displays as uppercase because the `t()` function
     returns the key string when translation is missing and CSS applies text-transform:uppercase.
   - FIX: Add `"profile.achievements": "Achievements"` to src/context/i18n/en.ts. (DONE)
   - Enhance badges: locked badges use 40% opacity + grayscale filter.
   - Unlocked badges get a shimmer animation: @keyframes badge-unlock { 0% { box-shadow:0 0 0 0 hsl(var(--primary)/0.4) } 70% { box-shadow:0 0 0 10px transparent } 100% { box-shadow:0 0 0 0 transparent } }
   - On unlock (when an achievement switches from locked to unlocked), trigger a confetti burst
     using the canvas-confetti library (npm install canvas-confetti).

5. Contribution Graph (src/components/ContributionGraph.tsx):
   - On mobile, reduce cell size from 12px to 8px.
   - Show only last 26 weeks on mobile (vs 52 weeks desktop).
   - Add a month label row above the graph.
   - On cell tap (mobile), show a tooltip: "{N} activities on {date}".

6. Profile completeness bar (already added to ProfilePage.tsx):
   - Add individual field indicators below the bar:
     5 dots/checks for: Avatar | Bio | Institution | Expertise | ORCID.
     Green check if filled, grey dot if empty. Each is tappable and focuses that field in the edit form.

7. Profile edit form (src/components/profile/ProfileEditForm.tsx):
   - On mobile: each field takes full width, stacked vertically.
   - Add character count indicators for bio (max 500) and expertise tags (max 10).
   - ORCID field: add a "Verify ORCID" button that opens `https://orcid.org/{orcid}` in a new tab.
   - Add avatar upload: circular dropzone that shows the uploaded image preview immediately.

DESKTOP:
8. Add a sticky right sidebar (desktop only, ≥1024px):
   - "Quick Links" section: links to their top 5 documents by view count.
   - "Pinned Research" section: up to 3 pinned documents with star ratings.
   - Both sections are collapsible.

9. Add a "Public Profile" toggle switch that hides personal fields (email, ORCID)
   when enabled. Show a preview mode that mirrors how other researchers see the profile.
```

---

## 5 — SETTINGS PAGE (`src/pages/SettingsPage.tsx`)

```
FILE: src/pages/SettingsPage.tsx
SIDEBAR: src/components/settings/SettingsSidebar.tsx (search already added)
SECTIONS: General | Appearance | Language | Notifications | Shortcuts | Security | Billing | Integrations | Developer | Privacy | Export & Backup

MOBILE IMPROVEMENTS:
1. On mobile, the sidebar + content layout must become a full-screen page stack:
   - Mobile shows ONLY the sidebar (section list) initially.
   - Tapping a section slides in the section content as a new "page" (translateX animation).
   - Add a "← Back" button in the section content header to go back to the list.
   - This is a standard iOS/Android settings navigation pattern.
   Implementation: use a state `mobileView: "list" | "section"` in SettingsPage.
   Animate with `transform: translateX(${mobileView === "section" ? 0 : "100%"}) ` on section pane.

2. Section content on mobile: remove the card wrapper, let content span full width
   with 16px horizontal padding.

3. Add a "Recently Visited" row at the top of the sidebar (above search) showing the
   last 3 accessed settings sections as small pill chips. Store in localStorage "settings-recent".

ALL VIEWPORTS:
4. Appearance section: replace the basic theme dropdown with a visual theme picker grid:
   - 4-6 preset themes (Dark Academic / Light Minimal / Ocean / Forest / Warm Amber / High Contrast).
   - Each preset shows a small 80×48px preview card of the color scheme.
   - Click selects the theme and applies CSS custom property overrides to :root.

5. Language section: add a search input for language selection.
   Show flag emoji + language name in native script + language name in English.
   Add "Auto-detect" option at top.

6. Notifications section: group by type with toggle switches for each:
   - Document events (upload complete, segmentation done, parse failed)
   - Social events (new follower, comment on your document, mention)
   - System events (maintenance, new features, security alerts)
   Each group has an "All off / All on" master toggle.

7. Shortcuts section: add a "Keyboard shortcut recorder" — clicking any shortcut row
   activates a recording mode (highlighted border, "Press new shortcut..." placeholder),
   captures the next key combination, validates for conflicts, and saves to localStorage.

8. Security section: add a session list showing recent logins:
   - Browser/device, date/time, IP (last 3 octets only), location.
   - "Revoke" button per session.
   - Demo data: 3 fake sessions in demo mode.

9. Export & Backup section: add a "Preview export" accordion that shows a JSON tree
   of what will be exported (document titles, segment counts, settings keys).
   Add format options: JSON | CSV | Markdown.

10. Developer section: add a "Reset to defaults" button (destructive, requires confirm dialog)
    that clears all localStorage keys and reloads. Add a "Copy diagnostic report" button
    that generates JSON of browser info, screen size, theme, and localStorage key count.
```

---

## 6 — RESEARCH LAB (`src/pages/research-lab/`)

```
FILE: src/pages/research-lab/ (directory)
PURPOSE: Document analysis workspace — segment viewer, graph, benchmarks.

MOBILE:
1. The segment graph visualization (SegmentGraphVisualizationPage.tsx) uses react-force-graph-2d
   which is unusable on mobile. On mobile:
   - Show a flat list of nodes instead of the force graph.
   - Each node is a card showing: label, type badge, connection count.
   - Tapping a node highlights it and shows its connections in a drawer below.

2. Research Lab main page: add a "Quick analyze" FAB (floating action button) at bottom-right
   on mobile. Opens a bottom sheet with: Upload Doc, Analyze Selected, View Results.

3. BenchmarkPage (src/pages/BenchmarkPage.tsx):
   - Mobile: replace the table view with stacked cards per benchmark metric.
   - Each card: metric name (bold), score (large colored number), comparison vs baseline (trend arrow).
   - Add a radar/spider chart for overall scores using recharts RadarChart.

DESKTOP:
4. Research Lab layout: add a resizable split view — left sidebar with document list,
   right main area with segment viewer. Use a drag handle (4px wide, hover = primary color)
   to resize. Persist split position in localStorage "researchlab-split".

5. Add an "Export Report" button that generates a PDF-like HTML page using window.print()
   with @media print CSS showing all benchmark results, segment statistics, and AI analysis.
```

---

## 7 — DOCUMENT WORKSPACE (`src/pages/DocumentWorkspace.tsx`)

```
FILE: src/pages/DocumentWorkspace.tsx
PURPOSE: Full-screen document editor/viewer with AI assistance panel.

MOBILE:
1. On mobile, the workspace must be a single-panel view with a bottom sheet for AI.
   - Main area: document viewer full width.
   - Bottom sheet (drag handle at top, swipe up to expand): AI assistant panel.
   - When bottom sheet is open/expanded: document scrolls to top, AI fills bottom 60%.

2. Add a floating "Reading progress" indicator: a circular progress ring (SVG)
   in the top-right corner showing scroll position through the document.

3. Add text selection → AI action: when user selects text (selectionchange event),
   show a floating mini toolbar above the selection:
   - Summarize | Explain | Find Citations | Add to Notes
   Each action sends the selected text to the AI chat.

DESKTOP:
4. Add a panel toggle system (keyboard shortcut P): cycle through
   [ Document only | Document + AI | AI only | Document + Notes | Three-panel ].

5. Add document annotations: users can highlight text and add sticky note annotations.
   Annotations stored in localStorage key "doc-annotations-{documentId}".
   Show annotation count badge in the document header.
   Annotation sidebar: list of all annotations with jump-to-location button.

6. Add a "Focus mode" (keyboard shortcut F): hides all chrome (sidebar, header),
   shows only document content with a subtle vignette overlay.
   Exit focus mode with Escape.
```

---

## 8 — ACTIVITY PAGE (`src/pages/ActivityPage.tsx`)

```
FILE: src/pages/ActivityPage.tsx
PURPOSE: Notification center and research activity feed.

MOBILE:
1. Convert to an infinite scroll feed instead of paginated list.
   - Load first 20 items on mount.
   - Use IntersectionObserver to detect when user reaches bottom 200px, load next batch.
   - Add a loading skeleton (3 skeleton rows) while loading next batch.

2. Add swipe-to-archive per activity item (left swipe = dismiss, right swipe = star/pin).
   Dismissed items go to a collapsible "Archived" section at the bottom.
   Starred items go to a "Pinned" section at the top.

3. Activity item cards: add relative timestamps ("2h ago", "Yesterday", "Mar 12")
   that update every 60s via setInterval.

ALL VIEWPORTS:
4. Add filter chips at the top (horizontal scroll on mobile):
   All | Documents | Social | System | Milestones | Errors
   Active filter chip: primary color fill, white text.

5. Add "Mark as read" on individual items: clicking the item marks it read (grey out, reduce opacity to 0.6).
   Add "Mark all read" in the page header.

6. Empty state: animated illustration (use Lottie or a CSS-animated SVG of a bell with no notifications).
   Text: "All caught up! No recent activity." with a "Go to Dashboard" button.

7. Group activities by day with sticky date dividers:
   position: sticky; top: 0; backdrop-filter: blur(8px); z-index 10.
   Format: "Today — Sunday, March 15" | "Yesterday" | "March 13".
```

---

## 9 — DISCOVER / EXPLORE PAGES (`src/pages/DiscoverPage.tsx`, `src/pages/ExplorePage.tsx`)

```
FILES: src/pages/DiscoverPage.tsx, src/pages/ExplorePage.tsx
PURPOSE: Research community exploration, trending papers, researchers to follow.

MOBILE:
1. Discover page: show a "Trending Now" horizontal scroll strip of topic chips at the top.
   Each chip: "#MachineLearning (142 papers today)" format.
   Chips have colored backgrounds cycling through primary/accent/warning/success.

2. Researcher cards: on mobile, show a compact horizontal card (60px avatar on left,
   name + institution + follower count on right, Follow button far right).
   On desktop: show a vertical card with cover area.

3. Add a "For You" algorithm section (localStorage-based):
   - Read from localStorage "search-history", "rh-recent-queries", and document categories.
   - Show 3-5 paper recommendations in a card strip with "Because you searched: {topic}" header.

ALL VIEWPORTS:
4. Add infinite scroll to both pages (same pattern as Activity page above).

5. Add a global "Trending" sidebar on desktop (right side, 240px):
   - Top 5 trending research topics this week.
   - Top 3 most active researchers this week (by document uploads).
   - These use localStorage data + fake trending data in demo mode.

6. ExplorePage: add a "Research Map" view — a force-directed graph of topics connected
   by co-citation relationships. Same tech as SegmentGraphVisualization. Node size = paper count.
   Click node → filter explore grid to that topic.
```

---

## 10 — PROJECT BOARD (`src/pages/ProjectBoardPage.tsx`)

```
FILE: src/pages/ProjectBoardPage.tsx
PURPOSE: Kanban board for research tasks/issues.

MOBILE:
1. On mobile, replace the kanban column layout with a single-column swipeable view.
   - Column header tabs at the top (horizontal scroll): Open | In Progress | In Review | Closed.
   - Active column shows its cards below.
   - Swipe left/right to change active column (same gesture as tab switching).

2. Issue cards on mobile: reduce padding, show only title + priority badge + assignee avatar.
   Status dot (colored circle, 8px) on the right edge indicates state.

3. Add a floating "+ New Issue" FAB at bottom right on mobile.

DESKTOP:
4. Drag-and-drop between columns using the HTML5 drag API:
   - onDragStart: store issue id and source column in state.
   - onDragOver: highlight target column with a dashed primary border.
   - onDrop: move issue to target column, update state, persist to localStorage.

5. Add a "Burndown chart" view toggle: shows a simple line chart (recharts LineChart)
   of open issues over time (last 30 days, using createdAt/closedAt dates).

6. Add issue labels (colored tags): 8 preset colors, user types label name and picks color.
   Labels show on cards as small colored chips.
```

---

## 11 — TEAMS PAGE (`src/pages/TeamsPage.tsx`)

```
FILE: src/pages/TeamsPage.tsx
PURPOSE: Research team management, collaboration, invite management.

MOBILE:
1. Team member list: compact horizontal avatar stack (up to 5 visible, "+N more" badge).
   Tap the stack to open a bottom sheet with full member list.

2. Invite form: full-width on mobile, stacked layout (email input + role select + Send button vertically).

3. Add team activity feed: "Maria uploaded a document 2h ago" type entries.

ALL VIEWPORTS:
4. Add a "Team Health" metrics strip: (cards: Open Issues | Active Members | Docs this month | Avg response time).

5. Add a "Team Recommendations" section: suggest researchers to invite based on
   similar research interests (match profile.researchInterests from localStorage).

6. Add role-based access control visualization: a permissions matrix table showing
   what each role (Owner / Admin / Write / Read) can do.
```

---

## 12 — RESEARCH DISCUSSIONS (`src/pages/ResearchDiscussionsPage.tsx`)

```
FILE: src/pages/ResearchDiscussionsPage.tsx
PURPOSE: Threaded discussions attached to documents/segments.

MOBILE:
1. Nested thread replies: limit visual nesting to 2 levels deep on mobile.
   Deeper replies shown as "View {N} more replies" expandable.

2. Reply input: fixed at bottom of screen on mobile (like iMessage).
   Keyboard safe area: pad bottom with env(safe-area-inset-bottom) + 56px (keyboard height estimate).

3. Add emoji reaction picker: long-press a message → show 6 quick reactions (👍❤️🧠💡🔥✅).

ALL VIEWPORTS:
4. Add @mention autocomplete: typing @ in the reply input shows a dropdown of team members.
   Filtered by what's typed after @. Insert formatted mention on select.

5. Add "Copy link to discussion" button: copies current URL with #discussion-{id} anchor.

6. Add a "Pinned discussions" section at top: threads marked as pinned by admins.
   Pinned threads have a 📌 badge and gold left border.
```

---

## 13 — LOGIN PAGE (`src/pages/Login.tsx`)

```
FILE: src/pages/Login.tsx
PURPOSE: Authentication entry point.

ALL VIEWPORTS:
1. The login page likely shows a basic form. Redesign to a split layout (desktop):
   - Left 50%: hero panel with Think!Hub branding, gradient background, animated particles/grid.
   - Right 50%: login form on a card.
   On mobile: single column, hero panel collapses to a compact 120px brand bar at top.

2. Add an animated background: CSS grid of fading dots or a subtle SVG wave animation.
   Colors: primary/accent gradients at 10% opacity.

3. Login form enhancements:
   - Email field: auto-focus on mount, validate format on blur (show green check or red X).
   - Password field: toggle visibility (Eye/EyeOff icon button, 44px touch target).
   - Add "Remember me" checkbox (styled, not default browser).
   - Show password strength indicator on the Register form.

4. Add a prominent "Demo Mode" button below the form:
   `<button onClick={() => { localStorage.setItem("demo_mode","true"); navigate("/"); }}>`
   Style: secondary variant with a "Try without signing up →" label.

5. Error message: instead of a red text alert, show a shake animation on the form card:
   @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }

6. Add social proof below the form: "Join 2,400+ researchers" with 3 small avatar circles.

7. Add keyboard shortcut: pressing Enter submits the form, Tab moves between fields.
```

---

## 14 — THEORY REPO PAGE (`src/pages/TheoryRepoPage.tsx`)

```
FILE: src/pages/TheoryRepoPage.tsx
PURPOSE: Git-like versioned repository for research theories and hypotheses.

MOBILE:
1. Repository file tree: replace nested indentation with a "breadcrumb drill-down" pattern.
   Show current folder contents as a flat list. Tap folder → drill into it.
   Breadcrumb header: "Root > Chapter3 > Methods" with back navigation.

2. Diff view (DocumentDiffPage.tsx): on mobile, switch from side-by-side to unified diff view.
   Add a toggle button: "Split | Unified" in the diff header.

3. Commit history: compact cards — hash (7 chars) + message (truncated 40 chars) + author avatar + date.
   Tap card → expand inline to show full commit details.

ALL VIEWPORTS:
4. Add syntax highlighting to code blocks in theory documents.
   Use Prism.js or highlight.js (already likely installed as katex dependency is present).

5. Add a "Fork" button: creates a copy of the theory with a new branch name.
   Store forked theories in localStorage "forked-theories-{originalId}".

6. Add a tag/label system for theories: methodology, hypothesis, conclusion, proof, refutation.
   Filter sidebar with multi-select checkboxes.
```

---

## 15 — MILESTONES PAGE (`src/pages/ResearchMilestonesPage.tsx`)

```
FILE: src/pages/ResearchMilestonesPage.tsx
PURPOSE: Research milestone tracking with timeline visualization.

MOBILE:
1. Replace the horizontal timeline with a vertical timeline for mobile.
   Each milestone: colored dot on left (connected by a vertical line), content card on right.
   Past milestones: solid dot, grey line. Future: dashed circle, dashed line.

2. Add a "% complete" progress ring per milestone (SVG circle progress).
   Size: 40px, stroke 4px.

3. "Add milestone" form: bottom sheet on mobile (swipe up), not inline form.

ALL VIEWPORTS:
4. Add Gantt chart view: horizontal bars per milestone spanning their date range.
   Use a scrollable div with fixed left column (milestone names) and scrollable right (bars).
   Bar colors: by status (planned=muted, in-progress=primary, done=success, overdue=destructive).

5. Add milestone dependencies: draw arrows between dependent milestones in the Gantt view.
   Store dependency pairs in localStorage.

6. Add a "Milestone health" summary at the top: 4 stat cards
   (Total | On track | At risk | Overdue) with colored indicators.
```

---

## 16 — WIKI PAGE (`src/pages/ResearchWikiPage.tsx`)

```
FILE: src/pages/ResearchWikiPage.tsx
PURPOSE: Collaborative knowledge base for research concepts, methods, terminology.

MOBILE:
1. Table of contents: hidden behind a "Contents" chip at the top (tap to expand into a
   bottom sheet showing the full TOC with anchor links).

2. Edit mode: on mobile, use a full-screen editor (position:fixed, top:0, bottom:0)
   with a compact toolbar (Bold | Italic | Link | Image | List) in a scrollable horizontal strip.

3. Search within wiki: always-visible sticky search bar at top of mobile view.

ALL VIEWPORTS:
4. The wiki editor (TipTap) should have:
   - Slash-command menu: typing / shows a command palette of block types
     (Heading1-3, BulletList, NumberedList, Table, CodeBlock, Blockquote, Divider, Image).
   - Floating format toolbar: appears above selected text with Bold/Italic/Link/Color options.
   - Auto-save: debounced 2s after last keypress, with "Saved" / "Saving..." indicator.

5. Add wiki article revision history (localStorage-based):
   Store up to 20 revisions per article in localStorage "wiki-history-{articleId}".
   "History" button in header opens a side panel showing revision list with timestamps.
   Clicking a revision shows a diff against current version.

6. Add linked mentions: typing [[ConceptName]] creates a link to the wiki article with that title.
   If no article exists: link is red (broken), clicking it prompts "Create article: ConceptName?".
```

---

## 17 — REFERENCES PAGE (`src/pages/ReferencesPage.tsx`)

```
FILE: src/pages/ReferencesPage.tsx
PURPOSE: Citation manager — import, organize, export citations in multiple formats.

MOBILE:
1. Citation cards: compact single-line format on mobile.
   Author Last + Year + abbreviated title. Expandable on tap.

2. Import flow: full-screen bottom sheet with options:
   DOI import | BibTeX paste | Manual entry | Import from Research Hub.
   Each option is a large tappable row with icon + description.

DESKTOP:
3. Add a "Citation preview" panel on the right: select a citation to see formatted output
   in all 4 styles simultaneously (APA, MLA, Chicago, Harvard).

ALL VIEWPORTS:
4. Add search/filter: search by title, author, year, type (article/book/conference/etc.).
   Year range filter: two number inputs (From: / To:).

5. Add DOI resolver: paste a DOI and auto-fetch metadata from CrossRef API
   (`https://api.crossref.org/works/{doi}`) with loading state and error handling.

6. Export: add checkboxes to select citations, then "Export {N} selected" button
   that generates a .bib / .ris / .txt / .docx file download.
   Use Blob API: `const blob = new Blob([content], {type}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "references.bib"; a.click();`
```

---

## 18 — GLOBAL COMPONENTS

### AIChatManager (`src/components/ai-chat/AIChatManager.tsx`)
```
MOBILE IMPROVEMENTS:
1. The AI chat FAB on mobile should be a circular button (56px diameter) fixed at
   bottom-right: 20px, bottom: 80px (above the MobileBottomNav).
   Pressing it opens the chat as a full-screen bottom sheet (85vh height, rounded top corners).

2. Chat input: sticky at bottom of the sheet with `padding-bottom: env(safe-area-inset-bottom)`.
   Send button: 44px circular, primary gradient background.

3. Add typing indicator (3 animated dots) when AI is processing.
   CSS: three 6px circles with staggered scale animations (0.8s delay each).

4. Add conversation starters: when chat is empty, show 4 preset question chips:
   "Summarize my latest document", "Find related papers", "Explain this concept", "What should I read next?".

5. Message actions: long-press a message → context menu (Copy | Quote | Add to Notes | Regenerate).

ALL VIEWPORTS:
6. Add model selector dropdown in the chat header: allows switching between
   OpenAI GPT-4 / Claude 3 / Gemini Pro (UI only — stores selection in localStorage "ai-model").

7. Add "Export chat" button: downloads the conversation as a markdown file.
```

### GlobalSearchModal (`src/components/search/GlobalSearchModal.tsx`)
```
1. Recent searches: show last 5 searches as chip row below the search input (on empty state).
   Store in localStorage "global-search-history".

2. Keyboard navigation: up/down arrows navigate results, Enter opens selected result.

3. Search result types: show type icon before each result:
   📄 Document | 📊 Segment | 👤 Researcher | 🏷️ Tag | ⚙️ Setting.

4. Add a "Search everywhere" section: if no results in local data, show a button
   "Search in Research Hub for '{query}'" that navigates to /research with query pre-filled.

5. Animate results list: each result fades in with 30ms stagger delay (animation-delay: {i * 0.03}s).
```

### PageShell / Layout (`src/components/layout/PageShell.tsx`)
```
1. Add a global loading bar (thin 3px progress bar at very top of viewport, below the accent bar)
   that fills from 0% to 100% during page transitions.
   Use a ref to animate: start at 30% immediately, jump to 80% when route changes, 100% + fade on complete.

2. HomeSideNav (src/components/nav/HomeSideNav.tsx):
   - Add keyboard navigation: up/down arrow keys cycle through nav items when focus is inside the sidebar.
   - Add a divider line between MAIN / RESEARCH / COLLABORATION / COMMUNITY groups.
   - Add a "Collapse all" link at the very bottom that collapses the sidebar to mini mode.
   - Add tooltips on mini mode (collapsed): show nav item label as a tooltip on hover.

3. Add a breadcrumb trail below the page header on desktop:
   Dashboard > Research Hub > Search Results
   Styled: muted text, 11px, separator "›", clickable links.
```

---

## 19 — BACKEND / API LAYER (`artifacts/api-server/`)

```
FILE: artifacts/api-server/src/index.ts and route files
PURPOSE: Express API server serving the frontend.

1. Add demo mode endpoint: GET /api/demo-data
   Returns all seeded demo data (users, documents, segments, library items, activities).
   When frontend detects demo_mode in localStorage, call this endpoint instead of real endpoints.

2. Add request logging middleware:
   Morgan-style: `[METHOD] /path STATUS ms` to stdout.
   Color-code by status: 2xx green, 4xx yellow, 5xx red (using ANSI codes).

3. Add CORS configuration for preview domain:
   `origin: process.env.REPLIT_DEV_DOMAIN || "*"` so the proxied preview works correctly.

4. Add rate limiting on AI chat endpoint:
   10 requests/minute per IP using a simple Map<ip, {count, resetAt}> in memory.
   Return 429 with `{ error: "Rate limit exceeded", retryAfter: seconds }`.

5. Add health check endpoint: GET /api/health
   Returns: `{ status: "ok", uptime: process.uptime(), version: "1.0.0", timestamp: Date.now() }`.
   Frontend can ping this on load to determine if backend is available.
   If health check fails → automatically enable demo mode.

6. Add request validation middleware using zod schemas for all POST/PUT endpoints.
   Return 400 with field-level error messages on validation failure.
```

---

## 20 — PERFORMANCE & BUILD OPTIMIZATIONS

```
FILES: artifacts/ai-organizer/vite.config.ts, package.json

1. Code splitting: ensure every page component is lazy-loaded:
   `const LibraryPage = lazy(() => import("./pages/LibraryPage"));`
   Wrap route renders in <Suspense fallback={<PageSkeleton />}>.
   A PageSkeleton: full-height shimmer block matching the typical page structure.

2. Image optimization: any user-uploaded images should be resized client-side before upload.
   Use createImageBitmap + OffscreenCanvas to resize to max 1200px width, quality 0.85, WEBP format.

3. Bundle analysis: add to vite.config.ts:
   `import { visualizer } from "rollup-plugin-visualizer"` and `plugins: [visualizer({ open: false, filename: "bundle-stats.html" })]`.

4. Prefetch critical routes: in App.tsx, on idle (`requestIdleCallback`), prefetch:
   `import("./pages/LibraryPage")`, `import("./pages/ResearchHub")`.

5. Memoization audit: scan all useMemo/useCallback for missing dependencies.
   Key ones to check: all `...List.filter(...).map(...)` chains in LibraryPage, HomeStoriesStrip.

6. Web Vitals monitoring: add `getCLS, getFID, getLCP` from `web-vitals` package.
   Log to console.log in development. In production, send to /api/metrics.

7. Service Worker (PWA): add a basic service worker via vite-plugin-pwa:
   `pnpm add -D vite-plugin-pwa` — caches static assets, enables "Add to Home Screen" on mobile.
   Manifest: name="Think!Hub", short_name="Think", theme_color=primary, background_color=dark.
```

---

## HOW TO USE THESE PROMPTS WITH CLAUDE

1. **Single-page improvement:** Copy the entire section for that page + paste the Global section header.
   Start your message with: *"You are improving Think!Hub (React+Vite+TypeScript academic platform).
   Apply ALL of the following improvements to [file]. Use inline styles with HSL tokens only."*

2. **Full platform audit:** Paste the Global section (Section 0) as a first message.
   Then paste individual page sections one by one in follow-up messages.

3. **Mobile-first pass:** Extract all `MOBILE IMPROVEMENTS` bullets from every section,
   group them, and send as a single prompt: *"Make all of the following mobile improvements..."*

4. **Automated implementation:** Give Claude access to the repo via filesystem tools,
   then paste the full document as context with: *"Read the existing code for each file mentioned,
   then apply ALL changes described. Write complete files, not diffs."*

---
*Generated by Think!Hub UI/UX audit — March 2026*
*Repository: https://github.com/Animus1991/ai-organizer-frontend*
