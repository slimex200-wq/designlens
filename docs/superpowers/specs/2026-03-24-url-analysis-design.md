# URL 분석 — Design Specification

## Overview

URL을 붙여넣으면 서버에서 웹사이트를 캡처하고, 실제 CSS/HTML을 파싱하여 스크린샷 기반보다 **정확한 디자인 시스템을 추출**하는 기능.

**선행 기능:** Reference Analysis (MVP 완료)

---

## 현재 vs 변경

### 현재
```
사용자가 스크린샷 직접 캡처 → 이미지 업로드 → AI 분석 (추측 기반)
```

### 변경 후
```
URL 붙여넣기 → 서버에서 자동 캡처 + CSS/HTML 파싱 → 하이브리드 분석 (정확한 값 + AI)
```

---

## 핵심 가치

1. **UX 마찰 감소** — 스크린샷 안 찍어도 됨
2. **정확도 향상** — computed CSS에서 실제 색상, 폰트, 간격 추출
3. **더 깊은 분석** — 사용 중인 폰트 패밀리, CSS 변수, 미디어쿼리 등

---

## 기술 설계

### 서버 사이드 캡처

**Puppeteer** 사용 (Vercel에서는 `@sparticuz/chromium` 번들).

```
POST /api/capture
Body: { url: string }
Response: {
  screenshot: string (base64),
  extractedStyles: ExtractedStyles,
  metadata: PageMetadata
}
```

### CSS/HTML 파싱 (브라우저 내 실행)

Puppeteer `page.evaluate()`로 실제 DOM에서 추출:

```typescript
type ExtractedStyles = {
  colors: Array<{ value: string; count: number; properties: string[] }>;
  fonts: Array<{ family: string; weights: number[]; count: number }>;
  spacing: Array<{ value: string; count: number }>;
  borderRadius: Array<{ value: string; count: number }>;
  breakpoints: string[];
  cssVariables: Record<string, string>;
};

type PageMetadata = {
  title: string;
  description: string;
  viewport: string;
  favicon: string;
};
```

**추출 로직:**
1. `document.querySelectorAll('*')` → 모든 요소의 `getComputedStyle()` 수집
2. 색상: `color`, `background-color`, `border-color` 값 빈도 집계
3. 폰트: `font-family`, `font-weight`, `font-size` 수집
4. 간격: `padding`, `margin`, `gap` 값 빈도 집계
5. Border-radius: `border-radius` 값 수집
6. CSS 변수: `document.documentElement.style` + `:root` 룰 파싱
7. 미디어쿼리: `document.styleSheets` 순회

### 하이브리드 분석 파이프라인

```
URL 입력
  ↓
POST /api/capture → 스크린샷 + extractedStyles + metadata
  ↓
POST /api/analyze → 기존 AI 분석 (스크린샷 기반)
  ↓
결과 병합: extractedStyles (정확한 값) + AI 분석 (레이아웃/패턴 해석)
  ↓
AnalysisResult로 통합
```

**병합 규칙:**
- 색상: extractedStyles 우선 (실제 CSS 값), AI는 역할(background, accent 등) 판단
- 폰트: extractedStyles 우선 (정확한 family/weight), AI는 역할 분류
- 레이아웃: AI 분석 (시각적 패턴 해석은 AI가 더 나음)
- 간격/radius: extractedStyles 우선

---

## UI 변경

### UploadZone 확장

기존 드래그/클릭 업로드 영역에 URL 입력 추가:

```
┌─────────────────────────────────────┐
│           + Drop images here         │
│         PNG, JPG, WebP (10MB)        │
│                                      │
│  ─────────── or ───────────          │
│                                      │
│  ┌─────────────────────────────┐     │
│  │ https://example.com         │ Go  │
│  └─────────────────────────────┘     │
│  Paste a URL to analyze its design   │
└─────────────────────────────────────┘
```

### RefGrid 카드 변경

URL로 분석된 레퍼런스는 카드에 URL 표시 + favicon:

```
┌──────────────┐
│  [screenshot] │
│               │
│ 🌐 linear.app │
│ ● analyzed    │
└──────────────┘
```

### AnalysisPanel 추가 탭

CSS에서 추출된 정보를 위한 "Source" 탭:

```
Colors | Typography | Layout | Tokens | Source
                                        ^^^^^^
```

Source 탭 내용:
- 사용 중인 폰트 패밀리 목록
- CSS 변수 (`--primary`, `--spacing-md` 등)
- 미디어쿼리 브레이크포인트
- 메타 정보 (title, viewport)

---

## 상태 관리

### ReferenceImage 확장

```typescript
export type ReferenceImage = {
  // ... 기존 필드
  sourceUrl?: string;                    // URL로 분석한 경우
  extractedStyles?: ExtractedStyles;     // CSS 추출 데이터
  pageMetadata?: PageMetadata;           // 페이지 메타 정보
};
```

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| 잘못된 URL | 인라인 에러: "유효한 URL을 입력하세요" |
| 접근 불가 (403, 타임아웃) | Toast: "이 사이트에 접근할 수 없습니다" + 스크린샷 업로드 안내 |
| JavaScript 필수 SPA | Puppeteer가 렌더링 대기 (`waitForNetworkIdle`) |
| 로그인 필요 페이지 | Toast: "로그인이 필요한 페이지입니다. 스크린샷을 직접 업로드하세요" |
| 캡처 시간 초과 (30초) | Toast: "시간이 초과되었습니다" + 재시도 버튼 |

---

## 보안

- URL 유효성 검증 (HTTP/HTTPS만)
- SSRF 방지: 내부 IP (127.0.0.1, 10.x, 192.168.x 등) 차단
- 캡처 타임아웃: 15초
- Rate limit: 10 URL 캡처/시간 (스크린샷 업로드와 별도)

---

## i18n 키

### en.json
```json
"urlPlaceholder": "https://example.com",
"urlSubmit": "Analyze",
"urlAnalyzing": "Capturing website...",
"urlInvalid": "Please enter a valid URL",
"urlFailed": "Could not access this site. Try uploading a screenshot instead.",
"urlTimeout": "Capture timed out. Try again or upload a screenshot.",
"urlLoginRequired": "This page requires login. Upload a screenshot instead.",
"urlOr": "or",
"sourceTab": "Source",
"sourceFonts": "Fonts Used",
"sourceCssVars": "CSS Variables",
"sourceBreakpoints": "Breakpoints",
"sourceMeta": "Page Info"
```

### ko.json
```json
"urlPlaceholder": "https://example.com",
"urlSubmit": "분석",
"urlAnalyzing": "웹사이트 캡처 중...",
"urlInvalid": "유효한 URL을 입력하세요",
"urlFailed": "이 사이트에 접근할 수 없습니다. 스크린샷을 직접 업로드하세요.",
"urlTimeout": "캡처 시간이 초과되었습니다. 다시 시도하거나 스크린샷을 업로드하세요.",
"urlLoginRequired": "로그인이 필요한 페이지입니다. 스크린샷을 직접 업로드하세요.",
"urlOr": "또는",
"sourceTab": "소스",
"sourceFonts": "사용 중인 폰트",
"sourceCssVars": "CSS 변수",
"sourceBreakpoints": "브레이크포인트",
"sourceMeta": "페이지 정보"
```

---

## 의존성

```bash
npm install puppeteer-core @sparticuz/chromium
```

- `puppeteer-core`: 브라우저 제어 (번들 없이)
- `@sparticuz/chromium`: Vercel/Lambda용 경량 Chromium 바이너리

로컬 개발: 시스템 Chrome 사용 (`executablePath` 분기)

---

## 파일 맵

```
designlens/
├── lib/
│   ├── types.ts                              # ExtractedStyles, PageMetadata 타입
│   ├── capture.ts                            # NEW: Puppeteer 캡처 + CSS 파싱
│   └── merge-analysis.ts                     # NEW: extractedStyles + AI 결과 병합
├── app/
│   └── api/capture/route.ts                  # NEW: URL 캡처 엔드포인트
├── components/workspace/
│   ├── UploadZone.tsx                        # URL 입력 필드 추가
│   ├── RefGrid.tsx                           # URL 소스 표시 (favicon + 도메인)
│   └── AnalysisPanel.tsx                     # Source 탭 추가
├── hooks/
│   └── useUpload.ts                          # URL 분석 흐름 추가
└── messages/
    ├── en.json                               # URL 관련 키
    └── ko.json                               # URL 관련 키
```

---

## Scope

### In scope
- URL 입력 → 서버 캡처 → 스크린샷 생성
- CSS/HTML 파싱으로 실제 디자인 값 추출
- 기존 AI 분석과 병합
- UploadZone에 URL 입력 UI
- Source 탭 (추출된 CSS 정보)
- SSRF 방지 + 에러 처리
- i18n (한/영)

### Out of scope
- 여러 페이지 크롤링 (단일 URL만)
- 반응형 분석 (여러 뷰포트)
- CSS 파일 다운로드/저장
- 로그인 인증 프록시
- 실시간 모니터링 (디자인 변경 감지)
