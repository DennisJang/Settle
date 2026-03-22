/**
 * terms.tsx — Phase 2-B (Terms of Service)
 *
 * 앱스토어 제출 최소 요건 충족:
 * - 서비스 설명
 * - 면책 조항 (비자 점수, AI, 급여 계산기, 송금)
 * - 구독/결제 조건
 * - 계정 해지
 * - 연락처
 *
 * 영어 우선 + 한국어 병기
 *
 * Dennis 규칙:
 * #32 컬러 하드코딩 금지
 * #35 급여 계산기 면책 포함
 */

import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export function Terms() {
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
            Terms of Service
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

          <Section title="1. Service Description · 서비스 설명">
            <p>
              Settle is a mobile application that helps foreign residents in Korea manage
              visa status, compare remittance services, prepare immigration documents, and
              calculate wages. Settle is an information and utility tool — not a legal,
              financial, or immigration advisory service.
            </p>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              Settle은 한국 체류 외국인의 비자 관리, 송금 비교, 서류 준비, 급여 계산을 돕는
              정보 도구이며, 법률·재무·이민 자문 서비스가 아닙니다.
            </p>
          </Section>

          <Section title="2. Disclaimers · 면책 조항">
            <div className="space-y-3">
              <div>
                <p style={{ fontWeight: 600 }}>Visa Score & E-7-4 Simulator</p>
                <p>
                  Scores are reference-only simulations with no legal effect. Actual immigration
                  decisions are made solely by Korean immigration authorities.
                </p>
                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  비자 점수 및 E-7-4 시뮬레이터는 참고용 모의계산이며 법적 효력이 없습니다.
                </p>
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Wage Calculator</p>
                <p>
                  The wage calculator provides reference estimates based on the 2026 minimum
                  wage (₩10,320/hr). It does not verify, validate, or determine legal
                  compliance. For accurate assessment, contact the 1350 Foreign Worker Helpline
                  or a certified labor attorney.
                </p>
                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  급여 계산기는 2026년 최저임금 기준 참고용 모의계산이며 법적 효력이 없습니다.
                  정확한 확인은 1350 외국인 노동 상담 또는 공인노무사에게 문의하세요.
                </p>
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>AI Contract Scanner</p>
                <p>
                  AI-generated analysis is for reference only and does not constitute legal
                  advice. Consult a qualified professional before making decisions based on
                  AI output.
                </p>
                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  AI 분석 결과는 참고용이며 법률 자문이 아닙니다.
                </p>
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Remittance Comparison</p>
                <p>
                  Rankings are sorted by estimated received amount, independent of partnerships.
                  Rates and fees fluctuate in real time. Settle is a comparison tool, not a
                  remittance intermediary.
                </p>
                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  순위는 실수령액 기준 자동 정렬이며 제휴 여부와 무관합니다.
                  Settle은 비교 서비스이며 송금 중개가 아닙니다.
                </p>
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Document Submission</p>
                <p>
                  Settle provides auto-fill assistance for immigration documents. The accuracy
                  and completeness of submitted information is your responsibility.
                </p>
                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  서류 자동완성 도구이며 제출 책임은 본인에게 있습니다.
                </p>
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>Consultant Matching</p>
                <p>
                  Settle provides matching only and does not act as a legal representative
                  or immigration agent.
                </p>
                <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Settle은 매칭만 수행하며 직접 대리하지 않습니다.
                </p>
              </div>
            </div>
          </Section>

          <Section title="3. Subscription · 구독">
            <ul className="list-disc pl-5 space-y-1">
              <li>Free tier: Basic features at no cost</li>
              <li>Premium: ₩4,900/month or ₩47,040/year (₩3,920/month)</li>
              <li>7-day free trial for new Premium subscribers</li>
              <li>Cancel anytime — access continues until end of billing period</li>
              <li>Full refund within 14 days of purchase if not satisfied</li>
            </ul>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              무료 기본 기능 제공. Premium은 월 ₩4,900 또는 연 ₩47,040.
              언제든 해지 가능, 14일 이내 전액 환불.
            </p>
          </Section>

          <Section title="4. Account Termination · 계정 해지">
            <p>
              You may delete your account at any time. Upon deletion, all personal data will
              be removed within 30 days. Active subscriptions will be canceled, and remaining
              access will continue until the end of the billing period.
            </p>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              계정 삭제 시 30일 이내에 모든 데이터가 삭제됩니다.
            </p>
          </Section>

          <Section title="5. Governing Law · 준거법">
            <p>
              These terms are governed by the laws of the Republic of Korea. Any disputes
              shall be resolved in the courts of Seoul, Republic of Korea.
            </p>
            <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
              본 약관은 대한민국 법률에 따르며, 관할 법원은 서울 법원입니다.
            </p>
          </Section>

          <Section title="6. Contact · 연락처">
            <p>
              For inquiries:{" "}
              <span style={{ fontWeight: 600, color: "var(--color-action-primary)" }}>
                support@settle.app
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