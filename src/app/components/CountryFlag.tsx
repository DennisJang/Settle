/**
 * CountryFlag — SVG 국기 컴포넌트
 *
 * 이모지 국기 대체용. Windows에서 이모지 국기가 깨지는 문제 해결.
 * iOS/Android에서는 이모지도 정상이지만, 웹(Vercel) 배포 시 Windows 유저 대응.
 *
 * 사용법:
 *   <CountryFlag code="VN" size={20} />
 *   <CountryFlag code="KR" size={16} />
 *
 * 지원 국가: KR, VN, CN, TH, PH, ID, NP, KH, UZ, MN, BD, US + fallback
 */

interface CountryFlagProps {
  code: string;
  size?: number;
  className?: string;
}

export function CountryFlag({ code, size = 20, className }: CountryFlagProps) {
  const flag = FLAGS[code.toUpperCase()];

  if (!flag) {
    // Fallback: 원형 + 국가코드 2글자
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full ${className ?? ""}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          fontWeight: 700,
          backgroundColor: "var(--color-surface-secondary)",
          color: "var(--color-text-secondary)",
        }}
      >
        {code.slice(0, 2)}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 40 28"
      width={size}
      height={size * 0.7}
      className={className}
      role="img"
      aria-label={`${code} flag`}
      style={{ borderRadius: size * 0.1, overflow: "hidden" }}
    >
      {flag}
    </svg>
  );
}

/**
 * 간소화 SVG 국기 — 주요 색상 블록만 표현
 * 정밀한 국기가 아닌 "인식 가능한 수준"의 미니멀 표현
 */
const FLAGS: Record<string, React.ReactNode> = {
  KR: (
    <>
      <rect width="40" height="28" fill="#FFFFFF" />
      <circle cx="20" cy="14" r="7" fill="#C60C30" />
      <path d="M20 7 A7 7 0 0 1 20 21 A3.5 3.5 0 0 0 20 14 A3.5 3.5 0 0 1 20 7Z" fill="#003478" />
    </>
  ),
  VN: (
    <>
      <rect width="40" height="28" fill="#DA251D" />
      <polygon points="20,5 22.4,12.4 30,12.4 23.8,17 26.2,24 20,19.6 13.8,24 16.2,17 10,12.4 17.6,12.4" fill="#FFFF00" />
    </>
  ),
  CN: (
    <>
      <rect width="40" height="28" fill="#DE2910" />
      <polygon points="8,4 9.5,8.5 14,8.5 10.3,11.2 11.8,15.7 8,13 4.2,15.7 5.7,11.2 2,8.5 6.5,8.5" fill="#FFDE00" />
    </>
  ),
  TH: (
    <>
      <rect width="40" height="28" fill="#FFFFFF" />
      <rect width="40" height="4.67" fill="#A51931" />
      <rect y="4.67" width="40" height="4.67" fill="#F4F5F8" />
      <rect y="9.33" width="40" height="9.33" fill="#2D2A4A" />
      <rect y="18.67" width="40" height="4.67" fill="#F4F5F8" />
      <rect y="23.33" width="40" height="4.67" fill="#A51931" />
    </>
  ),
  PH: (
    <>
      <rect width="40" height="14" fill="#0038A8" />
      <rect y="14" width="40" height="14" fill="#CE1126" />
      <polygon points="0,0 18,14 0,28" fill="#FFFFFF" />
      <circle cx="6" cy="14" r="2.5" fill="#FCD116" stroke="#FCD116" strokeWidth="0.5" />
    </>
  ),
  ID: (
    <>
      <rect width="40" height="14" fill="#FF0000" />
      <rect y="14" width="40" height="14" fill="#FFFFFF" />
    </>
  ),
  NP: (
    <>
      <rect width="40" height="28" fill="#FFFFFF" />
      <polygon points="2,26 2,2 22,14" fill="#DC143C" stroke="#003893" strokeWidth="1.5" />
      <polygon points="2,26 2,14 18,26" fill="#DC143C" stroke="#003893" strokeWidth="1.5" />
    </>
  ),
  KH: (
    <>
      <rect width="40" height="28" fill="#032EA1" />
      <rect y="6" width="40" height="16" fill="#E00025" />
      <rect x="14" y="10" width="12" height="8" fill="#FFFFFF" />
    </>
  ),
  UZ: (
    <>
      <rect width="40" height="9.3" fill="#1EB53A" />
      <rect y="9.3" width="40" height="9.3" fill="#FFFFFF" />
      <rect y="18.7" width="40" height="9.3" fill="#0099B5" />
      <rect y="8.8" width="40" height="1" fill="#CE1126" />
      <rect y="18.2" width="40" height="1" fill="#CE1126" />
    </>
  ),
  MN: (
    <>
      <rect width="13.3" height="28" fill="#C4272F" />
      <rect x="13.3" width="13.3" height="28" fill="#015197" />
      <rect x="26.7" width="13.3" height="28" fill="#C4272F" />
      <circle cx="6.7" cy="14" r="2.5" fill="#F9CF02" />
    </>
  ),
  BD: (
    <>
      <rect width="40" height="28" fill="#006A4E" />
      <circle cx="18" cy="14" r="7" fill="#F42A41" />
    </>
  ),
  US: (
    <>
      <rect width="40" height="28" fill="#B22234" />
      <rect y="4" width="40" height="4" fill="#FFFFFF" />
      <rect y="12" width="40" height="4" fill="#FFFFFF" />
      <rect y="20" width="40" height="4" fill="#FFFFFF" />
      <rect width="18" height="14" fill="#3C3B6E" />
    </>
  ),
};