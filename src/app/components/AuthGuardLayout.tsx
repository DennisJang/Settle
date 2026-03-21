import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useDashboardStore } from '../../stores/useDashboardStore'
import { useAuthStore } from '../../stores/useAuthStore'
import Layout from './layout'

export function AuthGuardLayout() {
  const { isAuthenticated, initialized } = useRequireAuth()
  const user = useAuthStore((s) => s.user)
  const { userProfile, loading, hydrate } = useDashboardStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (initialized && isAuthenticated && user?.id && !userProfile && !loading) {
      hydrate(user.id)
    }
  }, [initialized, isAuthenticated, user?.id, userProfile, loading, hydrate])

  useEffect(() => {
    if (!initialized || !isAuthenticated || loading) return

    // 온보딩 페이지 자체에서는 리다이렉트 안 함
    if (location.pathname === '/onboarding') {
      setChecked(true)
      return
    }

    // 프로필이 로드됐는데 온보딩 미완료면 리다이렉트
    if (userProfile && !userProfile.onboarding_completed) {
      navigate('/onboarding', { replace: true })
      return
    }

    // 프로필이 아예 없으면 (신규 유저) 온보딩으로
    if (!userProfile && !loading) {
      navigate('/onboarding', { replace: true })
      return
    }

    setChecked(true)
  }, [initialized, isAuthenticated, userProfile, loading, location.pathname, navigate])

  // Auth 초기화 중 → 스플래시
  if (!initialized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-surface-secondary)" }}
      >
        <div
          className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-action-primary)", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  // 미인증 → useRequireAuth가 "/" 로 리다이렉트 처리
  if (!isAuthenticated) return null

  // 온보딩 체크 중
  if (!checked && location.pathname !== '/onboarding') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-surface-secondary)" }}
      >
        <div
          className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-action-primary)", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  return <Layout />
}