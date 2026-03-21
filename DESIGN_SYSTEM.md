# Settle Design System v1.0
> 갱신: 2026-03-21 · 12개 Deep Research 기반
> Apple HIG 2025-2026 + iOS 26 Liquid Glass + Figma Make 워크플로우

---

## 핵심 5원칙

1. **탭 4개, 최대 5개.** 6개 이상 절대 금지.
2. **컬러 — 시맨틱 토큰 강제.** 하드코딩 색상 전면 폐지.
3. **Liquid Glass는 도구 레이어에만.** 콘텐츠 본문에 적용 금지.
4. **8pt 그리드 엄수.** 소수점 간격 금지.
5. **로딩/에러/빈 상태 통일.** 전 페이지 동일 패턴.

---

## 1. 색상 시스템 — 시맨틱 토큰

### 왜 토큰인가

현재 코드의 모든 페이지에서 `#007AFF`, `#34C759`, `#86868B`, `#F5F5F7`, `#1D1D1F` 등을 직접 사용 중.
문제: 다크모드 대응 불가, 브랜드 변경 시 전파일 수정, Liquid Glass 반사광 처리 불가.

### 토큰 구조

```css
:root {
  /* === Action === */
  --color-action-primary: #007AFF;       /* CTA 버튼, 활성 탭, 링크 */
  --color-action-primary-hover: #0051D5;
  --color-action-success: #34C759;       /* 성공, 완료, 양수 */
  --color-action-warning: #FF9500;       /* 경고, D-Day ≤30 */
  --color-action-error: #FF3B30;         /* 에러, 삭제, 위험 */

  /* === Text === */
  --color-text-primary: #1D1D1F;         /* 본문, 제목 */
  --color-text-secondary: #86868B;       /* 부제, 캡션, 비활성 */
  --color-text-tertiary: #C7C7CC;        /* 플레이스홀더 */
  --color-text-on-color: #FFFFFF;        /* 컬러 배경 위 텍스트 */

  /* === Surface === */
  --color-surface-primary: #FFFFFF;      /* 카드, 모달 배경 */
  --color-surface-secondary: #F5F5F7;    /* 페이지 배경, 입력 필드 배경 */
  --color-surface-glass: rgba(255,255,255,0.80);  /* Liquid Glass 배경 */
  --color-surface-elevated: #FFFFFF;     /* 떠있는 요소 (탭바, 시트) */

  /* === Border === */
  --color-border-default: rgba(0,0,0,0.05);  /* 카드 테두리, 구분선 */
  --color-border-strong: rgba(0,0,0,0.10);   /* 탭바 상단선 */

  /* === Overlay === */
  --color-overlay: rgba(0,0,0,0.50);    /* 모달 배경 */
}

.dark {
  --color-action-primary: #0A84FF;
  --color-text-primary: #F5F5F7;
  --color-text-secondary: #98989D;
  --color-surface-primary: #1C1C1E;
  --color-surface-secondary: #2C2C2E;
  --color-surface-glass: rgba(44,44,46,0.75);
  --color-border-default: rgba(255,255,255,0.08);
  /* Liquid Glass 다크모드: rim light + inner glow 추가 */
}
```

### 사용 규칙

- `#007AFF` 직접 사용 **절대 금지** → `var(--color-action-primary)` 사용
- Tailwind 클래스에서: `text-[var(--color-text-primary)]` 또는 `@theme` 연결
- 새 색상 추가 시 반드시 토큰 정의 → 사용. 인라인 컬러 금지.

---

## 2. 타이포그래피 — SF Pro 기준

### 스타일 매트릭스

| 스타일 | 웨이트 | 크기 | 행간 | 용도 |
|---|---|---|---|---|
| Large Title | SemiBold (600) | 34pt | 41pt | 탭 최상단 타이틀 (미사용 — 모바일 공간) |
| Title 1 | SemiBold (600) | 28pt | 34pt | 페이지 헤더 ("안녕하세요, Alex!") |
| Title 2 | SemiBold (600) | 22pt | 28pt | 섹션 헤더 ("Services") |
| Title 3 | SemiBold (600) | 20pt | 25pt | 카드 내 제목 |
| Headline | SemiBold (600) | 17pt | 22pt | 강조 본문 |
| Body | Regular (400) | 17pt | 22pt | 기본 본문 |
| Callout | Regular (400) | 16pt | 21pt | 설명 텍스트 |
| Subhead | Regular (400) | 15pt | 20pt | 부제목 |
| Footnote | Regular (400) | 13pt | 18pt | 면책문구, 캡션 |
| Caption 1 | Regular (400) | 12pt | 16pt | 메타데이터, 태그 |
| Caption 2 | Regular (400) | 11pt | 13pt | 최소 텍스트 |

### 규칙

- 폰트 종류: **1개만** (시스템 폰트 SF Pro / -apple-system, BlinkMacSystemFont)
- `fontWeight`는 항상 숫자로: `400`, `500`, `600`, `700` (키워드 아님)
- 행간: 폰트 크기의 **120~145%**
- Liquid Glass 위 텍스트: Vibrant 처리 (배경 대비 자동 보정)

---

## 3. 그리드 & 간격 — 8pt 시스템

### 표준 수치

| 구분 | 값 | 적용 |
|---|---|---|
| 기본 단위 | 8pt | 모든 간격의 최소 배수 |
| 화면 여백 (Margin) | 16pt (=`px-4`) | 좌우 여백. 현재 `px-6`(24pt)은 허용 |
| 카드 내부 패딩 | 16pt (=`p-4`) | 현재 `p-6`(24pt), `p-8`(32pt) — 8배수이므로 허용 |
| 요소 간격 (작음) | 8pt (=`gap-2`) | 인접 요소 간 |
| 요소 간격 (중간) | 16pt (=`gap-4`) | 카드 내 섹션 간 |
| 섹션 간격 | 24pt (=`space-y-6`) 또는 32pt | 큰 블록 간 |
| 터치 타겟 최소 높이 | 44pt (=`py-3` + 내용) | Apple HIG 필수 |

### 금지

- 소수점 간격: `7.3px`, `15px` → `8px`, `16px`로 교정
- 비 8배수: `10px`, `18px`, `22px` → 가장 가까운 8배수로
- 예외: `border-width` (1px), `font-size` (타이포 매트릭스 따름)

---

## 4. Liquid Glass 적용 규칙

### 적용 대상 (도구 레이어)

| 컴포넌트 | 적용 방식 |
|---|---|
| 탭바 (하단) | `backdrop-filter: blur(20px)` + `background: var(--color-surface-glass)` |
| 헤더 (상단) | 동일 |
| 바텀시트 배경 | `var(--color-overlay)` + `backdrop-filter: blur(10px)` |
| 모달 | 배경에만 blur, 모달 카드 자체는 solid |

### 적용 금지

- 카드 내부 텍스트 영역 — 가독성 훼손
- Glass-on-Glass (유리 위 유리) — 시각 위계 혼란 + 렌더링 부하
- 복잡한 배경 위 얇은 텍스트 — 대비 4.5:1 미달 시 solid로 폴백

### CSS 구현

```css
/* 탭바 / 헤더 */
.glass-surface {
  background: var(--color-surface-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid var(--color-border-strong);
}

/* 접근성: 투명도 감소 설정 시 */
@media (prefers-reduced-transparency: reduce) {
  .glass-surface {
    background: var(--color-surface-elevated);
    backdrop-filter: none;
  }
}
```

---

## 5. 탭바 설계 규칙

### iOS 26 HIG 기반

| 속성 | 값 |
|---|---|
| 탭 수 | 4개 (Home/Visa/Remit/MY) |
| 아이콘 크기 | 25×25pt (일반), 18×18pt (컴팩트) |
| 라벨 | SF 10pt Medium, 단일 단어 |
| 활성 상태 | `--color-action-primary` + `fontWeight: 600` + `strokeWidth: 2.5` |
| 비활성 상태 | `--color-text-secondary` + `fontWeight: 400` + `strokeWidth: 2` |
| 디자인 | 부유형(Floating) — Phase 0-B에서 적용 |
| 배경 | Liquid Glass (`glass-surface` 클래스) |

---

## 6. 카드 UI 규칙

| 속성 | 값 |
|---|---|
| 곡률 (Border Radius) | 24pt (=`rounded-3xl`). 현재 코드와 동일 |
| 내부 패딩 | 16~32pt (8배수) |
| 그림자 | `shadow-lg` (Liquid Glass 자체 깊이감이 있으므로 과도한 그림자 지양) |
| 내부 요소 곡률 | 카드 곡률 - 패딩 값 (Concentric 원칙) |
| 카드 배경 | `var(--color-surface-primary)` |
| 구분선 | `var(--color-border-default)` — 선(line)보다 여백 선호 |

---

## 7. 버튼 규칙

### 역할별 스타일

| 역할 | 배경 | 텍스트 | 용도 |
|---|---|---|---|
| Primary | `--color-action-primary` | white | CTA ("Submit now", "Start trial") |
| Secondary | `--color-surface-secondary` | `--color-text-primary` | 보조 액션 ("Current plan") |
| Destructive | `--color-action-error` | white | 삭제, 로그아웃 (텍스트만) |
| Ghost | transparent | `--color-action-primary` | 링크형 ("View all") |

### 공통 속성

- 최소 높이: 44pt
- 곡률: 16pt (=`rounded-2xl`)
- 터치 피드백: `active:scale-[0.98]`
- 비활성: `opacity-50`
- 로딩: 텍스트 → 스피너 교체 (Loader2 아이콘)

---

## 8. 로딩 / 에러 / 빈 상태 패턴

### 통일 패턴 (전 페이지 동일 적용)

| 상태 | 패턴 | 구현 |
|---|---|---|
| **로딩 (목록)** | 스켈레톤 | 3행 `animate-pulse` 카드. home.tsx 패턴 참조 |
| **로딩 (버튼)** | 인라인 스피너 | `<Loader2 className="animate-spin" />` + 텍스트 변경 |
| **로딩 (전체)** | 센터 스피너 | AuthGuardLayout.tsx 패턴 참조 |
| **에러 (인라인)** | 에러 배너 | `bg-[var(--color-action-error)]/10` + 에러 메시지 |
| **에러 (토스트)** | Sonner 토스트 | 일시적 에러 알림 |
| **빈 상태** | 일러스트 + CTA | "아직 없어요" + "첫 액션 유도 버튼" (절대 빈 텍스트만 X) |
| **성공** | 토스트 또는 체크 아이콘 | 짧은 확인 후 자동 사라짐 |

### 빈 상태 CTA 예시

```
[Home 피드 빈 상태]
"No activity yet"
→ "Check your visa status" 버튼 (Visa 탭으로 이동)

[Remit 빈 상태]
"No remittance yet"
→ "Compare rates now" 버튼
```

---

## 9. 애니메이션 규칙

### Spring 모델 (iOS 26 기본)

| 유형 | response | dampingFraction | 용도 |
|---|---|---|---|
| Bouncy | 0.5 | 0.6 | 강조 (성공, 달성) |
| Smooth | 0.5 | 0.825 | 화면 전환 (기본) |
| Snappy | 0.3 | 0.825 | 버튼, 탭 전환 |

### 바텀시트 (공통화 필수)

현재 visa.tsx, remit.tsx, profile.tsx에서 각각 `@keyframes slideUp`을 인라인 `<style>`로 선언 중.
→ `styles/animations.css`로 추출하거나 Tailwind `@layer` 활용.

```css
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 400ms cubic-bezier(0.32, 0.72, 0, 1);
}
```

---

## 10. 접근성 규칙

| 항목 | 기준 |
|---|---|
| 텍스트 대비 | 최소 4.5:1 (WCAG AA) |
| 터치 타겟 | 최소 44×44pt |
| 포커스 링 | `focus:ring-2 focus:ring-[var(--color-action-primary)]` |
| 투명도 감소 | `@media (prefers-reduced-transparency: reduce)` → solid 폴백 |
| 모션 감소 | `@media (prefers-reduced-motion: reduce)` → 애니메이션 비활성 |
| 스크린리더 | 아이콘 버튼에 `aria-label` 필수 |

---

## 11. Figma Make 워크플로우

### 프롬프트 구성 (CDPSC 모델)

1. **C (Context)**: "한국 체류 외국인을 위한 슈퍼앱. E-9 노동자가 주 타겟. 다국어 UI."
2. **D (Description)**: "Visa 탭의 E-7-4 점수 시뮬레이터 화면. 상단에 큰 점수 링, 하단에 5개 카테고리별 프로그레스 바."
3. **P (Platform)**: "모바일 전용 iOS. 375×812 프레임. Safe Area 반영."
4. **S (Style)**: "Apple HIG 2026 Liquid Glass 스타일. 단일 서체(SF Pro). 색상은 딥 네이비(#007AFF) + 화이트 + 그레이 중심. 배경은 #F5F5F7."
5. **C (Components)**: "하단 탭바 4개(Home/Visa/Remit/MY). 버튼은 rounded-2xl. 카드는 rounded-3xl."

### 네거티브 프롬프트 (AI 클리셰 방지)

반드시 포함:
- "보라색/파란색 네온 그라데이션 금지"
- "3D 이모티콘 금지"
- "불필요한 장식 그래픽 요소 금지"
- "글래스모피즘 과용 금지 — 도구 레이어에만 적용"
- "사용하지 않는 구성 요소나 빈 영역 금지"

### Figma → Claude 핸드오프

1. Figma Make로 와이어프레임 생성
2. 수동 보정: 8pt 그리드 정렬, 접근성 대비 검사, 레이어 정리
3. 하이파이 완성
4. **스크린샷 + 컴포넌트 구조 설명**을 Claude에게 전달
5. Claude가 React + Tailwind 코드로 구현 (기존 비즈니스 로직 유지)

---

## 12. i18n 규칙

### 적용 범위

- **전 페이지 모든 유저 노출 텍스트**는 `t()` 경유 필수
- 현재 미적용: home.tsx, visa.tsx, remit.tsx, landing.tsx, onboarding.tsx, paywall.tsx
- Phase 1에서 전수 적용

### 네임스페이스 재구성 (리뉴얼)

| 이전 | 이후 | 비고 |
|---|---|---|
| common | common | 유지 (탭바 라벨, 공통 버튼) |
| housing | visa | Housing 기능이 Visa로 이동 |
| education | visa | Education 기능이 Visa로 이동 |
| profile | profile | 유지 |
| — | home | 🆕 홈 대시보드 텍스트 |
| — | remit | 🆕 송금 탭 텍스트 |
| — | paywall | 🆕 결제 텍스트 |
| — | onboarding | 🆕 온보딩 텍스트 |

---

*Settle Design System v1.0 · 2026-03-21 · 12 Research Papers Based*