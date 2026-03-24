# AI 이미지 생성 — Design Specification

## Overview

Before/After 슬라이더의 After 쪽에 **AI가 실제로 수정한 UI 이미지**를 보여주는 기능. 현재는 바운딩 박스 어노테이션만 표시하지만, gpt-image-1을 사용해 Enhancement를 실제 적용한 이미지를 생성한다.

**선행 기능:** Before & After Enhancement (완료)

---

## 흐름 변경

### 현재
```
Review → "개선안 보기" → 2차 AI (Claude) → EnhanceResult
→ 같은 이미지 위에 바운딩 박스만 다르게 표시 (Before: 빨간 박스, After: 초록 박스)
```

### 변경 후
```
Review → "개선안 보기" → 2차 AI (Claude) → EnhanceResult
→ 3차 AI (gpt-image-1) → 수정된 UI 이미지 생성
→ Before: 원본 이미지 / After: AI 생성 이미지 (진짜 Before/After)
```

---

## 기술 설계

### API: `/api/review/generate-image`

```
POST /api/review/generate-image
Content-Type: application/json
Body: {
  image: string (base64),
  enhancements: Enhancement[],
  originalScore: number,
  improvedScore: number
}
Response: {
  imageUrl: string (base64 data URL),
  generationTime: number (ms)
}
```

### AI 모델

- **gpt-image-1** (OpenAI Images API)
- 입력: 원본 이미지 + Enhancement 지시문
- 출력: 수정된 UI 이미지
- 예상 비용: ~$0.02–0.08/장
- 예상 시간: 2–8초

### 프롬프트 전략

```
You are a UI designer. Edit this UI screenshot by applying these specific changes:

1. [Enhancement 1: Change button background from #17171C to #5E6AD2]
2. [Enhancement 2: Lighten sub-heading text from #8A8A8E to #A0A0AB]
3. [Enhancement 3: Reduce hero-to-preview gap from 100px to 64px]
4. [Enhancement 4: Increase nav link font weight from 400 to 500]

Keep everything else EXACTLY the same. Only modify the specified areas.
Do not add, remove, or rearrange any elements.
Maintain the same resolution and aspect ratio.
```

### 환경 변수

```env
OPENAI_API_KEY=sk-...
```

기존 `ANTHROPIC_API_KEY`와 별도. `.env.local`에 추가.

---

## UI 변경

### BeforeAfterSlider 변경

현재: 같은 이미지를 양쪽에 쓰고 바운딩 박스만 다르게 표시
변경: Before = 원본 이미지, After = AI 생성 이미지. 바운딩 박스 오버레이는 유지 (토글 가능).

```
┌─────────────────────────────────────┐
│  Before (원본)  │  After (AI 생성)   │
│                 │                   │
│  [이슈 박스]     │  [개선 박스]       │
│        ◄════►   │                   │
│                 │                   │
└─────────────────────────────────────┘
```

### 로딩 상태

이미지 생성은 2–8초 소요. 로딩 UX:

1. "개선안 보기" 클릭 → 기존 Enhancement 데이터 먼저 표시 (즉시)
2. 동시에 이미지 생성 API 호출 → 프로그레스 표시
3. 이미지 생성 완료 → 슬라이더 After 쪽에 AI 이미지 교체

```
상태 1: enhanceLoading = true
  → "개선안 생성 중..." (기존)

상태 2: enhance 완료, imageGenerating = true
  → 슬라이더 표시 + After 쪽에 "이미지 생성 중..." 스켈레톤
  → EnhancementPanel은 이미 사용 가능

상태 3: 이미지 생성 완료
  → After 쪽 이미지 교체 (fade-in 0.3s)
```

### 이미지 생성 실패 시

- 기존 바운딩 박스 방식으로 fallback
- Toast: "이미지 생성에 실패했습니다. 바운딩 박스로 표시합니다."
- 재시도 버튼 제공

---

## 상태 관리

### ReviewState 확장

```typescript
type ReviewState = {
  // ... 기존 필드
  generatedImage: string | null;      // AI 생성 이미지 (base64 data URL)
  imageGenerating: boolean;           // 이미지 생성 중
};
```

### ReviewAction 확장

```typescript
type ReviewAction =
  // ... 기존 액션
  | { type: "IMAGE_GEN_START" }
  | { type: "IMAGE_GEN_SUCCESS"; image: string }
  | { type: "IMAGE_GEN_ERROR"; error: string };
```

---

## 타입

```typescript
// lib/types.ts
export type ImageGenResult = {
  imageUrl: string;        // base64 data URL
  generationTime: number;  // ms
};
```

---

## i18n 키

### en.json (review 섹션)
```json
"imageGenerating": "Generating improved UI...",
"imageGenFailed": "Image generation failed. Showing annotations instead.",
"imageGenRetry": "Retry Image",
"imageGenTime": "Generated in {seconds}s"
```

### ko.json (review 섹션)
```json
"imageGenerating": "개선된 UI 생성 중...",
"imageGenFailed": "이미지 생성에 실패했습니다. 바운딩 박스로 표시합니다.",
"imageGenRetry": "이미지 재생성",
"imageGenTime": "{seconds}초 만에 생성"
```

---

## 샘플 데이터

Try Sample 흐름에서는 AI 이미지 생성을 호출하지 않음. 대신 미리 생성해둔 샘플 이미지 사용.

- `/public/samples/linear-review-enhanced.jpg` — 샘플 Enhancement가 적용된 Linear 랜딩 이미지 (미리 생성)
- 샘플 모드에서는 0.6초 딜레이 후 이 이미지를 로드

---

## 파일 맵

```
designlens/
├── lib/
│   ├── types.ts                              # ImageGenResult 타입 추가
│   └── openai.ts                             # NEW: OpenAI 클라이언트 + generateEnhancedImage()
├── app/
│   ├── app/page.tsx                          # ReviewState/Action 확장
│   └── api/review/generate-image/route.ts    # NEW: 이미지 생성 API 엔드포인트
├── components/workspace/
│   ├── ReviewView.tsx                        # 이미지 생성 호출 + 로딩 상태
│   └── BeforeAfterSlider.tsx                 # afterImage prop 추가, 이미지 분리
├── lib/sample-project.ts                     # 샘플 생성 이미지 경로 추가
└── messages/
    ├── en.json                               # imageGen 번역 키
    └── ko.json                               # imageGen 번역 키
```

---

## 의존성

```bash
npm install openai
```

---

## Scope

### In scope
- `/api/review/generate-image` 엔드포인트
- OpenAI gpt-image-1 연동
- BeforeAfterSlider에 실제 After 이미지 표시
- 로딩 스켈레톤 + fallback
- 샘플 데이터 대응
- i18n (한/영)

### Out of scope
- 생성 이미지 저장/캐싱 (매번 새로 생성)
- 부분 영역만 재생성
- 이미지 편집/수정 UI
- 생성 이미지 다운로드
