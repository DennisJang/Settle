import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { useDashboardStore } from './useDashboardStore'
import { usePaymentStore } from './usePaymentStore'
import { useSubmitStore } from './useSubmitStore'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  error: string | null

  initialize: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  error: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      set({
        session,
        user: session?.user ?? null,
        initialized: true,
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      })
    } catch {
      set({ initialized: true })
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign in failed'
      set({ error: message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  signUpWithEmail: async (email, password, fullName) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign up failed'
      set({ error: message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Google sign in failed'
      set({ error: message })
    } finally {
      set({ loading: false })
    }
  },

  // 규칙 #10: signOut → supabase.auth.signOut() + reset() + navigate("/")
  // navigate는 컴포넌트에서 호출 (store에서 직접 하지 않음)
  signOut: async () => {
    // Phase 2: dashboard store 초기화
    useDashboardStore.getState().reset()
    // Phase 3: payment store 초기화
    usePaymentStore.getState().resetSubscription()
    // Phase 4: submit store 초기화
    useSubmitStore.getState().reset()

    await supabase.auth.signOut()
    set({
      user: null,
      session: null,
      error: null,
    })
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      })
      if (error) throw error
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Password reset failed'
      set({ error: message })
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))