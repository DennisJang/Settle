/**
 * scan.tsx — Scan 위젯 페이지
 * Q-A1: Scan Anything
 * Sprint 1에서 scan-analyze Edge Function 연결 + UI 구현 예정.
 *
 * "찍으면 알아서 통역하고, 다음 할 일까지 데려다준다."
 */

import { useTranslation } from "react-i18next";

export function Scan() {
  const { t } = useTranslation("scan");

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: "var(--color-surface-page)",
        padding: "var(--space-md)",
      }}
    >
      <div
        className="text-center"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p style={{ fontSize: "15px" }}>
          {t("placeholder", "Scan Anything — Coming Soon")}
        </p>
      </div>
    </div>
  );
}

export default Scan;