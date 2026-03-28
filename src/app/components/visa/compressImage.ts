/**
 * compressImage.ts — Phase 3-B Sprint 1
 *
 * Canvas API 기반 이미지 압축 유틸리티
 * - JPEG/PNG 입력 → JPEG 출력
 * - 최대 1MB (하이코리아 제약 흡수)
 * - 장변 최대 2048px 리사이즈
 * - 파일명 정규화 (한글/특수문자 제거)
 *
 * 프로젝트 경로: src/app/components/visa/compressImage.ts
 */

const MAX_FILE_SIZE = 1_048_576; // 1MB
const MAX_DIMENSION = 2048;
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.1;

export interface CompressedImage {
  blob: Blob;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: "image/jpeg";
}

/**
 * 파일명 정규화 — document_code + timestamp 기반
 */
export function normalizeFileName(documentCode: string): string {
  const safeCode = documentCode.replace(/[^a-zA-Z0-9_-]/g, "");
  return `${safeCode}_${Date.now()}.jpg`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

function calcResize(
  w: number,
  h: number,
  max: number
): { w: number; h: number } {
  if (w <= max && h <= max) return { w, h };
  const ratio = Math.min(max / w, max / h);
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
}

/**
 * 이미지 압축 메인 함수
 *
 * 1. Canvas에 로드 + 장변 2048px 리사이즈
 * 2. JPEG 품질 0.85→0.4 점진 감소 (1MB 이하까지)
 * 3. 그래도 초과 시 해상도 50% 추가 축소
 */
export async function compressImage(
  file: File,
  documentCode: string
): Promise<CompressedImage> {
  const originalSize = file.size;
  const img = await loadImage(file);
  const { w, h } = calcResize(img.naturalWidth, img.naturalHeight, MAX_DIMENSION);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);

  // 품질 점진적 감소
  let quality = INITIAL_QUALITY;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > MAX_FILE_SIZE && quality > MIN_QUALITY) {
    quality -= QUALITY_STEP;
    blob = await canvasToBlob(canvas, Math.max(quality, MIN_QUALITY));
  }

  // 여전히 초과 → 해상도 50% 축소
  if (blob.size > MAX_FILE_SIZE) {
    const sw = Math.round(w * 0.5);
    const sh = Math.round(h * 0.5);
    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(img, 0, 0, sw, sh);
    blob = await canvasToBlob(canvas, 0.7);
  }

  return {
    blob,
    fileName: normalizeFileName(documentCode),
    originalSize,
    compressedSize: blob.size,
    width: canvas.width,
    height: canvas.height,
    mimeType: "image/jpeg",
  };
}