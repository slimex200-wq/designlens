# Before & After — Design Specification

## Overview

UI Review의 확장 기능. 이슈 발견 후 "개선안 보기"를 클릭하면 AI가 구체적인 개선 사항을 생성하고, 슬라이더 오버레이로 원본과 개선안을 비교하는 기능.

**위치:** 별도 탭이 아닌 기존 UI Review 흐름 안에 통합.

---

## User Flow

```
1. 유저가 UI 스크린샷 업로드 (기존 UI Review 흐름)
2. AI가 이슈 발견 → 점수 + 바운딩 박스 + 이슈 목록 (기존)
3. 유저가 "개선안 보기" 버튼 클릭 (NEW)
4. 2차 AI 호출 → 개선안 데이터 생성 (NEW)
5. 슬라이더 오버레이 UI로 Before/After 비교 (NEW)
6. "닫기"로 원래 리뷰 결과로 복귀
```

---

## API Design

### 2단계 호출 구조

**1차 (기존):** `POST /api/review`
- Input: 이미지 + 디자인 시스템 토큰
- Output: `ReviewResult` (score, issues[], improved TokenSet)

**2차 (신규):** `POST /api/review/enhance`
- Input: 이미지 + 디자인 시스템 토큰 + 1차 리뷰 결과 (issues[])
- Output: `EnhanceResult`

```typescript
type Enhancement = {
  issueIndex: number;           // 원본 이슈 참조
  type: "color" | "spacing" | "typography" | "position" | "contrast";
  before: string;               // 예: "#8A8A8E", "100px", "400"
  after: string;                // 예: "#A0A0AB", "64px", "500"
  bounds: BoundingBox;          // 변경 영역 (% 기반)
  description: string;          // 한/영 설명
};

type EnhanceResult = {
  enhancements: Enhancement[];
  improvedScore: number;        // 예상 개선 점수
};
```

### AI 프롬프트 전략

2차 호출에서 Claude에게:
- 1차에서 발견한 이슈 목록을 컨텍스트로 전달
- 각 이슈에 대해 **구체적 수치 변경**을 요청 (색상 hex, 간격 px, 폰트 weight 등)
- 변경이 적용된 영역의 바운딩 박스 좌표 요청
- locale에 따라 한/영 설명 생성

---

## UI Design

### 슬라이더 오버레이 (Slider Overlay)

리뷰 결과 화면에서 "개선안 보기" 버튼 클릭 시 콘텐츠 영역이 슬라이더 뷰로 전환.

```
┌──────────────────────────────────────────────────┐
│ UI Review     68 → 85       [닫기]               │
├──────────────────────────────┬───────────────────┤
│                              │                   │
│   Before (원본)    │ After   │  Enhancement List │
│                    │ (개선)  │                   │
│   ◄─ 드래그 ──►    │         │  1. 색상 변경     │
│                    │         │     #8A → #A0     │
│                              │  2. 간격 변경     │
│                              │     100px → 64px  │
│                              │  3. 폰트 weight   │
│                              │     400 → 500     │
│                              │  4. 대비율 개선   │
│                              │     3.9:1 → 4.8:1│
├──────────────────────────────┴───────────────────┤
│ ◄────────── 슬라이더 ──────────►                  │
└──────────────────────────────────────────────────┘
```

**슬라이더 동작:**
- 수직 분할선을 좌우로 드래그
- 왼쪽: 원본 이미지 + 이슈 바운딩 박스 (빨/노 테두리)
- 오른쪽: 원본 이미지 + 개선안 어노테이션 오버레이 (초록 테두리 + 변경 값 라벨)
- 분할선에 액센트 컬러(#93C5FD) 드래그 핸들

**오른쪽 패널 (Enhancement List):**
- 기존 이슈 패널과 동일한 위치 (w-[340px])
- 각 Enhancement 카드에:
  - 변경 타입 뱃지 (color/spacing/typography/position/contrast)
  - Before → After 값 (색상은 스와치, 수치는 텍스트)
  - 클릭 시 해당 영역 하이라이트

### 어노테이션 오버레이 상세

After 쪽 이미지 위에 표시되는 오버레이:

- **색상 변경**: 바운딩 박스 + 작은 색상 스와치 쌍 (before → after)
- **간격 변경**: 양방향 화살표 + 수치 라벨 (예: `64px`)
- **폰트 변경**: 바운딩 박스 + 라벨 (예: `w500 / 15px`)
- **요소 이동**: 점선 원본 위치 + 실선 새 위치
- **대비율**: 바운딩 박스 + 대비율 뱃지 (예: `4.8:1 ✓`)

모든 오버레이는 `position: absolute` + % 기반 좌표. 이미지 스케일과 무관하게 정확한 위치.

### 모바일 대응

- 슬라이더: 터치 드래그 지원 (touch events)
- Enhancement 패널: 바텀 시트 (기존 AnalysisPanel 패턴 재사용)
- 슬라이더 핸들: min 44px 터치 타겟

### 상태 관리

기존 `ReviewState`에 enhance 상태 추가:

```typescript
type ReviewState = {
  image: string | null;
  result: ReviewResult | null;
  enhance: EnhanceResult | null;  // NEW
  loading: boolean;
  enhanceLoading: boolean;        // NEW
  error: string | null;
  showEnhance: boolean;           // NEW — 슬라이더 뷰 토글
};
```

추가 액션:
```typescript
| { type: "ENHANCE_START" }
| { type: "ENHANCE_SUCCESS"; enhance: EnhanceResult }
| { type: "ENHANCE_ERROR"; error: string }
| { type: "TOGGLE_ENHANCE" }
```

---

## Design System 준수

- 슬라이더 핸들: `bg-accent` (#93C5FD), `rounded-full`
- Enhancement 뱃지: `bg-accent-dim text-accent border-accent-border` (accent 버튼 패턴)
- Before 오버레이: `border-error` / `border-warning` (기존 이슈 색상)
- After 오버레이: `border-success` (#4ADE80)
- 카드: `bg-bg-deep border border-border rounded-lg` (기존 패턴)
- 모든 인터랙티브 요소: `min-h-[44px]` 터치 타겟
- 애니메이션: `transform`과 `opacity`만 사용
- 이모지: `.emoji-text` 클래스 적용

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| 2차 API 실패 | Toast 에러 + "개선안 보기" 버튼 유지 (재시도 가능) |
| 부분 개선안 | 생성된 것만 표시, 나머지는 "개선안 없음" |
| 네트워크 오류 | Toast + 재시도 버튼 |
| 이슈 0개 (만점) | "개선안 보기" 버튼 비활성화, "이미 잘 맞습니다" 표시 |

---

## Scope

### In scope
- "개선안 보기" 버튼 + 2차 API 호출
- 슬라이더 오버레이 Before/After 비교
- 5가지 Enhancement 타입 (color, spacing, typography, position, contrast)
- Enhancement 목록 패널
- 모바일/태블릿 대응
- 한/영 i18n

### Out of scope
- AI 이미지 생성 (실제 수정된 이미지)
- 코드 스니펫 내보내기 (향후 확장)
- 개선안 자동 적용
- 히스토리/버전 관리
