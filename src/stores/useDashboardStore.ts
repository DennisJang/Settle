import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type {
  UserProfile,
  VisaTracker,
  DailyWorkLog,
  LifeEvent,
  ChecklistItem,
} from '../types'

// ============================================
// Dashboard Store — Phase 2-B
//
// Phase 2-B 변경사항:
// - hydrate: .single() → .maybeSingle() (user_profiles, visa_trackers)
//   원인: Google OAuth 리턴 직후 Auth 토큰이 완전히 세팅되기 전에 hydrate 호출 시
//         RLS가 auth.uid()를 null로 봄 → 0행 반환 → .single()이 406 에러
//   수정: .maybeSingle()은 0행이면 data: null 반환 (에러 아님)
// - hydrate 실패 시 1회 재시도 (500ms 딜레이) — Auth 토큰 안정화 대기
//
// 비즈니스 로직 동결: saveWorkLog, updateSpecOptimistic, toggleChecklistItem,
//                     updateProfileField, reset 100% 원본 유지
// ============================================

interface DashboardState {
  // --- data ---
  userProfile: UserProfile | null
  visaTracker: VisaTracker | null
  workLogs: DailyWorkLog[]
  lifeEvents: LifeEvent[]

  // --- UI state ---
  loading: boolean
  error: string | null

  // --- actions ---
  hydrate: (userId: string) => Promise<void>
  saveWorkLog: (log: Omit<DailyWorkLog, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateSpecOptimistic: (
    field: keyof Pick<UserProfile, 'full_name' | 'nationality' | 'visa_type' | 'visa_expiry' | 'phone' | 'language'>,
    value: string
  ) => Promise<void>
  toggleChecklistItem: (itemId: number) => Promise<void>
  updateProfileField: (updates: Partial<UserProfile>) => Promise<void>
  reset: () => void
}

const initialState = {
  userProfile: null,
  visaTracker: null,
  workLogs: [],
  lifeEvents: [],
  loading: false,
  error: null,
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initialState,

  // ============================================
  // hydrate — 로그인 직후 1회 호출
  // 4개 테이블 병렬 fetch (RLS가 user_id 필터링)
  //
  // ★ Phase 2-B: .single() → .maybeSingle() + 재시도
  // ============================================
  hydrate: async (userId: string) => {
    set({ loading: true, error: null })

    try {
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const [profileRes, visaRes, logsRes, eventsRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),  // ★ .single() → .maybeSingle()

        supabase
          .from('visa_trackers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),  // ★ .single() → .maybeSingle()

        supabase
          .from('daily_work_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('work_date', monthStart)
          .order('work_date', { ascending: false }),

        supabase
          .from('life_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const errors = [profileRes.error, visaRes.error, logsRes.error, eventsRes.error]
        .filter(Boolean)
        .map((e) => e?.message ?? 'Unknown error')

      if (errors.length > 0) {
        console.error('[Dashboard hydrate] errors:', errors)
      }

      // ★ Phase 2-B: 프로필이 null이고 에러도 있으면 → Auth 토큰 레이스 가능성
      // 500ms 후 1회 재시도
      if (!profileRes.data && profileRes.error) {
        console.warn('[Dashboard hydrate] Profile fetch failed, retrying in 500ms...')
        await new Promise(resolve => setTimeout(resolve, 500))

        const retryProfile = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        const retryVisa = await supabase
          .from('visa_trackers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        set({
          userProfile: retryProfile.data ?? null,
          visaTracker: retryVisa.data ?? null,
          workLogs: logsRes.data ?? [],
          lifeEvents: eventsRes.data ?? [],
          loading: false,
        })
        return
      }

      set({
        userProfile: profileRes.data ?? null,
        visaTracker: visaRes.data ?? null,
        workLogs: logsRes.data ?? [],
        lifeEvents: eventsRes.data ?? [],
        loading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard'
      set({ error: message, loading: false })
    }
  },

  // ============================================
  // saveWorkLog — 100% 동결
  // ============================================
  saveWorkLog: async (log) => {
    const { userProfile, workLogs } = get()
    if (!userProfile) return

    const userId = userProfile.user_id

    try {
      const { data: existing } = await supabase
        .from('daily_work_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('work_date', log.work_date)
        .maybeSingle()

      let result

      if (existing) {
        result = await supabase
          .from('daily_work_logs')
          .update({
            clock_in: log.clock_in,
            clock_out: log.clock_out,
            is_holiday: log.is_holiday,
            snapshot_minimum_wage: log.snapshot_minimum_wage,
          })
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('daily_work_logs')
          .insert({
            user_id: userId,
            work_date: log.work_date,
            clock_in: log.clock_in,
            clock_out: log.clock_out,
            is_holiday: log.is_holiday,
            snapshot_minimum_wage: log.snapshot_minimum_wage,
          })
          .select()
          .single()
      }

      if (result.error) {
        const isPgConflict =
          result.error.code === '23505' ||
          result.error.message?.includes('duplicate') ||
          (result.error as { status?: number }).status === 409

        if (isPgConflict) {
          console.warn('[saveWorkLog] Conflict detected, refetching...')
        }
        throw new Error(result.error.message ?? 'Failed to save work log')
      }

      if (result.data) {
        const updated = existing
          ? workLogs.map((w) => (w.id === existing.id ? result.data! : w))
          : [result.data, ...workLogs]

        set({ workLogs: updated })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save work log'
      set({ error: message })
    }
  },

  // ============================================
  // updateSpecOptimistic — 100% 동결
  // ============================================
  updateSpecOptimistic: async (field, value) => {
    const { userProfile } = get()
    if (!userProfile) return

    const prev = userProfile[field]

    set({
      userProfile: { ...userProfile, [field]: value },
    })

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('user_id', userProfile.user_id)

      if (error) throw error
    } catch (err) {
      set({
        userProfile: { ...get().userProfile!, [field]: prev },
        error: err instanceof Error ? err.message : 'Failed to update profile',
      })
    }
  },

  // ============================================
  // toggleChecklistItem — 100% 동결
  // ============================================
  toggleChecklistItem: async (itemId: number) => {
    const { visaTracker } = get()
    if (!visaTracker) return

    const prevChecklist = visaTracker.checklist

    const updatedChecklist = prevChecklist.map((item: ChecklistItem) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )

    set({
      visaTracker: { ...visaTracker, checklist: updatedChecklist },
    })

    try {
      const { error } = await supabase
        .from('visa_trackers')
        .update({
          checklist: updatedChecklist,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', visaTracker.user_id)

      if (error) throw error
    } catch (err) {
      set({
        visaTracker: { ...get().visaTracker!, checklist: prevChecklist },
        error: err instanceof Error ? err.message : 'Failed to update checklist',
      })
    }
  },

  // ============================================
  // updateProfileField — 100% 동결
  // ============================================
  updateProfileField: async (updates: Partial<UserProfile>) => {
    const { userProfile } = get()
    if (!userProfile) return

    const prevProfile = { ...userProfile }

    set({
      userProfile: { ...userProfile, ...updates, updated_at: new Date().toISOString() },
    })

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userProfile.user_id)

      if (error) throw error
    } catch (err) {
      set({
        userProfile: prevProfile,
        error: err instanceof Error ? err.message : 'Failed to update profile',
      })
    }
  },

  // ============================================
  // reset — 100% 동결
  // ============================================
  reset: () => set(initialState),
}))