import { useState } from "react";

const Header = () => {
  // TODO: replace with real auth state (context / zustand / etc.)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4">
      <header
        className="mx-auto max-w-5xl rounded-2xl border border-white/[0.08] bg-black/70 backdrop-blur-2xl"
        style={{
          boxShadow:
            "0 0 0 1px rgba(180,18,27,0.25), 0 8px 24px rgba(180,18,27,0.15), 0 20px 60px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex h-14 items-center justify-between px-5">

          {/* ── Logo ── */}
          <a href="/" className="group flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold text-white transition-transform duration-200 group-hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #B4121B 0%, #E8212D 100%)",
                boxShadow: "0 0 14px rgba(180,18,27,0.55)",
              }}
            >
              M
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">
              makeIt<span style={{ color: "#ff4d4d" }}>Short</span>
            </span>
          </a>

          {/* ── Right Nav ── */}
          <nav className="flex items-center gap-0.5">

            {/* Analytics — always visible */}
            <a
              href="/analytics"
              className="relative rounded-xl px-3.5 py-1.5 text-[13px] font-medium text-white/50 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/90"
            >
              Analytics
            </a>

            {isLoggedIn ? (
              <>
                {/* Divider */}
                <div className="mx-2 h-4 w-px bg-white/10" />

                {/* Profile avatar */}
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white transition-all duration-200 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #B4121B, #E8212D)",
                    boxShadow: "0 0 12px rgba(180,18,27,0.4)",
                  }}
                  title="Profile"
                >
                  P
                </button>

                {/* Logout */}
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="ml-1 rounded-xl px-3.5 py-1.5 text-[13px] font-medium text-white/40 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Divider */}
                <div className="mx-2 h-4 w-px bg-white/10" />

                {/* Log in */}
                <a
                  href="/login"
                  className="rounded-xl px-3.5 py-1.5 text-[13px] font-medium text-white/50 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/90"
                >
                  Log in
                </a>

                {/* Sign up */}
                <a
                  href="/signup"
                  className="ml-1 rounded-xl px-4 py-1.5 text-[13px] font-semibold text-white transition-all duration-200 hover:scale-[1.04] hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #B4121B 0%, #E8212D 100%)",
                    boxShadow: "0 0 20px rgba(180,18,27,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}
                >
                  Sign up
                </a>
              </>
            )}
          </nav>
        </div>
      </header>
    </div>
  );
};

export default Header;