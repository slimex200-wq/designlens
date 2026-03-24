# Before & After Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI Review에 슬라이더 오버레이 Before/After 비교 기능 추가. 2차 AI 호출로 구체적 개선안(색상, 간격, 폰트, 위치, 대비율)을 생성하고 시각화.

**Architecture:** 기존 ReviewView 흐름 확장. 1차 리뷰 결과에서 "개선안 보기" → 2차 API (`/api/review/enhance`) → EnhanceResult → 슬라이더 UI. 상태는 기존 ReviewState reducer에 enhance 필드 추가.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Claude API (Haiku 4.5), touch events

**Spec:** `docs/superpowers/specs/2026-03-24-before-after-design.md`

---

## File Map

```
designlens/
├── lib/
│   ├── types.ts                          # Enhancement, EnhanceResult 타입 추가
│   └── ai.ts                             # enhanceUI() 함수 추가
├── app/
│   ├── app/page.tsx                       # ReviewState/ReviewAction 확장
│   └── api/review/enhance/route.ts        # NEW: 2차 enhance API 엔드포인트
├── components/workspace/
│   ├── ReviewView.tsx                     # "개선안 보기" 버튼 + 슬라이더 뷰 토글
│   ├── BeforeAfterSlider.tsx              # NEW: 슬라이더 오버레이 컴포넌트
│   └── EnhancementPanel.tsx              # NEW: Enhancement 목록 패널
├── lib/sample-project.ts                  # 샘플 enhance 데이터 추가
└── messages/
    ├── en.json                            # enhance 번역 키 추가
    └── ko.json                            # enhance 번역 키 추가
```

---

## Task 1: Types — Enhancement & EnhanceResult

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add Enhancement type**

```typescript
// lib/types.ts — append after ReviewResult (line 62)

export type EnhancementType = "color" | "spacing" | "typography" | "position" | "contrast";

export type Enhancement = {
  issueIndex: number;
  type: EnhancementType;
  before: string;
  after: string;
  bounds: BoundingBox;
  description: string;
};

export type EnhanceResult = {
  enhancements: Enhancement[];
  improvedScore: number;
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Enhancement and EnhanceResult types"
```

---

## Task 2: AI Function — enhanceUI()

**Files:**
- Modify: `lib/ai.ts`

- [ ] **Step 1: Add enhanceUI function**

Add after the existing `reviewUI` function. Uses the same model (Haiku 4.5) but a different prompt that receives the 1차 issues and asks for concrete fix values.

```typescript
// lib/ai.ts — append after reviewUI function

export async function enhanceUI(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  designSystem: { colors: Record<string, string>; spacing: Record<string, string>; radius: Record<string, string> },
  issues: Array<{ area: string; severity: string; suggestion: string; bounds: { x: number; y: number; width: number; height: number } }>,
  locale: string = "en"
): Promise<EnhanceResult> {
  const client = getClient();
  const lang = locale === "ko" ? "Korean" : "English";

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          {
            type: "text",
            text: `You are a UI design improvement expert. Given this UI screenshot and the issues found during review, provide CONCRETE fix values for each issue.

Design system: ${JSON.stringify(designSystem)}
Issues found: ${JSON.stringify(issues)}

For each issue, provide a specific enhancement with exact before/after values:
- color: hex codes (before → after)
- spacing: pixel values (before → after)
- typography: weight or size values (before → after)
- position: describe repositioning
- contrast: ratio values (before → after)

Respond in ${lang}. Return ONLY valid JSON:
{
  "enhancements": [
    {
      "issueIndex": 0,
      "type": "color"|"spacing"|"typography"|"position"|"contrast",
      "before": "current value",
      "after": "recommended value",
      "bounds": {"x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100},
      "description": "what changed and why"
    }
  ],
  "improvedScore": 0-100
}`,
          },
        ],
      },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as EnhanceResult;
}
```

- [ ] **Step 2: Add EnhanceResult import at top of ai.ts**

```typescript
// lib/ai.ts line 2 — update import
import type { AnalysisResult, ReviewResult, EnhanceResult } from "./types";
```

- [ ] **Step 3: Commit**

```bash
git add lib/ai.ts lib/types.ts
git commit -m "feat: add enhanceUI AI function for concrete fix suggestions"
```

---

## Task 3: API Route — `/api/review/enhance`

**Files:**
- Create: `app/api/review/enhance/route.ts`

- [ ] **Step 1: Create enhance endpoint**

```typescript
// app/api/review/enhance/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";
import { enhanceUI } from "@/lib/ai";
import type { ReviewIssue } from "@/lib/types";

const MAX_DIM = 1568;

async function resizeImage(buffer: Buffer): Promise<{ data: Buffer; type: "image/jpeg" }> {
  const img = sharp(buffer);
  const meta = await img.metadata();
  const w = meta.width ?? 800;
  const h = meta.height ?? 600;
  if (w > MAX_DIM || h > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h);
    return { data: await img.resize(Math.round(w * scale), Math.round(h * scale)).jpeg({ quality: 85 }).toBuffer(), type: "image/jpeg" };
  }
  return { data: await img.jpeg({ quality: 85 }).toBuffer(), type: "image/jpeg" };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const designSystemRaw = formData.get("designSystem") as string | null;
    const issuesRaw = formData.get("issues") as string | null;
    const locale = (formData.get("locale") as string) || "en";

    if (!file || !designSystemRaw || !issuesRaw) {
      return NextResponse.json({ error: "Missing image, designSystem, or issues" }, { status: 400 });
    }

    const designSystem = JSON.parse(designSystemRaw);
    const issues: ReviewIssue[] = JSON.parse(issuesRaw);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, type } = await resizeImage(buffer);
    const base64 = data.toString("base64");

    const compact = { colors: designSystem.colors ?? {}, spacing: designSystem.spacing ?? {}, radius: designSystem.radius ?? {} };

    const result = await enhanceUI(base64, type, compact, issues, locale);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Enhance error:", err);
    return NextResponse.json({
      enhancements: [],
      improvedScore: 0,
    }, { status: 200 }); // graceful fallback
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/review/enhance/route.ts
git commit -m "feat: add /api/review/enhance endpoint for 2nd-pass AI improvements"
```

---

## Task 4: State Management — Extend ReviewState

**Files:**
- Modify: `app/app/page.tsx` (lines 19-43)

- [ ] **Step 1: Extend ReviewState and ReviewAction types**

```typescript
// app/app/page.tsx — replace lines 19-31
type ReviewState = {
  image: string | null;
  result: ReviewResult | null;
  enhance: EnhanceResult | null;
  loading: boolean;
  enhanceLoading: boolean;
  error: string | null;
  showEnhance: boolean;
};

type ReviewAction =
  | { type: "START"; image: string }
  | { type: "SUCCESS"; result: ReviewResult }
  | { type: "ERROR"; error: string }
  | { type: "DISMISS" }
  | { type: "ENHANCE_START" }
  | { type: "ENHANCE_SUCCESS"; enhance: EnhanceResult }
  | { type: "ENHANCE_ERROR"; error: string }
  | { type: "TOGGLE_ENHANCE" };
```

- [ ] **Step 2: Extend reviewReducer**

```typescript
// app/app/page.tsx — replace reviewReducer (lines 33-43)
function reviewReducer(_state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case "START":
      return { image: action.image, result: null, enhance: null, loading: true, enhanceLoading: false, error: null, showEnhance: false };
    case "SUCCESS":
      return { ..._state, result: action.result, loading: false };
    case "ERROR":
      return { ..._state, error: action.error, loading: false };
    case "DISMISS":
      return { image: null, result: null, enhance: null, loading: false, enhanceLoading: false, error: null, showEnhance: false };
    case "ENHANCE_START":
      return { ..._state, enhanceLoading: true, error: null };
    case "ENHANCE_SUCCESS":
      return { ..._state, enhance: action.enhance, enhanceLoading: false, showEnhance: true };
    case "ENHANCE_ERROR":
      return { ..._state, error: action.error, enhanceLoading: false };
    case "TOGGLE_ENHANCE":
      return { ..._state, showEnhance: !_state.showEnhance };
  }
}
```

- [ ] **Step 3: Update initial state**

```typescript
// app/app/page.tsx — update useReducer initial state (line 75-77)
const [reviewState, reviewDispatch] = useReducer(reviewReducer, {
  image: null, result: null, enhance: null, loading: false, enhanceLoading: false, error: null, showEnhance: false,
});
```

- [ ] **Step 4: Add EnhanceResult import**

```typescript
// app/app/page.tsx line 15
import type { ReviewResult, EnhanceResult } from "@/lib/types";
```

- [ ] **Step 5: Commit**

```bash
git add app/app/page.tsx
git commit -m "feat: extend ReviewState with enhance fields and actions"
```

---

## Task 5: i18n — Translation Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ko.json`

- [ ] **Step 1: Add enhance keys to en.json review section**

```json
"enhance": "Show Improvements",
"enhanceLoading": "Generating improvements...",
"enhanceScore": "Improved Score",
"enhanceScoreChange": "{before} → {after}",
"enhanceCount": "{count} Improvement{count, plural, one {} other {s}}",
"enhanceBefore": "Before",
"enhanceAfter": "After",
"enhanceClose": "Back to Review",
"enhanceEmpty": "No improvements could be generated.",
"enhanceDisabled": "Already well-aligned — no improvements needed.",
"enhanceColor": "Color",
"enhanceSpacing": "Spacing",
"enhanceTypography": "Typography",
"enhancePosition": "Position",
"enhanceContrast": "Contrast"
```

- [ ] **Step 2: Add enhance keys to ko.json review section**

```json
"enhance": "개선안 보기",
"enhanceLoading": "개선안 생성 중...",
"enhanceScore": "개선 점수",
"enhanceScoreChange": "{before} → {after}",
"enhanceCount": "{count}개 개선 사항",
"enhanceBefore": "Before",
"enhanceAfter": "After",
"enhanceClose": "리뷰로 돌아가기",
"enhanceEmpty": "개선안을 생성하지 못했습니다.",
"enhanceDisabled": "이미 잘 맞습니다 — 개선이 필요하지 않습니다.",
"enhanceColor": "색상",
"enhanceSpacing": "간격",
"enhanceTypography": "타이포그래피",
"enhancePosition": "위치",
"enhanceContrast": "대비"
```

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/ko.json
git commit -m "feat: add Before/After i18n keys (en + ko)"
```

---

## Task 6: BeforeAfterSlider Component

**Files:**
- Create: `components/workspace/BeforeAfterSlider.tsx`

- [ ] **Step 1: Create slider component**

The core slider: two copies of the same image overlaid, clipped by a draggable vertical divider. Left side shows Before overlays (issue bounding boxes), right side shows After overlays (enhancement annotations).

```typescript
// components/workspace/BeforeAfterSlider.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { ReviewIssue, Enhancement } from "@/lib/types";

interface BeforeAfterSliderProps {
  image: string;
  issues: ReviewIssue[];
  enhancements: Enhancement[];
  highlightedIndex: number | null;
}

export function BeforeAfterSlider({ image, issues, enhancements, highlightedIndex }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50); // % from left
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const t = useTranslations("review");

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !dragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(5, Math.min(95, pct)));
  }, []);

  const onMouseDown = () => { dragging.current = true; };
  const onMouseUp = () => { dragging.current = false; };
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  const severityBorder = (s: ReviewIssue["severity"]) =>
    s === "high" ? "border-error" : s === "medium" ? "border-warning" : "border-accent";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-col-resize"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
    >
      {/* Full image (base layer) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="UI under review" className="w-full h-auto rounded-lg" />

      {/* Before overlays (left side) — issue bounding boxes */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        {issues.map((issue, i) => (
          <div
            key={`before-${i}`}
            className={`absolute border-2 rounded-sm ${severityBorder(issue.severity)} ${
              highlightedIndex === null || highlightedIndex === i ? "opacity-80" : "opacity-20"
            }`}
            style={{
              left: `${issue.bounds.x}%`,
              top: `${issue.bounds.y}%`,
              width: `${issue.bounds.width}%`,
              height: `${issue.bounds.height}%`,
            }}
          >
            <span className={`absolute -top-5 left-0 text-[9px] px-1 rounded text-white ${
              issue.severity === "high" ? "bg-error" : issue.severity === "medium" ? "bg-warning" : "bg-accent"
            }`}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* After overlays (right side) — enhancement annotations */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        {enhancements.map((enh, i) => (
          <div
            key={`after-${i}`}
            className={`absolute border-2 border-success rounded-sm ${
              highlightedIndex === null || highlightedIndex === enh.issueIndex ? "opacity-80" : "opacity-20"
            }`}
            style={{
              left: `${enh.bounds.x}%`,
              top: `${enh.bounds.y}%`,
              width: `${enh.bounds.width}%`,
              height: `${enh.bounds.height}%`,
            }}
          >
            <span className="absolute -top-5 left-0 text-[9px] px-1 rounded bg-success text-bg-deep font-medium">
              {enh.after}
            </span>
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold bg-bg-deep/80 px-2 py-1 rounded">
        {t("enhanceBefore")}
      </div>
      <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider text-success font-semibold bg-bg-deep/80 px-2 py-1 rounded">
        {t("enhanceAfter")}
      </div>

      {/* Slider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
        style={{ left: `${position}%` }}
      >
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent flex items-center justify-center cursor-col-resize min-w-[44px] min-h-[44px]"
          onMouseDown={onMouseDown}
          onTouchStart={onMouseDown}
        >
          <span className="text-bg-deep text-xs font-bold emoji-text">⇔</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/workspace/BeforeAfterSlider.tsx
git commit -m "feat: add BeforeAfterSlider component with drag and touch support"
```

---

## Task 7: EnhancementPanel Component

**Files:**
- Create: `components/workspace/EnhancementPanel.tsx`

- [ ] **Step 1: Create enhancement list panel**

```typescript
// components/workspace/EnhancementPanel.tsx
"use client";

import { useTranslations } from "next-intl";
import type { Enhancement, EnhancementType } from "@/lib/types";

interface EnhancementPanelProps {
  enhancements: Enhancement[];
  originalScore: number;
  improvedScore: number;
  highlightedIndex: number | null;
  onHighlight: (index: number | null) => void;
}

const TYPE_KEYS: Record<EnhancementType, string> = {
  color: "enhanceColor",
  spacing: "enhanceSpacing",
  typography: "enhanceTypography",
  position: "enhancePosition",
  contrast: "enhanceContrast",
};

export function EnhancementPanel({ enhancements, originalScore, improvedScore, highlightedIndex, onHighlight }: EnhancementPanelProps) {
  const t = useTranslations("review");

  const scoreColor = improvedScore >= 80 ? "text-success" : improvedScore >= 50 ? "text-warning" : "text-error";

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Score comparison */}
      <div className="text-center py-4">
        <div className={`text-4xl font-bold ${scoreColor}`}>
          {t("enhanceScoreChange", { before: originalScore, after: improvedScore })}
        </div>
        <div className="text-[11px] text-text-tertiary mt-1">{t("enhanceScore")}</div>
      </div>

      <div className="h-px bg-border" />

      {/* Enhancement count */}
      <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">
        {t("enhanceCount", { count: enhancements.length })}
      </div>

      {/* Enhancement cards */}
      {enhancements.map((enh, i) => (
        <button
          key={i}
          onClick={() => onHighlight(highlightedIndex === enh.issueIndex ? null : enh.issueIndex)}
          className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer min-h-[44px] ${
            highlightedIndex === enh.issueIndex
              ? "bg-bg-elevated border-accent-border"
              : "bg-bg-deep border-border hover:border-border-hover"
          }`}
        >
          {/* Type badge + before/after */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-success-dim text-success">
              {t(TYPE_KEYS[enh.type])}
            </span>
          </div>

          {/* Before → After values */}
          <div className="flex items-center gap-2 mb-1.5">
            {enh.type === "color" ? (
              <>
                <span className="w-4 h-4 rounded border border-border" style={{ backgroundColor: enh.before }} />
                <span className="text-[11px] text-text-tertiary">→</span>
                <span className="w-4 h-4 rounded border border-success" style={{ backgroundColor: enh.after }} />
                <span className="text-[11px] text-text-secondary font-mono">{enh.after}</span>
              </>
            ) : (
              <span className="text-[12px] text-text-secondary font-mono">
                {enh.before} → <span className="text-success">{enh.after}</span>
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-[11px] text-text-secondary leading-relaxed">{enh.description}</p>
        </button>
      ))}

      {enhancements.length === 0 && (
        <p className="text-[12px] text-text-tertiary text-center py-4">{t("enhanceEmpty")}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/workspace/EnhancementPanel.tsx
git commit -m "feat: add EnhancementPanel with typed badges and color swatches"
```

---

## Task 8: ReviewView Integration

**Files:**
- Modify: `components/workspace/ReviewView.tsx`

- [ ] **Step 1: Import new components and types**

Add to imports at top of ReviewView.tsx:

```typescript
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { EnhancementPanel } from "./EnhancementPanel";
import type { ReferenceImage, TokenSet, ReviewResult, ReviewIssue, EnhanceResult } from "@/lib/types";
```

- [ ] **Step 2: Extend ReviewState/ReviewAction types in ReviewView**

Update the local type definitions (lines 7-18) to match the expanded types from page.tsx:

```typescript
type ReviewState = {
  image: string | null;
  result: ReviewResult | null;
  enhance: EnhanceResult | null;
  loading: boolean;
  enhanceLoading: boolean;
  error: string | null;
  showEnhance: boolean;
};

type ReviewAction =
  | { type: "START"; image: string }
  | { type: "SUCCESS"; result: ReviewResult }
  | { type: "ERROR"; error: string }
  | { type: "DISMISS" }
  | { type: "ENHANCE_START" }
  | { type: "ENHANCE_SUCCESS"; enhance: EnhanceResult }
  | { type: "ENHANCE_ERROR"; error: string }
  | { type: "TOGGLE_ENHANCE" };
```

- [ ] **Step 3: Add "개선안 보기" button to review result top bar**

In the top bar section (around line 190-212), add enhance button after the score:

```typescript
{reviewResult && !reviewState.showEnhance && (
  <button
    onClick={handleEnhance}
    disabled={reviewState.enhanceLoading || sortedIssues.length === 0}
    className="px-3 rounded-md text-xs bg-accent-dim text-accent border border-accent-border font-medium hover:opacity-85 transition-opacity cursor-pointer min-h-[44px] flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {reviewState.enhanceLoading ? t("enhanceLoading") : t("enhance")}
  </button>
)}
{reviewState.showEnhance && (
  <button
    onClick={() => reviewDispatch({ type: "TOGGLE_ENHANCE" })}
    className="px-3 rounded-md text-xs bg-bg-elevated border border-border text-text-secondary font-medium hover:border-border-hover hover:text-text-primary transition-all cursor-pointer min-h-[44px] flex items-center"
  >
    {t("enhanceClose")}
  </button>
)}
```

- [ ] **Step 4: Add handleEnhance function**

```typescript
const handleEnhance = useCallback(async () => {
  if (!reviewImage || !reviewResult) return;
  reviewDispatch({ type: "ENHANCE_START" });

  try {
    // Fetch the image as a blob to send to the API
    const imageRes = await fetch(reviewImage);
    const imageBlob = await imageRes.blob();

    const formData = new FormData();
    formData.append("image", imageBlob, "review.jpg");
    formData.append("designSystem", JSON.stringify(mergedTokens));
    formData.append("issues", JSON.stringify(reviewResult.issues));
    formData.append("locale", locale);

    const res = await fetch("/api/review/enhance", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const enhance: EnhanceResult = await res.json();
    reviewDispatch({ type: "ENHANCE_SUCCESS", enhance });
  } catch (err) {
    reviewDispatch({ type: "ENHANCE_ERROR", error: err instanceof Error ? err.message : "Enhancement failed" });
  }
}, [reviewImage, reviewResult, mergedTokens, reviewDispatch, locale]);
```

- [ ] **Step 5: Replace content area with slider when showEnhance is true**

In the split content section (around line 216), wrap the existing image area with a conditional:

```typescript
{/* Split content */}
<div className="flex-1 flex flex-col md:flex-row overflow-hidden">
  {/* Left: Image with overlays OR slider */}
  <div className="flex-1 relative overflow-auto p-4">
    {reviewState.showEnhance && reviewState.enhance ? (
      <BeforeAfterSlider
        image={reviewImage}
        issues={sortedIssues}
        enhancements={reviewState.enhance.enhancements}
        highlightedIndex={highlightedIssue}
      />
    ) : (
      <div className="relative inline-block">
        {/* existing image + bounding box code */}
      </div>
    )}
  </div>

  {/* Right/Bottom: Issues panel OR Enhancement panel */}
  <div className="w-full md:w-[340px] border-t md:border-t-0 md:border-l border-border bg-bg-surface overflow-y-auto flex-shrink-0 max-h-[40vh] md:max-h-none">
    {reviewState.showEnhance && reviewState.enhance ? (
      <EnhancementPanel
        enhancements={reviewState.enhance.enhancements}
        originalScore={reviewResult.score}
        improvedScore={reviewState.enhance.improvedScore}
        highlightedIndex={highlightedIssue}
        onHighlight={setHighlightedIssue}
      />
    ) : (
      /* existing issues panel JSX */
    )}
  </div>
</div>
```

- [ ] **Step 6: Commit**

```bash
git add components/workspace/ReviewView.tsx
git commit -m "feat: integrate Before/After slider and enhancement panel into ReviewView"
```

---

## Task 9: Sample Enhance Data

**Files:**
- Modify: `lib/sample-project.ts`

- [ ] **Step 1: Add SAMPLE_ENHANCE_RESULTS for the Try Sample flow**

```typescript
// lib/sample-project.ts — after SAMPLE_REVIEW_RESULTS

export const SAMPLE_ENHANCE_RESULTS: Record<string, EnhanceResult> = {
  en: {
    enhancements: [
      {
        issueIndex: 0,
        type: "color",
        before: "#17171C",
        after: "#5E6AD2",
        bounds: { x: 91, y: 2, width: 6, height: 4 },
        description: "Change Sign up button background from near-black to accent purple for clear CTA visibility.",
      },
      {
        issueIndex: 1,
        type: "contrast",
        before: "3.9:1",
        after: "5.2:1",
        bounds: { x: 2, y: 54, width: 31, height: 5 },
        description: "Lighten sub-heading text from #8A8A8E to #A0A0AB to meet WCAG AA 4.5:1 minimum.",
      },
      {
        issueIndex: 2,
        type: "spacing",
        before: "100px",
        after: "64px",
        bounds: { x: 2, y: 59, width: 96, height: 10 },
        description: "Reduce hero-to-preview gap from ~100px to 64px to match the section spacing system.",
      },
      {
        issueIndex: 3,
        type: "typography",
        before: "400",
        after: "500",
        bounds: { x: 47, y: 2, width: 36, height: 4 },
        description: "Increase nav link font weight from 400 to 500 for better legibility on dark background.",
      },
    ],
    improvedScore: 85,
  },
  ko: {
    enhancements: [
      {
        issueIndex: 0,
        type: "color",
        before: "#17171C",
        after: "#5E6AD2",
        bounds: { x: 91, y: 2, width: 6, height: 4 },
        description: "Sign up 버튼 배경을 거의 검정에서 액센트 퍼플로 변경하여 CTA 가시성 확보.",
      },
      {
        issueIndex: 1,
        type: "contrast",
        before: "3.9:1",
        after: "5.2:1",
        bounds: { x: 2, y: 54, width: 31, height: 5 },
        description: "서브 헤딩 텍스트를 #8A8A8E에서 #A0A0AB로 밝혀 WCAG AA 4.5:1 기준 충족.",
      },
      {
        issueIndex: 2,
        type: "spacing",
        before: "100px",
        after: "64px",
        bounds: { x: 2, y: 59, width: 96, height: 10 },
        description: "히어로-프리뷰 간격을 ~100px에서 64px로 줄여 섹션 간격 시스템과 일치.",
      },
      {
        issueIndex: 3,
        type: "typography",
        before: "400",
        after: "500",
        bounds: { x: 47, y: 2, width: 36, height: 4 },
        description: "네비게이션 링크 폰트 weight를 400에서 500으로 증가하여 다크 배경에서 가독성 향상.",
      },
    ],
    improvedScore: 85,
  },
};
```

- [ ] **Step 2: Update Try Sample button in ReviewView to also load enhance data**

In ReviewView, update the Try Sample click handler to schedule enhance data loading after review data:

```typescript
onClick={() => {
  reviewDispatch({ type: "START", image: SAMPLE_REVIEW_IMAGE });
  const result = SAMPLE_REVIEW_RESULTS[locale as "en" | "ko"] ?? SAMPLE_REVIEW_RESULTS.en;
  setTimeout(() => reviewDispatch({ type: "SUCCESS", result }), 800);
}}
```

No change needed — enhance data is loaded separately when "개선안 보기" is clicked. The sample enhance result is fetched inline:

```typescript
// In handleEnhance, add sample data fallback check:
if (reviewImage === SAMPLE_REVIEW_IMAGE) {
  const sampleEnhance = SAMPLE_ENHANCE_RESULTS[locale as "en" | "ko"] ?? SAMPLE_ENHANCE_RESULTS.en;
  setTimeout(() => reviewDispatch({ type: "ENHANCE_SUCCESS", enhance: sampleEnhance }), 600);
  return;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/sample-project.ts components/workspace/ReviewView.tsx
git commit -m "feat: add sample enhance data and Try Sample enhance fallback"
```

---

## Task 10: Build & Deploy Verification

**Files:** none (verification only)

- [ ] **Step 1: Build**

```bash
cd designlens && npx next build
```

Expected: no errors, all routes compiled

- [ ] **Step 2: Test sample flow locally**

```bash
npx next dev
```

1. Open `/app`, go to UI Review tab
2. Click "Try Sample" → verify review loads
3. Click "개선안 보기" → verify slider appears with overlays
4. Drag slider left/right → verify Before/After overlays clip correctly
5. Click enhancement cards → verify highlight syncs with slider
6. Click "리뷰로 돌아가기" → verify return to review
7. Test on mobile viewport (375px) → verify touch drag works

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "feat: Before & After slider with AI-powered enhancement suggestions"
git push origin master
```
