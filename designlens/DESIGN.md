# Cool Steel Design System

DesignLens의 디자인 시스템. 모든 UI 구현은 이 문서를 기준으로 합니다.

---

## Principles

1. **Monochromatic first** — 색상은 예외로만 사용. Accent(#93C5FD)는 active state, badge, headline highlight에만.
2. **Typography carries hierarchy** — 크기, 굵기, 간격이 계층 구조를 만듦. 색상이 아님.
3. **Generous spacing** — 섹션: 128px, 카드: 24px, 요소: 8px. 8px 기반 스케일.
4. **Subtle interactions** — Hover = 배경 shift + border lighten. 드라마틱한 색상 변화 없음.
5. **1px borders as structure** — 섹션은 배경색이 아닌 얇은 선으로 구분.

---

## Color Tokens

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#0C0D0F` | Page background |
| `--bg-surface` | `#131519` | Cards, sidebar, panels |
| `--bg-elevated` | `#1A1D23` | Elevated elements, inputs |
| `--bg-hover` | `#1F2229` | Hover states |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `#1E2028` | Default borders |
| `--border-hover` | `#2A2D38` | Hover borders, scrollbar thumb |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#E8EAED` | Headings, primary text |
| `--text-secondary` | `#8A8F9B` | Body, descriptions (WCAG AA 4.5:1 on #0C0D0F) |
| `--text-tertiary` | `#3A3F4B` | Labels, placeholders (decorative only) |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#93C5FD` | Ice blue. Active states, badges, highlights |
| `--accent-dim` | `rgba(147,197,253,0.08)` | Accent backgrounds |
| `--accent-border` | `rgba(147,197,253,0.15)` | Accent borders |
| `--accent-text` | `rgba(147,197,253,0.7)` | Accent text (badges) |

### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| `--success` / `--success-dim` | `#4ADE80` / `rgba(74,222,128,0.08)` | Success states |
| `--warning` / `--warning-dim` | `#FBBF24` / `rgba(251,191,36,0.08)` | Warning states |
| `--error` / `--error-dim` | `#F87171` / `rgba(248,113,113,0.08)` | Error states |

---

## Typography

| Role | Font | Size | Weight | Letter-spacing | Line-height |
|------|------|------|--------|----------------|-------------|
| H1 (hero) | Inter | 72px | 800 | -2.5px | 1.0 |
| H2 (section) | Inter | 44-56px | 700-800 | -1.8px | 1.0 |
| H3 (subsection) | Inter | 18-20px | 600-700 | -0.5px | 1.2 |
| Body | Inter | 13-15px | 400-500 | -0.2px | 1.6 |
| Label | Inter | 10-11px | 500-600 | 1-2px (uppercase) | 1.4 |
| Code/Tokens | JetBrains Mono | 11-12px | 400-500 | 0 | 1.5 |

---

## Spacing Scale

8px 기반:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps (color dots) |
| sm | 8px | Element gap |
| md | 12px | Card padding |
| lg | 16-20px | Panel padding |
| xl | 24px | Card gap |
| 2xl | 32px | Section inner padding |
| 3xl | 128px (py-32) | Section vertical padding |

---

## Component Patterns

### Buttons
- **Primary**: `bg-text-primary text-bg-deep` — white on dark, hover `opacity-85`
- **Secondary**: `bg-bg-elevated border-border text-text-secondary` — hover `border-border-hover text-text-primary`
- **Accent**: `bg-accent-dim text-accent border-accent-border` — hover `opacity-85`
- **Touch target**: 최소 44px (WCAG)
- **Border-radius**: `rounded-md` (6px)

### Cards
- `bg-bg-deep border border-border rounded-lg`
- Hover: `border-border-hover` + subtle scale/translate
- No shadows. Structure comes from borders.

### Panels
- `bg-bg-surface border-l border-border`
- Fixed width or conditional display
- `overflow-y-auto` with slim scrollbar

### Tabs
- Active: `text-text-primary border-b-2 border-accent`
- Inactive: `text-text-tertiary hover:text-text-secondary`
- `text-[11px] font-medium`

### Icons / Emoji
- 유니코드 이모지 사용 (⚙ ▣ ✓ ↗ 등)
- 크로스 플랫폼 일관성을 위해 `.emoji-text` 클래스 필수 적용
- `.emoji-text`: `font-variant-emoji: text` + 심볼 폰트 스택 (`Segoe UI Symbol`, `Noto Sans Symbols 2`, `Apple Symbols`)
- 컬러 이모지가 아닌 흑백 텍스트 글리프로 렌더링되어야 함

### Toast Notifications
- Slide in from right (`slideInRight 0.25s`)
- Fade out (`fadeOut 0.3s`)
- Types: success (green dot), error (red dot), info (blue dot)

---

## Workspace Layout

```
┌ Analyze ─────────────────────────────────────┐
│ Sidebar    │ RefGrid(3col)    │ AnalysisPanel │
│ 240px/52px │ + UploadZone     │ (조건부 360px) │
│ (접기 가능) │                  │ 선택 시만 표시 │
├────────────┴──────────────────┴──────────────┤
│ FeedbackBar (분석 결과 있을 때만, 52px)        │
└──────────────────────────────────────────────┘

┌ Moodboard ───────────────────────────────────┐
│ Sidebar │ Grid(3col, compact) │ Insights(280px)│
│         │                     │ 팔레트+패턴     │
└─────────┴─────────────────────┴──────────────┘

┌ UI Review ───────────────────────────────────┐
│ Sidebar │ Image + Overlays    │ Issues(340px) │
│         │                     │ 점수+이슈 목록 │
└─────────┴─────────────────────┴──────────────┘

┌ Tokens ──────────────────────────────────────┐
│ Sidebar │ Token list + Export (전체 너비)      │
└─────────┴────────────────────────────────────┘
```

---

## Interaction States

| Feature | Loading | Empty | Error | Success |
|---------|---------|-------|-------|---------|
| Upload | Card shimmer | UploadZone 안내 | Toast + 사유 | "analyzed" 배지 |
| AI 분석 | Panel skeleton | "색상만 — AI 재시도" + 버튼 | "AI 불가" + 재시도 | 전체 분석 |
| UI Review | "분석 중..." pulse | 레퍼런스 없으면 Analyze 안내 | "AI 실패" + 재시도 | 점수 + 오버레이 |
| 패턴 분석 | 버튼 → "분석 중..." | 2개 미만 → 숨김 | Fallback 패턴 | 패턴 카드 |
| Tokens | Skeleton | "레퍼런스 분석하면 생성" | — | 목록 + 내보내기 |
| Trends | Skeleton 차트 | "데이터 없음 — 분석 시작" | Toast + 재시도 | 차트 + 통계 |

---

## Accessibility

- **Contrast**: `--text-secondary` (#8A8F9B) meets WCAG AA 4.5:1 on `--bg-deep` (#0C0D0F)
- **Touch targets**: 44px minimum on all interactive elements
- **Focus**: `focus-visible` ring — `outline: 2px solid var(--accent)`, `outline-offset: 2px`
- **Keyboard**: Tab → Sidebar → Content → Panel. Arrow Up/Down in sidebar. Arrow Left/Right in tabs.
- **ARIA**: `aside role="navigation"`, `main role="main"`, AnalysisPanel `role="complementary"`
- **Motion**: `prefers-reduced-motion` — disable ScrollReveal transitions, hover animations
- **Screen reader**: Upload zone `aria-label`, analysis results `aria-live="polite"`

---

## Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| fadeIn | 0.5s | ease | General reveal |
| fadeInUp | 0.7s | ease-out | Scroll reveal sections |
| slideInRight | 0.25s | ease | Toast enter |
| fadeOut | 0.3s | ease | Toast exit |
| Hover translate | 0.2s | ease | Cards: translateY(-1px) |
| Sidebar collapse | 0.2s | ease | Width transition |

Rule: Only animate `transform` and `opacity`. No layout property animations.
