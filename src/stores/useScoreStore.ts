// src/stores/useScoreStore.ts
// ============================================
// Score 위젯 Store — score-calculate + score-deadlines 통합
// Phase C: Phase B의 score-deadlines EF + Phase C의 score-calculate EF
// 패턴: WIKI_PATTERNS 2.1 (위젯당 1 Store, EF action과 1:1)
// ============================================

import { create } from "zustand";
import { supabase } from "../lib/supabase";

// ─── Types ───

export interface ScoreBreakdown {
  base: {
    total: number;
    visa_score: number;
    visa_type: string | null;
    duration_score: number;
    stay_years: number;
  };
  w_int: {
    value: number;
    topik: { level: number; weight: number };
    kiip: { completed: boolean; weight: number };
    housing: { type: string; weight: number };
  };
  w_fin: {
    value: number;
    income: { annual: number | null; gni_ratio: number | null; weight: number };
    health: { estimated_months: number; weight: number };
    insurance: { weight: number };
  };
  penalty: {
    total: number;
    items: Array<{ type: string; points: number }>;
  };
  formula: string;
}

export interface ScoreResult {
  score: number;
  base_score: number;
  w_int: number;
  w_fin: number;
  penalty: number;
  breakdown: ScoreBreakdown;
  scorecard: string;
  delta: number | null;
  grade: string;
  grade_label_key: string;
  calculated_at: string;
  cached: boolean;
  disclaimer: string;
}

export interface Deadline {
  id: string;
  title_key: string;
  deadline_date: string;
  source_widget: string;
  urgency: "info" | "warning" | "urgent";
  completed: boolean;
  completed_at: string | null;
  d_day: number;
  created_at: string;
}

export interface ScoreNotification {
  id: string;
  type: string;
  title_key: string;
  body: Record<string, unknown>;
  source_widget: string;
  read: boolean;
  created_at: string;
}

interface ScoreState {
  // Score
  score: ScoreResult | null;
  scoreLoading: boolean;
  scoreError: string | null;

  // Deadlines
  deadlines: Deadline[];
  deadlinesLoading: boolean;
  deadlinesError: string | null;

  // Notifications
  notifications: ScoreNotification[];
  notificationsLoading: boolean;

  // Actions — Score
  calculateScore: (force?: boolean) => Promise<void>;

  // Actions — Deadlines (score-deadlines EF)
  loadDeadlines: () => Promise<void>;
  addDeadline: (titleKey: string, deadlineDate: string, sourceWidget: string, urgency?: string) => Promise<void>;
  completeDeadline: (deadlineId: string) => Promise<void>;

  // Actions — Notifications
  loadNotifications: () => Promise<void>;
}

// ─── EF 호출 헬퍼 (WIKI_PATTERNS 1.3) ───

async function callEF(efName: string, action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${efName}`,
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
  if (!res.ok) throw new Error(data.error || `EF ${efName} failed`);
  return data;
}

// ─── Store ───

export const useScoreStore = create<ScoreState>((set) => ({
  score: null,
  scoreLoading: false,
  scoreError: null,

  deadlines: [],
  deadlinesLoading: false,
  deadlinesError: null,

  notifications: [],
  notificationsLoading: false,

  // ── Score ──

  calculateScore: async (force = false) => {
    set({ scoreLoading: true, scoreError: null });
    try {
      const data = await callEF("score-calculate", "", { force_recalculate: force });
      set({
        score: {
          score: data.score,
          base_score: data.base_score,
          w_int: data.w_int,
          w_fin: data.w_fin,
          penalty: data.penalty,
          breakdown: data.breakdown,
          scorecard: data.scorecard,
          delta: data.delta,
          grade: data.grade,
          grade_label_key: data.grade_label_key,
          calculated_at: data.calculated_at,
          cached: data.cached,
          disclaimer: data.disclaimer,
        },
        scoreLoading: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Score calculation failed";
      set({ scoreError: msg, scoreLoading: false });
    }
  },

  // ── Deadlines ──

  loadDeadlines: async () => {
    set({ deadlinesLoading: true, deadlinesError: null });
    try {
      const data = await callEF("score-deadlines", "get_all");
      set({ deadlines: data.deadlines ?? [], deadlinesLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load deadlines";
      set({ deadlinesError: msg, deadlinesLoading: false });
    }
  },

  addDeadline: async (titleKey, deadlineDate, sourceWidget, urgency = "info") => {
    try {
      await callEF("score-deadlines", "add", {
        title_key: titleKey,
        deadline_date: deadlineDate,
        source_widget: sourceWidget,
        urgency,
      });
      // Reload after add
      const data = await callEF("score-deadlines", "get_all");
      set({ deadlines: data.deadlines ?? [] });
    } catch (e: unknown) {
      console.error("[useScoreStore] addDeadline error:", e);
    }
  },

  completeDeadline: async (deadlineId) => {
    try {
      await callEF("score-deadlines", "complete", { deadline_id: deadlineId });
      // Update local state immediately
      set((state) => ({
        deadlines: state.deadlines.map((d) =>
          d.id === deadlineId
            ? { ...d, completed: true, completed_at: new Date().toISOString() }
            : d
        ),
      }));
    } catch (e: unknown) {
      console.error("[useScoreStore] completeDeadline error:", e);
    }
  },

  // ── Notifications ──

  loadNotifications: async () => {
    set({ notificationsLoading: true });
    try {
      const data = await callEF("score-deadlines", "get_notifications");
      set({ notifications: data.notifications ?? [], notificationsLoading: false });
    } catch {
      set({ notificationsLoading: false });
    }
  },
}));