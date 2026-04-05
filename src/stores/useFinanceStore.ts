// src/stores/useFinanceStore.ts
// ================================================
// 금융 & 정보 위젯 Zustand Store
// 패턴: WIKI_PATTERNS 2.1 (위젯당 1 store, EF action 1:1)
// EF: finance-calculate (5 action)
// ================================================

import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ── Types ────────────────────────────────────────

export interface DeductionItem {
  code: string;
  name_ko: string;
  amount: number;
  rate_user: number;
  rate_reference: number;
  status: 'normal' | 'over' | 'under';
  cumulative_estimate: number | null;
  refundable_on_departure: boolean | null;
  context_notes: string | null;
}

export interface PayslipAnalysis {
  period: string;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  deductions: DeductionItem[];
  hourly_wage_estimate: number;
  minimum_wage: number;
  wage_status: 'normal' | 'below_minimum';
  scanned_at: string;
}

export interface Anomaly {
  type: string;
  change_pct: number;
  current: number;
  previous: number;
}

export interface DashboardData {
  has_data: boolean;
  payslips: PayslipAnalysis[];
  anomalies: Anomaly[];
  message?: string;
  hint?: string;
}

export interface RefundBreakdown {
  pension: {
    eligible: boolean;
    eligibility_type: string;
    country_notes: string | null;
    monthly_contribution: number;
    months_contributed: number;
    estimated_refund: number;
    refund_condition: string;
  };
  severance: {
    eligible: boolean;
    months_worked: number;
    estimated_amount: number;
    note: string | null;
  };
  tax_saving: {
    flat_19pct: number;
    progressive: number;
    saving: number;
    recommended: string;
    note: string;
  };
}

export interface RefundData {
  total_refundable: number;
  breakdown: RefundBreakdown;
  context: {
    visa_type: string;
    nationality: string;
    employment_start: string | null;
    annual_income: number;
  };
}

export interface TaxComparisonData {
  has_data: boolean;
  annual_income: number;
  flat_19pct: { income_tax: number; local_tax: number; total: number };
  progressive: {
    gross_tax: number;
    basic_deduction_credit: number;
    income_tax: number;
    local_tax: number;
    total: number;
    brackets: Array<{
      range_min: number;
      range_max: number | null;
      rate: number;
      taxable_amount: number;
      tax_amount: number;
    }>;
  };
  comparison: { saving: number; saving_method: string; note: string };
}

export interface RemittanceQuote {
  provider_name: string;
  fee: number;
  exchange_rate: number;
  spread_pct: number;
  receive_amount: number;
  delivery_time: string;
  deeplink: string | null;
}

export interface RemittanceData {
  has_data: boolean;
  destination_country: string;
  target_currency: string;
  send_amount_krw: number;
  mid_rate: number;
  rate_updated_at: string;
  quotes: RemittanceQuote[];
}

export interface PreCheckData {
  health_insurance_status: 'paid' | 'overdue' | 'unknown';
  tax_arrears: 'none' | 'exists' | 'unknown';
  pension_months: number;
  refund_eligible: boolean;
}

type FinanceView = 'dashboard' | 'refund' | 'remittance' | 'insurance';

interface FinanceState {
  // UI
  currentView: FinanceView;
  loading: boolean;
  error: string | null;

  // Data
  dashboard: DashboardData | null;
  refund: RefundData | null;
  taxComparison: TaxComparisonData | null;
  remittance: RemittanceData | null;
  preCheck: PreCheckData | null;

  // Actions
  setView: (view: FinanceView) => void;
  loadDashboard: (months?: number) => Promise<void>;
  loadRefundEstimate: () => Promise<void>;
  loadTaxComparison: () => Promise<void>;
  loadRemittanceCompare: (destinationCountry?: string, amountKrw?: number) => Promise<void>;
  loadPreCheck: () => Promise<void>;
  reset: () => void;
}

// ── EF Helper ────────────────────────────────────

async function callEF(action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/finance-calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// ── Initial State ────────────────────────────────

const initialState = {
  currentView: 'dashboard' as FinanceView,
  loading: false,
  error: null as string | null,
  dashboard: null as DashboardData | null,
  refund: null as RefundData | null,
  taxComparison: null as TaxComparisonData | null,
  remittance: null as RemittanceData | null,
  preCheck: null as PreCheckData | null,
};

// ── Store ────────────────────────────────────────

export const useFinanceStore = create<FinanceState>((set) => ({
  ...initialState,

  setView: (view) => set({ currentView: view }),

  loadDashboard: async (months = 1) => {
    set({ loading: true, error: null });
    try {
      const data = await callEF('dashboard', { months });
      set({ dashboard: data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  loadRefundEstimate: async () => {
    set({ loading: true, error: null });
    try {
      const data = await callEF('refund_estimate');
      set({ refund: data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  loadTaxComparison: async () => {
    set({ loading: true, error: null });
    try {
      const data = await callEF('tax_comparison');
      set({ taxComparison: data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  loadRemittanceCompare: async (destinationCountry, amountKrw) => {
    set({ loading: true, error: null });
    try {
      const payload: Record<string, unknown> = {};
      if (destinationCountry) payload.destination_country = destinationCountry;
      if (amountKrw) payload.amount_krw = amountKrw;
      const data = await callEF('remittance_compare', payload);
      set({ remittance: data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  loadPreCheck: async () => {
    set({ loading: true, error: null });
    try {
      const data = await callEF('pre_check');
      set({ preCheck: data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  reset: () => set(initialState),
}));