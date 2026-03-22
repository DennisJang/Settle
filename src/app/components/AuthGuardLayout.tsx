/**
 * AuthGuardLayout.tsx — Phase 2-B
 *
 * P0-2 FIX: Google 재로그인 시 온보딩 재진입 문제
 *
 * 원인: hydrate() 호출 → 응답 도착 전에 두 번째 useEffect가
 *       !userProfile && !loading 조건을 만족시켜 /onboarding으로 리다이렉트.
 *       loading이 true가 되기까지 한 틱의 갭이 있었음.
 *
 * 수정: hydrationStarted 플래그를 추가하여,
 *       hydrate가 시작됐지만 아직 완료되지 않은 상태에서는 리다이렉트하지 않음.
 *       loading이 true→false로 전환된 후에야 프로필 유무를 판단.
 *
 * Dennis 규칙:
 * #26 비즈니스 로직 건드리지 않음
 * #32 컬러 하드코딩 금지
 */

import { useEffect, useState, useRef } from 'react'
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

  // ★ P0-2 FIX: hydrate 호출 여부 추적
  const hydrationStarted = useRef(false)

  useEffect(() => {
    if (initialized && isAuthenticated && user?.id && !userProfile && !loading) {
      hydrationStarted.current = true
      hydrate(user.id)
    }
  }, [initialized, isAuthenticated, user?.id, userProfile, loading, hydrate])

  useEffect(() => {
    if (!initialized || !isAuthenticated) return

    // 아직 로딩 중이면 기다림
    if (loading) return

    // ★ P0-2 FIX: hydrate가 시작됐지만 아직 프로필이 로드되지 않았으면 기다림
    // hydrate()가 호출되면 loading이 true→false 순서로 전환됨.
    // loading이 false인데 userProfile이 없고, hydrate가 아직 시작 안 됐으면
    // → 첫 렌더 직후일 수 있음. hydrate 시작을 기다려야 함.
    if (!userProfile && !hydrationStarted.current && user?.id) {
      // hydrate가 아직 시작 안 됨 — 첫 번째 useEffect가 실행될 때까지 대기
      return
    }

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
    // ★ P0-2: 이 조건은 hydrate가 완료된 후(loading false 전환 후)에만 도달
    if (!userProfile && !loading) {
      navigate('/onboarding', { replace: true })
      return
    }

    setChecked(true)
  }, [initialized, isAuthenticated, userProfile, loading, location.pathname, navigate, user?.id])

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