# URL 분석 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** URL 붙여넣기로 웹사이트 스크린샷 자동 캡처 + CSS/HTML 파싱으로 정확한 디자인 시스템 추출.

**Architecture:** Puppeteer로 서버 사이드 캡처 → `page.evaluate()`로 computed styles 추출 → 기존 AI 분석 파이프라인과 병합. UploadZone에 URL 입력 UI 추가.

**Tech Stack:** Next.js App Router, puppeteer-core, @sparticuz/chromium, 기존 Claude API 유지

**Spec:** `docs/superpowers/specs/2026-03-24-url-analysis-design.md`

---

## File Map

```
designlens/
├── lib/
│   ├── types.ts                              # ExtractedStyles, PageMetadata 타입
│   ├── capture.ts                            # NEW: Puppeteer 캡처 + CSS 파싱
│   └── merge-analysis.ts                     # NEW: 추출 + AI 결과 병합
├── app/
│   └── api/capture/route.ts                  # NEW: URL 캡처 엔드포인트
├── components/workspace/
│   ├── UploadZone.tsx                        # URL 입력 필드 추가
│   ├── RefGrid.tsx                           # URL 소스 표시
│   └── AnalysisPanel.tsx                     # Source 탭 추가
├── hooks/
│   └── useUpload.ts                          # URL 분석 흐름 추가
└── messages/
    ├── en.json                               # URL 키
    └── ko.json                               # URL 키
```

---

## Task 1: 의존성 + 타입

**Files:**
- Modify: `lib/types.ts`
- Run: `npm install puppeteer-core @sparticuz/chromium`

- [ ] **Step 1: 패키지 설치**

```bash
cd designlens && npm install puppeteer-core @sparticuz/chromium
```

- [ ] **Step 2: ExtractedStyles, PageMetadata 타입 추가**

```typescript
// lib/types.ts — append

export type ExtractedColor = {
  value: string;
  count: number;
  properties: string[];
};

export type ExtractedFont = {
  family: string;
  weights: number[];
  count: number;
};

export type ExtractedStyles = {
  colors: ExtractedColor[];
  fonts: ExtractedFont[];
  spacing: Array<{ value: string; count: number }>;
  borderRadius: Array<{ value: string; count: number }>;
  breakpoints: string[];
  cssVariables: Record<string, string>;
};

export type PageMetadata = {
  title: string;
  description: string;
  viewport: string;
  favicon: string;
};
```

- [ ] **Step 3: ReferenceImage 확장**

기존 ReferenceImage에 optional 필드 추가:

```typescript
export type ReferenceImage = {
  // ... 기존 필드
  sourceUrl?: string;
  extractedStyles?: ExtractedStyles;
  pageMetadata?: PageMetadata;
};
```

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts package.json package-lock.json
git commit -m "feat: add URL analysis types and puppeteer dependencies"
```

---

## Task 2: Puppeteer 캡처 + CSS 파싱

**Files:**
- Create: `lib/capture.ts`

- [ ] **Step 1: URL 유효성 검증 + SSRF 방지**

```typescript
// lib/capture.ts

function validateUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  // SSRF prevention: block internal IPs
  const hostname = url.hostname;
  const blocked = [
    /^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./, /^0\./, /^169\.254\./, /^\[::1\]$/, /^\[fc/, /^\[fd/,
  ];
  if (blocked.some((re) => re.test(hostname))) {
    throw new Error("Internal URLs are not allowed");
  }

  return url;
}
```

- [ ] **Step 2: 브라우저 시작 함수**

```typescript
async function getBrowser() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1440, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  // Local: use system Chrome
  const puppeteer = (await import("puppeteer-core")).default;
  const possiblePaths = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ];
  const fs = await import("fs");
  const executablePath = possiblePaths.find((p) => fs.existsSync(p));
  if (!executablePath) throw new Error("Chrome not found. Install Chrome or set CHROME_PATH.");

  return puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });
}
```

- [ ] **Step 3: CSS 추출 스크립트 (page.evaluate)**

```typescript
// 브라우저 내에서 실행되는 함수
const extractStylesScript = () => {
  const colorMap = new Map<string, { count: number; properties: Set<string> }>();
  const fontMap = new Map<string, Set<number>>();
  const spacingMap = new Map<string, number>();
  const radiusMap = new Map<string, number>();

  const elements = document.querySelectorAll("body *");
  const sample = Array.from(elements).slice(0, 500); // 성능을 위해 500개 제한

  for (const el of sample) {
    const style = getComputedStyle(el);

    // Colors
    for (const prop of ["color", "backgroundColor", "borderColor"]) {
      const val = style.getPropertyValue(prop === "backgroundColor" ? "background-color" : prop === "borderColor" ? "border-color" : prop);
      if (val && val !== "rgba(0, 0, 0, 0)" && val !== "transparent") {
        const entry = colorMap.get(val) ?? { count: 0, properties: new Set() };
        entry.count++;
        entry.properties.add(prop);
        colorMap.set(val, entry);
      }
    }

    // Fonts
    const family = style.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
    const weight = parseInt(style.fontWeight) || 400;
    if (family) {
      const weights = fontMap.get(family) ?? new Set();
      weights.add(weight);
      fontMap.set(family, weights);
    }

    // Spacing
    for (const prop of ["paddingTop", "paddingBottom", "marginTop", "marginBottom", "gap"]) {
      const val = style.getPropertyValue(prop.replace(/([A-Z])/g, "-$1").toLowerCase());
      if (val && val !== "0px" && val !== "normal" && val !== "auto") {
        spacingMap.set(val, (spacingMap.get(val) ?? 0) + 1);
      }
    }

    // Border radius
    const radius = style.borderRadius;
    if (radius && radius !== "0px") {
      radiusMap.set(radius, (radiusMap.get(radius) ?? 0) + 1);
    }
  }

  // CSS Variables from :root
  const cssVariables: Record<string, string> = {};
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
          for (let i = 0; i < rule.style.length; i++) {
            const name = rule.style[i];
            if (name.startsWith("--")) {
              cssVariables[name] = rule.style.getPropertyValue(name).trim();
            }
          }
        }
      }
    } catch { /* cross-origin stylesheet */ }
  }

  // Breakpoints from media queries
  const breakpoints = new Set<string>();
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSMediaRule) {
          const match = rule.conditionText.match(/\d+px/g);
          if (match) match.forEach((bp) => breakpoints.add(bp));
        }
      }
    } catch { /* cross-origin */ }
  }

  return {
    colors: Array.from(colorMap.entries())
      .map(([value, { count, properties }]) => ({ value, count, properties: Array.from(properties) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    fonts: Array.from(fontMap.entries())
      .map(([family, weights]) => ({ family, weights: Array.from(weights).sort(), count: 0 }))
      .slice(0, 10),
    spacing: Array.from(spacingMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    borderRadius: Array.from(radiusMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    breakpoints: Array.from(breakpoints).sort(),
    cssVariables,
  };
};
```

- [ ] **Step 4: 메인 captureUrl 함수**

```typescript
export async function captureUrl(rawUrl: string): Promise<{
  screenshot: string; // base64
  extractedStyles: ExtractedStyles;
  metadata: PageMetadata;
}> {
  const url = validateUrl(rawUrl);
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

    await page.goto(url.toString(), {
      waitUntil: "networkidle0",
      timeout: 15000,
    });

    // Wait for any lazy-loaded content
    await new Promise((r) => setTimeout(r, 1000));

    // Screenshot
    const screenshotBuffer = await page.screenshot({
      type: "jpeg",
      quality: 85,
      fullPage: false,
    });
    const screenshot = Buffer.from(screenshotBuffer).toString("base64");

    // Extract styles
    const extractedStyles = await page.evaluate(extractStylesScript);

    // Metadata
    const metadata = await page.evaluate(() => ({
      title: document.title || "",
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "",
      favicon: document.querySelector('link[rel*="icon"]')?.getAttribute("href") || "/favicon.ico",
    }));

    // Resolve relative favicon URL
    if (metadata.favicon && !metadata.favicon.startsWith("http")) {
      metadata.favicon = new URL(metadata.favicon, url.origin).toString();
    }

    return { screenshot, extractedStyles: extractedStyles as ExtractedStyles, metadata };
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/capture.ts
git commit -m "feat: add Puppeteer URL capture with CSS extraction"
```

---

## Task 3: 분석 결과 병합

**Files:**
- Create: `lib/merge-analysis.ts`

- [ ] **Step 1: 병합 함수**

extractedStyles(정확한 CSS 값)와 AI 분석 결과를 병합. CSS 값이 있으면 AI 추측보다 우선.

```typescript
// lib/merge-analysis.ts
import type { ExtractedStyles, AnalysisResult, TokenSet, ColorInfo, TypographyInfo } from "./types";

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;
  const [, r, g, b] = match;
  return `#${[r, g, b].map((v) => parseInt(v).toString(16).padStart(2, "0")).join("")}`;
}

export function mergeAnalysis(
  aiResult: Omit<AnalysisResult, "id" | "imageHash" | "fileName" | "aiAvailable" | "createdAt"> | null,
  extracted: ExtractedStyles,
): { tokens: TokenSet; typography: TypographyInfo[]; colors: ColorInfo[] } {
  // Colors: use extracted CSS colors, convert RGB to hex
  const colors: ColorInfo[] = extracted.colors.slice(0, 8).map((c) => ({
    hex: rgbToHex(c.value),
    role: c.properties.includes("backgroundColor") ? "background"
      : c.properties.includes("borderColor") ? "border" : "text",
    percentage: c.count,
  }));

  // Typography: prefer extracted fonts
  const typography: TypographyInfo[] = extracted.fonts.map((f) => ({
    size: "16px", // computed styles don't easily give dominant size
    weight: f.weights[0] ?? 400,
    letterSpacing: "0px",
    role: "body",
  }));

  // Tokens: merge extracted + AI
  const tokens: TokenSet = {
    colors: {},
    spacing: {},
    radius: {},
    typography: aiResult?.tokens?.typography ?? typography,
  };

  // Colors from extracted
  extracted.colors.slice(0, 8).forEach((c, i) => {
    const hex = rgbToHex(c.value);
    const role = c.properties.includes("backgroundColor") ? "bg" : c.properties.includes("borderColor") ? "border" : "text";
    tokens.colors[`--${role}-${i}`] = hex;
  });

  // Override with AI colors if available (AI has better role naming)
  if (aiResult?.tokens?.colors) {
    Object.assign(tokens.colors, aiResult.tokens.colors);
  }

  // Spacing from extracted
  extracted.spacing.slice(0, 8).forEach((s) => {
    tokens.spacing[`--space-${s.value}`] = s.value;
  });
  if (aiResult?.tokens?.spacing) {
    Object.assign(tokens.spacing, aiResult.tokens.spacing);
  }

  // Radius from extracted
  extracted.borderRadius.slice(0, 5).forEach((r) => {
    tokens.radius[`--radius-${r.value}`] = r.value;
  });
  if (aiResult?.tokens?.radius) {
    Object.assign(tokens.radius, aiResult.tokens.radius);
  }

  return { tokens, typography: aiResult?.typography ?? typography, colors };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/merge-analysis.ts
git commit -m "feat: add analysis merger for CSS extraction + AI results"
```

---

## Task 4: API 엔드포인트 — `/api/capture`

**Files:**
- Create: `app/api/capture/route.ts`

- [ ] **Step 1: 캡처 엔드포인트**

```typescript
// app/api/capture/route.ts
import { NextResponse } from "next/server";
import { captureUrl } from "@/lib/capture";
import { analyzeDesign } from "@/lib/ai";
import { mergeAnalysis } from "@/lib/merge-analysis";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Step 1: Capture screenshot + extract styles
    const { screenshot, extractedStyles, metadata } = await captureUrl(url);

    // Step 2: AI analysis on the screenshot
    let aiResult = null;
    try {
      aiResult = await analyzeDesign(screenshot, "image/jpeg");
    } catch (err) {
      console.warn("AI analysis failed for URL capture:", err);
    }

    // Step 3: Merge results
    const merged = mergeAnalysis(aiResult, extractedStyles);

    return NextResponse.json({
      screenshot: `data:image/jpeg;base64,${screenshot}`,
      extractedStyles,
      metadata,
      analysis: {
        typography: merged.typography,
        layout: aiResult?.layout ?? { type: "unknown", spacing: {}, grid: "" },
        tokens: merged.tokens,
        colors: merged.colors,
        aiAvailable: aiResult !== null,
      },
    });
  } catch (err) {
    console.error("Capture error:", err);
    const message = err instanceof Error ? err.message : "Capture failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/capture/route.ts
git commit -m "feat: add /api/capture endpoint for URL analysis"
```

---

## Task 5: i18n 키 추가

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ko.json`

- [ ] **Step 1: en.json uploadZone 섹션에 추가**

```json
"urlPlaceholder": "https://example.com",
"urlSubmit": "Analyze",
"urlAnalyzing": "Capturing website...",
"urlInvalid": "Please enter a valid URL",
"urlFailed": "Could not access this site. Try uploading a screenshot instead.",
"urlOr": "or"
```

- [ ] **Step 2: ko.json uploadZone 섹션에 추가**

```json
"urlPlaceholder": "https://example.com",
"urlSubmit": "분석",
"urlAnalyzing": "웹사이트 캡처 중...",
"urlInvalid": "유효한 URL을 입력하세요",
"urlFailed": "이 사이트에 접근할 수 없습니다. 스크린샷을 직접 업로드하세요.",
"urlOr": "또는"
```

- [ ] **Step 3: en.json analysis 섹션에 Source 탭 키 추가**

```json
"sourceTab": "Source",
"sourceFonts": "Fonts Used",
"sourceCssVars": "CSS Variables",
"sourceBreakpoints": "Breakpoints",
"sourceMeta": "Page Info"
```

- [ ] **Step 4: ko.json analysis 섹션에 Source 탭 키 추가**

```json
"sourceTab": "소스",
"sourceFonts": "사용 중인 폰트",
"sourceCssVars": "CSS 변수",
"sourceBreakpoints": "브레이크포인트",
"sourceMeta": "페이지 정보"
```

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/ko.json
git commit -m "feat: add URL analysis and Source tab i18n keys"
```

---

## Task 6: UploadZone — URL 입력 추가

**Files:**
- Modify: `components/workspace/UploadZone.tsx`

- [ ] **Step 1: URL 입력 UI + 제출 로직**

기존 드래그/드롭 영역 아래에 구분선 + URL 입력 필드 추가:

```typescript
interface UploadZoneProps {
  onFiles: (files: File[]) => void;
  onUrl?: (url: string) => void;     // NEW
  urlLoading?: boolean;               // NEW
}
```

URL 입력: `<input type="url">` + "분석" 버튼.
Enter 키 또는 버튼 클릭 시 `onUrl(value)` 호출.
`urlLoading` 상태에서 입력 비활성화 + 스피너.

- [ ] **Step 2: Commit**

```bash
git add components/workspace/UploadZone.tsx
git commit -m "feat: add URL input field to UploadZone"
```

---

## Task 7: useUpload 훅 — URL 분석 흐름

**Files:**
- Modify: `hooks/useUpload.ts`

- [ ] **Step 1: URL 분석 함수 추가**

기존 `handleUpload` 옆에 `handleUrlAnalysis` 추가:

```typescript
const [urlLoading, setUrlLoading] = useState(false);

const handleUrlAnalysis = useCallback(async (url: string) => {
  setUrlLoading(true);
  // 임시 reference 생성 (uploading 상태)
  const tempRef = createTempReference(url);

  try {
    const res = await fetch("/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }

    const data = await res.json();

    // screenshot을 File로 변환하여 기존 분석 흐름과 호환
    // + extractedStyles, metadata를 reference에 저장
    updateReference(tempRef.id, {
      status: "analyzed",
      filePath: data.screenshot,
      sourceUrl: url,
      extractedStyles: data.extractedStyles,
      pageMetadata: data.metadata,
      analysis: {
        id: tempRef.id,
        imageHash: url,
        fileName: new URL(url).hostname,
        ...data.analysis,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    updateReference(tempRef.id, {
      status: "error",
      error: err instanceof Error ? err.message : "Capture failed",
    });
  } finally {
    setUrlLoading(false);
  }
}, []);
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useUpload.ts
git commit -m "feat: add URL analysis flow to useUpload hook"
```

---

## Task 8: RefGrid — URL 소스 표시

**Files:**
- Modify: `components/workspace/RefGrid.tsx`

- [ ] **Step 1: URL 소스 카드 표시**

`sourceUrl`이 있는 reference는 카드에 도메인 표시:

```typescript
{ref.sourceUrl && (
  <span className="text-[10px] text-text-tertiary truncate">
    &#x1F310; {new URL(ref.sourceUrl).hostname}
  </span>
)}
```

- [ ] **Step 2: Commit**

```bash
git add components/workspace/RefGrid.tsx
git commit -m "feat: show URL source domain on reference cards"
```

---

## Task 9: AnalysisPanel — Source 탭

**Files:**
- Modify: `components/workspace/AnalysisPanel.tsx`

- [ ] **Step 1: Source 탭 추가**

`extractedStyles`가 있는 reference 선택 시 "Source" 탭 표시.

내용:
- **폰트 목록**: family + weights
- **CSS 변수**: `--name: value` 코드 블록
- **브레이크포인트**: 목록
- **페이지 정보**: title, description, viewport

- [ ] **Step 2: Commit**

```bash
git add components/workspace/AnalysisPanel.tsx
git commit -m "feat: add Source tab to AnalysisPanel for CSS extraction data"
```

---

## Task 10: Build & 검증

**Files:** none (verification only)

- [ ] **Step 1: Build**

```bash
cd designlens && npx next build
```

- [ ] **Step 2: 로컬 테스트**

1. `npx next dev`
2. Workspace → Analyze 탭
3. URL 입력: `https://linear.app` → "분석" 클릭
4. 캡처 진행 확인 (로딩 상태)
5. 완료 → RefGrid에 스크린샷 + 도메인 표시 확인
6. 카드 클릭 → AnalysisPanel에 Colors/Typography/Layout/Tokens + Source 탭 확인
7. Source 탭: 폰트 목록, CSS 변수, 브레이크포인트 확인
8. 잘못된 URL 입력 → 에러 메시지 확인
9. 내부 IP (127.0.0.1) → SSRF 차단 확인

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "feat: URL analysis with CSS extraction and Source tab"
git push origin master
```
