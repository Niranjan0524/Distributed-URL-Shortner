import { FiLink2, FiMousePointer, FiTrendingUp } from "react-icons/fi";

// TODO (Backend Integration):
// Replace the `stats` prop with data fetched from:
//   GET /api/analytics/summary
// Expected response shape:
//   {
//     totalLinks: number,       -- total shortened URLs created by the user
//     totalClicks: number,      -- sum of all clicks across all links
//     topLinkClicks: number,    -- click count of the single best-performing link
//     topLinkSlug: string       -- short slug of that top link (e.g. "mkitshrt.ly/demo")
//   }

const Card = ({ icon, label, value, sub, glow }) => (
  <div
    className="relative flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-5 overflow-hidden"
    style={
      glow
        ? { boxShadow: "0 0 32px rgba(180,18,27,0.15), 0 2px 16px rgba(0,0,0,0.6)" }
        : { boxShadow: "0 2px 16px rgba(0,0,0,0.5)" }
    }
  >
    {/* Red ambient glow blob — only on the highlighted card */}
    {glow && (
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #B4121B 0%, transparent 70%)" }}
      />
    )}

    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ background: glow ? "rgba(180,18,27,0.18)" : "rgba(255,255,255,0.05)" }}
      >
        <span style={{ color: glow ? "#D91E28" : "#94A3B8" }}>{icon}</span>
      </span>
    </div>

    <div>
      <p className="font-display text-3xl font-bold text-text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted truncate">{sub}</p>}
    </div>
  </div>
);

const AnalyticsStatCards = ({ stats }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <Card
      icon={<FiLink2 size={16} />}
      label="Total Links"
      value={stats.totalLinks.toLocaleString()}
      sub="shortened URLs"
      glow={false}
    />
    <Card
      icon={<FiMousePointer size={16} />}
      label="Total Clicks"
      value={stats.totalClicks.toLocaleString()}
      sub="across all links"
      glow={true}
    />
    <Card
      icon={<FiTrendingUp size={16} />}
      label="Top Link"
      value={stats.topLinkClicks.toLocaleString()}
      sub={stats.topLinkSlug}
      glow={false}
    />
  </div>
);

export default AnalyticsStatCards;
