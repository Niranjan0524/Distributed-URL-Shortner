import { FiExternalLink } from "react-icons/fi";

// TODO (Backend Integration):
// Replace the `links` prop with data fetched from:
//   GET /api/analytics/top-links?limit=5
// Expected response shape:
//   Array<{
//     shortSlug: string,     -- e.g. "mkitshrt.ly/demo"
//     originalUrl: string,   -- full destination URL
//     clicks: number         -- total click count
//   }>
//   Sorted by clicks descending, top 5 entries.

const TopLinksTable = ({ links }) => {
  const max = Math.max(...links.map((l) => l.clicks), 1);

  return (
    <div
      className="rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-6"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
    >
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-text-primary">Top Links</h3>
        <p className="mt-0.5 text-xs text-text-muted">Sorted by click count</p>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-4">
        {links.map((link, i) => {
          const pct = (link.clicks / max) * 100;
          const isTop = i === 0;

          return (
            <div key={link.shortSlug} className="group">
              {/* Row info */}
              <div className="mb-1.5 flex items-center justify-between gap-2">
                {/* Rank + slug + external link */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                    style={{
                      background: isTop ? "rgba(180,18,27,0.2)" : "rgba(255,255,255,0.05)",
                      color: isTop ? "#D91E28" : "#94A3B8",
                    }}
                  >
                    {i + 1}
                  </span>

                  <span
                    className="truncate text-xs font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #D91E28, #B4121B)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {link.shortSlug}
                  </span>

                  <a
                    href={link.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    title={link.originalUrl}
                  >
                    <FiExternalLink size={11} className="text-text-muted hover:text-white" />
                  </a>
                </div>

                {/* Click count */}
                <span className="ml-2 shrink-0 text-xs font-bold text-text-primary">
                  {link.clicks.toLocaleString()}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-[3px] w-full rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: isTop
                      ? "linear-gradient(90deg, #B4121B, #E8212D)"
                      : "linear-gradient(90deg, rgba(180,18,27,0.45), rgba(232,33,45,0.45))",
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
};

export default TopLinksTable;
