interface LogoProps {
  size?: "small" | "medium" | "large";
  showText?: boolean;
}

export function Logo({ size = "medium", showText = false }: LogoProps) {
  const dimensions = {
    small: { container: 32, outer: 32, inner: 14, radius: 8, innerRadius: 4, perspective: 400 },
    medium: { container: 48, outer: 48, inner: 20, radius: 12, innerRadius: 6, perspective: 600 },
    large: { container: 140, outer: 140, inner: 60, radius: 32, innerRadius: 16, perspective: 800 },
  };

  const d = dimensions[size];

  return (
    <div className="flex items-center" style={{ gap: size === "large" ? 16 : 8 }}>
      {/* 3D Portal Shape */}
      <div className="relative" style={{ perspective: `${d.perspective}px` }}>
        {/* Subtle ambient glow */}
        {size === "large" && (
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)",
              transform: "scale(1.5)",
              filter: "blur(24px)",
            }}
          />
        )}
        {/* Ground shadow */}
        {size !== "small" && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: size === "large" ? -6 : -3,
              width: d.outer * 0.85,
              height: d.outer * 0.14,
              background: "radial-gradient(ellipse, rgba(100,80,160,0.12) 0%, transparent 70%)",
              filter: "blur(4px)",
            }}
          />
        )}
        {/* The portal */}
        <div
          style={{
            width: d.outer,
            height: d.outer,
            transform: "rotateY(-18deg) rotateX(8deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: d.radius,
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 30%, #3b82f6 70%, #60a5fa 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: size === "small"
                ? "0 4px 8px -2px rgba(99,102,241,0.2), 0 2px 4px -1px rgba(59,130,246,0.1), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.05)"
                : "0 20px 40px -10px rgba(99,102,241,0.25), 0 8px 16px -6px rgba(59,130,246,0.15), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(0,0,0,0.05)",
            }}
          >
            {/* Top-left highlight */}
            <div
              style={{
                position: "absolute",
                top: d.outer * 0.04,
                left: d.outer * 0.04,
                right: "40%",
                bottom: "40%",
                borderRadius: `${d.radius - 4}px ${d.radius - 6}px ${d.radius + 8}px ${d.radius - 6}px`,
                background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)",
              }}
            />
            {/* Pink/orange accent reflection (medium & large only) */}
            {size !== "small" && (
              <div
                style={{
                  position: "absolute",
                  bottom: d.outer * 0.06,
                  right: d.outer * 0.06,
                  width: d.outer * 0.36,
                  height: d.outer * 0.36,
                  borderRadius: d.innerRadius,
                  background: "radial-gradient(circle at center, rgba(251,146,60,0.2) 0%, rgba(236,72,153,0.15) 50%, transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
            )}
            {/* Hollow center */}
            <div
              style={{
                width: d.inner,
                height: d.inner,
                borderRadius: d.innerRadius,
                background: size === "large" ? "#f8f8fa" : "var(--color-surface-primary, #ffffff)",
                boxShadow: "inset 0 2px 6px rgba(99,102,241,0.15), inset 0 -1px 3px rgba(59,130,246,0.1)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      {showText && (
        <span
          style={{
            color: "var(--color-text-primary, #1a1a2e)",
            letterSpacing: "0.12em",
            fontSize: size === "large" ? 42 : size === "medium" ? 20 : 14,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Phivis
        </span>
      )}
    </div>
  );
}