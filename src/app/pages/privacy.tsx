/**
 * privacy.tsx — Phase 2-B (Privacy Policy)
 *
 * 앱스토어 제출 최소 요건 충족:
 * - 수집 데이터 종류 명시
 * - 데이터 사용 목적
 * - 제3자 공유 여부
 * - 데이터 보관/삭제 정책
 * - 연락처
 *
 * 영어 우선 (타겟: 외국인) + 한국어 병기
 *
 * Dennis 규칙:
 * #32 컬러 하드코딩 금지
 */

import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export function Privacy() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen pb-16"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "var(--color-surface-primary)",
          borderBottom: "1px solid var(--color-border-default)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{ backgroundColor: "var(--color-surface-secondary)" }}
          >
            <ChevronLeft size={20} style={{ color: "var(--color-text-primary)" }} />
          </button>
          <h1
            className="text-[20px] leading-[25px]"
            style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
          >
            Privacy Policy
          </h1>
        </div>
      </header>

      <div className="px-5 py-6">
        <div
          className="rounded-3xl p-6 space-y-6"
          style={{ backgroundColor: "var(--color-surface-primary)" }}
        >
          <p
            className="text-[13px] leading-[20px]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Last updated: March 2026 · 최종 수정: 2026년 3월
          </p>

          <Section title="1. Information We Collect · 수집하는 정보">
            <p>Settle collects the following information to provide our services:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Account information: name, email, phone number</li>
              <li>Immigration data: visa type, expiry date, nationality, ARC number (optional)</li>
              <li>Employment data: workplace, income (optional, for wage calculator)</li>
              <li>Usage data: app interactions, remittance comparison history</li>
            </ul>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              Settle은 서비스 제공을 위해 위 정보를 수집합니다.
            </p>
          </Section>

          <Section title="2. How We Use Your Data · 데이터 사용 목적">
            <ul className="list-disc pl-5 space-y-1">
              <li>Visa tracking and D-Day notifications</li>
              <li>Remittance provider comparison</li>
              <li>Document preparation and submission</li>
              <li>Personalized recommendations</li>
              <li>Service improvement and analytics</li>
            </ul>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              비자 추적, 송금 비교, 서류 준비 등 서비스 제공 및 개선을 위해 사용합니다.
            </p>
          </Section>

          <Section title="3. Data Sharing · 제3자 제공">
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Supabase</strong> — secure database hosting (encrypted at rest)</li>
              <li><strong>Toss Payments</strong> — subscription payment processing</li>
              <li><strong>Popbill</strong> — document fax submission (only when you initiate)</li>
              <li><strong>Google</strong> — OAuth authentication (if you choose Google sign-in)</li>
            </ul>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              개인정보를 판매하지 않습니다. 서비스 운영에 필요한 최소한의 파트너에게만 공유합니다.
            </p>
          </Section>

          <Section title="4. Data Security · 보안">
            <p>
              All data is encrypted in transit (TLS 1.3) and at rest. Database access is
              restricted by Row Level Security (RLS) — you can only access your own data.
            </p>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              모든 데이터는 전송 및 저장 시 암호화됩니다. 본인의 데이터에만 접근 가능합니다.
            </p>
          </Section>

          <Section title="5. Data Retention & Deletion · 보관 및 삭제">
            <p>
              Your data is retained while your account is active. You may request deletion
              of your account and all associated data by contacting us. Deletion is processed
              within 30 days.
            </p>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              계정 활성 상태 동안 데이터를 보관합니다. 연락하시면 30일 이내에 삭제 처리합니다.
            </p>
          </Section>

          <Section title="6. Your Rights · 이용자 권리">
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your data at any time through the MY tab</li>
              <li>Correct inaccurate information</li>
              <li>Request data export</li>
              <li>Request account deletion</li>
            </ul>
          </Section>

          <Section title="7. Contact · 연락처">
            <p>
              For privacy inquiries:{" "}
              <span style={{ fontWeight: 600, color: "var(--color-action-primary)" }}>
                privacy@settle.app
              </span>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2
        className="text-[15px] leading-[20px] mb-2"
        style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      <div
        className="text-[13px] leading-[20px]"
        style={{ color: "var(--color-text-primary)" }}
      >
        {children}
      </div>
    </div>
  );
}