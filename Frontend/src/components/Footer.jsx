import { FiGithub, FiLinkedin, FiGlobe, FiLink2, FiTwitter } from "react-icons/fi";

const SOCIAL_LINKS = [
  {
    icon: <FiGithub size={17} />,
    label: "GitHub",
    href: "https://github.com/",
  },
  {
    icon: <FiLinkedin size={17} />,
    label: "LinkedIn",
    href: "https://linkedin.com/in/",
  },
  {
    icon: <FiGlobe size={17} />,
    label: "Portfolio",
    href: "https://",
  },
  {
    icon: <FiTwitter size={17} />,
    label: "Twitter",
    href: "https://twitter.com/",
  },
];

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Docs", href: "/docs" },
  { label: "Privacy", href: "/privacy" },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative mt-auto border-t border-border bg-bg-secondary/40 backdrop-blur-xl"
      style={{ boxShadow: "0 -1px 0 rgba(180,18,27,0.08)" }}
    >
      {/* faint top glow line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(180,18,27,0.35), transparent)" }}
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* ── Main row ── */}
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">

          {/* Brand */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #B4121B22, #D91E2811)",
                  border: "1px solid rgba(180,18,27,0.3)",
                }}
              >
                <FiLink2 size={15} className="text-accent-red" />
              </div>
              <span
                className="text-lg font-bold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                makeItShort<span style={{ WebkitTextFillColor: "#D91E28" }}>.</span>ly
              </span>
            </div>
            <p className="max-w-[200px] text-center text-xs leading-relaxed text-text-muted/60 sm:text-left">
              Fast, distributed URL shortening — built for scale.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-text-muted/40">
              Navigate
            </span>
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-text-muted/70 transition-colors duration-150 hover:text-accent-red"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Social links */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <span className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-text-muted/40">
              Connect
            </span>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {SOCIAL_LINKS.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-bg-tertiary/60 px-3 py-1.5 text-xs text-text-muted transition-all duration-150 hover:border-accent-red/40 hover:text-text-primary hover:scale-[1.05] active:scale-[0.97]"
                >
                  {icon}
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mt-8 border-t border-border/50" />

        {/* ── Bottom bar ── */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-text-muted/40">
            &copy; {year} makeItShort.ly &mdash; All rights reserved.
          </p>
          <p className="text-xs text-text-muted/30">
            Built with{" "}
            <span
              className="font-medium"
              style={{
                background: "linear-gradient(135deg, #D91E28, #B4121B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              React & Go
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;