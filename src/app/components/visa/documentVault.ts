/**
 * documentVault.ts — Phase 3-B Sprint 1
 *
 * document_vault 업로드 플로우:
 * 1. compressImage() → 1MB 이하 JPEG
 * 2. Supabase Storage 업로드 (user_id/fileName)
 * 3. document_vault 테이블에 레코드 INSERT
 *
 * Free: 3개 / Premium: 무제한
 *
 * 프로젝트 경로: src/app/components/visa/documentVault.ts
 *
 * Dennis 규칙:
 * #36 .maybeSingle() 사용
 * #40 "유저가 자기 데이터를 자기 양식에 채우는 것"
 */

import { supabase } from "../../../lib/supabase";
import { compressImage } from "./compressImage";
import type { CompressedImage } from "./compressImage";

// ─── Types ───

export interface VaultUploadResult {
  success: boolean;
  vaultId?: string;
  storagePath?: string;
  error?: string;
}

export interface VaultItem {
  id: string;
  document_code: string;
  file_name: string;
  file_name_normalized: string;
  storage_path: string;
  file_size_bytes: number;
  compressed_size_bytes: number;
  mime_type: string;
  status: "uploaded" | "verified" | "expired" | "rejected";
  expires_at: string | null;
  uploaded_at: string;
  is_latest: boolean;
}

// ─── Constants ───

const BUCKET = "document-vault";
const FREE_LIMIT = 3;

// ─── Functions ───

export async function getVaultCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("document_vault")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_latest", true);
  if (error) return 0;
  return count ?? 0;
}

export async function getVaultItems(userId: string): Promise<VaultItem[]> {
  const { data, error } = await supabase
    .from("document_vault")
    .select("*")
    .eq("user_id", userId)
    .eq("is_latest", true)
    .order("uploaded_at", { ascending: false });
  if (error || !data) return [];
  return data as VaultItem[];
}

/**
 * 서류 업로드 메인 플로우
 */
export async function uploadDocument(
  file: File,
  documentCode: string,
  userId: string,
  isPremium: boolean
): Promise<VaultUploadResult> {
  // 1. Free 제한
  if (!isPremium) {
    const count = await getVaultCount(userId);
    if (count >= FREE_LIMIT) {
      return { success: false, error: `Free: ${FREE_LIMIT} documents max. Upgrade to Premium.` };
    }
  }

  // 2. 압축
  let compressed: CompressedImage;
  try {
    compressed = await compressImage(file, documentCode);
  } catch (err) {
    return { success: false, error: `Compression failed: ${err instanceof Error ? err.message : "Unknown"}` };
  }

  // 3. Storage 업로드
  const storagePath = `${userId}/${compressed.fileName}`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, compressed.blob, { contentType: compressed.mimeType, upsert: false });
  if (uploadErr) {
    return { success: false, error: `Upload failed: ${uploadErr.message}` };
  }

  // 4. 기존 is_latest 해제
  await supabase
    .from("document_vault")
    .update({ is_latest: false })
    .eq("user_id", userId)
    .eq("document_code", documentCode)
    .eq("is_latest", true);

  // 5. INSERT
  const { data: inserted, error: insertErr } = await supabase
    .from("document_vault")
    .insert({
      user_id: userId,
      document_code: documentCode,
      file_name: file.name,
      file_name_normalized: compressed.fileName,
      storage_path: storagePath,
      file_size_bytes: compressed.originalSize,
      compressed_size_bytes: compressed.compressedSize,
      mime_type: compressed.mimeType,
      status: "uploaded",
      is_latest: true,
    })
    .select("id")
    .maybeSingle();

  if (insertErr || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { success: false, error: `DB insert failed: ${insertErr?.message ?? "No data"}` };
  }

  return { success: true, vaultId: inserted.id, storagePath };
}

export async function deleteVaultItem(vaultId: string, userId: string): Promise<boolean> {
  const { data: item } = await supabase
    .from("document_vault")
    .select("storage_path")
    .eq("id", vaultId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!item) return false;

  await supabase.storage.from(BUCKET).remove([item.storage_path]);
  const { error } = await supabase
    .from("document_vault")
    .delete()
    .eq("id", vaultId)
    .eq("user_id", userId);
  return !error;
}