
import UrlCard from "./UrlCard";


const UrlHistory = () => {

  const urls = [
    {
      id: 1,
      shortUrl: "https://mkshrt.io/abc123",
      originalUrl: "https://github.com/Niranjan0524",
      createdAt: "March 3, 2026 5:59 PM GMT+5:30",
    },
    {
      id: 2,
      shortUrl: "https://mkshrt.io/xyz789",
      originalUrl: "https://www.example.com/some/very/long/url/path",
      createdAt: "March 3, 2026 4:30 PM GMT+5:30",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Recent URLs</h2>
        <span className="rounded-full border border-border bg-bg-secondary/60 px-3 py-1 text-xs text-text-muted">
          {urls.length} links
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {urls.map((url) => (
          <UrlCard key={url.id} {...url} />
        ))}
      </div>
    </section>
  );
};

export default UrlHistory;