export function BrandColors() {
  const colors = [
    {
      name: "Primary Blue",
      hex: "#007AFF",
      description: "Trust, stability, system reliability",
      role: "Primary actions, key UI elements",
    },
    {
      name: "Soft Mint",
      hex: "#34C759",
      description: "Success, growth, approachability",
      role: "Accents, success states, highlights",
    },
    {
      name: "Light Neutral",
      hex: "#F5F5F7",
      description: "Subtle, clean, Korean milky aesthetic",
      role: "Backgrounds, cards, spacing",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {colors.map((color) => (
        <div key={color.hex} className="bg-white rounded-3xl overflow-hidden">
          <div
            className="h-48 w-full"
            style={{ backgroundColor: color.hex }}
          />
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 style={{ fontWeight: 600 }}>{color.name}</h3>
              <span className="text-sm text-[#86868B] font-mono">{color.hex}</span>
            </div>
            <p className="text-sm text-[#86868B]">{color.description}</p>
            <p className="text-xs text-[#86868B]/70 italic">{color.role}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
