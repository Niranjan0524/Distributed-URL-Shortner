import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHome, FiLink2 } from "react-icons/fi";

const Page404 = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-primary px-6 text-center">

      {/* Background glow blobs */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[120px]"
        style={{ background: "radial-gradient(circle, #D91E28 0%, transparent 70%)" }}
      />

      {/* Icon */}
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #B4121B22, #D91E2811)",
          border: "1px solid rgba(180,18,27,0.3)",
          boxShadow: "0 0 30px rgba(180,18,27,0.15)",
        }}
      >
        <FiLink2 size={28} className="text-accent-red" />
      </div>

      {/* 404 number */}
      <h1
        className="text-[96px] font-bold leading-none tracking-tighter"
        style={{
          background: "linear-gradient(135deg, #D91E28 0%, #B4121B 60%, #7A0A10 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "none",
          filter: "drop-shadow(0 0 40px rgba(180,18,27,0.35))",
        }}
      >
        404
      </h1>

      {/* Heading */}
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">
        Page not found
      </h2>

      {/* Subtext */}
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-muted/70">
        The link you followed may be broken, expired, or it never existed. Double-check the URL and try again.
      </p>

      {/* Divider */}
      <div
        className="my-8 h-px w-24"
        style={{ background: "linear-gradient(90deg, transparent, rgba(180,18,27,0.4), transparent)" }}
      />

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-full border border-border bg-bg-tertiary/60 px-5 py-2.5 text-sm font-medium text-text-muted transition-all duration-150 hover:border-accent-red/40 hover:text-text-primary hover:scale-[1.04] active:scale-[0.97]"
        >
          <FiArrowLeft size={15} />
          Go Back
        </button>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.04] active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg, #B4121B, #D91E28)",
            boxShadow: "0 0 18px rgba(180,18,27,0.4)",
          }}
        >
          <FiHome size={15} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Page404;