# DesignLens — Design Specification

## Overview

DesignLens is a SaaS web application that helps developers and designers extract design systems from reference images, build moodboards, get AI-powered UI feedback, and export design tokens. The system learns from aggregated usage data to evolve its own design over time.

**Target users:** Developers, designers, and non-designers who struggle with UI/UX quality.

**Core value proposition:** "Design smarter, not from scratch" — instead of starting every project with a blank canvas, extract proven design patterns from references you admire.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Image analysis (algorithmic) | Color extraction, typography detection via canvas/sharp |
| Image analysis (AI) | Claude API (multimodal) for UI feedback and layout analysis |
| Storage | Local/cloud image storage (MVP: local uploads) |
| Database | MVP: localStorage → later Postgres/Supabase |
| Deployment | Vercel |

---

## Design System — "Cool Steel"

### Color Tokens

```
--bg-deep:       #0C0D0F    // page background
--bg-surface:    #131519    // cards, sidebar
--bg-elevated:   #1A1D23    // elevated elements
--bg-hover:      #1F2229    // hover states
--border:        #1E2028    // default borders
--border-hover:  #2A2D38    // hover borders
--text-primary:  #E8EAED    // headings, primary text
--text-secondary:#5A5F6B    // body, descriptions
--text-tertiary: #3A3F4B    // labels, placeholders
--accent:        #93C5FD    // ice blue, used sparingly
--accent-dim:    rgba(147,197,253,0.08)  // accent backgrounds
--accent-border: rgba(147,197,253,0.15)  // accent borders
```

### Design Principles

- **Monochromatic first.** Color is used as exception, not rule. The accent (#93C5FD) appears only in: active states, badges, and headline highlights.
- **Typography carries hierarchy.** Size, weight, and spacing do the heavy lifting — not color.
- **Generous spacing.** Sections: 128px. Cards: 24px. Elements: 8px.
- **Subtle interactions.** Hover = background shift + border lighten. No dramatic color changes.
- **1px borders as structure.** Sections divided by thin lines, not background color shifts.

### Typography

- Font: Inter (variable weight)
- Headlines: 44-72px, weight 700-800, letter-spacing -1.8px to -2.5px, line-height 1.0
- Body: 13-15px, weight 400-500, letter-spacing -0.2px, line-height 1.6
- Labels: 10-11px, weight 500-600, uppercase, letter-spacing 1-2px
- Code/tokens: JetBrains Mono, 11-12px

---

## Architecture — Page-Based (MVP)

### Pages

1. **Landing Page** (`/`) — Marketing, hero with product preview, features, workflow, CTA
2. **Workspace** (`/app`) — Main application interface
3. **Pricing** (`/pricing`) — Plans and billing (stub for MVP)

### Workspace Layout

Three-panel layout:

```
┌──────────┬────────────────────┬──────────────┐
│ Sidebar  │   Content Area     │  Analysis    │
│ 240px    │   flex: 1          │  Panel 360px │
│          │                    │              │
│ - Tools  │  - Upload zone     │  - Colors    │
│ - Projects│  - Reference grid │  - Typography│
│          │                    │  - Layout    │
│          │                    │  - Tokens    │
├──────────┴────────────────────┴──────────────┤
│              AI Feedback Bar (52px)           │
└──────────────────────────────────────────────┘
```

---

## Core Features (MVP)

### 1. Reference Analysis

**Input:** User uploads screenshot (PNG/JPG/WebP) or pastes URL.

**Algorithmic extraction:**
- Dominant colors (top 5-8) with percentage breakdown
- Color role detection (background, text, accent, border)
- Font size/weight distribution from visual analysis

**AI analysis (Claude API, multimodal):**
- Layout pattern identification (grid, single-column, sidebar, etc.)
- Spacing system estimation
- Typography style classification
- Overall design tone assessment

**Output:** Structured analysis displayed in the right panel with tabs (Colors, Typography, Layout, Tokens).

### 2. Moodboard Builder

- Drag-and-drop reference organization
- Group references by project
- AI finds common patterns across multiple references
- Visual grid display with thumbnails

### 3. UI Review

**Input:** User uploads their own UI screenshot.

**Process:**
1. Compare uploaded UI against the user's collected references/design system
2. Claude API analyzes: visual hierarchy, consistency, accessibility (contrast ratios), spacing regularity
3. Generate actionable suggestions with specific improvement areas highlighted

**Output:** Before/after comparison view with annotated suggestions.

### 4. Design Token Export

Generated from analyzed references. Export formats:
- **CSS Custom Properties** (`--primary: #6366f1;`)
- **Tailwind Config** (extend theme object)
- **JSON** (raw token data)

Token categories: colors, typography, spacing, border-radius, shadows.

### 5. Self-Evolving System

**Data collection (anonymized):**
- Color palettes analyzed across all users
- Layout patterns frequency
- Typography trends
- Seasonal shifts

**Feedback loop:**
- Trending design patterns dashboard (public or per-user)
- App's own UI tokens can be updated based on aggregated trends
- MVP: Manual trend report; later: automated A/B testing of UI changes

---

## Landing Page Structure

```
1. Nav (fixed, blur backdrop, minimal)
2. Hero
   - Badge: "AI-powered design analysis"
   - H1: "Design smarter, not from scratch"
   - Subtitle + dual CTA
   - Product preview (workspace mockup, embedded)
3. Features (3x2 grid, 1px border cells)
4. Workflow (4-step horizontal)
5. Self-Evolving section (text + trend bar chart)
6. Final CTA
7. Footer (4-column)
```

**Animations:**
- Hero: fadeInUp staggered (badge → h1 → subtitle → CTAs → preview)
- Sections: scroll-triggered reveal (IntersectionObserver)
- Hover: translateY(-1px) + border lighten
- No heavy parallax or decorative motion

---

## Workspace Interaction Flow

```
User opens /app
  → Sees empty workspace with upload zone
  → Drops reference images
  → Each image: processing → analyzed (status badge)
  → Clicks analyzed reference
  → Right panel shows analysis (Colors tab default)
  → Switches tabs: Typography, Layout, Tokens
  → Can export tokens (CSS/Tailwind/JSON)
  → Bottom bar shows AI insight summary
  → Switches to "UI Review" tool
  → Uploads own UI screenshot
  → Gets comparison + suggestions
```

---

## API Design (Internal)

### Image Analysis
```
POST /api/analyze
Body: { image: File | URL }
Response: {
  colors: [{ hex, role, percentage }],
  typography: [{ size, weight, letterSpacing, role }],
  layout: { type, spacing, grid },
  tokens: { colors: {}, spacing: {}, radius: {} }
}
```

### AI Review
```
POST /api/review
Body: { image: File, designSystem: TokenSet }
Response: {
  score: number,
  issues: [{ area, severity, suggestion, coordinates }],
  improved: { tokens: TokenSet }
}
```

### Trend Data
```
GET /api/trends
Response: {
  colors: [{ palette, frequency }],
  layouts: [{ type, frequency }],
  typography: [{ style, frequency }],
  period: "2026-03"
}
```

---

## MVP Scope Boundaries

### In scope
- Landing page with Cool Steel design
- Workspace with 3-panel layout
- Reference upload and algorithmic color extraction
- AI analysis via Claude API (layout, typography, feedback)
- Moodboard basic grid
- UI Review with suggestions
- Token export (CSS, Tailwind, JSON)
- Self-evolving: basic trend tracking dashboard

### Out of scope (post-MVP)
- User authentication / accounts
- Cloud storage / project persistence across devices
- Team collaboration
- Figma/Sketch plugin
- Automated A/B testing of app UI
- Payment / billing
- Real-time collaboration

---

## File Structure (Proposed)

```
designlens/
├── app/
│   ├── page.tsx              # Landing
│   ├── app/
│   │   └── page.tsx          # Workspace
│   ├── api/
│   │   ├── analyze/route.ts
│   │   ├── review/route.ts
│   │   └── trends/route.ts
│   └── layout.tsx
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Workflow.tsx
│   │   ├── Evolving.tsx
│   │   └── Footer.tsx
│   ├── workspace/
│   │   ├── Sidebar.tsx
│   │   ├── RefGrid.tsx
│   │   ├── AnalysisPanel.tsx
│   │   ├── UploadZone.tsx
│   │   └── FeedbackBar.tsx
│   └── ui/                   # Shared UI primitives
├── lib/
│   ├── analyze.ts            # Color extraction, image processing
│   ├── ai.ts                 # Claude API integration
│   └── tokens.ts             # Token generation & export
├── styles/
│   └── globals.css           # Tailwind + custom properties
└── public/
```

---

## Design Reference Files

Visual mockups created during brainstorming:
- Landing page: `.superpowers/brainstorm/*/landing-v2.html`
- Workspace: `.superpowers/brainstorm/*/workspace-mockup.html`
- Color exploration: `.superpowers/brainstorm/*/color-minimal.html`
