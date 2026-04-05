// src/stores/useMyStore.ts
// ============================================
// My 위젯 Store — my-profile EF 연동
// Phase C: 프로필 관리 + 비자 변경 + 구독 조회
// 패턴: WIKI_PATTERNS 2.1
// ============================================

import { create } from "zustand";
import { supabase } from "../lib/supabase";

// ─── Types ───

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  nationality: string | null;
  visa_type: string | null;
  visa_expiry: string | null;
  arrival_date: string | null;
  phone: string | null;
  language: string | null;
  address_korea: string | null;
  email: string | null;
  topik_level: number;
  kiip_completed: boolean;
  housing_type: string;
  employment_start: string | null;
  annual_income: number | null;
  onboarding_completed: boolean;
  event_consent: boolean | null;
  // 나머지 필드는 프론트에서 필요할 때 추가
  [key: string]: unknown;
}

export interface Subscription {
  plan: "free" | "premium";
  is_premium: boolean;
  started_at: string | null;
  expires_at: string | null;
  payment_provider: string | null;
}

export interface VisaChangeRecord {
  old_visa_type: string;
  new_visa_type: string;
  changed_at: string;
  source: string;
}

export interface VisaChangeResult {
  changed: boolean;
  old_visa_type?: string;
  new_visa_type?: string;
  actions_required?: string[];
}

interface MyState {
  // Data
  profile: UserProfile | null;
  subscription: Subscription | null;
  visaHistory: VisaChangeRecord[];

  // UI
  loading: boolean;
  error: string | null;
  saving: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ address_changed: boolean }>;
  changeVisa: (newVisaType: string, source: string, scanResultId?: string) => Promise<VisaChangeResult>;
  loadSubscription: () => Promise<void>;
}

// ─── EF 호출 헬퍼 ───

async function callEF(action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/my-profile`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "my-profile EF failed");
  return data;
}

// ─── Store ───

export const useMyStore = create<MyState>((set) => ({
  profile: null,
  subscription: null,
  visaHistory: [],
  loading: false,
  error: null,
  saving: false,

  loadProfile: async () => {
    set({ loading: true, error: null });
    try {
      const data = await callEF("get");
      set({
        profile: data.profile,
        subscription: data.subscription,
        visaHistory: data.visa_history ?? [],
        loading: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load profile";
      set({ error: msg, loading: false });
    }
  },

  updateProfile: async (updates) => {
    set({ saving: true, error: null });
    try {
      const data = await callEF("update", { updates });

      // 로컬 상태 즉시 반영
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
        saving: false,
      }));

      return { address_changed: data.address_changed ?? false };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      set({ error: msg, saving: false });
      return { address_changed: false };
    }
  },

  changeVisa: async (newVisaType, source, scanResultId) => {
    set({ saving: true, error: null });
    try {
      const data = await callEF("change_visa", {
        new_visa_type: newVisaType,
        source,
        scan_result_id: scanResultId,
      });

      if (data.changed) {
        // 로컬 비자 즉시 반영
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, visa_type: newVisaType }
            : null,
          visaHistory: [
            {
              old_visa_type: data.old_visa_type,
              new_visa_type: data.new_visa_type,
              changed_at: new Date().toISOString(),
              source,
            },
            ...state.visaHistory,
          ],
          saving: false,
        }));
      } else {
        set({ saving: false });
      }

      return {
        changed: data.changed,
        old_visa_type: data.old_visa_type,
        new_visa_type: data.new_visa_type,
        actions_required: data.actions_required,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to change visa";
      set({ error: msg, saving: false });
      return { changed: false };
    }
  },

  loadSubscription: async () => {
    try {
      const data = await callEF("get_subscription");
      set({
        subscription: {
          plan: data.plan,
          is_premium: data.is_premium,
          started_at: data.started_at,
          expires_at: data.expires_at,
          payment_provider: data.payment_provider,
        },
      });
    } catch (e: unknown) {
      console.error("[useMyStore] loadSubscription error:", e);
    }
  },
}));