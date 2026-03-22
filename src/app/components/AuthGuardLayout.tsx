/**
 * AuthGuardLayout.tsx — Phase 2-B (P0-2 v2)
 *
 * P0-2 FIX v2: Google 재로그인 시 온보딩 재진입 문제
 *
 * 근본 원인:
 * 1. hydrate()는 async → set({ loading: true })가 다음 렌더에서 반영
 * 2. 같은 렌더 사이클에서 두 번째 useEffect가 !userProfile && !loading을 만족
 * 3. → /onboarding 리다이렉트 발동
 *
 * 수정 전략 (3-Effect 패턴):
 * - Effect 1: hydrate 호출 (1회만, hydrateCalledRef로 중복 방지)
 * - Effect 2: hydrate 완료 감지 (hydrateCalledRef.current && !loading → hydrated = true)
 * - Effect 3: 온보딩 리다이렉트 판단 (hydrated가 true일 때만)
 *
 * hydrated는 state이므로 리렌더를 트리거하고,
 * Effect 3이 올바른 타이밍에 재실행됨.
 *
 * Dennis 규칙 #26: 비즈니스 로직 건드리지 않음
 * Dennis 규칙 #32: 컬러 하드코딩 금지
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

  // ★ P0-2 v2: hydrate 완료 추적
  const [hydrated, setHydrated] = useState(false)
  const hydrateCalledRef = useRef(false)

  // Effect 1: hydrate 호출 (1회만)
  useEffect(() => {
    if (initialized && isAuthenticated && user?.id && !userProfile && !loading && !hydrateCalledRef.current) {
      hydrateCalledRef.current = true
      hydrate(user.id)
    }
  }, [initialized, isAuthenticated, user?.id, userProfile, loading, hydrate])

  // Effect 2: hydrate 완료 감지
  // hydrate 호출 후 loading이 true→false로 전환되면 완료
  useEffect(() => {
    if (hydrateCalledRef.current && !loading && !hydrated) {
      setHydrated(true)
    }
  }, [loading, hydrated])

  // Effect 3: 온보딩 리다이렉트 판단
  useEffect(() => {
    if (!initialized || !isAuthenticated) return

    // 온보딩 페이지 자체에서는 리다이렉트 안 함
    if (location.pathname === '/onboarding') {
      setChecked(true)
      return
    }

    // ★ 핵심: hydrate 완료 전에는 판단하지 않음
    if (!hydrated) return

    // 프로필이 로드됐는데 온보딩 미완료면 리다이렉트
    if (userProfile && !userProfile.onboarding_completed) {
      navigate('/onboarding', { replace: true })
      return
    }

    // 프로필이 아예 없으면 (진짜 신규 유저) 온보딩으로
    if (!userProfile) {
      navigate('/onboarding', { replace: true })
      return
    }

    setChecked(true)
  }, [initialized, isAuthenticated, userProfile, hydrated, location.pathname, navigate])

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

  // 온보딩 체크 중 (hydrate 완료 대기)
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