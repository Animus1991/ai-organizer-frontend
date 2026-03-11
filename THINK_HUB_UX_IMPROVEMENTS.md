# Think!Hub — State-of-the-Art UX/UI Improvement Roadmap

## App Purpose & Audience
Think!Hub is an **AI-powered research, document management, and intelligent analysis platform**
for academics, researchers, data scientists, and startup founders. Core user jobs:
1. Upload & parse research documents (PDF, DOCX)
2. Segment & semantically index content
3. AI-assisted search, summarisation & Q&A over their corpus
4. Community knowledge sharing (stories, discussions)
5. Collaborative project & milestone tracking

---

## APPLIED CHANGES (already committed)

### 1. `AcademicQuickActions.tsx` — Tiered Visual Hierarchy
**Before:** 6–9 action cards in a flat uniform grid, all equal visual weight.
**After:**
- **Tier 1 – 3 Primary Hero Cards** (Upload, Search, AI Assistant): large gradient-background
  cards (130px+ tall), coloured top-accent stripe, animated hover with translateY + shadow,
  arrow-right hint icon, each card has its own gradient angle for visual variety.
- **Tier 2 – Secondary Compact Pills** (Analytics, Import, Browse, Submit, Collaborate,
  Benchmark): small pill buttons in a flex-wrap row, show colour accent on hover only,
  collapse under "+2 more" toggle.
- **Mobile**: unchanged 4-column icon grid (already good).

### 2. `AcademicHeroCard.tsx` — Living Dashboard Welcome Banner
**Before:** Static card with flat muted stat boxes and generic subtitle.
**After:**
- **Gradient mesh background**: linear-gradient card + radial blob top-right.
- **Badge row**: teal "AI-Powered Research Hub" pill + orange "N-day streak" Flame badge
  (reads localStorage `research-streak` just like the Hero section already does).
- **Count-up animation**: each stat value animates from 0 → target on mount (800ms).
- **Colour-coded stat cards**: Documents=primary, Processed=success, Segments=accent,
  Accuracy=warning — each with its own icon + hover effect.
- **Polished CTAs**: solid primary button with glow box-shadow for "Explore Documents";
  ghost border button for "Upload Document". Both have hover lift transitions.

---

## RECOMMENDED NEXT CHANGES (Claude prompts below)

---

### PRIORITY 1 — Home.tsx: Gradient Top Accent Bar
**Impact:** High — immediate premium feel on first load.

**Prompt for Claude:**
```
You are editing `artifacts/ai-organizer/src/pages/Home.tsx`.

Inside the return statement, immediately after the opening `<div className="min-h-screen homeShell ...">`,
add a 3 px fixed-position gradient accent bar at the very top of the viewport:

```tsx
{/* Top gradient accent bar — spans full viewport width above all content */}
<div
  aria-hidden
  style={{
    position: "fixed",
    top: 0, left: 0, right: 0,
    height: 3,
    background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
    backgroundSize: "200% 100%",
    animation: "accentBarShimmer 4s ease-in-out infinite",
    zIndex: 9998,
    pointerEvents: "none",
  }}
/>
```

Also add the keyframe to the `<style>` tag that already exists in the file
(it renders `{getHomeStyles(colors)}`). Or add a second `<style>` tag:

```tsx
<style>{`
  @keyframes accentBarShimmer {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
`}</style>
```
```

---

### PRIORITY 2 — HomeHeader.tsx: Reduce Visual Clutter
**Impact:** High — current header has 10+ interactive elements in one bar.

**Prompt for Claude:**
```
You are editing `artifacts/ai-organizer/src/components/home/HomeHeader.tsx`.

The header currently renders a theme button that shows both an icon AND the text label
(e.g., "Dark"). On desktop (not mobile), change it to icon-only with a tooltip.
Find the JSX that renders the theme picker button and remove the text label span,
keeping only the icon and the chevron. Add `title={themeInfo.label}` to the button.

Also: the view-mode buttons "Grid / 3D Carousel / Carousel" are currently rendered inside
the HomeHeader with keyboard shortcut hints. Move the keyboard shortcut hint spans
(the elements showing "G", "3", "C") into a `title` attribute tooltip instead of
visible text, to reduce header density.

Result: header should be visually lighter while retaining all functionality.
```

---

### PRIORITY 3 — HomeStoriesStrip.tsx: Tag Chips Visible on Story Cards
**Impact:** Medium — helps users understand story content at a glance before clicking.

**Prompt for Claude:**
```
You are editing `artifacts/ai-organizer/src/components/home/HomeStoriesStrip.tsx`.

Find the story card rendering section (where each story card is rendered as a clickable
div in the horizontal scroll strip). Currently cards show: author avatar, author name,
age, category icon, title, and engagement stats.

Add the following below the title and above the engagement stats row:
1. **Tag chips**: render up to 2 of `story.tags` as small pill badges.
   Each chip: `padding: "2px 7px"`, `borderRadius: 999`, `fontSize: 10`, `fontWeight: 600`,
   `background: hsl(var(--muted))`, `color: hsl(var(--muted-foreground))`.
   If there are more than 2 tags, add a "+N" chip.

2. **Reading time estimate**: calculate `Math.ceil(story.body.split(" ").length / 200)` minutes.
   Add a small `Clock3` icon + "{N} min read" line in `fontSize: 10`,
   `color: hsl(var(--muted-foreground))` below the tag chips.

3. **Desktop scroll arrows**: Wrap the horizontal scroll container with a relative-positioned
   parent div. Add two `<button>` elements (left arrow `←`, right arrow `→`) absolutely
   positioned at left: -16px and right: -16px, vertically centred.
   On click, call `scrollRef.current?.scrollBy({ left: ±300, behavior: "smooth" })`.
   Hide them when the scroll is at the start/end respectively using a scroll-event listener.
   Style: 32×32 px circle, `background: hsl(var(--card))`, `border: 1px solid hsl(var(--border))`,
   `boxShadow: 0 2px 8px hsl(var(--background)/0.4)`.
```

---

### PRIORITY 4 — LibraryPage.tsx: Kanban / Shelf View Mode
**Impact:** Medium — core power-user feature for document organisation.

**Prompt for Claude:**
```
You are editing `artifacts/ai-organizer/src/pages/LibraryPage.tsx`.

Currently the library only has a list/grid card view. Add a "Shelf" view mode
that groups documents visually by category in a kanban-style column layout.

Steps:
1. Add a `viewMode` state: `"grid" | "list" | "shelf"` (default: "grid").
2. Add a view-mode toggle button group in the filter bar area (three icons:
   `LayoutGrid`, `List`, `LayoutPanelLeft` from lucide-react).
3. When `viewMode === "shelf"`:
   - Group `displayedItems` by their `category` field.
   - Render each category as a vertical column with a sticky header showing the category
     name, count, and a coloured left-border accent.
   - Inside each column, render compact `LibraryItemCard` components stacked vertically.
   - The shelf layout uses a horizontal flexbox that scrolls left-right:
     `display: flex, flexDirection: row, overflowX: auto, gap: 20, paddingBottom: 12`
   - Each column: `minWidth: 280, maxWidth: 320, display: flex, flexDirection: column, gap: 8`

All existing filter, search, sort, and favourites logic should work across all three modes.
```

---

### PRIORITY 5 — ProfilePage.tsx: Profile Completeness Ring
**Impact:** Medium — drives engagement for new users.

**Prompt for Claude:**
```
You are editing `artifacts/ai-organizer/src/pages/ProfilePage.tsx`.

Add a "Profile Completeness" indicator to the top of the profile page,
rendered just below the profile cover image and above the main content.

Implementation:
1. Calculate completeness score as a percentage based on filled fields in `profile`:
   - bio: 15 pts
   - institution: 15 pts
   - department: 10 pts
   - position: 10 pts
   - website: 10 pts
   - orcid: 10 pts
   - expertise (length > 0): 15 pts
   - researchInterests (length > 0): 15 pts
   Total: 100 pts.

2. Render a horizontal progress bar component:
   ```tsx
   <div style={{ padding: "12px 20px", background: "hsl(var(--card))", borderRadius: 12,
     border: "1px solid hsl(var(--border))", marginBottom: 16 }}>
     <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
       <span style={{ fontSize: 13, fontWeight: 700 }}>Profile Completeness</span>
       <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--primary))" }}>
         {score}%
       </span>
     </div>
     <div style={{ height: 6, borderRadius: 999, background: "hsl(var(--muted))" }}>
       <div style={{
         height: "100%", borderRadius: 999, width: `${score}%`,
         background: score === 100
           ? "hsl(var(--success))"
           : score > 60 ? "hsl(var(--primary))" : "hsl(var(--warning))",
         transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
       }} />
     </div>
     {score < 100 && (
       <p style={{ margin: "8px 0 0", fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
         Complete your profile to increase visibility in the research community.
       </p>
     )}
   </div>
   ```

3. If `editMode` is false and score < 60, show a subtle pulsing "Complete profile →" CTA
   that sets `setEditMode(true)` on click.
```

---

### PRIORITY 6 — SettingsPage.tsx: In-Page Settings Search
**Impact:** Medium — critical UX for power users navigating 10+ settings sections.

**Prompt for Claude:**
```
You are editing `artifacts/ai-organizer/src/pages/SettingsPage.tsx` and
`artifacts/ai-organizer/src/components/settings/SettingsSidebar.tsx`.

Add a settings search input at the top of the SettingsSidebar component.

1. In `SettingsSidebar.tsx`:
   - Add a `searchQuery: string` prop and `onSearchChange: (q: string) => void` prop.
   - At the top of the sidebar list, add an `<input>` element:
     ```tsx
     <input
       type="text"
       placeholder="Search settings..."
       value={searchQuery}
       onChange={e => onSearchChange(e.target.value)}
       style={{
         width: "100%", padding: "8px 12px", borderRadius: "var(--radius)",
         border: "1px solid hsl(var(--border))",
         background: "hsl(var(--muted))", color: "hsl(var(--foreground))",
         fontSize: 13, outline: "none", marginBottom: 8,
       }}
     />
     ```
   - Filter the sidebar nav items to show only those whose label includes `searchQuery`
     (case-insensitive). If searchQuery is empty, show all.

2. In `SettingsPage.tsx`:
   - Add `const [settingsSearch, setSettingsSearch] = useState("")` state.
   - Pass `searchQuery={settingsSearch}` and `onSearchChange={setSettingsSearch}` to
     `<SettingsSidebar>`.
```

---

### PRIORITY 7 — ResearchHub.tsx / Research Lab: AI-Suggested Next Steps
**Impact:** High for power users — makes the AI feel proactive, not reactive.

**Prompt for Claude:**
```
You are editing `artifacts/ai-organizer/src/pages/ResearchHub.tsx` (or the relevant
research lab page component).

Add an "AI Suggested Actions" panel — a non-intrusive card shown near the top of the page
that reads from localStorage to surface contextual next-step suggestions.

Logic:
- If `uploads.length === 0`: suggest "Upload your first document to begin AI analysis"
- If `parsedCount > 0 && totalSegments === 0`: suggest "Segment your documents to enable semantic search"
- If `totalSegments > 0`: suggest "Run a semantic search across your {totalSegments} segments"
- Always show: "Explore your Theory Repo for cross-document patterns"

UI: render as a horizontal scrollable strip of suggestion chips at the top of the page.
Each chip: `padding: "8px 16px"`, rounded-full, primary/accent colour, `cursor: pointer`,
clicking navigates to the relevant route or triggers the relevant action.

Add a small `Sparkles` icon from lucide-react at the start of each chip.
Add an `×` dismiss button that saves dismissed state to localStorage per suggestion key.
```

---

## Cross-Cutting Technical Improvements

### Performance
```
Prompt for Claude:
In `artifacts/ai-organizer/src/pages/Home.tsx`, several section components are loaded
lazily (HomeCommunityStrip, HomeDashboardFeedPanel, HomeEnhancementsSection).

Improve the Suspense fallback for each lazy section:
Instead of `<SectionErrorFallback>`, use `<SkeletonBlock>` with the appropriate
`count` and `height` props that match the expected rendered height of that section.
This eliminates layout shift during lazy load.

For HomeCommunityStrip: `<SkeletonBlock count={3} height={120} />`
For HomeDashboardFeedPanel: `<SkeletonBlock count={5} height={60} />`
For HomeEnhancementsSection: `<SkeletonBlock count={2} height={180} />`
```

### Accessibility
```
Prompt for Claude:
Audit `artifacts/ai-organizer/src/components/home/HomeStoriesStrip.tsx`.
Add `role="feed"` to the stories list container.
Add `aria-label="Research story: {story.title} by {story.authorName}"` to each story card button.
Add `aria-live="polite"` and `aria-atomic="true"` to the story viewer progress bar container.
Add keyboard navigation to the story viewer: already has ← → Escape, but add
`aria-keyshortcuts="ArrowLeft ArrowRight Escape"` to the viewer overlay.
```

### i18n Hardcoding Cleanup
```
Prompt for Claude:
Scan `artifacts/ai-organizer/src/components/home/AcademicQuickActions.tsx`.
The "Show less" / "more" strings use `t(key) || "hardcoded"` pattern.
Add the following keys to `artifacts/ai-organizer/src/i18n/en.json`
(or whichever translation file holds `home.quickActions.*` keys):
  "home.quickActions.more": "more"
  "home.quickActions.showLess": "Show less"
  "home.quickActions.showMore": "Show more"
If the translation file is a TypeScript object, add them there instead.
```

---

## Summary Table

| # | File | Change | Impact | Effort |
|---|------|--------|--------|--------|
| ✅ | AcademicQuickActions.tsx | Tiered primary/secondary hierarchy | High | Done |
| ✅ | AcademicHeroCard.tsx | Gradient banner + count-up + coloured stats | High | Done |
| 1 | Home.tsx | Animated gradient top accent bar | High | 10 min |
| 2 | HomeHeader.tsx | Icon-only theme button, remove shortcut text | High | 15 min |
| 3 | HomeStoriesStrip.tsx | Tag chips + reading time + scroll arrows | Medium | 30 min |
| 4 | LibraryPage.tsx | Shelf/kanban view mode | Medium | 45 min |
| 5 | ProfilePage.tsx | Profile completeness progress bar | Medium | 20 min |
| 6 | SettingsSidebar.tsx | In-settings search input | Medium | 20 min |
| 7 | ResearchHub.tsx | AI-suggested next steps panel | High | 30 min |
| — | Home.tsx | Skeleton fallbacks for lazy sections | Low | 15 min |
| — | HomeStoriesStrip.tsx | ARIA roles + keyboard shortcuts | Low | 15 min |
