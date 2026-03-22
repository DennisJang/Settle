import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { usePaymentStore } from "../../stores/usePaymentStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useDashboardStore } from "../../stores/useDashboardStore";

// ============================================
// PaywallSuccess — Toss redirect 후 처리
// URL params: authKey, customerKey, plan, cycle
// → Edge Function 호출 → 구독 활성화
// ============================================

type Status = 'processing' | 'success' | 'error'

export function PaywallSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const activateSubscription = usePaymentStore((s) => s.activateSubscription)
  const hydrate = useDashboardStore((s) => s.hydrate)

  const [status, setStatus] = useState<Status>('processing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const authKey = searchParams.get('authKey')
    const customerKey = searchParams.get('customerKey')
    const plan = searchParams.get('plan') as 'basic' | 'premium' | null
    const cycle = searchParams.get('cycle') as 'monthly' | 'yearly' | null

    const errorCode = searchParams.get('code')
    const errorMsg = searchParams.get('message')

    if (errorCode || errorMsg) {
      setStatus('error')
      setErrorMessage(errorMsg ?? t('paywall:success_error_auth'))
      return
    }

    if (!authKey || !customerKey || !plan || !user) {
      setStatus('error')
      setErrorMessage(t('paywall:success_error_invalid'))
      return
    }

    const activate = async () => {
      try {
        await activateSubscription({
          authKey,
          customerKey,
          plan,
          billingCycle: cycle ?? 'monthly',
        })

        await hydrate(user.id)

        setStatus('success')

        setTimeout(() => {
          navigate('/home', { replace: true })
        }, 3000)
      } catch (err) {
        setStatus('error')
        setErrorMessage(
          err instanceof Error ? err.message : t('paywall:success_error_activate')
        )
      }
    }

    activate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "var(--color-surface-secondary)" }}
    >
      <div
        className="rounded-3xl p-8 w-full max-w-sm text-center space-y-6"
        style={{ backgroundColor: "var(--color-surface-primary)" }}
      >
        {/* Processing */}
        {status === 'processing' && (
          <>
            <Loader2
              size={48}
              className="animate-spin mx-auto"
              style={{ color: "var(--color-action-primary)" }}
            />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>
              {t('paywall:success_processing_title')}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {t('paywall:success_processing_desc')}
            </p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <CheckCircle2
              size={48}
              className="mx-auto"
              style={{ color: "var(--color-action-success)" }}
            />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>
              {t('paywall:success_done_title')}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {t('paywall:success_done_desc')}
            </p>
            <button
              onClick={() => navigate('/home', { replace: true })}
              className="w-full rounded-2xl py-4 active:scale-96 transition-transform"
              style={{
                fontWeight: 600,
                backgroundColor: "var(--color-action-primary)",
                color: "var(--color-text-on-color)",
              }}
            >
              {t('paywall:success_go_home')}
            </button>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <XCircle
              size={48}
              className="mx-auto"
              style={{ color: "var(--color-action-error)" }}
            />
            <h2 className="text-xl" style={{ fontWeight: 600 }}>
              {t('paywall:success_error_title')}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-action-error)" }}>
              {errorMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/paywall', { replace: true })}
                className="w-full rounded-2xl py-4 active:scale-96 transition-transform"
                style={{
                  fontWeight: 600,
                  backgroundColor: "var(--color-action-primary)",
                  color: "var(--color-text-on-color)",
                }}
              >
                {t('paywall:success_retry')}
              </button>
              <button
                onClick={() => navigate('/home', { replace: true })}
                className="w-full rounded-2xl py-4 active:scale-96 transition-transform"
                style={{
                  fontWeight: 600,
                  backgroundColor: "var(--color-surface-secondary)",
                  color: "var(--color-text-primary)",
                }}
              >
                {t('paywall:success_go_home')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}