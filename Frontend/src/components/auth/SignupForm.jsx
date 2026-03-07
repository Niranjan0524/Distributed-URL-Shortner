import { useState } from "react";
import Field from "./Field";
import SocialBtn from "./SocialBtn";
import { GoogleIcon, GithubIcon, EyeIcon, EmailIcon, LockIcon, UserIcon } from "./icons";

const PASSWORD_RULES = [
  { label: "At least 6 characters", test: p => p.length >= 6 },
  { label: "Lowercase letter",       test: p => /[a-z]/.test(p) },
  { label: "Uppercase letter",       test: p => /[A-Z]/.test(p) },
  { label: "Number",                 test: p => /[0-9]/.test(p) },
  { label: "Symbol",                 test: p => /[^a-zA-Z0-9]/.test(p) },
];

const SignupForm = ({
  signupName, setSignupName,
  signupEmail, setSignupEmail,
  signupPass, setSignupPass,
  error, loading,
  handleSignup, handleOAuth, switchMode,
}) => {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="flex flex-col gap-5 px-10 py-12">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Create Account</h2>
      </div>

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
          icon={<UserIcon />}
        />
        <Field
          type="email"
          placeholder="Enter E-mail"
          value={signupEmail}
          onChange={e => setSignupEmail(e.target.value)}
          icon={<EmailIcon />}
        />
        <Field
          type={showPass ? "text" : "password"}
          placeholder="Enter Password"
          value={signupPass}
          onChange={e => setSignupPass(e.target.value)}
          icon={<LockIcon />}
          rightSlot={
            <button type="button" onClick={() => setShowPass(p => !p)} className="text-text-muted hover:text-text-primary transition-colors">
              <EyeIcon open={showPass} />
            </button>
          }
        />

        {signupPass.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl px-4 py-3" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            {PASSWORD_RULES.map(r => {
              const met = r.test(signupPass);
              return (
                <span key={r.label} className="flex items-center gap-1.5 text-xs" style={{ color: met ? "#22c55e" : "rgba(255,255,255,0.35)" }}>
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    {met
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
                  </svg>
                  {r.label}
                </span>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-xs text-center" style={{ color: error.startsWith('Check') ? '#22c55e' : '#D91E28' }}>
            {error}
          </p>
        )}

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
};

export default SignupForm;
