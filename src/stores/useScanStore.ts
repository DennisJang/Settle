// src/stores/useScanStore.ts
// ============================================
// Scan 위젯 상태 머신 — Phase A 완성
//
// States: idle → validating → uploading → analyzing → result | error | limitReached
// Features: Storage 병렬 업로드, status 필드, 실패 시 횟수 무효,
//           Free/Premium 횟수 제한 (월 5회, success만 카운트)
// 규칙 #1: 원본 확인 기반 · #34: i18n 키만 · #39: "대행" 금지
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
  | 'error'
  | 'limitReached';

export type ScanStatus = 'success' | 'failed' | 'error';

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
  status: ScanStatus;
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
  raw_file_url: string | null;
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const STORAGE_BUCKET = 'scan-uploads';
const FREE_MONTHLY_LIMIT = 5;

// ─── Store ───

interface ScanStore {
  // State
  state: ScanState;
  file: File | null;
  filePreviewUrl: string | null;
  storageUrl: string | null;
  result: ScanResult | null;
  error: string | null;
  progress: number;

  // Limit state
  scanCount: number;
  isPremium: boolean;
  limitChecked: boolean;

  // Actions
  checkScanLimit: () => Promise<void>;
  selectFile: (file: File) => void;
  analyze: () => Promise<void>;
  reset: () => void;
  retry: () => void;
  clearError: () => void;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  state: 'idle',
  file: null,
  filePreviewUrl: null,
  storageUrl: null,
  result: null,
  error: null,
  progress: 0,
  scanCount: 0,
  isPremium: false,
  limitChecked: false,

  // ── 횟수 + 플랜 체크 (페이지 진입 시 호출) ──
  checkScanLimit: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [countResult, subResult] = await Promise.all([
        supabase
          .from('scan_results')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'success')
          .gte('created_at', monthStart.toISOString()),
        supabase
          .from('subscriptions')
          .select('plan, expires_at')
          .eq('user_id', user.id)
          .single(),
      ]);

      const scanCount = countResult.count ?? 0;

      let isPremium = false;
      if (subResult.data) {
        const { plan, expires_at } = subResult.data;
        isPremium = plan === 'premium' && (!expires_at || new Date(expires_at) > new Date());
      }

      set({ scanCount, isPremium, limitChecked: true });
    } catch (err) {
      console.error('[useScanStore] checkScanLimit error:', err);
      set({ limitChecked: true });
    }
  },

  // ── selectFile ──
  selectFile: (file: File) => {
    const prevUrl = get().filePreviewUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    set({ state: 'validating', file, error: null, result: null, progress: 0, storageUrl: null });

    // 횟수 체크 (Free 유저만)
    const { isPremium, scanCount } = get();
    if (!isPremium && scanCount >= FREE_MONTHLY_LIMIT) {
      set({ state: 'limitReached' });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      set({ state: 'error', error: 'scan:error.unsupportedType' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      set({ state: 'error', error: 'scan:error.fileTooLarge' });
      return;
    }

    const previewUrl = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;

    set({ state: 'uploading', filePreviewUrl: previewUrl });
    get().analyze();
  },

  // ── analyze ──
  analyze: async () => {
    const { file } = get();
    if (!file) {
      set({ state: 'error', error: 'scan:error.noFile' });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        set({ state: 'error', error: 'scan:error.notAuthenticated' });
        return;
      }

      set({ state: 'uploading', progress: 10 });

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${session.user.id}/${timestamp}_${safeName}`;

      const [storageResult, base64] = await Promise.all([
        uploadToStorage(file, storagePath),
        fileToBase64(file),
      ]);

      set({ progress: 40 });

      const storageUrl = storageResult.url;
      set({ storageUrl });

      if (storageResult.error) {
        console.warn('[useScanStore] Storage upload failed:', storageResult.error);
      }

      const fileType = file.type === 'application/pdf' ? 'pdf'
        : file.type === 'image/png' ? 'png'
        : file.type === 'image/webp' ? 'webp'
        : 'image';

      set({ state: 'analyzing', progress: 50 });

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
            file_url: storageUrl,
          }),
        }
      );

      set({ progress: 80 });

      const data = await response.json();

      // EF가 횟수 초과로 403 반환
      if (response.status === 403 && data.error === 'scan_limit_reached') {
        set({ state: 'limitReached', progress: 0 });
        return;
      }

      if (!response.ok) {
        const errorMsg = data.error || 'scan:error.analysisFailed';
        set({ state: 'error', error: errorMsg, progress: 0 });
        return;
      }

      if (!data.success) {
        set({ state: 'error', error: 'scan:error.analysisFailed', progress: 0 });
        return;
      }

      const items = data.items ?? [];
      const hasContent = items.length > 0;
      const status: ScanStatus = hasContent ? 'success' : 'failed';

      set({
        state: 'result',
        progress: 100,
        result: {
          scan_id: data.scan_id,
          category: data.category,
          category_confidence: data.category_confidence,
          status,
          summary: data.summary,
          items,
          linked_widget: data.linked_widget,
          linked_data: data.linked_data,
          deadlines: data.deadlines ?? [],
          disclaimer: data.disclaimer,
          tokens_used: data.tokens_used,
          raw_file_url: storageUrl,
        },
      });

      // 성공 시 로컬 카운트 +1
      if (status === 'success') {
        set((s) => ({ scanCount: s.scanCount + 1 }));
      }

      // 실패 시 DB status 업데이트
      if (status === 'failed' && data.scan_id) {
        await supabase
          .from('scan_results')
          .update({ status: 'failed' })
          .eq('id', data.scan_id);
      }
    } catch (err) {
      console.error('[useScanStore] analyze error:', err);
      set({ state: 'error', error: 'scan:error.networkError', progress: 0 });
    }
  },

  reset: () => {
    const prevUrl = get().filePreviewUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    set({
      state: 'idle',
      file: null,
      filePreviewUrl: null,
      storageUrl: null,
      result: null,
      error: null,
      progress: 0,
    });
  },

  retry: () => {
    set({ state: 'idle', error: null, progress: 0 });
  },

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

async function uploadToStorage(
  file: File,
  path: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: (err as Error).message };
  }
}