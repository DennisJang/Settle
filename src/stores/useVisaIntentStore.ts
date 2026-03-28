/**
 * useVisaIntentStore.ts — VisaIntent 추상화 계층
 *
 * 역할: 비자 민원의 전체 생명주기를 하나의 객체로 관리
 * 원리: Stripe PaymentIntent → Settle VisaIntent (B2C 맥락)
 *
 * 상태 머신:
 *   created → collecting → documents_ready → submitted → approved/rejected
 *
 * 유저가 보는 것:
 *   Start → Preparing (42%) → Ready (100%) → Submitted → Done
 *
 * 이 스토어가 소유하는 것:
 *   - 현재 활성 민원 (intent)
 *   - readiness_score 계산
 *   - next_action 결정
 *   - 상태 전이
 *
 * 이 스토어가 소유하지 않는 것:
 *   - 서류 파일 업로드 (documentVault.ts가 처리, 완료 후 refreshScore 호출)
 *   - PDF 생성 (generatePdf.ts가 처리)
 *   - K-point 시뮬레이터 (독립)
 *   - 급여 계산기 (독립)
 *
 * 법적 안전: "서류 준비 도구"의 진행 상태 추적. 제출은 유저가 직접.
 */

import { create } from "zustand";
import { supabase } from "../lib/supabase";

// ─── Types ───

export type VisaIntentStatus =
  | "created"
  | "collecting"
  | "documents_ready"
  | "submitted"
  | "approved"
  | "rejected";

export interface VisaIntent {
  id: string;
  user_id: string;
  visa_type: string;
  civil_type: string;
  status: VisaIntentStatus;
  readiness_score: number;
  documents_ready: number;
  documents_required: number;
  profile_completeness: number;
  next_action: string | null;
  next_action_document_code: string | null;
  total_fee_krw: number;
  estimated_processing_days: number | null;
  target_office_id: string | null;
  submission_method: string | null;
  submitted_at: string | null;
  expected_result_at: string | null;
  result_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Profile fields that contribute to readiness (통합신청서 핵심)
const PROFILE_SCORE_FIELDS = [
  "full_name",
  "foreign_reg_no",
  "passport_no",
  "address_korea",
  "date_of_birth",
] as const;

// ─── Store ───

interface VisaIntentStore {
  // State
  intent: VisaIntent | null;
  loading: boolean;
  error: string | null;

  // Core actions
  hydrate: (userId: string) => Promise<void>;
  createIntent: (
    userId: string,
    visaType: string,
    civilType: string
  ) => Promise<VisaIntent | null>;
  refreshScore: (userId: string) => Promise<void>;
  setCivilType: (userId: string, civilType: string) => Promise<void>;

  // State transitions
  markSubmitted: (officeId?: string, method?: string) => Promise<void>;
  markResult: (approved: boolean, reason?: string) => Promise<void>;
  deactivate: () => Promise<void>;

  // Computed (sync, from current intent)
  getUserFacingStatus: () => "start" | "preparing" | "ready" | "submitted" | "done";
}

export const useVisaIntentStore = create<VisaIntentStore>((set, get) => ({
  intent: null,
  loading: false,
  error: null,

  // ─── Hydrate: Load active intent for this user ───
  hydrate: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("visa_intents")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      set({ intent: data as VisaIntent | null, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  // ─── Create: Start a new visa application intent ───
  createIntent: async (userId, visaType, civilType) => {
    set({ loading: true, error: null });
    try {
      // Deactivate any existing active intent
      await supabase
        .from("visa_intents")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      // Count required documents for this visa+civil_type
      const { data: reqDocs } = await supabase
        .from("document_requirements")
        .select("document_code, cost_krw, is_required")
        .eq("visa_type", visaType)
        .eq("civil_type", civilType);

      const required = reqDocs?.filter((d) => d.is_required) ?? [];
      const totalFee = required.reduce((sum, d) => sum + (d.cost_krw || 0), 0);

      // Create new intent
      const { data, error } = await supabase
        .from("visa_intents")
        .insert({
          user_id: userId,
          visa_type: visaType,
          civil_type: civilType,
          status: "created",
          documents_required: required.length,
          documents_ready: 0,
          readiness_score: 0,
          total_fee_krw: totalFee,
          next_action: "upload_documents",
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const intent = data as VisaIntent;
      set({ intent, loading: false });
      return intent;
    } catch (err) {
      set({ error: String(err), loading: false });
      return null;
    }
  },

  // ─── Refresh Score: Recalculate readiness from vault + profile ───
  refreshScore: async (userId: string) => {
    const { intent } = get();
    if (!intent) return;

    try {
      // 1. Get required documents for this intent
      const { data: reqDocs } = await supabase
        .from("document_requirements")
        .select("document_code, is_required")
        .eq("visa_type", intent.visa_type)
        .eq("civil_type", intent.civil_type)
        .eq("is_required", true);

      const requiredCodes = new Set(
        (reqDocs ?? []).map((d) => d.document_code)
      );

      // 2. Get uploaded documents
      const { data: vault } = await supabase
        .from("document_vault")
        .select("document_code")
        .eq("user_id", userId)
        .eq("is_latest", true);

      const uploadedCodes = new Set(
        (vault ?? []).map((v) => v.document_code)
      );

      // 3. Count ready documents
      // Fee items count as ready; auto-fill items check profile
      let docsReady = 0;
      for (const code of requiredCodes) {
        if (code.startsWith("application_fee")) {
          docsReady++;
        } else if (uploadedCodes.has(code)) {
          docsReady++;
        }
      }

      // 4. Profile completeness
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, foreign_reg_no, passport_no, address_korea, date_of_birth")
        .eq("user_id", userId)
        .maybeSingle();

      const profileFilled = profile
        ? PROFILE_SCORE_FIELDS.filter((f) => {
            const v = (profile as any)[f];
            return v && String(v).trim().length > 0;
          }).length
        : 0;
      const profilePct = Math.round(
        (profileFilled / PROFILE_SCORE_FIELDS.length) * 100
      );

      // 5. Calculate readiness score (70% docs, 30% profile)
      const docScore =
        requiredCodes.size > 0
          ? (docsReady / requiredCodes.size) * 70
          : 0;
      const profileScore = (profileFilled / PROFILE_SCORE_FIELDS.length) * 30;
      const score = Math.round(docScore + profileScore);

      // 6. Determine next action
      let nextAction: string | null = null;
      let nextDocCode: string | null = null;

      if (profileFilled < PROFILE_SCORE_FIELDS.length) {
        nextAction = "fill_profile";
      } else {
        // Find first missing required document
        for (const code of requiredCodes) {
          if (
            !code.startsWith("application_fee") &&
            !uploadedCodes.has(code)
          ) {
            nextAction = "upload_document";
            nextDocCode = code;
            break;
          }
        }
      }

      if (!nextAction && docsReady >= requiredCodes.size) {
        nextAction = "generate_pdf";
      }

      // 7. Determine status
      let newStatus: VisaIntentStatus = intent.status;
      if (
        intent.status === "created" ||
        intent.status === "collecting"
      ) {
        if (docsReady >= requiredCodes.size && profilePct >= 100) {
          newStatus = "documents_ready";
        } else if (docsReady > 0 || profilePct > 0) {
          newStatus = "collecting";
        }
      }

      // 8. Update DB
      const { error } = await supabase
        .from("visa_intents")
        .update({
          readiness_score: score,
          documents_ready: docsReady,
          documents_required: requiredCodes.size,
          profile_completeness: profilePct,
          next_action: nextAction,
          next_action_document_code: nextDocCode,
          status: newStatus,
        })
        .eq("id", intent.id);

      if (error) throw error;

      // 9. Update local state
      set({
        intent: {
          ...intent,
          readiness_score: score,
          documents_ready: docsReady,
          documents_required: requiredCodes.size,
          profile_completeness: profilePct,
          next_action: nextAction,
          next_action_document_code: nextDocCode,
          status: newStatus,
        },
      });
    } catch (err) {
      console.error("refreshScore error:", err);
    }
  },

  // ─── Change civil_type on existing intent ───
  setCivilType: async (userId: string, civilType: string) => {
    const { intent } = get();
    if (!intent) return;

    // Re-create intent with new civil_type
    await get().createIntent(userId, intent.visa_type, civilType);
    await get().refreshScore(userId);
  },

  // ─── Mark as submitted ───
  markSubmitted: async (officeId?: string, method?: string) => {
    const { intent } = get();
    if (!intent) return;

    const now = new Date();
    const estimatedDays = intent.estimated_processing_days ?? 14;
    const expectedResult = new Date(
      now.getTime() + estimatedDays * 24 * 60 * 60 * 1000
    );

    const { error } = await supabase
      .from("visa_intents")
      .update({
        status: "submitted",
        submitted_at: now.toISOString(),
        expected_result_at: expectedResult.toISOString(),
        target_office_id: officeId ?? intent.target_office_id,
        submission_method: method ?? intent.submission_method,
      })
      .eq("id", intent.id);

    if (!error) {
      set({
        intent: {
          ...intent,
          status: "submitted",
          submitted_at: now.toISOString(),
          expected_result_at: expectedResult.toISOString(),
          target_office_id: officeId ?? intent.target_office_id,
          submission_method: method ?? intent.submission_method,
        },
      });
    }
  },

  // ─── Mark result (approved or rejected) ───
  markResult: async (approved: boolean, reason?: string) => {
    const { intent } = get();
    if (!intent) return;

    const { error } = await supabase
      .from("visa_intents")
      .update({
        status: approved ? "approved" : "rejected",
        result_at: new Date().toISOString(),
        rejection_reason: approved ? null : (reason ?? null),
        is_active: false, // Intent lifecycle complete
      })
      .eq("id", intent.id);

    if (!error) {
      set({
        intent: {
          ...intent,
          status: approved ? "approved" : "rejected",
          result_at: new Date().toISOString(),
          rejection_reason: approved ? null : (reason ?? null),
          is_active: false,
        },
      });
    }
  },

  // ─── Deactivate (cancel) ───
  deactivate: async () => {
    const { intent } = get();
    if (!intent) return;

    await supabase
      .from("visa_intents")
      .update({ is_active: false })
      .eq("id", intent.id);

    set({ intent: null });
  },

  // ─── User-facing status (5 simple states) ───
  getUserFacingStatus: () => {
    const { intent } = get();
    if (!intent) return "start";

    switch (intent.status) {
      case "created":
        return "start";
      case "collecting":
        return "preparing";
      case "documents_ready":
        return "ready";
      case "submitted":
        return "submitted";
      case "approved":
      case "rejected":
        return "done";
      default:
        return "start";
    }
  },
}));