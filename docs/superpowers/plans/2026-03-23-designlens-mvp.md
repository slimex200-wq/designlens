# DesignLens MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DesignLens MVP — a design assistant SaaS with reference analysis, moodboard builder, UI review, and token export.

**Architecture:** Next.js App Router with Tailwind CSS. Three-panel workspace layout. Algorithmic color extraction via canvas + sharp. AI analysis via Claude API (multimodal). localStorage for user state, uploaded images stored in `/public/uploads` for MVP.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 3, @anthropic-ai/sdk (Claude API), Inter + JetBrains Mono fonts

**Known deviations from spec:** Tailwind v3 (not v4) for stable config-based theming. SQLite/Turso deferred to post-MVP — trends page reads from localStorage. sharp removed — color extraction uses canvas client-side.

**Spec:** `docs/superpowers/specs/2026-03-23-designlens-design.md`

**Design mockups:**
- Landing: `.superpowers/brainstorm/*/landing-v2.html`
- Workspace: `.superpowers/brainstorm/*/workspace-mockup.html`

---

## File Map

```
designlens/
├── app/
│   ├── layout.tsx                    # Root layout, fonts, metadata
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Tailwind config + Cool Steel tokens
│   ├── app/
│   │   ├── layout.tsx                # Workspace layout (3-panel)
│   │   ├── page.tsx                  # Workspace main (analyze view)
│   │   └── trends/
│   │       └── page.tsx              # Trends dashboard
│   └── api/
│       ├── analyze/route.ts          # POST: image analysis endpoint
│       ├── review/route.ts           # POST: AI UI review endpoint
│       └── trends/route.ts           # GET: trend data endpoint
├── components/
│   ├── landing/
│   │   ├── Nav.tsx                   # Fixed nav with blur backdrop
│   │   ├── Hero.tsx                  # Hero + product preview
│   │   ├── Features.tsx              # 3x2 feature grid
│   │   ├── Workflow.tsx              # 4-step workflow
│   │   ├── Evolving.tsx              # Self-evolving section
│   │   ├── FinalCta.tsx              # Bottom CTA
│   │   └── Footer.tsx                # 4-column footer
│   ├── workspace/
│   │   ├── Sidebar.tsx               # Left sidebar (tools + projects)
│   │   ├── UploadZone.tsx            # Drag-and-drop upload
│   │   ├── RefGrid.tsx               # Reference image grid
│   │   ├── RefCard.tsx               # Single reference card
│   │   ├── AnalysisPanel.tsx         # Right panel container
│   │   ├── ColorTab.tsx              # Colors analysis tab
│   │   ├── TypographyTab.tsx         # Typography analysis tab
│   │   ├── LayoutTab.tsx             # Layout analysis tab
│   │   ├── TokenTab.tsx              # Tokens tab + export
│   │   ├── ReviewView.tsx            # UI Review split view
│   │   ├── FeedbackBar.tsx           # Bottom AI insight bar
│   │   └── MoodboardGrid.tsx         # Moodboard view
│   └── ui/
│       ├── ScrollReveal.tsx          # IntersectionObserver wrapper
│       └── Toast.tsx                 # Toast notifications
├── lib/
│   ├── types.ts                      # Shared types (TokenSet, BoundingBox, etc.)
│   ├── colors.ts                     # Color extraction algorithm
│   ├── ai.ts                         # Claude API integration
│   ├── tokens.ts                     # Token generation + export formatters
│   ├── storage.ts                    # localStorage helpers
│   ├── upload.ts                     # Upload validation + file handling
│   └── hash.ts                       # SHA-256 image hashing for cache
├── hooks/
│   ├── useProjects.ts                # Project state management
│   ├── useAnalysis.ts                # Analysis state + API calls
│   └── useUpload.ts                  # Upload handling hook
├── public/
│   └── uploads/                      # Uploaded images (MVP, gitignored)
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.gitignore`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd ~/Desktop/design-assistant
npx create-next-app@latest designlens --typescript --tailwind --eslint --app --src=false --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Move into project and verify**

```bash
cd designlens
npm run dev
```
Expected: dev server starts on localhost:3000

- [ ] **Step 3: Install dependencies**

```bash
npm install @anthropic-ai/sdk
npm install -D @types/node
```

- [ ] **Step 4: Add Cool Steel design tokens to `app/globals.css`**

Replace the default Tailwind content with:

```css
@import "tailwindcss";

@layer base {
  :root {
    --bg-deep: #0C0D0F;
    --bg-surface: #131519;
    --bg-elevated: #1A1D23;
    --bg-hover: #1F2229;
    --border: #1E2028;
    --border-hover: #2A2D38;
    --text-primary: #E8EAED;
    --text-secondary: #8A8F9B;
    --text-tertiary: #3A3F4B;
    --accent: #93C5FD;
    --accent-dim: rgba(147, 197, 253, 0.08);
    --accent-border: rgba(147, 197, 253, 0.15);
    --accent-text: rgba(147, 197, 253, 0.7);
    --success: #4ADE80;
    --success-dim: rgba(74, 222, 128, 0.08);
    --warning: #FBBF24;
    --warning-dim: rgba(251, 191, 36, 0.08);
    --error: #F87171;
    --error-dim: rgba(248, 113, 113, 0.08);
  }

  body {
    background-color: var(--bg-deep);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 5: Configure `tailwind.config.ts` with custom theme**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "var(--bg-deep)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          hover: "var(--bg-hover)",
        },
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
          border: "var(--accent-border)",
          text: "var(--accent-text)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Set up root layout with Inter + JetBrains Mono fonts**

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "DesignLens — Design smarter, not from scratch",
  description: "AI-powered design analysis. Extract colors, typography, layout patterns from any reference.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create placeholder landing page**

```typescript
// app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
        DesignLens
      </h1>
    </div>
  );
}
```

- [ ] **Step 8: Update `.gitignore`**

Add to `.gitignore`:
```
public/uploads/
.superpowers/
```

- [ ] **Step 9: Verify dev server renders correctly**

```bash
npm run dev
```
Expected: dark background, white "DesignLens" text centered

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Cool Steel design tokens"
```

---

## Task 2: Shared Types & Lib Utilities

**Files:**
- Create: `lib/types.ts`, `lib/hash.ts`, `lib/upload.ts`, `lib/storage.ts`
- Test: manual verification (utility functions)

- [ ] **Step 1: Create shared types**

```typescript
// lib/types.ts
export type TokenSet = {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  typography: Array<{
    role: string;
    size: string;
    weight: number;
    letterSpacing: string;
  }>;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ColorInfo = {
  hex: string;
  role: string;
  percentage: number;
};

export type TypographyInfo = {
  size: string;
  weight: number;
  letterSpacing: string;
  role: string;
};

export type LayoutInfo = {
  type: string;
  spacing: Record<string, string>;
  grid: string;
};

export type AnalysisResult = {
  id: string;
  imageHash: string;
  fileName: string;
  colors: ColorInfo[];
  typography: TypographyInfo[];
  layout: LayoutInfo;
  tokens: TokenSet;
  createdAt: string;
};

export type ReviewIssue = {
  area: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
  bounds: BoundingBox;
};

export type ReviewResult = {
  score: number;
  issues: ReviewIssue[];
  improved: TokenSet;
};

export type Project = {
  id: string;
  name: string;
  color: string;
  references: ReferenceImage[];
  createdAt: string;
};

export type ReferenceImage = {
  id: string;
  fileName: string;
  filePath: string;
  status: "uploading" | "processing" | "analyzed" | "error";
  analysis?: AnalysisResult;
  error?: string;
  uploadedAt: string;
};
```

- [ ] **Step 2: Create upload validation**

```typescript
// lib/upload.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RESOLUTION = 4096;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type UploadError = {
  type: "size" | "resolution" | "format";
  message: string;
};

export function validateFile(file: File): UploadError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      type: "format",
      message: `Unsupported format. Use PNG, JPG, or WebP.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: "size",
      message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`,
    };
  }
  return null;
}

export async function validateResolution(file: File): Promise<UploadError | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width > MAX_RESOLUTION || img.height > MAX_RESOLUTION) {
        resolve({
          type: "resolution",
          message: `Image too large (${img.width}x${img.height}). Max ${MAX_RESOLUTION}x${MAX_RESOLUTION}.`,
        });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null); // let server handle corrupt files
    img.src = URL.createObjectURL(file);
  });
}
```

- [ ] **Step 3: Create SHA-256 image hash**

```typescript
// lib/hash.ts
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

- [ ] **Step 4: Create localStorage helpers**

```typescript
// lib/storage.ts
import type { Project, AnalysisResult } from "./types";

const PROJECTS_KEY = "designlens_projects";
const CACHE_KEY = "designlens_analysis_cache";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getCachedAnalysis(hash: string): AnalysisResult | null {
  const data = localStorage.getItem(CACHE_KEY);
  if (!data) return null;
  const cache: Record<string, AnalysisResult> = JSON.parse(data);
  return cache[hash] ?? null;
}

export function setCachedAnalysis(hash: string, result: AnalysisResult): boolean {
  const data = localStorage.getItem(CACHE_KEY);
  const cache: Record<string, AnalysisResult> = data ? JSON.parse(data) : {};
  cache[hash] = result;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("localStorage full");
      return false; // caller should show toast: "Storage full. Export or clear old projects."
    }
    throw e;
  }
}

export function saveProjectsSafe(projects: Project[]): boolean {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("localStorage full");
      return false;
    }
    throw e;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/
git commit -m "feat: add shared types and utility libraries"
```

---

## Task 3: Color Extraction Algorithm

**Files:**
- Create: `lib/colors.ts`
- Test: manual with sample image

- [ ] **Step 1: Create color extraction using canvas**

```typescript
// lib/colors.ts
import type { ColorInfo } from "./types";

type RGB = [number, number, number];

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function classifyRole(hex: string, rgb: RGB, rank: number, totalPixels: number, count: number): string {
  const luminance = getLuminance(rgb[0], rgb[1], rgb[2]);
  const percentage = (count / totalPixels) * 100;

  if (percentage > 30 && luminance < 0.1) return "background";
  if (percentage > 30 && luminance > 0.8) return "background";
  if (rank === 0) return "background";
  if (luminance > 0.7 && percentage > 10) return "text";
  if (luminance < 0.15 && percentage > 10) return "text";
  if (percentage < 10 && percentage > 2) return "accent";
  if (percentage <= 2) return "border";
  return "secondary";
}

export function extractColors(imageData: Uint8ClampedArray, width: number, height: number): ColorInfo[] {
  const sampleStep = Math.max(1, Math.floor((width * height) / 50000));
  const colorCounts = new Map<string, { rgb: RGB; count: number }>();

  for (let i = 0; i < imageData.length; i += 4 * sampleStep) {
    const r = Math.round(imageData[i] / 8) * 8;
    const g = Math.round(imageData[i + 1] / 8) * 8;
    const b = Math.round(imageData[i + 2] / 8) * 8;
    const key = `${r},${g},${b}`;

    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { rgb: [r, g, b], count: 1 });
    }
  }

  // Sort by frequency
  const sorted = Array.from(colorCounts.values()).sort((a, b) => b.count - a.count);

  // Merge similar colors (distance < 30)
  const merged: Array<{ rgb: RGB; count: number }> = [];
  for (const color of sorted) {
    const similar = merged.find((m) => colorDistance(m.rgb, color.rgb) < 30);
    if (similar) {
      similar.count += color.count;
    } else {
      merged.push({ ...color });
    }
    if (merged.length >= 20) break;
  }

  merged.sort((a, b) => b.count - a.count);
  const totalSampled = merged.reduce((sum, c) => sum + c.count, 0);
  const top = merged.slice(0, 8);

  return top.map((c, i) => ({
    hex: rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]),
    role: classifyRole(rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]), c.rgb, i, totalSampled, c.count),
    percentage: Math.round((c.count / totalSampled) * 100),
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/colors.ts
git commit -m "feat: add color extraction algorithm"
```

---

## Task 4: Claude AI Integration

**Files:**
- Create: `lib/ai.ts`

- [ ] **Step 1: Create Claude API wrapper**

```typescript
// lib/ai.ts
import Anthropic from "@anthropic-ai/sdk";
import type { TypographyInfo, LayoutInfo, TokenSet, ReviewResult } from "./types";

const client = new Anthropic();

export async function analyzeDesign(imageBase64: string, mimeType: string) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg" | "image/webp", data: imageBase64 },
          },
          {
            type: "text",
            text: `Analyze this UI screenshot. Return JSON only, no markdown:
{
  "typography": [{"role": "heading"|"body"|"label"|"caption", "size": "px value", "weight": number, "letterSpacing": "px value"}],
  "layout": {"type": "single-column"|"two-column"|"grid"|"sidebar"|"dashboard", "spacing": {"section": "px", "card": "px", "element": "px"}, "grid": "description"},
  "tokens": {
    "colors": {"--name": "#hex"},
    "spacing": {"--name": "px"},
    "radius": {"--name": "px"},
    "typography": [{"role": "string", "size": "px", "weight": number, "letterSpacing": "px"}]
  }
}`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text) as {
      typography: TypographyInfo[];
      layout: LayoutInfo;
      tokens: TokenSet;
    };
  } catch {
    throw new Error("Failed to parse AI analysis response");
  }
}

export async function reviewUI(
  imageBase64: string,
  mimeType: string,
  designSystem: TokenSet
): Promise<ReviewResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg" | "image/webp", data: imageBase64 },
          },
          {
            type: "text",
            text: `Review this UI against the following design system:
${JSON.stringify(designSystem, null, 2)}

Evaluate: visual hierarchy, color consistency, spacing regularity, contrast/accessibility.

Return JSON only:
{
  "score": 0-100,
  "issues": [{"area": "description", "severity": "high"|"medium"|"low", "suggestion": "actionable fix", "bounds": {"x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100}}],
  "improved": { same TokenSet format with suggested improvements }
}`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text) as ReviewResult;
  } catch {
    throw new Error("Failed to parse AI review response");
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ai.ts
git commit -m "feat: add Claude API integration for design analysis and review"
```

---

## Task 5: Token Generation & Export

**Files:**
- Create: `lib/tokens.ts`

- [ ] **Step 1: Create token formatters**

```typescript
// lib/tokens.ts
import type { TokenSet } from "./types";

export function toCSS(tokens: TokenSet): string {
  const lines = [":root {"];

  for (const [key, value] of Object.entries(tokens.colors)) {
    lines.push(`  ${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.spacing)) {
    lines.push(`  ${key}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.radius)) {
    lines.push(`  ${key}: ${value};`);
  }

  lines.push("}");
  return lines.join("\n");
}

export function toTailwind(tokens: TokenSet): string {
  const config: Record<string, Record<string, string>> = {
    colors: {},
    spacing: {},
    borderRadius: {},
  };

  for (const [key, value] of Object.entries(tokens.colors)) {
    const name = key.replace(/^--/, "").replace(/-/g, ".");
    config.colors[name] = value;
  }
  for (const [key, value] of Object.entries(tokens.spacing)) {
    const name = key.replace(/^--space-/, "");
    config.spacing[name] = value;
  }
  for (const [key, value] of Object.entries(tokens.radius)) {
    const name = key.replace(/^--radius-/, "");
    config.borderRadius[name] = value;
  }

  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: ${JSON.stringify(config, null, 6).replace(/"/g, "'")},
  },
};`;
}

export function toJSON(tokens: TokenSet): string {
  return JSON.stringify(tokens, null, 2);
}

export function exportTokens(tokens: TokenSet, format: "css" | "tailwind" | "json"): string {
  switch (format) {
    case "css": return toCSS(tokens);
    case "tailwind": return toTailwind(tokens);
    case "json": return toJSON(tokens);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/tokens.ts
git commit -m "feat: add token generation and export (CSS, Tailwind, JSON)"
```

---

## Task 6: API Routes

**Files:**
- Create: `app/api/analyze/route.ts`, `app/api/review/route.ts`, `app/api/trends/route.ts`

- [ ] **Step 1: Create analyze endpoint**

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { analyzeDesign } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type;

    // AI analysis — may fail if API is down
    let aiResult = null;
    try {
      aiResult = await analyzeDesign(base64, mimeType);
    } catch (aiError) {
      console.warn("AI analysis failed, returning colors-only:", aiError);
    }

    // Note: algorithmic color extraction runs client-side via canvas + extractColors()
    // (see hooks/useUpload.ts). This endpoint provides AI-powered analysis only.
    // If AI fails, client still has algorithmic colors.

    return NextResponse.json({
      typography: aiResult?.typography ?? [],
      layout: aiResult?.layout ?? { type: "unknown", spacing: {}, grid: "" },
      tokens: aiResult?.tokens ?? { colors: {}, spacing: {}, radius: {}, typography: [] },
      aiAvailable: aiResult !== null,
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create review endpoint**

```typescript
// app/api/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { reviewUI } from "@/lib/ai";
import type { TokenSet } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const designSystemStr = formData.get("designSystem") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (!designSystemStr) {
      return NextResponse.json({ error: "No design system provided" }, { status: 400 });
    }

    let designSystem: TokenSet;
    try {
      designSystem = JSON.parse(designSystemStr);
    } catch {
      return NextResponse.json({ error: "Invalid design system format" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await reviewUI(base64, file.type, designSystem);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Review failed:", error);
    return NextResponse.json(
      { error: "Review failed. Please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create trends endpoint (stub)**

```typescript
// app/api/trends/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // MVP: return empty trends, populated by client-side data
  return NextResponse.json({
    colors: [],
    layouts: [],
    typography: [],
    period: new Date().toISOString().slice(0, 7),
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for analyze, review, and trends"
```

---

## Task 7: Landing Page

**Files:**
- Create: `components/landing/Nav.tsx`, `components/landing/Hero.tsx`, `components/landing/Features.tsx`, `components/landing/Workflow.tsx`, `components/landing/Evolving.tsx`, `components/landing/FinalCta.tsx`, `components/landing/Footer.tsx`
- Create: `components/ui/ScrollReveal.tsx`
- Modify: `app/page.tsx`

**Reference mockup:** `.superpowers/brainstorm/*/landing-v2.html`

- [ ] **Step 1: Create ScrollReveal wrapper**

```typescript
// components/ui/ScrollReveal.tsx
"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function ScrollReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("opacity-100", "translate-y-0"); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create Nav component**

Build the fixed nav: logo left, links center, CTA right. Blur backdrop. Match the mockup's `nav` element exactly.

- [ ] **Step 3: Create Hero component**

Badge with pulse dot → H1 with `.highlight` in accent → description → dual CTA buttons → product preview (workspace screenshot mockup). Staggered fadeInUp animations using Tailwind `animate-` classes with delays.

- [ ] **Step 4: Create Features component**

3x2 grid using `grid-cols-3` with 1px gap trick (bg-border on container, bg-surface on cells). Icon + title + description per cell. Hover: bg-elevated.

- [ ] **Step 5: Create Workflow component**

Two-column header (title left, description right) + 4-step horizontal grid. Same 1px gap technique. Step number in large faded text + title + description.

- [ ] **Step 6: Create Evolving component**

Two-column: text left (title + description + bullet list), trend bar chart right (animated width bars).

- [ ] **Step 7: Create FinalCta component**

Large centered heading "Stop guessing. Start designing." + subtitle + dual CTA.

- [ ] **Step 8: Create Footer**

4-column grid: Product, Resources, Company, Legal.

- [ ] **Step 9: Assemble landing page**

```typescript
// app/page.tsx
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Workflow } from "@/components/landing/Workflow";
import { Evolving } from "@/components/landing/Evolving";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Features />
      <Workflow />
      <Evolving />
      <FinalCta />
      <Footer />
    </>
  );
}
```

- [ ] **Step 10: Verify landing page matches mockup**

```bash
npm run dev
```
Compare against `.superpowers/brainstorm/*/landing-v2.html` in browser.

- [ ] **Step 11: Commit**

```bash
git add components/landing/ components/ui/ScrollReveal.tsx app/page.tsx
git commit -m "feat: build landing page with Cool Steel design"
```

---

## Task 8: Workspace Layout & Sidebar

**Files:**
- Create: `app/app/layout.tsx`, `app/app/page.tsx`
- Create: `components/workspace/Sidebar.tsx`
- Create: `hooks/useProjects.ts`

**Reference mockup:** `.superpowers/brainstorm/*/workspace-mockup.html`

- [ ] **Step 1: Create project state hook**

```typescript
// hooks/useProjects.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Project, ReferenceImage } from "@/lib/types";
import { getProjects, saveProjects } from "@/lib/storage";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getProjects();
    if (stored.length === 0) {
      const defaultProject: Project = {
        id: crypto.randomUUID(),
        name: "My Project",
        color: "var(--accent)",
        references: [],
        createdAt: new Date().toISOString(),
      };
      setProjects([defaultProject]);
      setActiveProjectId(defaultProject.id);
      saveProjects([defaultProject]);
    } else {
      setProjects(stored);
      setActiveProjectId(stored[0].id);
    }
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const updateProject = useCallback((id: string, updater: (p: Project) => Project) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? updater(p) : p));
      saveProjects(next);
      return next;
    });
  }, []);

  const addReference = useCallback((projectId: string, ref: ReferenceImage) => {
    updateProject(projectId, (p) => ({
      ...p,
      references: [...p.references, ref],
    }));
  }, [updateProject]);

  const updateReference = useCallback((projectId: string, refId: string, updater: (r: ReferenceImage) => ReferenceImage) => {
    updateProject(projectId, (p) => ({
      ...p,
      references: p.references.map((r) => (r.id === refId ? updater(r) : r)),
    }));
  }, [updateProject]);

  return { projects, activeProject, activeProjectId, setActiveProjectId, addReference, updateReference, updateProject };
}
```

- [ ] **Step 2: Create Sidebar component**

Build the left sidebar matching the mockup: logo/avatar header, tools section (Analyze active, Moodboard, UI Review, Tokens), divider, projects list with colored dots and counts, footer (Settings, Help). Tool switching state is managed via a `activeTool` state in the workspace page (lifted up). Sidebar receives `activeTool` and `onToolChange` as props. Full state management hook (`useAnalysis`) is wired in Task 12.

- [ ] **Step 3: Create workspace layout**

```typescript
// app/app/layout.tsx
import { Sidebar } from "@/components/workspace/Sidebar";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create workspace page stub**

```typescript
// app/app/page.tsx
export default function WorkspacePage() {
  return (
    <div className="flex-1 flex items-center justify-center text-text-secondary">
      Workspace loading...
    </div>
  );
}
```

- [ ] **Step 5: Verify layout renders**

Navigate to `localhost:3000/app`. Should see sidebar + main area.

- [ ] **Step 6: Commit**

```bash
git add app/app/ components/workspace/Sidebar.tsx hooks/useProjects.ts
git commit -m "feat: add workspace layout with sidebar and project management"
```

---

## Task 9: Upload Zone & Reference Grid

**Files:**
- Create: `components/workspace/UploadZone.tsx`, `components/workspace/RefGrid.tsx`, `components/workspace/RefCard.tsx`
- Create: `hooks/useUpload.ts`

- [ ] **Step 1: Create upload hook**

Hook that handles the full upload-to-analysis flow:
1. Validate file (lib/upload.ts) — reject with inline error if invalid
2. Read file to object URL for thumbnail preview
3. Hash file (lib/hash.ts) — check cache, return cached result if exists
4. **Run client-side color extraction via canvas + `extractColors()` from `lib/colors.ts`** — this always runs regardless of API availability
5. Call `/api/analyze` for AI analysis (typography, layout, tokens)
6. Merge algorithmic colors with AI results into a single `AnalysisResult`
7. If AI fails: still save the algorithmic color extraction as partial result, show "AI analysis unavailable" on the card
8. Cache result by hash
9. Update reference status in project state

```typescript
// Key flow in hooks/useUpload.ts:
// 1. Draw image to offscreen canvas
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
canvas.width = img.width;
canvas.height = img.height;
ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
// 2. Extract colors algorithmically (always works, no API needed)
const colors = extractColors(imageData.data, canvas.width, canvas.height);
// 3. Call /api/analyze for AI parts (may fail gracefully)
```

- [ ] **Step 2: Create UploadZone component**

Dashed border container with drag-and-drop support. Shows "Drop references here" with icon. On hover: border-hover + accent-dim background. Handles `onDrop` and `onDragOver` events. Also has hidden file input triggered by click.

- [ ] **Step 3: Create RefCard component**

Single reference thumbnail card. Shows: image preview, status badge (Analyzed/Processing.../Error), filename, dimensions. Click selects the card (border-accent). Match the mockup's `.ref-card`.

- [ ] **Step 4: Create RefGrid component**

3-column grid of RefCard components. Manages selected reference state. Includes UploadZone at top.

- [ ] **Step 5: Wire into workspace page**

Update `app/app/page.tsx` to use RefGrid with the upload flow and project state.

- [ ] **Step 6: Test upload flow end-to-end**

Drop an image → should show "Processing..." → then "Analyzed" (or error).

- [ ] **Step 7: Commit**

```bash
git add components/workspace/UploadZone.tsx components/workspace/RefGrid.tsx components/workspace/RefCard.tsx hooks/useUpload.ts app/app/page.tsx
git commit -m "feat: add upload zone and reference grid with drag-and-drop"
```

---

## Task 10: Analysis Panel

**Files:**
- Create: `components/workspace/AnalysisPanel.tsx`, `components/workspace/ColorTab.tsx`, `components/workspace/TypographyTab.tsx`, `components/workspace/LayoutTab.tsx`, `components/workspace/TokenTab.tsx`

- [ ] **Step 1: Create ColorTab**

Displays extracted colors: swatch + hex (JetBrains Mono) + role label + percentage bar. Matches the mockup's color section.

- [ ] **Step 2: Create TypographyTab**

Shows detected typography: preview text at detected size/weight, meta row with font details and role badge.

- [ ] **Step 3: Create LayoutTab**

Shows layout type, spacing values, and grid description from AI analysis.

- [ ] **Step 4: Create TokenTab**

Shows generated tokens grouped by category (colors, spacing, radius). Each line: key in accent-text, colon, value in text-secondary. JetBrains Mono. Export section at bottom: CSS/Tailwind/JSON toggle + Export button. Uses `lib/tokens.ts` to generate output, copies to clipboard on export.

- [ ] **Step 5: Create AnalysisPanel container**

Right panel with header (title + filename), tab row (Colors/Typography/Layout/Tokens), and body that renders the active tab. 360px fixed width, border-left.

- [ ] **Step 6: Wire into workspace page**

Pass selected reference's analysis data to AnalysisPanel. Show "Select a reference" empty state when nothing selected.

- [ ] **Step 7: Verify full analysis flow**

Upload image → select it → see analysis in right panel → switch tabs → export tokens.

- [ ] **Step 8: Commit**

```bash
git add components/workspace/AnalysisPanel.tsx components/workspace/ColorTab.tsx components/workspace/TypographyTab.tsx components/workspace/LayoutTab.tsx components/workspace/TokenTab.tsx
git commit -m "feat: add analysis panel with color, typography, layout, and token tabs"
```

---

## Task 11: AI Feedback Bar

**Files:**
- Create: `components/workspace/FeedbackBar.tsx`

- [ ] **Step 1: Create FeedbackBar**

Bottom bar (52px, border-top). Shows: green pulse indicator, AI insight text (summarizes analysis patterns), "View Details" action button. When multiple references analyzed, shows cross-reference insights (e.g., "These references share a consistent dark theme").

- [ ] **Step 2: Wire into workspace layout**

Add FeedbackBar at the bottom of the workspace main area.

- [ ] **Step 3: Commit**

```bash
git add components/workspace/FeedbackBar.tsx
git commit -m "feat: add AI feedback bar"
```

---

## Task 12: UI Review View

**Files:**
- Create: `components/workspace/ReviewView.tsx`
- Create: `hooks/useAnalysis.ts`

- [ ] **Step 1: Create analysis state hook**

Manages: active tool (analyze/moodboard/review/tokens), review state, loading states.

- [ ] **Step 2: Create ReviewView**

Split view that replaces the content area. Left: original UI with bounding box overlays for issues. Right: suggestions list sorted by severity. Top bar: score badge + dismiss button. Each issue: colored severity tag + area + suggestion text. Clicking an issue highlights its bounding box.

- [ ] **Step 3: Wire tool switching in sidebar**

Clicking "UI Review" in sidebar switches to review mode. **Empty state:** If no references have been analyzed yet (no design system available), show a message: "Analyze at least one reference first to build a design system for comparison." with a button to switch to Analyze tool. **Normal state:** Shows upload prompt for UI screenshot. The design system used for comparison is auto-generated by merging tokens from all analyzed references. After upload and API response, shows ReviewView.

- [ ] **Step 4: Test review flow**

Upload a UI screenshot in review mode → see score + issues overlaid.

- [ ] **Step 5: Commit**

```bash
git add components/workspace/ReviewView.tsx hooks/useAnalysis.ts
git commit -m "feat: add UI review with split view and issue annotations"
```

---

## Task 13: Moodboard View

**Files:**
- Create: `components/workspace/MoodboardGrid.tsx`

- [ ] **Step 1: Create MoodboardGrid**

Grid view of all references in the active project. Larger thumbnails than RefGrid (2-column grid). Shows aggregated color palette strip at top (union of all extracted colors from all references, sorted by frequency). Click a reference to view its individual analysis.

- [ ] **Step 2: Add "Analyze Patterns" button**

When 2+ references are analyzed, show an "Analyze Patterns" button above the grid. On click, sends all reference analysis results to Claude API to find common patterns:

```typescript
// In lib/ai.ts — add:
export async function findCommonPatterns(analyses: AnalysisResult[]): Promise<string> {
  const summary = analyses.map(a => ({
    colors: a.colors,
    layout: a.layout,
    typography: a.typography,
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Analyze these ${analyses.length} design references and identify common patterns.
Return a brief JSON: {"patterns": ["pattern 1", "pattern 2", ...], "suggestedTokens": TokenSet}
References: ${JSON.stringify(summary)}`
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return text;
}
```

Display the result as a "Common Patterns" card below the palette strip.

- [ ] **Step 3: Wire into tool switching**

Clicking "Moodboard" in sidebar shows MoodboardGrid instead of RefGrid.

- [ ] **Step 4: Commit**

```bash
git add components/workspace/MoodboardGrid.tsx
git commit -m "feat: add moodboard grid view"
```

---

## Task 14: Trends Page

**Files:**
- Create: `app/app/trends/page.tsx`

- [ ] **Step 1: Create trends page**

Read-only dashboard showing per-user analysis history. Color frequency bars (same style as landing Evolving section). Layout pattern distribution. Typography trend list. Data sourced from localStorage (all cached analyses).

- [ ] **Step 2: Commit**

```bash
git add app/app/trends/
git commit -m "feat: add per-user trends dashboard"
```

---

## Task 15: Toast Notifications & Error States

**Files:**
- Create: `components/ui/Toast.tsx`
- Modify: workspace components to handle errors

- [ ] **Step 1: Create Toast component**

Fixed bottom-right toast. Types: error (red), success (green), info (accent). Auto-dismiss after 5s. Shows retry action for network errors.

- [ ] **Step 2: Add error handling to upload flow**

Show inline errors on RefCard for analysis failures. Show toast for network errors. Show "Analysis unavailable" banner when Claude API fails (algorithmic extraction still shows).

- [ ] **Step 3: Add rate limit display**

Show "X analyses remaining" in topbar actions area.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Toast.tsx
git commit -m "feat: add toast notifications and error handling"
```

---

## Task 16: Responsive Basics & Polish

**Files:**
- Modify: workspace layout, landing components

- [ ] **Step 1: Add "Desktop recommended" banner for small screens**

```typescript
// In workspace layout, add above flex container:
<div className="lg:hidden flex items-center justify-center h-screen p-8 text-center text-text-secondary">
  <p>DesignLens works best on desktop (1024px+).<br/>Please resize your browser window.</p>
</div>
<div className="hidden lg:flex h-screen overflow-hidden">
  {/* existing layout */}
</div>
```

- [ ] **Step 2: Verify landing page is readable on smaller screens**

Landing sections should stack naturally with Tailwind responsive classes.

- [ ] **Step 3: Final visual QA**

Compare all pages against mockups. Verify: colors match tokens, spacing is consistent, hover states work, animations are smooth.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add responsive handling and visual polish"
```

---

## Task 17: Build & Deploy Verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```
Expected: no errors, all pages pre-rendered

- [ ] **Step 2: Test production locally**

```bash
npm run start
```
Verify landing + workspace + trends pages work.

- [ ] **Step 3: Create `.env.local` template**

```
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: production build verification and env template"
```
