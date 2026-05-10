import { FiCopy, FiExternalLink, FiShare2, FiClock, FiLink2 } from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";


/* ── Reusable action button ── */
const ActionBtn = ({ icon, label, onClick, filled = false, dark = false }) => {
  if (filled) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
        style={{ background: "linear-gradient(135deg, #B4121B, #D91E28)", boxShadow: "0 0 12px rgba(180,18,27,0.4)" }}
      >
        {icon}
        {label}
      </button>
    );
  }
  if (dark) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-full bg-bg-tertiary px-3 py-1.5 text-xs font-semibold text-text-primary transition-all duration-150 hover:bg-bg-tertiary/80 hover:scale-[1.04] active:scale-[0.97] border border-border"
      >
        {icon}
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-all duration-150 hover:border-accent-red/40 hover:text-text-primary active:scale-[0.97]"
    >
      {icon}
      {label}
    </button>
  );
};

/* ── Single URL card ── */
const UrlCard = ({ shortUrl, originalUrl, createdAt }) => {

  
  const getRedirectUrl = (url) => {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";
    return `${backendUrl}/${encodeURIComponent(url)}`;
  };

  const handleRedirect = (url) => {
    window.open(getRedirectUrl(url), "_blank", "noopener,noreferrer");
  };

  const handleCopy=async(url)=>{
    await navigator.clipboard.writeText(getRedirectUrl(url));
  }

  
  return (
    <div
      className="group relative rounded-2xl border border-border bg-bg-secondary/60 backdrop-blur-xl px-6 py-5 transition-all duration-200 hover:border-accent-red/30 hover:bg-bg-secondary/80"
      style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(180,18,27,0.06)" }}
    >
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-4">

        {/* Left: icon + URLs */}
        <div className="flex items-start gap-4 min-w-0">
          {/* Favicon placeholder */}
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #B4121B22, #D91E2811)", border: "1px solid rgba(180,18,27,0.2)" }}
          >
            <FiLink2 size={16} className="text-accent-red" />
          </div>

          <div className="min-w-0">
            {/* Short URL */}
            <a
              href={getRedirectUrl(shortUrl)}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-base font-semibold leading-tight transition-colors duration-150 hover:text-accent-red"
              style={{
                background: "linear-gradient(135deg, #D91E28 0%, #B4121B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {shortUrl}
            </a>

            {/* Original URL */}
            <p className="mt-1 truncate text-sm text-text-muted" title={originalUrl}>
              <span className="mr-1 text-text-muted/50">↪</span>
              {originalUrl}
            </p>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Visit */}
          <ActionBtn
            icon={<FiExternalLink size={14} />}
            label="Visit URL"
            onClick={() => handleRedirect(shortUrl)}
            filled
          />
          {/* QR */}
          <ActionBtn icon={<BsQrCode size={14} />} label="QR" />
          {/* Share */}
          <ActionBtn icon={<FiShare2 size={14} />} label="Share" />
          {/* Copy */}
          <ActionBtn
            icon={<FiCopy size={14} />}
            label="Copy"
            onClick={() => navigator.clipboard.writeText(getRedirectUrl(shortUrl))}
            dark
          />
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mt-4 border-t border-border/50" />

      {/* ── Bottom row: tags + timestamp ── */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-text-muted/60">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          No tags
        </span>

        <span className="flex items-center gap-1.5 text-xs text-text-muted/60">
          <FiClock size={12} />
          {createdAt}
        </span>
      </div>
    </div>
  );
};

export default UrlCard;
