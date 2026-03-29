import { useState } from "react";

const UrlForm = () => {
  const [activeTab, setActiveTab] = useState("shorten");
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiry, setExpiry] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    
    console.log("long URL:" , url);
    console.log("alias : ",alias);
    console.log("Expiry : ",expiry);
    const backendUrl=import.meta.env.VITE_BACKEND_URL;
    let shortCode;

    const body = {
      longUrl: url,
      ...(expiry && {expiresAt:expiry}),
      ...(alias && { alias: alias }),
    };

    try {
      const res = await fetch(`${backendUrl}/api/shortenUrl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      shortCode= await res.json();
      console.log("ShortCode",shortCode);
    } catch (err) {
      console.error(err);
    }
    // // Placeholder — wire to real API later
    const generated = `mkitshrt.ly/${shortCode || Math.random().toString(36).slice(2, 7)}`;

    
    setShortUrl(generated);
    console.log(generated)
    setSubmitted(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shortUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setUrl("");
    setAlias("");
    setExpiry("");
    setShortUrl("");
    setSubmitted(false);
    setCopied(false);
  };

  return (
    <section className="flex items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-lg rounded-2xl border"
        style={{
          background: "#0D0D0D",
          borderColor: "rgba(180,18,27,0.25)",
          boxShadow: "0 0 0 1px rgba(220, 245, 31, 0.2), 0 8px 48px rgba(180,18,27,0.18), 0 2px 16px rgba(180,18,27,0.12)",
        }}
      >

        {/* ── Tabs ── */}
        <div
          className="flex rounded-t-2xl overflow-hidden border-b"
          style={{ borderColor: "rgba(197, 189, 189, 0.07)" }}
        >
          <button
            onClick={() => setActiveTab("shorten")}
            className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-150"
            style={{
              background: activeTab === "shorten" ? "#B4121B" : "transparent",
              color: activeTab === "shorten" ? "#fff" : "#94A3B8",
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
            </svg>
            Shorten a Link
          </button>
          <button
            onClick={() => setActiveTab("qr")}
            className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-150"
            style={{
              background: activeTab === "qr" ? "#B4121B" : "transparent",
              color: activeTab === "qr" ? "#fff" : "#94A3B8",
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 14v1M4 12h1m14 0h1m-2.05-6.536l-.707.707M6.757 17.243l-.707.707m0-11.9l.707.707M17.243 17.243l.707.707" />
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Generate QR Code
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6">
          {activeTab === "shorten" && !submitted && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Long URL */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <svg className="h-4 w-4" style={{ color: "#B4121B" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5" />
                  </svg>
                  Long URL
                  <span style={{ color: "#B4121B" }}>*</span>
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your long URL here..."
                  className="w-full rounded-xl px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-muted outline-none transition-all duration-150"
                  style={{
                    background: "#1A1A1A",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(180,18,27,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Domain + Alias */}
              <div className="grid grid-cols-2 gap-4">

                {/* Domain */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                    <svg className="h-4 w-4" style={{ color: "#B4121B" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                    </svg>
                    Domain
                  </label>
                  <div
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-text-muted cursor-not-allowed select-none"
                    style={{
                      background: "#1A1A1A",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span className="font-mono text-text-primary">mkitshrt.ly</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Alias */}
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                    <svg className="h-4 w-4" style={{ color: "#B4121B" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 2.828L11.828 13.828A2 2 0 0111 14.414l-4 1 1-4a2 2 0 01.586-.828z" />
                    </svg>
                    Alias
                    <span className="text-xs font-normal text-text-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Add alias here"
                    minLength={5}
                    className="w-full rounded-xl px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-muted outline-none transition-all duration-150"
                    style={{
                      background: "#1A1A1A",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(180,18,27,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                  <p className="text-xs text-text-muted">Must be at least 5 characters</p>
                </div>
              </div>

              {/* Expiration */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <svg className="h-4 w-4" style={{ color: "#B4121B" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                  </svg>
                  Expiration
                  <span className="text-xs font-normal text-text-muted">(optional)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "1 hour",   value: "1h" },
                    { label: "24 hours", value: "24h" },
                    { label: "7 days",   value: "7d" },
                    { label: "30 days",  value: "30d" },
                    { label: "1 year",   value: "1y" },
                    { label: "Never",    value: "never" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExpiry(expiry === opt.value ? "" : opt.value)}
                      className="rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 hover:brightness-110"
                      style={{
                        background: expiry === opt.value ? "rgba(180,18,27,0.2)" : "#1A1A1A",
                        border: expiry === opt.value ? "1px solid rgba(180,18,27,0.6)" : "1px solid rgba(255,255,255,0.08)",
                        color: expiry === opt.value ? "#D91E28" : "#94A3B8",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-1 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #B4121B, #D91E28)",
                  boxShadow: "0 0 24px rgba(180,18,27,0.4)",
                }}
              >
                Shorten Link
              </button>

              {/* Terms */}
              <p className="text-center text-xs" style={{ color: "#94A3B8" }}>
                By clicking Shorten Link, you agree to our{" "}
                <a href="#" className="underline transition-colors hover:text-white" style={{ color: "#D91E28" }}>Terms of Service</a>,{" "}
                <a href="#" className="underline transition-colors hover:text-white" style={{ color: "#D91E28" }}>Privacy Policy</a>,{" "}
                and <a href="#" className="underline transition-colors hover:text-white" style={{ color: "#D91E28" }}>Use of Cookies</a>.
              </p>
            </form>
          )}

          {/* ── Success State ── */}
          {activeTab === "shorten" && submitted && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgba(180,18,27,0.15)", border: "1px solid rgba(180,18,27,0.3)" }}
              >
                <svg className="h-7 w-7" style={{ color: "#D91E28" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-muted">Your short link is ready</p>
                <p className="mt-1 font-mono text-lg font-semibold text-text-primary">https://{shortUrl}</p>
              </div>
              <div className="flex w-full gap-3">
                <button
                  onClick={handleCopy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: copied ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #B4121B, #D91E28)",
                    border: copied ? "1px solid rgba(34,197,94,0.4)" : "none",
                    boxShadow: copied ? "0 0 16px rgba(34,197,94,0.2)" : "0 0 20px rgba(180,18,27,0.35)",
                    color: copied ? "#22C55E" : "#fff",
                  }}
                >
                  {copied ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path strokeLinecap="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-text-muted transition-all duration-150 hover:text-text-primary"
                  style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  New
                </button>
              </div>
            </div>
          )}

          {/* ── QR Tab placeholder ── */}
          {activeTab === "qr" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(180,18,27,0.12)", border: "1px solid rgba(180,18,27,0.25)" }}
              >
                <svg className="h-8 w-8" style={{ color: "#B4121B" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                  <path strokeLinecap="round" d="M14 14h2m2 0h1m-3 2v2m0 2v1" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-text-primary">QR Code Generator</p>
              <p className="max-w-xs text-xs text-text-muted">Paste a URL and generate a scannable QR code — coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UrlForm;