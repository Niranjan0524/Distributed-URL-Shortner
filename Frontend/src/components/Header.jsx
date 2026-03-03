import { useState } from "react";

const Header = () => {
  // TODO: replace with real auth state (context / zustand / etc.)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="fixed top-5 left-0 right-0 z-50 px-4">
      <header
        className="mx-auto max-w-6xl rounded-2xl border border-border bg-bg-secondary/50 backdrop-blur-xl "
        style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(180,18,27,0.15)" }}
      >
        <div className="flex h-16 items-center justify-between px-6">

          {/* ── Logo ── */}
          <a href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #B4121B, #D91E28)" }}
            >
              M
            </div>
            <span
              className="font-display text-xl font-bold"
              style={{
                background: "linear-gradient(135deg, #D91E28 0%, #B4121B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              makeItShort
            </span>
          </a>

          {/* ── Right Nav ── */}
          <nav className="flex items-center gap-1">

            {/* Analytics — always visible */}
            <a
              href="/analytics"
              className="rounded-full px-4 py-2 text-sm font-medium text-text-muted transition-all duration-150 hover:bg-bg-tertiary hover:text-text-primary"
            >
              Analytics
            </a>

            {isLoggedIn ? (
              <>
                {/* Profile avatar */}
                <button
                  className="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-accent-red/30 transition-all duration-150 hover:ring-accent-red/70"
                  style={{ background: "linear-gradient(135deg, #B4121B, #D91E28)" }}
                  title="Profile"
                >
                  P
                </button>

                {/* Logout */}
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="ml-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-text-muted transition-all duration-150 hover:border-danger/50 hover:text-danger"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Log in */}
                <a
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-medium text-text-muted transition-all duration-150 hover:text-text-primary"
                >
                  Log in
                </a>

                {/* Sign up */}
                <a
                  href="/signup"
                  className="ml-1 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #B4121B, #D91E28)",
                    boxShadow: "0 0 18px rgba(180,18,27,0.5)",
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