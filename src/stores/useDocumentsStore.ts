/**
 * useDocumentsStore.ts — Documents 위젯 상태 관리
 *
 * docs-prepare EF 7개 action과 1:1 매핑.
 * Phase A 패턴 계승: Zustand + async action + 상태 머신.
 *
 * 뷰: checklist | vault | guide
 * 상태: idle → loading → ready → submitting → submitted → result
 */

import { create } from "zustand";
import { supabase } from "../lib/supabase";

// ─── Types ───

export type DocView = "checklist" | "vault" | "guide";

export type IntentStatus =
  | "created"
  | "collecting"
  | "documents_ready"
  | "submitted"
  | "approved"
  | "rejected";

export type DocReadinessStatus = "ready" | "expiring" | "expired" | "missing";

export interface ChecklistItem {
  // document_requirements fields
  id: string;
  visa_type: string;
  civil_type: string;
  document_code: string;
  document_name_ko: string;
  document_name_en: string;
  document_name_vi: string | null;
  document_name_zh: string | null;
  description_ko: string | null;
  description_en: string | null;
  description_vi: string | null;
  description_zh: string | null;
  issuing_agency_ko: string | null;
  issuing_agency_en: string | null;
  online_url: string | null;
  is_visit_required: boolean;
  cost_krw: number;
  validity_days: number | null;
  processing_days: number | null;
  automation_grade: "A" | "B" | "C";
  is_required: boolean;
  premium_only: boolean;
  sort_order: number;
  notes_ko: string | null;
  notes_en: string | null;
  tip_ko: string | null;
  tip_en: string | null;
  template_url: string | null;
  last_verified_at: string | null;
  source_url: string | null;
  // vault join
  vault_item: VaultItem | null;
  readiness_status: DocReadinessStatus;
  readiness_detail: string;
}

export interface VaultItem {
  id: string;
  document_code: string;
  file_name: string;
  file_name_normalized: string | null;
  file_size_bytes: number | null;
  compressed_size_bytes: number | null;
  mime_type: string | null;
  status: string;
  expires_at: string | null;
  uploaded_at: string;
  is_latest: boolean;
  requirement: {
    document_name_ko: string;
    document_name_en: string;
    document_name_vi: string | null;
    document_name_zh: string | null;
    validity_days: number | null;
    automation_grade: string;
  } | null;
}

export interface IntentData {
  id: string;
  visa_type: string;
  civil_type: string;
  status: IntentStatus;
  readiness_score: number;
  documents_ready: number;
  documents_required: number;
  next_action_code: string | null;
  next_action_name: string | null;
  total_fee_krw: number;
  estimated_processing_days: number | null;
  submitted_at: string | null;
  submission_method: string | null;
}

export interface SubmissionGuideData {
  submission: {
    online: boolean;
    visit: boolean;
    mail: boolean;
    proxy: boolean;
    hikorea_url: string | null;
    hikorea_path: string | null;
    reservation_required: boolean;
    total_fee_krw: number;
    processing_days_min: number | null;
    processing_days_max: number | null;
    processing_days_typical: number | null;
    common_rejection_reasons: string[];
    result_delivery: string | null;
  };
  offices: Array<{
    id: string;
    name_ko: string;
    name_en: string;
    phone_number: string | null;
    fax_number: string | null;
    address_ko: string | null;
    address_en: string | null;
    jurisdiction_keywords: string[] | null;
  }>;
  suggested_office_id: string | null;
  pre_check: Array<{
    item: string;
    status: "ok" | "warning" | "unknown";
    detail: string;
  }>;
}

export interface ConsistencyIssue {
  field: string;
  issue: string;
  severity: "warning" | "error";
  details: Record<string, string>;
}

// ─── Store ───

interface DocumentsState {
  // View
  view: DocView;
  setView: (view: DocView) => void;

  // Intent
  intent: IntentData | null;
  civilType: string;

  // Checklist
  checklist: ChecklistItem[];

  // Vault
  vault: VaultItem[];

  // Guide
  guide: SubmissionGuideData | null;
  selectedOfficeId: string | null;

  // Consistency
  consistencyIssues: ConsistencyIssue[];

  // Loading / Error
  loading: boolean;
  error: string | null;
  uploadingCode: string | null;
  uploadSuccess: string | null;

  // ─── Actions ───

  /** 민원 생성 (create_intent) */
  createIntent: (visaType: string, civilType: string) => Promise<void>;

  /** 체크리스트 로드 (get_checklist) */
  loadChecklist: (intentId: string) => Promise<void>;

  /** 볼트 로드 (get_vault) */
  loadVault: () => Promise<void>;

  /** 일관성 검증 (check_consistency) */
  checkConsistency: (intentId: string) => Promise<void>;

  /** 제출 가이드 로드 (get_submission_guide) */
  loadGuide: (intentId: string, userAddress?: string) => Promise<void>;

  /** 관서 선택 */
  selectOffice: (officeId: string) => void;

  /** 제출 (mark_submitted) */
  markSubmitted: (intentId: string, method?: string, officeId?: string) => Promise<void>;

  /** 결과 업데이트 (update_result) */
  updateResult: (intentId: string, result: "approved" | "rejected" | "supplement_requested", reason?: string) => Promise<void>;

  /** 민원 유형 변경 */
  setCivilType: (ct: string) => void;

  /** 서류 업로드 상태 관리 */
  setUploadingCode: (code: string | null) => void;
  setUploadSuccess: (code: string | null) => void;

  /** 리셋 */
  reset: () => void;
}

/** EF 호출 헬퍼 */
async function callDocsPrepare(action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/docs-prepare`,
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
  if (!res.ok) throw new Error(data.error || `docs-prepare ${action} failed`);
  return data;
}

const initialState = {
  view: "checklist" as DocView,
  intent: null as IntentData | null,
  civilType: "extension",
  checklist: [] as ChecklistItem[],
  vault: [] as VaultItem[],
  guide: null as SubmissionGuideData | null,
  selectedOfficeId: null as string | null,
  consistencyIssues: [] as ConsistencyIssue[],
  loading: false,
  error: null as string | null,
  uploadingCode: null as string | null,
  uploadSuccess: null as string | null,
};

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  ...initialState,

  setView: (view) => set({ view }),

  createIntent: async (visaType, civilType) => {
    set({ loading: true, error: null });
    try {
      const data = await callDocsPrepare("create_intent", {
        visa_type: visaType,
        civil_type: civilType,
      });
      set({
        intent: data.intent,
        civilType,
        loading: false,
      });
      // 바로 체크리스트 로드
      await get().loadChecklist(data.intent.id);
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  loadChecklist: async (intentId) => {
    set({ loading: true, error: null });
    try {
      const data = await callDocsPrepare("get_checklist", { intent_id: intentId });
      set({
        intent: data.intent,
        checklist: data.checklist,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  loadVault: async () => {
    set({ loading: true, error: null });
    try {
      const data = await callDocsPrepare("get_vault");
      set({ vault: data.vault, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  checkConsistency: async (intentId) => {
    set({ loading: true, error: null });
    try {
      const data = await callDocsPrepare("check_consistency", { intent_id: intentId });
      set({ consistencyIssues: data.issues ?? [], loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  loadGuide: async (intentId, userAddress) => {
    set({ loading: true, error: null });
    try {
      const data = await callDocsPrepare("get_submission_guide", {
        intent_id: intentId,
        user_address: userAddress,
      });
      set({
        guide: data,
        selectedOfficeId: data.suggested_office_id,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  selectOffice: (officeId) => set({ selectedOfficeId: officeId }),

  markSubmitted: async (intentId, method, officeId) => {
    set({ loading: true, error: null });
    try {
      const data = await callDocsPrepare("mark_submitted", {
        intent_id: intentId,
        submission_method: method,
        target_office_id: officeId,
      });
      set({
        intent: { ...get().intent!, ...data.intent },
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  updateResult: async (intentId, result, reason) => {
    set({ loading: true, error: null });
    try {
      const data = await callDocsPrepare("update_result", {
        intent_id: intentId,
        result,
        rejection_reason: reason,
      });
      set({
        intent: { ...get().intent!, ...data.intent },
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  setCivilType: (ct) => set({ civilType: ct }),

  setUploadingCode: (code) => set({ uploadingCode: code }),
  setUploadSuccess: (code) => {
    set({ uploadSuccess: code });
    if (code) setTimeout(() => set({ uploadSuccess: null }), 3000);
  },

  reset: () => set(initialState),
}));