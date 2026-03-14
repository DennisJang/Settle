export function TypographyShowcase() {
  const examples = [
    {
      label: "Display / 디스플레이",
      english: "Your trusted companion",
      korean: "당신의 든든한 동반자",
      size: "text-4xl",
      weight: 600,
    },
    {
      label: "Heading / 헤딩",
      english: "Visa & Immigration",
      korean: "비자 및 체류 관리",
      size: "text-2xl",
      weight: 600,
    },
    {
      label: "Body / 본문",
      english: "Simplify your life in Korea with comprehensive support for visa, remittance, housing, and education.",
      korean: "비자, 송금, 주거, 교육까지 한국 생활의 모든 것을 간편하게 해결하세요.",
      size: "text-base",
      weight: 400,
    },
    {
      label: "Caption / 캡션",
      english: "Updated 2 hours ago",
      korean: "2시간 전 업데이트",
      size: "text-sm",
      weight: 400,
    },
  ];

  return (
    <div className="space-y-8">
      {examples.map((example, index) => (
        <div key={index} className="bg-white rounded-3xl p-8 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-black/5">
            <span className="text-xs text-[#86868B] uppercase tracking-wide" style={{ fontWeight: 500 }}>
              {example.label}
            </span>
          </div>
          <div className={`${example.size} space-y-2`} style={{ fontWeight: example.weight }}>
            <p className="text-[#1D1D1F]">{example.english}</p>
            <p className="text-[#1D1D1F]">{example.korean}</p>
          </div>
          <div className="flex gap-4 text-xs text-[#86868B] pt-2">
            <span>Size: {example.size}</span>
            <span>•</span>
            <span>Weight: {example.weight}</span>
            <span>•</span>
            <span>Line height: 1.5</span>
          </div>
        </div>
      ))}

      {/* Font Stack Info */}
      <div className="bg-[#007AFF] text-white rounded-3xl p-8">
        <h3 className="text-xl mb-4" style={{ fontWeight: 600 }}>
          Font Stack
        </h3>
        <p className="font-mono text-sm opacity-90 leading-relaxed">
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Sans KR", sans-serif
        </p>
        <p className="mt-4 text-sm opacity-75">
          System fonts ensure optimal readability and performance across all devices while maintaining perfect alignment between English and Korean text.
        </p>
      </div>
    </div>
  );
}
