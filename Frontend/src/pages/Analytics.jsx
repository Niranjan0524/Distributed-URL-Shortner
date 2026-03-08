import Header from "../components/Header";
import AnalyticsStatCards from "../components/analytics/AnalyticsStatCards";
import ClicksChart from "../components/analytics/ClicksChart";
import TopLinksTable from "../components/analytics/TopLinksTable";
import ReferrersList from "../components/analytics/ReferrersList";

// ─────────────────────────────────────────────────────────────────────────────
// DATA LAYER — replace all four MOCK_* constants with real API calls
// when the backend is ready.
//
// Suggested pattern using useEffect + useState:
//
//   const [summary, setSummary] = useState(null);
//   useEffect(() => {
//     api.get("/analytics/summary").then(r => setSummary(r.data));
//   }, []);
//
// Endpoints to implement on the Go backend:
//   GET /api/analytics/summary           → MOCK_SUMMARY shape
//   GET /api/analytics/clicks-over-time  → MOCK_CLICKS_OVER_TIME shape
//   GET /api/analytics/top-links         → MOCK_TOP_LINKS shape
//   GET /api/analytics/referrers         → MOCK_REFERRERS shape
//
// All endpoints should be scoped to the authenticated user via JWT.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SUMMARY = {
  totalLinks: 24,
  totalClicks: 1790,
  topLinkClicks: 1042,
  topLinkSlug: "mkitshrt.ly/yt-demo",
};

const MOCK_CLICKS_OVER_TIME = [
  { day: "Sun", clicks: 140 },
  { day: "Mon", clicks: 320 },
  { day: "Tue", clicks: 210 },
  { day: "Wed", clicks: 480 },
  { day: "Thu", clicks: 390 },
  { day: "Fri", clicks: 520 },
  { day: "Sat", clicks: 260 },
];

const MOCK_TOP_LINKS = [
  { shortSlug: "mkitshrt.ly/yt-demo",  originalUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",              clicks: 1042 },
  { shortSlug: "mkitshrt.ly/fig-ui",   originalUrl: "https://figma.com/file/XYZ/dashboard-design",          clicks: 319  },
  { shortSlug: "mkitshrt.ly/gh-repo",  originalUrl: "https://github.com/parth/distributed-url-shortener",  clicks: 284  },
  { shortSlug: "mkitshrt.ly/resume",   originalUrl: "https://drive.google.com/file/d/1ABC/view",            clicks: 88   },
  { shortSlug: "mkitshrt.ly/docs",     originalUrl: "https://supabase.com/docs/guides/auth",                clicks: 57   },
];

const MOCK_REFERRERS = [
  { source: "Direct",      clicks: 890, percentage: 50 },
  { source: "Twitter / X", clicks: 534, percentage: 30 },
  { source: "LinkedIn",    clicks: 214, percentage: 12 },
  { source: "GitHub",      clicks: 107, percentage: 6  },
  { source: "Other",       clicks: 45,  percentage: 2  },
];

// ─────────────────────────────────────────────────────────────────────────────

const Analytics = () => {
  return (
    <div className="min-h-screen" style={{ background: "#000000" }}>
      <Header />

      {/* Ambient red glow — purely decorative */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(ellipse, #B4121B 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pt-28 pb-16">

        {/* ── Page heading ── */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-primary">Analytics</h1>
          <p className="mt-1 text-sm text-text-muted">
            An overview of all your link performance.
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="mb-6">
          <AnalyticsStatCards stats={MOCK_SUMMARY} />
        </div>

        {/* ── Clicks over time chart ── */}
        <div className="mb-6">
          <ClicksChart data={MOCK_CLICKS_OVER_TIME} />
        </div>

        {/* ── Bottom two-column grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopLinksTable links={MOCK_TOP_LINKS} />
          <ReferrersList referrers={MOCK_REFERRERS} />
        </div>

      </div>
    </div>
  );
};

export default Analytics;
