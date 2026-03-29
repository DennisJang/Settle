/**
 * eventLog.ts — Layer 2 Event Log 유틸
 *
 * 역할: settle_events 테이블에 유저 행동을 자동 기록
 * 원칙: Passive Collection (Waze 패턴). 유저 마찰 0.
 *       fire-and-forget — 실패해도 UX에 영향 없음.
 *       PII 금지 — EventData 타입에 이름/등록번호 필드 자체가 없음.
 *
 * Stage 4 무기: 이 데이터가 2년 후 "Settle 경유 반려율 2%" 근거가 된다.
 *
 * 5가지 MVP 이벤트:
 *   1. intent_created     — 민원 시작
 *   2. document_uploaded  — 서류 업로드
 *   3. readiness_changed  — 준비도 변경
 *   4. guide_viewed       — 제출 가이드 조회
 *   5. intent_completed   — 민원 완료
 */

import { supabase } from "./supabase";

export type EventType =
  | "intent_created"
  | "document_uploaded"
  | "readiness_changed"
  | "guide_viewed"
  | "intent_completed";

export interface EventData {
  // intent_created / intent_completed
  visa_type?: string;
  civil_type?: string;
  // document_uploaded
  document_code?: string;
  file_size_kb?: number;
  compression_ratio?: number;
  // readiness_changed
  old_score?: number;
  new_score?: number;
  // guide_viewed
  office_id?: string;
  // intent_completed
  duration_days?: number;
  total_documents?: number;
}

/**
 * 이벤트 기록. fire-and-forget.
 * 실패 시 console.warn만 출력. UX 차단 없음.
 */
export async function logEvent(
  intentId: string | null,
  eventType: EventType,
  eventData: EventData = {}
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return; // 비로그인 시 무시

    await supabase.from("settle_events").insert({
      user_id: user.id,
      intent_id: intentId,
      event_type: eventType,
      event_data: eventData,
    });
  } catch (e) {
    // 이벤트 기록 실패는 UX에 영향 주지 않음 — 조용히 실패
    console.warn("[EventLog] Failed to log event:", eventType, e);
  }
}