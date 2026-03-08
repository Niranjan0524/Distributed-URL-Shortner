import { useState } from "react";

// TODO (Backend Integration):
// Replace the `data` prop with data fetched from:
//   GET /api/analytics/clicks-over-time?range=7d
// Expected response shape:
//   Array<{ day: string, clicks: number }>
//   e.g. [{ day: "Mon", clicks: 120 }, { day: "Tue", clicks: 340 }, ...]
//   Must be chronological, last 7 days.
//
// Future enhancements:
//   - Add a range picker (7d / 30d / 90d) that re-fetches with a different query param
//   - Support "unique clicks" toggle (requires backend to track unique IPs/fingerprints)

const ClicksChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <div
      className="rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-6"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Clicks Over Time</h3>
          <p className="mt-0.5 text-xs text-text-muted">Last 7 days</p>
        </div>
        <span
          className="rounded-xl px-3 py-1 text-[11px] font-semibold"
          style={{
            background: "rgba(180,18,27,0.12)",
            color: "#D91E28",
            border: "1px solid rgba(180,18,27,0.22)",
          }}
        >
          7d
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2" style={{ height: "160px" }}>
        {data.map((d, i) => {
          const pct = (d.clicks / max) * 100;
          const isHovered = hovered === i;

          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center gap-1"
              style={{ height: "100%" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Click count tooltip above bar */}
              <span
                className="text-[11px] font-bold transition-all duration-150"
                style={{
                  color: "#D91E28",
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered ? "translateY(0)" : "translateY(4px)",
                  minHeight: "16px",
                }}
              >
                {d.clicks.toLocaleString()}
              </span>

              {/* Bar container — fills remaining height, bar grows from bottom */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-lg cursor-pointer"
                  style={{
                    height: `${Math.max(pct, 3)}%`,
                    background: isHovered
                      ? "linear-gradient(180deg, #E8212D 0%, #B4121B 100%)"
                      : "linear-gradient(180deg, rgba(180,18,27,0.65) 0%, rgba(180,18,27,0.25) 100%)",
                    boxShadow: isHovered ? "0 0 14px rgba(180,18,27,0.5)" : "none",
                    transition: "background 0.2s, box-shadow 0.2s, height 0.4s ease-out",
                  }}
                />
              </div>

              {/* Day label */}
              <span
                className="text-[11px] font-medium transition-colors duration-150"
                style={{ color: isHovered ? "#F8FAFC" : "#94A3B8" }}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Axis line */}
      <div className="mt-2 h-px w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
};

export default ClicksChart;
