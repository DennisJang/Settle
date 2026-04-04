// src/stores/useScanStore.ts
// ============================================
// Scan 위젯 상태 머신 — Sprint 1
//
// States: idle → validating → uploading → analyzing → result | error
// 규칙 #1: 원본 확인 — scan-analyze EF 스펙 기반
// 규칙 #34: i18n 키만 (하드코딩 텍스트 금지)
// 규칙 #39: "대행" 표현 금지
// ============================================

import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ─── Types ───

export type ScanState =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'analyzing'
  | 'result'
  | 'error';

export interface ScanKeyNumber {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface ScanComparison {
  user_value: string;
  reference_value: string;
  reference_label?: string;
}

export interface ScanItem {
  name_ko: string;
  name_translated: string;
  amount: number | null;
  explanation: string;
  comparison: ScanComparison | null;
  linked_widget: string | null;
  action_text: string | null;
}

export interface ScanDeadline {
  title: string;
  date: string;
  consequence: string;
  urgency: 'info' | 'warning' | 'urgent';
}

export interface ScanResult {
  scan_id: string | null;
  category: string;
  category_confidence: number;
  summary: {
    title: string;
    subtitle: string;
    key_numbers: ScanKeyNumber[];
  };
  items: ScanItem[];
  linked_widget: string | null;
  linked_data: Record<string, unknown> | null;
  deadlines: ScanDeadline[];
  disclaimer: string;
  tokens_used: number | null;
}

// 허용 파일 타입
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Store ───

interface ScanStore {
  // State
  state: ScanState;
  file: File | null;
  filePreviewUrl: string | null;
  result: ScanResult | null;
  error: string | null; // i18n key
  progress: number; // 0-100 (uploading + analyzing 단계 표시용)

  // Actions
  selectFile: (file: File) => void;
  analyze: () => Promise<void>;
  reset: () => void;
  retry: () => void;
  clearError: () => void;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  // Initial state
  state: 'idle',
  file: null,
  filePreviewUrl: null,
  result: null,
  error: null,
  progress: 0,

  // ── selectFile: idle → validating → uploading (or error) ──
  selectFile: (file: File) => {
    // Clean up previous preview URL
    const prevUrl = get().filePreviewUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    set({ state: 'validating', file, error: null, result: null, progress: 0 });

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      set({
        state: 'error',
        error: 'scan:error.unsupportedType',
      });
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      set({
        state: 'error',
        error: 'scan:error.fileTooLarge',
      });
      return;
    }

    // Generate preview URL for images
    const previewUrl = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;

    set({
      state: 'uploading',
      filePreviewUrl: previewUrl,
    });

    // Auto-trigger analyze
    get().analyze();
  },

  // ── analyze: uploading → analyzing → result (or error) ──
  analyze: async () => {
    const { file } = get();
    if (!file) {
      set({ state: 'error', error: 'scan:error.noFile' });
      return;
    }

    try {
      // ── Phase 1: Base64 인코딩 ──
      set({ state: 'uploading', progress: 20 });

      const base64 = await fileToBase64(file);
      set({ progress: 40 });

      // file_type 결정
      const fileType = file.type === 'application/pdf' ? 'pdf'
        : file.type === 'image/png' ? 'png'
        : file.type === 'image/webp' ? 'webp'
        : 'image'; // jpeg default

      // ── Phase 2: API 호출 ──
      set({ state: 'analyzing', progress: 50 });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        set({ state: 'error', error: 'scan:error.notAuthenticated' });
        return;
      }

      set({ progress: 60 });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: base64,
            file_type: fileType,
          }),
        }
      );

      set({ progress: 80 });

      const data = await response.json();

      if (!response.ok) {
        // EF에서 반환한 에러
        const errorMsg = data.error || 'scan:error.analysisFailed';
        set({ state: 'error', error: errorMsg, progress: 0 });
        return;
      }

      if (!data.success) {
        set({ state: 'error', error: 'scan:error.analysisFailed', progress: 0 });
        return;
      }

      // ── Phase 3: 결과 저장 ──
      set({
        state: 'result',
        progress: 100,
        result: {
          scan_id: data.scan_id,
          category: data.category,
          category_confidence: data.category_confidence,
          summary: data.summary,
          items: data.items ?? [],
          linked_widget: data.linked_widget,
          linked_data: data.linked_data,
          deadlines: data.deadlines ?? [],
          disclaimer: data.disclaimer,
          tokens_used: data.tokens_used,
        },
      });
    } catch (err) {
      console.error('[useScanStore] analyze error:', err);
      set({
        state: 'error',
        error: 'scan:error.networkError',
        progress: 0,
      });
    }
  },

  // ── reset: any → idle ──
  reset: () => {
    const prevUrl = get().filePreviewUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    set({
      state: 'idle',
      file: null,
      filePreviewUrl: null,
      result: null,
      error: null,
      progress: 0,
    });
  },

  // ── retry: error → idle ──
  retry: () => {
    set({
      state: 'idle',
      error: null,
      progress: 0,
    });
  },

  // ── clearError ──
  clearError: () => {
    set({ error: null });
  },
}));

// ─── Helpers ───

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/jpeg;base64,XXXX → XXXX 부분만 추출
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to encode file'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}