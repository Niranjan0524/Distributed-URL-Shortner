import { useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import supabase from '../library/supabaseClient';

/* ── Social icon SVGs ── */
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const GithubIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
    )}
  </svg>
);

/* ── Input field ── */
const Field = ({ type = "text", placeholder, value, onChange, icon, rightSlot }) => (
  <div
    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-150"
    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
    onFocus={() => {}}
  >
    {icon && <span style={{ color: "#B4121B" }}>{icon}</span>}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
      onFocus={e => e.currentTarget.parentElement.style.borderColor = "rgba(180,18,27,0.6)"}
      onBlur={e => e.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.08)"}
    />
    {rightSlot}
  </div>
);

/* ── Social button ── */
const SocialBtn = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-text-muted transition-all duration-150 hover:text-text-primary hover:brightness-110"
    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
  >
    {icon}
    {label}
  </button>
);

/* ══════════════════════════════════════════ */
const LoginSignup = () => {
  const [mode, setMode] = useState("login"); // "login" | "signup"

  /* Login state */
  const [loginEmail, setLoginEmail]     = useState("");
  const [loginPass, setLoginPass]       = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);

  /* Signup state */
  const [signupName, setSignupName]     = useState("");
  const [signupEmail, setSignupEmail]   = useState("");
  const [signupPass, setSignupPass]     = useState("");
  const [showSignupPass, setShowSignupPass] = useState(false);

  const [fading, setFading] = useState(false);
  const isLogin = mode === "login";

  const navigate = useNavigate();
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

// Email/password login
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true); setError(null);
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: loginPass,
  });
  setLoading(false);
  if (error) setError(error.message);
  else navigate('/dashboard');
};

// Email/password signup
const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true); setError(null);
  const { error } = await supabase.auth.signUp({
    email: signupEmail,
    password: signupPass,
    options: { data: { full_name: signupName } }, // stored in user_metadata
  });
  setLoading(false);
  if (error) setError(error.message);
  else setError("Check your email to confirm your account!");
};

// OAuth (Google / GitHub / Facebook)
const handleOAuth = async (provider) => {
  await supabase.auth.signInWithOAuth({
    provider, // 'google' | 'github' | 'facebook'
    options: { redirectTo: window.location.origin + '/dashboard' },
  });
};

  const switchMode = useCallback((next) => {
    setFading(true);
    setTimeout(() => {
      setMode(next);
      setTimeout(() => setFading(false), 30);
    }, 260);
  }, []);

  /* ── Promo panel ── */
  const PromoPanel = () => (
    <div
      className="flex flex-col items-center justify-center gap-6 px-10 py-12 text-center mr-10 ml-10"
      style={{ background: "linear-gradient(160deg, #B4121B 0%, #8B0D13 100%)" }}
    >
      {/* Logo mark */}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/20">
        <span className="font-display text-xl font-bold text-white">M</span>
      </div>

      <div>
        <h2 className="font-display text-3xl font-bold leading-tight text-white">
          {isLogin ? "Hello!" : "Welcome Back!"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          {isLogin
            ? "Don't have an account yet?\nJoin makeItShort and start shortening links in seconds."
            : "Already have an account?\nSign in and get back to shortening."}
        </p>
      </div>

      <button
        onClick={() => switchMode(isLogin ? "signup" : "login")}
        className="mt-2 cursor-pointer rounded-full border-2 border-white px-8 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition-all duration-200 hover:bg-white hover:text-[#B4121B]"
      >
        {isLogin ? "Sign Up" : "Sign In"}
      </button>
    </div>
  );

  /* ── Login form ── */
  const LoginForm = () => (
    <div className="flex flex-col gap-5 px-10 py-12">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Sign In</h2>
      </div>

      {/* Social */}
      <div className="flex gap-3">
        <SocialBtn icon={<GoogleIcon />} label="Google" onClick={() => handleOAuth('google')} />
        <SocialBtn icon={<GithubIcon />} label="GitHub" onClick={() => handleOAuth('github')} />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-xs text-text-muted">or with email</span>
        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleLogin}>
        <Field
          type="email"
          placeholder="Enter E-mail"
          value={loginEmail}
          onChange={e => setLoginEmail(e.target.value)}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <Field
          type={showLoginPass ? "text" : "password"}
          placeholder="Enter Password"
          value={loginPass}
          onChange={e => setLoginPass(e.target.value)}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          rightSlot={
            <button type="button" onClick={() => setShowLoginPass(p => !p)} className="text-text-muted hover:text-text-primary transition-colors">
              <EyeIcon open={showLoginPass} />
            </button>
          }
        />

        <div className="text-right">
          <a href="#" className="text-xs transition-colors hover:text-white" style={{ color: "#B4121B" }}>
            Forgot Password?
          </a>
        </div>

        {error && <p className="text-xs text-center" style={{ color: "#D91E28" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #B4121B, #D91E28)", boxShadow: "0 0 24px rgba(180,18,27,0.4)" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-xs text-text-muted">
        No account?{" "}
        <button onClick={() => switchMode("signup")} className="font-semibold cursor-pointer transition-colors hover:text-white" style={{ color: "#D91E28" }}>
          Sign up free
        </button>
      </p>
    </div>
  );

  /* ── Signup form ── */
  const SignupForm = () => (
    <div className="flex flex-col gap-5 px-10 py-12">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Create Account</h2>
      </div>

      {/* Social */}
      <div className="flex gap-3">
        <SocialBtn icon={<GoogleIcon />} label="Google" onClick={() => handleOAuth('google')} />
        <SocialBtn icon={<GithubIcon />} label="GitHub" onClick={() => handleOAuth('github')} />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-xs text-text-muted">or with email</span>
        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleSignup}>
        <Field
          placeholder="Full Name"
          value={signupName}
          onChange={e => setSignupName(e.target.value)}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <Field
          type="email"
          placeholder="Enter E-mail"
          value={signupEmail}
          onChange={e => setSignupEmail(e.target.value)}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <Field
          type={showSignupPass ? "text" : "password"}
          placeholder="Enter Password"
          value={signupPass}
          onChange={e => setSignupPass(e.target.value)}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          rightSlot={
            <button type="button" onClick={() => setShowSignupPass(p => !p)} className="text-text-muted hover:text-text-primary transition-colors">
              <EyeIcon open={showSignupPass} />
            </button>
          }
        />

        {error && <p className="text-xs text-center" style={{ color: error.startsWith('Check') ? '#22c55e' : '#D91E28' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all duration-150 hover:scale-[1.02] hover:brightness-110 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #B4121B, #D91E28)", boxShadow: "0 0 24px rgba(180,18,27,0.4)" }}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-xs text-text-muted">
        Already have an account?{" "}
        <button onClick={() => switchMode("login")} className="font-semibold cursor-pointer transition-colors hover:text-white" style={{ color: "#D91E28" }}>
          Sign in
        </button>
      </p>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "#000000" }}>
      <div
        className="w-full max-w-4xl  h-140 overflow-hidden rounded-3xl"
        style={{
          background: "#0D0D0D",
          border: "1px solid rgba(180,18,27,0.25)",
          boxShadow: "0 0 0 1px rgba(180,18,27,0.2), 0 8px 48px rgba(180,18,27,0.18), 0 2px 16px rgba(180,18,27,0.12)",
        }}
      >
        <div
          className="grid grid-cols-2 min-h-[520px]"
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? "scale(0.98)" : "scale(1)",
            transition: "opacity 260ms cubic-bezier(0.4,0,0.2,1), transform 260ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {isLogin ? (
            <>
              {/* Login: form LEFT, promo RIGHT */}
              <div className="flex flex-col justify-center" style={{ background: "#0D0D0D" }}>
                <LoginForm />
              </div>
              <div className="flex flex-col justify-center rounded-r-3xl overflow-hidden">
                <PromoPanel />
              </div>
            </>
          ) : (
            <>
              {/* Signup: promo LEFT, form RIGHT */}
              <div className="flex flex-col justify-center rounded-l-3xl overflow-hidden">
                <PromoPanel />
              </div>
              <div className="flex flex-col justify-center" style={{ background: "#0D0D0D" }}>
                <SignupForm />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;