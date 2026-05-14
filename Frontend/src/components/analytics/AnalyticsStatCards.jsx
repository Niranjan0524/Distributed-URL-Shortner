import { FiLink2, FiMousePointer, FiTarget, FiTrendingUp } from "react-icons/fi";

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
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card
      icon={<FiLink2 size={16} />}
      label="Total Links"
      value={(stats?.totalLinks ?? 0).toLocaleString()}
      sub="shortened URLs"
      glow={false}
    />
    <Card
      icon={<FiMousePointer size={16} />}
      label="Total Clicks"
      value={(stats?.totalClicks ?? 0).toLocaleString()}
      sub="across all links"
      glow={true}
    />
    <Card
      icon={<FiTarget size={16} />}
      label="Unique Clicks"
      value={(stats?.uniqueClicks ?? 0).toLocaleString()}
      sub={`${(stats?.clicksToday ?? 0).toLocaleString()} today`}
      glow={false}
    />
    <Card
      icon={<FiTrendingUp size={16} />}
      label="Top Link"
      value={(stats?.topLinkClicks ?? 0).toLocaleString()}
      sub={stats?.topLinkSlug || "No clicks yet"}
      glow={false}
    />
  </div>
);

export default AnalyticsStatCards;
