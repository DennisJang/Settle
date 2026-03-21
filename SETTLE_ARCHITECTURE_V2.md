# Settle Architecture v2.0 — 4-Tab Blueprint
> 갱신: 2026-03-21 · Phase 0-A 기준
> V1 대비 변경: 6탭→4탭, Housing/Education 흡수, 급여 계산기 추가, 디자인 토큰 체계 도입

---

## Layer 0: 파일 구조

```
src/
├── app/
│   ├── pages/
│   │   ├── landing.tsx          ✅ Auth (이메일 + Google OAuth)
│   │   ├── onboarding.tsx       ✅ 2단계 온보딩
│   │   ├── home.tsx             🔄 리디자인 (글랜서블 대시보드)
│   │   ├── visa.tsx             🔄 강화 (E-7-4 시뮬레이터 + 급여 계산기 + AI 서류가이드)
│   │   ├── remit.tsx            🔄 송금 비교 (하드코딩 탈피 목표)
│   │   ├── profile.tsx          ✅ → MY 탭으로 리브랜딩
│   │   ├── paywall.tsx          ✅ Toss 결제
│   │   ├── PaywallSuccess.tsx   ✅
│   │   ├── housing.tsx          ⏸️ 탭바에서 제거, 파일 보존 (AI 스캐너 이식 후)
│   │   └── education.tsx        ⏸️ 탭바에서 제거, 파일 보존
│   ├── components/
│   │   ├── layout.tsx           🔄 4탭 탭바로 수정
│   │   ├── AuthGuardLayout.tsx  ✅
│   │   ├── logo.tsx             ✅
│   │   └── ui/                  ✅ shadcn 컴포넌트
│   ├── App.tsx                  ✅
│   └── routes.tsx               🔄 Housing/Education 라우트 제거
├── i18n/
│   ├── index.ts                 ✅
│   └── locales/
│       ├── ko.json              🔄 네임스페이스 재구성 (housing/education → visa 통합)
│       ├── en.json              🔄
│       ├── vi.json              🔄
│       └── zh.json              🔄
├── stores/
│   ├── useAuthStore.ts          ✅
│   ├── useDashboardStore.ts     ✅
│   ├── usePaymentStore.ts       ✅
│   └── useSubmitStore.ts        ✅
├── hooks/
│   └── useRequireAuth.ts        ✅
├── types/
│   └── index.ts                 ✅
├── lib/
│   └── supabase.ts              ✅
└── styles/
    ├── theme.css                🔄 시맨틱 토큰 전면 교체
    ├── index.css                ✅
    └── fonts.css                ✅
```

---

## Layer 1: Route 구조 (리뉴얼)

```typescript
// routes.tsx — Phase 0-A 목표
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/",
    Component: AuthGuardLayout,
    children: [
      { path: "home", Component: Home },
      { path: "visa", Component: Visa },
      { path: "remit", Component: Remit },
      { path: "profile", Component: Profile },  // MY 탭
      { path: "paywall", Component: Paywall },
      { path: "paywall/success", Component: PaywallSuccess },
      { path: "onboarding", Component: Onboarding },
      // housing, education 라우트 제거
      // 단, 직접 URL 접근 시 /home으로 리다이렉트 처리
    ],
  },
]);
```

### 탭바 (layout.tsx)

```typescript
const tabs = [
  { path: "/home", icon: Home, label: t('tab_home') },       // 홈
  { path: "/visa", icon: FileText, label: t('tab_visa') },   // 비자
  { path: "/remit", icon: Send, label: t('tab_remit') },     // 송금
  { path: "/profile", icon: User, label: t('tab_my') },      // MY
];
// 4개 탭, iOS 26 HIG 준수
// 부유형(Floating) 탭바 디자인 적용 (Phase 0-B)
```

---

## Layer 2: Data 레이어

### 테이블 사용 현황 (리뉴얼 후)

| 테이블 | 상태 | 사용 탭 | 비고 |
|---|---|---|---|
| user_profiles | ✅ 활성 | 전체 | 핵심 |
| visa_trackers | ✅ 활성 | Home, Visa | 핵심 |
| daily_work_logs | ⏸️ 보류 | — | 급여 달력 삭제, 급여 계산기는 DB 불사용 (클라이언트 계산) |
| life_events | ✅ 활성 | Home | 피드 |
| action_queue | ✅ 활성 | 시스템 | 자동화 큐 |
| kiip_schedules | ✅ 활성 | Home (카드) | 읽기 전용 |
| kiip_alerts | ✅ 활성 | Home | 알림 구독 |
| exchange_rates | ✅ 활성 | Home, Remit | 환율 |
| remit_logs | ✅ 활성 | Remit | 딥링크 추적 |
| housing_insurance_providers | ⏸️ 보류 | — | 실데이터 확보 시 부활 |
| housing_legal_services | ⏸️ 보류 | — | 실데이터 확보 시 부활 |
| mock_exams | ⏸️ 보류 | — | 실 문제 DB 확보 시 부활 |
| exam_attempts | ⏸️ 보류 | — | 실 문제 DB 확보 시 부활 |
| fax_submissions | ✅ 활성 | Visa | 서류 제출 |
| payment_history | ✅ 활성 | MY | 결제 이력 |
| admin_match_requests | ✅ 활성 | Visa | 행정사 매칭 |

### Edge Functions 우선순위

| 함수 | P등급 | 트리거 탭 | 비고 |
|---|---|---|---|
| get-exchange-rates | P0 | Home, Remit | |
| toss-subscribe-init | P0 | Paywall | |
| toss-webhook-handler | P0 | 시스템 | |
| get-wage-summary | P1 | Visa (급여 계산기) | body에 user_id 필수 |
| render-immigration-pdf | P1 | Visa | |
| send-immigration-fax | P1 | Visa | |
| parse-contract-ocr | P2 | Visa (프리미엄) | Housing에서 이동 |
| translate-field | P2 | MY | |
| webhook-fax-handler | P2 | 시스템 | |

---

## Layer 3: State 레이어 (Zustand)

### Store 구조 (변경 없음)

```
useAuthStore       → Auth 상태 (user, session, loading, initialized)
useDashboardStore  → 프로필 + 비자 + 워크로그 + 이벤트
usePaymentStore    → 구독 상태 + Toss 연동
useSubmitStore     → 팩스/서류 제출 상태
```

### 급여 계산기 — Store 불사용

급여 계산기는 **순수 클라이언트 사이드 계산**. DB 저장 없음, Edge Function 호출 없음.

```typescript
// visa.tsx 내부 함수 (Store 아님)
function calculateWage(params: {
  hourlyRate: number;    // 유저 입력 시급
  hoursPerDay: number;   // 일 근무시간
  daysPerWeek: number;   // 주 근무일
  nightHours: number;    // 야간 근무시간 (22~06시)
  overtimeHours: number; // 주 초과근무 시간
}): WageEstimate {
  const MINIMUM_WAGE_2026 = 10_320; // 원 — 하드코딩 OK (연 1회 업데이트)
  // ... 기계적 계산
  return {
    estimatedMonthlyPay: number;
    minimumWageMonthlyPay: number;  // 최저임금 기준 월급
    isAboveMinimum: boolean;        // 비교 결과 (판단이 아닌 비교)
    breakdown: { base, night, overtime, weeklyHoliday };
  };
}
```

**핵심**: 이 함수는 "적법/위반" 판단을 하지 않는다. 두 숫자를 나란히 보여주고 유저가 비교한다.

---

## Layer 4: UI Binding 맵 (리뉴얼)

### Home (글랜서블 대시보드)

| 섹션 | 데이터 소스 | 비고 |
|---|---|---|
| 비자 D-Day | `userProfile.visa_expiry` → `calcDDay()` | ≤30일 시 경고 |
| 환율 스냅샷 | `exchange_rates` + `userProfile.frequent_country` | 1줄 |
| KIIP 진행도 | `visaTracker.kiip_stage` | /5 프로그레스 |
| 송금 요약 | `remit_logs` 이번 달 합계 | "이번 달 ₩0 송금" or 금액 |
| 최근 활동 | `life_events` 최신 3건 | |
| 프리미엄 배너 | `userProfile.subscription_plan !== 'premium'` | |

### Visa (비자 오토파일럿)

| 섹션 | 데이터 소스 | 신규 여부 |
|---|---|---|
| E-7-4 K-point 시뮬레이터 | `visaTracker` 전체 + 계산 로직 | 🆕 신규 |
| 비자 점수 링 | `visaTracker.total_score` | 기존 |
| 요건 체크리스트 | `visaTracker.checklist` JSONB | 기존 |
| KIIP 진행도 | `visaTracker.kiip_stage` | 기존 |
| 서류 자동제출 | `useSubmitStore` | 기존 (리브랜딩) |
| AI 서류 가이드 | `userProfile.visa_type` → 서류 매핑 | 🆕 신규 |
| AI 계약서 스캐너 | `parse-contract-ocr` | Housing에서 이동 |
| 행정사 매칭 | `admin_match_requests` | 기존 (CTA 강화) |
| 급여 계산기 | 클라이언트 사이드 계산 (DB 불사용) | 🆕 신규 |

### Remit (송금 + 환율)

| 섹션 | 데이터 소스 | 비고 |
|---|---|---|
| 환율 | `get-exchange-rates` | 기존 |
| 업체 비교 | 하드코딩 (→ 실데이터 전환 예정) | 기존 |
| Money Flight | `remit_logs` | 기존 |

### MY (프로필)

| 섹션 | 데이터 소스 | 비고 |
|---|---|---|
| Immigration Profile | `userProfile` | 기존 |
| 구독 관리 | `payment_history` | 기존 |
| 언어 변경 | `userProfile.language` + i18n | 기존 |
| 로그아웃 | `useAuthStore.signOut()` | 기존 |

---

## Supabase Secrets

| Secret | 상태 |
|---|---|
| POPBILL_LINK_ID | ✅ GAHEON |
| POPBILL_SECRET_KEY | ✅ |
| POPBILL_CORP_NUM | ✅ |
| KOREAEXIM_API_KEY | ✅ |
| EXCHANGERATE_API_KEY | ✅ |

---

## .env 템플릿

```env
VITE_SUPABASE_URL=https://wcwurhccxhbzojrsictb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_TOSS_CLIENT_KEY=test_ck_...
VITE_POPBILL_API_KEY=...
```

---

*Settle Architecture v2.0 · 2026-03-21 · 4-Tab Blueprint*