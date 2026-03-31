import { useState, useEffect, useRef } from "react";

const PLACEHOLDER = "you@email.com";
const CHAR_DELAY = 50;
const HOLD_DURATION = 2000;
const FADE_DURATION = 300;

export function WavePlaceholderInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [displayText, setDisplayText] = useState("");
  const [fading, setFading] = useState(false);
  const [focused, setFocused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (focused || value) return;

    let charIndex = 0;
    let phase: "typing" | "holding" | "fading" = "typing";

    const run = () => {
      if (phase === "typing") {
        charIndex++;
        setDisplayText(PLACEHOLDER.slice(0, charIndex));
        setFading(false);
        if (charIndex >= PLACEHOLDER.length) {
          phase = "holding";
          intervalRef.current = setTimeout(run, HOLD_DURATION);
          return;
        }
        intervalRef.current = setTimeout(run, CHAR_DELAY);
      } else if (phase === "holding") {
        phase = "fading";
        setFading(true);
        intervalRef.current = setTimeout(run, FADE_DURATION);
      } else {
        setDisplayText("");
        setFading(false);
        charIndex = 0;
        phase = "typing";
        intervalRef.current = setTimeout(run, 400);
      }
    };

    intervalRef.current = setTimeout(run, 300);
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [focused, value]);

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input
        type="email"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 40,
          borderRadius: 12,
          background: "var(--color-surface-secondary, #F3F3F5)",
          border: "none",
          padding: "0 14px",
          fontSize: 16,
          outline: "none",
          fontFamily: "Inter, sans-serif",
          color: "var(--color-text-primary, #1A1D26)",
          transition: "box-shadow 0.2s ease",
          boxShadow: focused
            ? "0 0 0 3px var(--color-action-primary-subtle, rgba(99,91,255,0.1))"
            : "none",
        }}
      />
      {!value && !focused && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 14,
            height: 40,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            opacity: fading ? 0 : 1,
            transition: fading ? `opacity ${FADE_DURATION}ms ease` : "none",
          }}
        >
          {displayText.split("").map((char, i) => (
            <span
              key={`${i}-${char}`}
              style={{
                color: "var(--color-text-tertiary, #A3ACCD)",
                fontSize: 16,
                fontFamily: "Inter, sans-serif",
                display: "inline-block",
                animation: "waveFadeIn 0.2s ease forwards",
              }}
            >
              {char}
            </span>
          ))}
        </div>
      )}
      <style>{`
        @keyframes waveFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}