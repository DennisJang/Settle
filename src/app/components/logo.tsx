interface LogoProps {
  size?: "small" | "medium" | "large";
}

export function Logo({ size = "medium" }: LogoProps) {
  const dimensions = {
    small: { container: 40, circle: 24, dot: 8 },
    medium: { container: 64, circle: 40, dot: 12 },
    large: { container: 96, circle: 60, dot: 18 },
  };

  const d = dimensions[size];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: d.container, height: d.container }}
    >
      <svg
        width={d.container}
        height={d.container}
        viewBox={`0 0 ${d.container} ${d.container}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main circle - Primary Blue */}
        <circle
          cx={d.container / 2}
          cy={d.container / 2}
          r={d.circle / 2}
          fill="var(--color-action-primary)"
        />
        
        {/* Anchor point - Success accent */}
        <circle
          cx={d.container / 2}
          cy={d.container / 2 + d.circle / 6}
          r={d.dot / 2}
          fill="var(--color-action-success)"
        />
        
        {/* Horizontal line suggesting "settling down" */}
        <rect
          x={d.container / 2 - d.circle / 3}
          y={d.container / 2 + d.circle / 6 - 1}
          width={d.circle / 1.5}
          height={2}
          fill="white"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}