# AI 이미지 생성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before/After 슬라이더의 After 쪽에 gpt-image-1이 생성한 실제 수정 UI 이미지를 표시.

**Architecture:** 기존 Enhancement 흐름 확장. Enhancement 데이터 생성 후 → 3차 API로 OpenAI 이미지 생성 → 슬라이더 After 이미지 교체. 실패 시 기존 바운딩 박스 fallback.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, OpenAI API (gpt-image-1), 기존 Claude API 유지

**Spec:** `docs/superpowers/specs/2026-03-24-ai-image-gen-design.md`

---

## File Map

```
designlens/
├── lib/
│   ├── types.ts                              # ImageGenResult 타입 추가
│   └── openai.ts                             # NEW: OpenAI 클라이언트 + generateEnhancedImage()
├── app/
│   ├── app/page.tsx                          # ReviewState/Action 확장
│   └── api/review/generate-image/route.ts    # NEW: 이미지 생성 엔드포인트
├── components/workspace/
│   ├── ReviewView.tsx                        # 이미지 생성 호출 + 로딩 + fallback
│   └── BeforeAfterSlider.tsx                 # afterImage prop 추가
├── lib/sample-project.ts                     # 샘플 생성 이미지 경로
└── messages/
    ├── en.json                               # imageGen 키
    └── ko.json                               # imageGen 키
```

---

## Task 1: 의존성 + 타입

**Files:**
- Modify: `lib/types.ts`
- Run: `npm install openai`

- [ ] **Step 1: openai 패키지 설치**

```bash
cd designlens && npm install openai
```

- [ ] **Step 2: ImageGenResult 타입 추가**

```typescript
// lib/types.ts — append after EnhanceResult

export type ImageGenResult = {
  imageUrl: string;
  generationTime: number;
};
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts package.json package-lock.json
git commit -m "feat: add openai dependency and ImageGenResult type"
```

---

## Task 2: OpenAI 클라이언트 — generateEnhancedImage()

**Files:**
- Create: `lib/openai.ts`

- [ ] **Step 1: OpenAI 클라이언트 + 이미지 생성 함수**

```typescript
// lib/openai.ts
import OpenAI from "openai";
import type { Enhancement } from "./types";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function buildPrompt(enhancements: Enhancement[]): string {
  const changes = enhancements.map((e, i) => {
    switch (e.type) {
      case "color":
        return `${i + 1}. Change color from ${e.before} to ${e.after} in the area: ${e.description}`;
      case "spacing":
        return `${i + 1}. Adjust spacing from ${e.before} to ${e.after}: ${e.description}`;
      case "typography":
        return `${i + 1}. Change typography from ${e.before} to ${e.after}: ${e.description}`;
      case "position":
        return `${i + 1}. Reposition element: ${e.before} → ${e.after}: ${e.description}`;
      case "contrast":
        return `${i + 1}. Improve contrast from ${e.before} to ${e.after}: ${e.description}`;
      default:
        return `${i + 1}. ${e.description}`;
    }
  });

  return `You are a UI designer. Edit this UI screenshot by applying ONLY these specific changes:

${changes.join("\n")}

CRITICAL RULES:
- Keep everything else EXACTLY the same
- Do not add, remove, or rearrange any elements
- Only modify the specified areas
- Maintain the same resolution, aspect ratio, and overall layout
- The result should look like a real UI screenshot, not an illustration`;
}

export async function generateEnhancedImage(
  imageBase64: string,
  mimeType: string,
  enhancements: Enhancement[]
): Promise<{ imageBase64: string; generationTime: number }> {
  const client = getClient();
  const prompt = buildPrompt(enhancements);
  const start = Date.now();

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: Buffer.from(imageBase64, "base64"),
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const generationTime = Date.now() - start;
  const outputBase64 = response.data?.[0]?.b64_json;

  if (!outputBase64) {
    throw new Error("No image returned from OpenAI");
  }

  return { imageBase64: outputBase64, generationTime };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/openai.ts
git commit -m "feat: add OpenAI client with generateEnhancedImage function"
```

---

## Task 3: API 엔드포인트 — `/api/review/generate-image`

**Files:**
- Create: `app/api/review/generate-image/route.ts`

- [ ] **Step 1: 이미지 생성 엔드포인트**

```typescript
// app/api/review/generate-image/route.ts
import { NextResponse } from "next/server";
import { generateEnhancedImage } from "@/lib/openai";
import type { Enhancement } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, enhancements } = body as {
      image: string;
      enhancements: Enhancement[];
    };

    if (!image || !enhancements?.length) {
      return NextResponse.json(
        { error: "Missing image or enhancements" },
        { status: 400 }
      );
    }

    // image는 base64 data URL → raw base64 추출
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch?.[1] ?? "image/jpeg";

    const result = await generateEnhancedImage(base64, mimeType, enhancements);

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${result.imageBase64}`,
      generationTime: result.generationTime,
    });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/review/generate-image/route.ts
git commit -m "feat: add /api/review/generate-image endpoint"
```

---

## Task 4: 상태 관리 확장

**Files:**
- Modify: `app/app/page.tsx`

- [ ] **Step 1: ReviewState에 이미지 생성 필드 추가**

ReviewState에 추가:
```typescript
generatedImage: string | null;
imageGenerating: boolean;
```

- [ ] **Step 2: ReviewAction에 이미지 생성 액션 추가**

```typescript
| { type: "IMAGE_GEN_START" }
| { type: "IMAGE_GEN_SUCCESS"; image: string }
| { type: "IMAGE_GEN_ERROR"; error: string }
```

- [ ] **Step 3: reviewReducer에 케이스 추가**

```typescript
case "IMAGE_GEN_START":
  return { ..._state, imageGenerating: true };
case "IMAGE_GEN_SUCCESS":
  return { ..._state, generatedImage: action.image, imageGenerating: false };
case "IMAGE_GEN_ERROR":
  return { ..._state, imageGenerating: false, error: action.error };
```

기존 DISMISS, START 케이스에서 `generatedImage: null, imageGenerating: false` 초기화.

- [ ] **Step 4: 초기값 업데이트**

```typescript
const [reviewState, reviewDispatch] = useReducer(reviewReducer, {
  // ... 기존 필드
  generatedImage: null,
  imageGenerating: false,
});
```

- [ ] **Step 5: Commit**

```bash
git add app/app/page.tsx
git commit -m "feat: extend ReviewState with image generation fields"
```

---

## Task 5: i18n 키 추가

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ko.json`

- [ ] **Step 1: en.json review 섹션에 추가**

```json
"imageGenerating": "Generating improved UI...",
"imageGenFailed": "Image generation failed. Showing annotations instead.",
"imageGenRetry": "Retry Image",
"imageGenTime": "Generated in {seconds}s"
```

- [ ] **Step 2: ko.json review 섹션에 추가**

```json
"imageGenerating": "개선된 UI 생성 중...",
"imageGenFailed": "이미지 생성에 실패했습니다. 바운딩 박스로 표시합니다.",
"imageGenRetry": "이미지 재생성",
"imageGenTime": "{seconds}초 만에 생성"
```

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/ko.json
git commit -m "feat: add image generation i18n keys (en + ko)"
```

---

## Task 6: BeforeAfterSlider 변경

**Files:**
- Modify: `components/workspace/BeforeAfterSlider.tsx`

- [ ] **Step 1: afterImage prop 추가**

```typescript
interface BeforeAfterSliderProps {
  image: string;                    // Before 이미지 (원본)
  afterImage?: string | null;       // After 이미지 (AI 생성). null이면 기존 바운딩 박스 방식
  imageGenerating?: boolean;        // 이미지 생성 중
  issues: ReviewIssue[];
  enhancements: Enhancement[];
  highlightedIndex: number | null;
}
```

- [ ] **Step 2: After 쪽 렌더링 분기**

```
afterImage 있음 → After 쪽에 AI 생성 이미지 표시 (바운딩 박스 오버레이 선택적)
afterImage 없음 + imageGenerating → 스켈레톤 로딩
afterImage 없음 + !imageGenerating → 기존 바운딩 박스 방식 (fallback)
```

After 영역 (clipPath right side):
- AI 이미지가 있으면: `<img src={afterImage}>` + 초록 바운딩 박스 오버레이
- 생성 중이면: 원본 이미지 위에 반투명 스켈레톤 + "생성 중..." 텍스트
- 없으면: 기존 방식 (원본 이미지 + 초록 바운딩 박스)

- [ ] **Step 3: Commit**

```bash
git add components/workspace/BeforeAfterSlider.tsx
git commit -m "feat: support AI-generated after image in BeforeAfterSlider"
```

---

## Task 7: ReviewView 통합

**Files:**
- Modify: `components/workspace/ReviewView.tsx`

- [ ] **Step 1: handleEnhance에 이미지 생성 호출 추가**

Enhancement 성공 후, 이미지 생성을 병렬로 시작:

```typescript
// ENHANCE_SUCCESS 후
reviewDispatch({ type: "IMAGE_GEN_START" });

fetch("/api/review/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image: reviewImage,  // base64 data URL
    enhancements: enhance.enhancements,
  }),
})
  .then(res => res.json())
  .then(data => {
    if (data.imageUrl) {
      reviewDispatch({ type: "IMAGE_GEN_SUCCESS", image: data.imageUrl });
    } else {
      reviewDispatch({ type: "IMAGE_GEN_ERROR", error: data.error });
    }
  })
  .catch(err => {
    reviewDispatch({ type: "IMAGE_GEN_ERROR", error: err.message });
  });
```

- [ ] **Step 2: BeforeAfterSlider에 새 props 전달**

```typescript
<BeforeAfterSlider
  image={reviewImage}
  afterImage={reviewState.generatedImage}
  imageGenerating={reviewState.imageGenerating}
  issues={sortedIssues}
  enhancements={reviewState.enhance.enhancements}
  highlightedIndex={highlightedIssue}
/>
```

- [ ] **Step 3: 이미지 생성 실패 시 Toast + 재시도 버튼**

EnhancementPanel 상단 또는 슬라이더 하단에:
```typescript
{reviewState.error && reviewState.error.includes("Image") && (
  <button onClick={retryImageGen} className="...">
    {t("imageGenRetry")}
  </button>
)}
```

- [ ] **Step 4: Commit**

```bash
git add components/workspace/ReviewView.tsx
git commit -m "feat: integrate AI image generation into ReviewView enhance flow"
```

---

## Task 8: 샘플 데이터 대응

**Files:**
- Modify: `lib/sample-project.ts`
- Modify: `components/workspace/ReviewView.tsx`

- [ ] **Step 1: 샘플 이미지 생성 경로 추가**

Try Sample 흐름에서는 OpenAI API를 호출하지 않음. 미리 생성해둔 이미지 사용.

```typescript
// lib/sample-project.ts
export const SAMPLE_ENHANCED_IMAGE = "/samples/linear-review-enhanced.jpg";
```

초기에는 샘플 이미지가 없으므로 null 처리 → 바운딩 박스 fallback.

- [ ] **Step 2: handleEnhance 샘플 분기 업데이트**

```typescript
if (reviewImage === SAMPLE_REVIEW_IMAGE) {
  const sampleEnhance = SAMPLE_ENHANCE_RESULTS[locale] ?? SAMPLE_ENHANCE_RESULTS.en;
  setTimeout(() => reviewDispatch({ type: "ENHANCE_SUCCESS", enhance: sampleEnhance }), 600);
  // 샘플은 이미지 생성 스킵 (or SAMPLE_ENHANCED_IMAGE가 있으면 로드)
  return;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/sample-project.ts components/workspace/ReviewView.tsx
git commit -m "feat: handle sample data for AI image generation flow"
```

---

## Task 9: Build & 검증

**Files:** none (verification only)

- [ ] **Step 1: Build**

```bash
cd designlens && npx next build
```

- [ ] **Step 2: 로컬 테스트**

1. `.env.local`에 `OPENAI_API_KEY` 설정
2. `npx next dev`
3. UI Review → 이미지 업로드 → Review → "개선안 보기"
4. Enhancement 로드 후 "이미지 생성 중..." 스켈레톤 확인
5. AI 이미지 생성 완료 → After 쪽에 수정된 이미지 표시 확인
6. 슬라이더 드래그 → Before/After 비교 확인
7. API 키 없이 테스트 → fallback (바운딩 박스) 확인

- [ ] **Step 3: Commit and push**

```bash
git add -A
git commit -m "feat: AI image generation for Before/After enhanced UI preview"
git push origin master
```
