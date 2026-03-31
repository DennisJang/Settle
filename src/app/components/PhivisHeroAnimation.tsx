import { motion, useAnimation } from "motion/react";
import { useEffect } from "react";

export function PhivisHeroAnimation() {
  const controls = useAnimation();
  const textControls = useAnimation();

  useEffect(() => {
    const animate = async () => {
      while (true) {
        await controls.start("idle");
        await controls.start("aligned");
        await controls.start("merged");
        await controls.start("final");

        textControls.start({ opacity: 1 });
        await new Promise((resolve) => setTimeout(resolve, 1500));

        await textControls.start({ opacity: 0 });
        await controls.start("reset");
      }
    };

    animate();
  }, [controls, textControls]);

  const layerVariants = {
    idle: (custom: number) => ({
      z: custom * 40,
      rotateY: -18,
      rotateX: 8,
      opacity: 0.4 + custom * 0.15,
      scale: 0.95 - custom * 0.05,
      y: Math.sin(custom * 2) * 3,
      transition: { duration: 2, ease: "easeInOut" as const },
    }),
    aligned: {
      z: 0,
      rotateY: -18,
      rotateX: 8,
      opacity: 0.7,
      scale: 1,
      y: 0,
      transition: { duration: 2, ease: "easeInOut" as const },
    },
    merged: {
      z: -80,
      rotateY: -18,
      rotateX: 8,
      opacity: 0.3,
      scale: 0.85,
      y: 0,
      transition: { duration: 2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
    },
    final: {
      z: 0,
      rotateY: -18,
      rotateX: 8,
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
    },
    reset: (custom: number) => ({
      z: custom * 40,
      rotateY: -18,
      rotateX: 8,
      opacity: 0.4 + custom * 0.15,
      scale: 0.95 - custom * 0.05,
      y: Math.sin(custom * 2) * 3,
      transition: { duration: 0.8, ease: "easeInOut" as const },
    }),
  };

  const layerConfigs = [
    { custom: 3, gradient: "linear-gradient(135deg, #a78bfa 0%, #7c5cf6 50%, #6366f1 100%)", highlight: "rgba(168,85,247,0.15)", isFinal: false },
    { custom: 2, gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)", highlight: "rgba(139,92,246,0.2)", isFinal: false },
    { custom: 1, gradient: "linear-gradient(135deg, #7c5cf6 0%, #6366f1 40%, #3b82f6 80%, #60a5fa 100%)", highlight: "rgba(99,102,241,0.25)", isFinal: false },
    { custom: 0, gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 30%, #3b82f6 70%, #60a5fa 100%)", highlight: "rgba(59,130,246,0.3)", isFinal: true },
  ];

  return (
    <div className="flex items-center justify-center" style={{ gap: 64 }}>
      <div className="relative" style={{ perspective: "800px" }}>
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)",
            transform: "scale(1.5)",
            filter: "blur(24px)",
          }}
        />
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2"
          style={{
            width: 120,
            height: 20,
            background: "radial-gradient(ellipse, rgba(100,80,160,0.15) 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />

        <div
          style={{
            width: 140,
            height: 140,
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          {layerConfigs.map((config, i) => (
            <motion.div
              key={i}
              custom={config.custom}
              initial="idle"
              animate={controls}
              variants={layerVariants}
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
              }}
            >
              <PortalLayer
                gradient={config.gradient}
                highlight={config.highlight}
                isFinal={config.isFinal}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={textControls}
        transition={{ duration: 1 }}
      >
        <h1
          style={{
            color: "var(--color-text-primary, #1a1a2e)",
            letterSpacing: "0.12em",
            fontSize: 42,
            fontWeight: 500,
            margin: 0,
            fontFamily: "Inter, sans-serif",
            transform: "perspective(800px) rotateY(-18deg) rotateX(8deg)",
          }}
        >
          Phivis
        </h1>
      </motion.div>
    </div>
  );
}

function PortalLayer({
  gradient,
  highlight,
  isFinal = false,
}: {
  gradient: string;
  highlight: string;
  isFinal?: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 32,
        background: gradient,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxShadow: `
          0 20px 40px -10px rgba(99,102,241,0.25),
          0 8px 16px -6px rgba(59,130,246,0.15),
          inset 0 1px 1px rgba(255,255,255,${isFinal ? "0.3" : "0.2"}),
          inset 0 -1px 1px rgba(0,0,0,0.05)
        `,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 6, left: 6, right: "40%", bottom: "40%",
          borderRadius: "28px 26px 40px 26px",
          background: `linear-gradient(135deg, rgba(255,255,255,${isFinal ? "0.25" : "0.18"}) 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 8, right: 8, width: 50, height: 50,
          borderRadius: 16,
          background: `radial-gradient(circle at center, rgba(251,146,60,${isFinal ? "0.2" : "0.12"}) 0%, rgba(236,72,153,${isFinal ? "0.15" : "0.08"}) 50%, transparent 70%)`,
          filter: "blur(6px)",
        }}
      />
      <div
        style={{
          width: 60, height: 60,
          borderRadius: 16,
          background: "#f8f8fa",
          boxShadow: `inset 0 2px 6px ${highlight}, inset 0 -1px 3px rgba(59,130,246,0.1)`,
        }}
      />
    </div>
  );
}