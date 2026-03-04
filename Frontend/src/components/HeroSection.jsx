import { FiZap, FiShield, FiBarChart2, FiLink } from "react-icons/fi";

const STATS = [
  { icon: <FiZap size={13} />, label: "< 50ms Redirects" },
  { icon: <FiShield size={13} />, label: "Secure & Private" },
  { icon: <FiBarChart2 size={13} />, label: "Real-time Analytics" },
  { icon: <FiLink size={13} />, label: "Custom Aliases" },
];

const HeroSection = () => {
  return (
    <div className="flex flex-col justify-center gap-8 px-4 py-12 lg:px-8">

      {/* Eyebrow badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold"
          style={{
            background: "rgba(180,18,27,0.12)",
            border: "1px solid rgba(180,18,27,0.3)",
            color: "#D91E28",
            boxShadow: "0 0 16px rgba(180,18,27,0.15)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "#D91E28" }}
          />
          Distributed · Fast · Reliable
        </span>
      </div>

      {/* Headline */}
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-text-primary lg:text-6xl">
          Shorten.{" "}
          <br />
          Share.{" "}
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #D91E28 0%, #B4121B 60%, #FF4D57 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 24px rgba(180,18,27,0.4))",
            }}
          >
            Track Everything.
          </span>
        </h1>

        {/* Subtext */}
        <p className="max-w-sm text-base leading-relaxed text-text-muted/80">
          A blazing-fast, distributed URL shortener built for scale. Turn long,
          cluttered links into clean, memorable short URLs — in under a second.
        </p>
      </div>

      {/* Divider */}
      <div
        className="h-px w-20"
        style={{
          background: "linear-gradient(90deg, rgba(180,18,27,0.6), transparent)",
        }}
      />

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2">
        {STATS.map(({ icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-text-muted transition-all duration-150 hover:text-text-primary hover:border-accent-red/30"
            style={{
              background: "#0D0D0D",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span className="text-accent-red">{icon}</span>
            {label}
          </span>
        ))}
      </div>

      {/* Social proof */}
      <div className="flex items-center gap-3">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {["#B4121B", "#7A0A10", "#D91E28"].map((color, i) => (
            <div
              key={i}
              className="h-7 w-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: color,
                borderColor: "#000",
                zIndex: 3 - i,
              }}
            >
              {["P", "A", "M"][i]}
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted/60">
          Trusted by developers &amp; teams building at scale
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
