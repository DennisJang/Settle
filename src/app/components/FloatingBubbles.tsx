import { motion } from "motion/react";

const bubbles = [
  {
    text: "E-9 in 3 min",
    top: "6%",
    left: "-4%",
    rotate: -3,
    bg: "rgba(139,92,246,0.08)",
    duration: 3.2,
  },
  {
    text: "비자 쉬워요",
    top: "22%",
    right: "-2%",
    rotate: 4,
    bg: "rgba(251,146,60,0.06)",
    duration: 3.8,
  },
  {
    text: "Gia hạn dễ dàng",
    top: "58%",
    left: "-8%",
    rotate: 2,
    bg: "rgba(59,130,246,0.06)",
    duration: 4.2,
  },
  {
    text: "签证不再复杂",
    top: "66%",
    right: "-6%",
    rotate: -2,
    bg: "rgba(139,92,246,0.07)",
    duration: 3.5,
  },
  {
    text: "D-2 → E-7-4 ✓",
    top: "40%",
    left: "-12%",
    rotate: 5,
    bg: "rgba(251,146,60,0.06)",
    duration: 4.6,
  },
];

export function FloatingBubbles() {
  return (
    <>
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: [0, -4, 0, 4, 0],
          }}
          transition={{
            opacity: { duration: 0.8, delay: 0.3 + i * 0.1 },
            y: {
              duration: b.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            },
          }}
          style={{
            position: "absolute",
            top: b.top,
            left: (b as Record<string, unknown>).left as string | undefined,
            right: (b as Record<string, unknown>).right as string | undefined,
            transform: `rotate(${b.rotate}deg)`,
            background: b.bg,
            color: "var(--color-text-secondary, #6B7294)",
            padding: "5px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {b.text}
        </motion.div>
      ))}
    </>
  );
}