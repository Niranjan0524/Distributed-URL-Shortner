import { useEffect, useState } from "react";
import {
  FiClock,
  FiCopy,
  FiDownload,
  FiExternalLink,
  FiLink2,
  FiShare2,
  FiX,
} from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ActionBtn = ({ icon, label, onClick, filled = false, dark = false, disabled = false }) => {
  if (filled) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:scale-[1.04] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
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
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-full bg-bg-tertiary px-3 py-1.5 text-xs font-semibold text-text-primary transition-all duration-150 hover:bg-bg-tertiary/80 hover:scale-[1.04] active:scale-[0.97] border border-border disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-all duration-150 hover:border-accent-red/40 hover:text-text-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  );
};

const UrlCard = ({ shortUrl, originalUrl, createdAt }) => {
  const { getToken } = useAuth();
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const getRedirectUrl = (url) => {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "";
    return `${backendUrl}/${encodeURIComponent(url)}`;
  };

  const getShortCode = (url) => {
    const cleanUrl = String(url || "").replace(/\/$/, "");
    return cleanUrl.split("/").pop() || cleanUrl;
  };

  const handleRedirect = (url) => {
    window.open(getRedirectUrl(url), "_blank", "noopener,noreferrer");
  };

  const handleCopy = async (url) => {
    await navigator.clipboard.writeText(getRedirectUrl(url));
    toast.success("Short link copied");
  };

  const getQrCode = async (shortCode) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const token = await getToken();
    const qrShortCode = encodeURIComponent(getShortCode(shortCode));

    try {
      setQrLoading(true);

      const res = await fetch(`${backendUrl}/api/urls/${qrShortCode}/qr`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let errorMessage = "Unable to load QR code";
        if (res.status === 401 || res.status === 511) errorMessage = "Unauthorized";
        else if (res.status === 400) errorMessage = "Bad Request";
        else if (res.status === 500) errorMessage = "Internal Server Error";
        toast.error(errorMessage);
        return;
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      setQrImageUrl((currentUrl) => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        return imageUrl;
      });
      setIsQrModalOpen(true);
    } catch (err) {
      console.log(err);
      toast.error("Internal Server Error");
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${getShortCode(shortUrl)}-qr.png`;
    link.click();
  };

  useEffect(() => {
    return () => {
      if (qrImageUrl) URL.revokeObjectURL(qrImageUrl);
    };
  }, [qrImageUrl]);

  return (
    <>
      <div
        className="group relative rounded-2xl border border-border bg-bg-secondary/60 backdrop-blur-xl px-6 py-5 transition-all duration-200 hover:border-accent-red/30 hover:bg-bg-secondary/80"
        style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(180,18,27,0.06)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #B4121B22, #D91E2811)", border: "1px solid rgba(180,18,27,0.2)" }}
            >
              <FiLink2 size={16} className="text-accent-red" />
            </div>

            <div className="min-w-0">
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

              <p className="mt-1 truncate text-sm text-text-muted" title={originalUrl}>
                <span className="mr-1 text-text-muted/50">-&gt;</span>
                {originalUrl}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ActionBtn
              icon={<FiExternalLink size={14} />}
              label="Visit URL"
              onClick={() => handleRedirect(shortUrl)}
              filled
            />
            <ActionBtn
              icon={<BsQrCode size={14} />}
              label={qrLoading ? "Loading" : "QR"}
              onClick={() => getQrCode(shortUrl)}
              disabled={qrLoading}
            />
            <ActionBtn icon={<FiShare2 size={14} />} label="Share" />
            <ActionBtn
              icon={<FiCopy size={14} />}
              label="Copy"
              onClick={() => handleCopy(shortUrl)}
              dark
            />
          </div>
        </div>

        <div className="mt-4 border-t border-border/50" />

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

      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-bg-secondary p-6 text-center shadow-2xl"
            style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(180,18,27,0.12)" }}
          >
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-tertiary text-text-muted transition hover:border-accent-red/50 hover:text-text-primary"
              aria-label="Close QR code preview"
            >
              <FiX size={18} />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-tertiary text-accent-red">
              <BsQrCode size={22} />
            </div>

            <h3 className="mt-4 text-2xl font-bold text-text-primary">Your QR Code is ready</h3>
            <p className="mt-2 text-sm text-text-muted">Scan the image below to open your short link.</p>

            <div className="mx-auto mt-6 flex h-56 w-56 items-center justify-center rounded-xl bg-white p-4">
              <img src={qrImageUrl} alt={`QR code for ${shortUrl}`} className="h-full w-full object-contain" />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-bg-tertiary/70 p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-text-muted/60">Short code</span>
                <span className="rounded-full bg-accent-red/10 px-3 py-1 font-mono text-xs font-semibold text-accent-glow">
                  {getShortCode(shortUrl)}
                </span>
              </div>
              <p className="mt-3 truncate font-mono text-sm text-text-primary" title={getRedirectUrl(shortUrl)}>
                {getRedirectUrl(shortUrl)}
              </p>
              <p className="mt-2 truncate text-xs text-text-muted" title={originalUrl}>
                Destination: {originalUrl}
              </p>
              <p className="mt-2 text-xs text-text-muted">Created: {createdAt}</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-2 rounded-xl bg-accent-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-glow active:scale-[0.98]"
              >
                <FiDownload size={16} />
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => handleCopy(shortUrl)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-tertiary px-4 py-3 text-sm font-semibold text-text-primary transition hover:border-accent-red/50 active:scale-[0.98]"
              >
                <FiCopy size={16} />
                Copy link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UrlCard;
