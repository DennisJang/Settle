import { useState, useRef, useEffect, useCallback } from "react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CENTER_INDEX = 2;

function generateYears() {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y <= current + 10; y++) years.push(y);
  return years;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function generateDays(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

function ScrollColumn({
  items,
  selectedIndex,
  onSelect,
  formatItem,
}: {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (item: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (ref.current && !isScrolling.current) {
      ref.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    isScrolling.current = true;

    clearTimeout((ref.current as unknown as { _scrollTimer?: ReturnType<typeof setTimeout> })._scrollTimer);
    (ref.current as unknown as { _scrollTimer: ReturnType<typeof setTimeout> })._scrollTimer = setTimeout(() => {
      if (!ref.current) return;
      const index = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      ref.current.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
      onSelect(clamped);
      isScrolling.current = false;
    }, 80);
  }, [items.length, onSelect]);

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      style={{
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        overflow: "auto",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        position: "relative",
        flex: 1,
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {/* Top padding */}
      <div style={{ height: ITEM_HEIGHT * CENTER_INDEX }} />
      {items.map((item, i) => {
        const isSelected = i === selectedIndex;
        return (
          <div
            key={item}
            onClick={() => {
              onSelect(i);
              ref.current?.scrollTo({ top: i * ITEM_HEIGHT, behavior: "smooth" });
            }}
            style={{
              height: ITEM_HEIGHT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scrollSnapAlign: "start",
              fontSize: isSelected ? 18 : 15,
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? "#1A1D26" : "#A3ACCD",
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {formatItem(item)}
          </div>
        );
      })}
      {/* Bottom padding */}
      <div style={{ height: ITEM_HEIGHT * CENTER_INDEX }} />
    </div>
  );
}

export function DateScrollPicker({ value, onChange }: DatePickerProps) {
  const years = generateYears();
  const parsed = value ? new Date(value) : null;

  const [yearIdx, setYearIdx] = useState(() =>
    parsed ? Math.max(0, years.indexOf(parsed.getFullYear())) : 0
  );
  const [monthIdx, setMonthIdx] = useState(() =>
    parsed ? parsed.getMonth() : 0
  );
  const [dayIdx, setDayIdx] = useState(() =>
    parsed ? parsed.getDate() - 1 : 0
  );

  const selectedYear = years[yearIdx] || years[0];
  const selectedMonth = MONTHS[monthIdx] || 1;
  const days = generateDays(selectedYear, selectedMonth);

  // Clamp day if month changes
  useEffect(() => {
    if (dayIdx >= days.length) {
      setDayIdx(days.length - 1);
    }
  }, [days.length, dayIdx]);

  // Emit change
  useEffect(() => {
    const day = days[dayIdx] || 1;
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
  }, [yearIdx, monthIdx, dayIdx, selectedYear, selectedMonth, days, onChange]);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        background: "#F3F3F5",
        overflow: "hidden",
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
      }}
    >
      {/* Selection highlight band */}
      <div
        style={{
          position: "absolute",
          top: ITEM_HEIGHT * CENTER_INDEX,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          background: "rgba(99,91,255,0.06)",
          borderTop: "1px solid rgba(99,91,255,0.1)",
          borderBottom: "1px solid rgba(99,91,255,0.1)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div className="flex" style={{ height: "100%" }}>
        <ScrollColumn
          items={years}
          selectedIndex={yearIdx}
          onSelect={setYearIdx}
          formatItem={(y) => `${y}년`}
        />
        <ScrollColumn
          items={MONTHS}
          selectedIndex={monthIdx}
          onSelect={setMonthIdx}
          formatItem={(m) => `${m}월`}
        />
        <ScrollColumn
          items={days}
          selectedIndex={dayIdx}
          onSelect={setDayIdx}
          formatItem={(d) => `${d}일`}
        />
      </div>

      {/* Fade edges */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "linear-gradient(180deg, #F3F3F5 0%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(0deg, #F3F3F5 0%, transparent 100%)", pointerEvents: "none", zIndex: 2 }} />
    </div>
  );
}