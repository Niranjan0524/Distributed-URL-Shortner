import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiActivity,
  FiBarChart2,
  FiClock,
  FiGlobe,
  FiMonitor,
  FiSearch,
} from "react-icons/fi";
import { FallingLines } from "react-loader-spinner";
import Header from "../components/Header";
import AnalyticsStatCards from "../components/analytics/AnalyticsStatCards";
import ClicksChart from "../components/analytics/ClicksChart";
import TopLinksTable from "../components/analytics/TopLinksTable";
import ReferrersList from "../components/analytics/ReferrersList";
import { useAuth } from "../context/AuthContext";

const RANGE_OPTIONS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "All", value: "all" },
];

const emptySummary = {
  totalLinks: 0,
  totalClicks: 0,
  uniqueClicks: 0,
  avgClicksPerLink: 0,
  topLinkClicks: 0,
  topLinkSlug: "",
  clicksToday: 0,
};

const formatDate = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const MiniStat = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[11px] font-medium uppercase tracking-widest text-text-muted">{label}</span>
      <span className="text-accent-red">{icon}</span>
    </div>
    <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
  </div>
);

const BreakdownList = ({ title, items = [] }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-5">
    <h3 className="mb-4 text-sm font-semibold text-text-primary">{title}</h3>
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <p className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-6 text-center text-xs text-text-muted">
          No data yet.
        </p>
      )}
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="truncate text-xs text-text-primary">{item.label}</span>
            <span className="shrink-0 text-xs font-bold text-text-primary">{item.clicks}</span>
          </div>
          <div className="h-[3px] rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-accent-red"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LinkDetails = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0D0D0D]">
        <FallingLines color="#D91E28" width="80" visible ariaLabel="analytics-detail-loading" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0D0D0D] px-6 text-center">
        <FiBarChart2 size={32} className="mb-3 text-text-muted/40" />
        <p className="text-sm font-semibold text-text-primary">Select a short URL</p>
        <p className="mt-1 max-w-sm text-xs text-text-muted">
          Drill down into clicks, referrers, devices, locations, and recent activity for one link.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-6">
        <div className="mb-5 min-w-0">
          <p
            className="truncate text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #D91E28, #B4121B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {data.url.shortUrl}
          </p>
          <p className="mt-1 truncate text-xs text-text-muted" title={data.url.originalUrl}>
            {data.url.originalUrl}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat icon={<FiActivity size={15} />} label="Clicks" value={data.summary.totalClicks.toLocaleString()} />
          <MiniStat icon={<FiGlobe size={15} />} label="Unique" value={data.summary.uniqueClicks.toLocaleString()} />
          <MiniStat icon={<FiClock size={15} />} label="Last Click" value={formatDateTime(data.url.lastClickedAt)} />
        </div>
      </div>

      <ClicksChart data={data.clicksOverTime} title="Selected link activity" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReferrersList referrers={data.referrers} title="Link Referrers" />
        <BreakdownList title="Devices" items={data.devices} />
        <BreakdownList title="Countries" items={data.locations} />
        <BreakdownList title="Browsers" items={data.browsers} />
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-6">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Recent Clicks</h3>
        <div className="flex flex-col gap-3">
          {data.recentClicks.length === 0 && (
            <p className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-8 text-center text-xs text-text-muted">
              No recent click events in this range.
            </p>
          )}
          {data.recentClicks.map((click, index) => (
            <div
              key={`${click.clickedAt}-${index}`}
              className="grid grid-cols-1 gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-xs text-text-muted sm:grid-cols-4"
            >
              <span className="font-medium text-text-primary">{formatDateTime(click.clickedAt)}</span>
              <span>{click.country || "Unknown"}{click.city ? `, ${click.city}` : ""}</span>
              <span>{click.deviceType || "Unknown"} / {click.browser || "Unknown"}</span>
              <span>{click.isUnique ? "Unique" : "Returning"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const { getToken } = useAuth();
  const [range, setRange] = useState("7d");
  const [summary, setSummary] = useState(emptySummary);
  const [clicksOverTime, setClicksOverTime] = useState([]);
  const [links, setLinks] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const filteredLinks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return links;

    return links.filter((link) =>
      link.shortUrl.toLowerCase().includes(term) ||
      link.originalUrl.toLowerCase().includes(term)
    );
  }, [links, search]);

  const topLinks = filteredLinks.slice(0, 8);

  useEffect(() => {
    const fetchOverview = async () => {
      const token = await getToken();
      if (!token) {
        toast.error("Please login to view analytics");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        const query = `range=${range}`;

        const [summaryRes, chartRes, linksRes, referrersRes] = await Promise.all([
          fetch(`${backendUrl}/api/analytics/summary?${query}`, { headers }),
          fetch(`${backendUrl}/api/analytics/clicks-over-time?${query}`, { headers }),
          fetch(`${backendUrl}/api/analytics/links?${query}`, { headers }),
          fetch(`${backendUrl}/api/analytics/referrers?${query}`, { headers }),
        ]);

        if (!summaryRes.ok || !chartRes.ok || !linksRes.ok || !referrersRes.ok) {
          throw new Error("Unable to load analytics");
        }

        const [summaryData, chartData, linksData, referrersData] = await Promise.all([
          summaryRes.json(),
          chartRes.json(),
          linksRes.json(),
          referrersRes.json(),
        ]);

        setSummary(summaryData);
        setClicksOverTime(chartData);
        setLinks(linksData);
        setReferrers(referrersData);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [backendUrl, getToken, range]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedId) return;

      const token = await getToken();
      if (!token) return;

      try {
        setDetailLoading(true);
        const response = await fetch(`${backendUrl}/api/analytics/urls/${selectedId}?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Unable to load link analytics");
        }

        setSelectedAnalytics(await response.json());
      } catch (err) {
        console.error(err);
        toast.error("Unable to load link analytics");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetails();
  }, [backendUrl, getToken, range, selectedId]);

  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Header />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(ellipse, #B4121B 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-16">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold text-text-primary">Analytics</h1>
            <p className="mt-1 text-sm text-text-muted">
              Overview and drill-down performance for your short URLs.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                  style={{
                    background: range === option.value ? "rgba(180,18,27,0.24)" : "transparent",
                    color: range === option.value ? "#FFFFFF" : "#94A3B8",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#0D0D0D] px-3 py-2">
              <FiSearch size={14} className="text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search links"
                className="w-44 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="mx-auto flex w-40 flex-col items-center gap-3 py-20">
            <FallingLines color="#D91E28" width="100" visible ariaLabel="analytics-loading" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <AnalyticsStatCards stats={summary} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <ClicksChart data={clicksOverTime} title="All link activity" rangeLabel={range} />
              <ReferrersList referrers={referrers} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="flex flex-col gap-6">
                <TopLinksTable
                  links={topLinks}
                  selectedId={selectedId}
                  onSelect={(link) => {
                    setSelectedId(link.id);
                    setSelectedAnalytics(null);
                  }}
                />

                <div className="rounded-2xl border border-white/[0.07] bg-[#0D0D0D] p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <FiMonitor size={15} className="text-accent-red" /> Link Snapshot
                  </h3>
                  <div className="flex flex-col gap-3">
                    {filteredLinks.slice(0, 5).map((link) => (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(link.id);
                          setSelectedAnalytics(null);
                        }}
                        className="grid cursor-pointer grid-cols-[1fr_auto] gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-left transition-all hover:border-accent-red/25"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-text-primary">{link.shortUrl}</span>
                          <span className="mt-1 block truncate text-[11px] text-text-muted">
                            Created {formatDate(link.createdAt)}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block text-sm font-bold text-text-primary">{link.totalClicks}</span>
                          <span className="text-[10px] uppercase tracking-widest text-text-muted">clicks</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <LinkDetails data={selectedAnalytics} loading={detailLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
