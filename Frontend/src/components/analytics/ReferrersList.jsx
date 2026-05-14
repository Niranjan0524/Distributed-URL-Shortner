const SOURCE_BADGE = {
  Direct: "dir",
  "Twitter / X": "x",
  LinkedIn: "in",
  GitHub: "gh",
  Other: "...",
};

const ReferrersList = ({ referrers = [], title = "Top Referrers" }) => (
  <div
    className="rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-6"
    style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
  >
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mt-0.5 text-xs text-text-muted">Where your clicks are coming from</p>
    </div>

    <div className="flex flex-col gap-4">
      {referrers.length === 0 && (
        <p className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-8 text-center text-xs text-text-muted">
          No referrer data in this range.
        </p>
      )}

      {referrers.map((ref, i) => {
        const isTop = i === 0;
        return (
          <div key={ref.source}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#94A3B8" }}
                >
                  {SOURCE_BADGE[ref.source] ?? ref.source.slice(0, 2).toLowerCase()}
                </span>
                <span className="truncate text-xs font-medium text-text-primary">{ref.source}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">
                  {ref.clicks.toLocaleString()}
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: isTop ? "rgba(180,18,27,0.12)" : "rgba(255,255,255,0.04)",
                    color: isTop ? "#D91E28" : "#94A3B8",
                  }}
                >
                  {ref.percentage}%
                </span>
              </div>
            </div>

            <div className="h-[3px] w-full rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${ref.percentage}%`,
                  background: isTop
                    ? "linear-gradient(90deg, #B4121B, #E8212D)"
                    : "rgba(180,18,27,0.35)",
                  transition: "width 0.6s ease-out",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default ReferrersList;
