import { useState } from "react";
import Field from "./Field";
import SocialBtn from "./SocialBtn";
import { GoogleIcon, GithubIcon, EyeIcon, EmailIcon, LockIcon } from "./icons";

const LoginForm = ({
  loginEmail, setLoginEmail,
  loginPass, setLoginPass,
  error, loading,
  handleLogin, handleOAuth, switchMode,
}) => {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="flex flex-col gap-5 px-10 py-12">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-text-primary">Sign In</h2>
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

      <form className="flex flex-col gap-3" onSubmit={handleLogin}>
        <Field
          type="email"
          placeholder="Enter E-mail"
          value={loginEmail}
          onChange={e => setLoginEmail(e.target.value)}
          icon={<EmailIcon />}
        />
        <Field
          type={showPass ? "text" : "password"}
          placeholder="Enter Password"
          value={loginPass}
          onChange={e => setLoginPass(e.target.value)}
          icon={<LockIcon />}
          rightSlot={
            <button type="button" onClick={() => setShowPass(p => !p)} className="text-text-muted hover:text-text-primary transition-colors">
              <EyeIcon open={showPass} />
            </button>
          }
        />

        <div className="text-right">
          <a href="#" className="text-xs transition-colors hover:text-white" style={{ color: "#B4121B" }}>
            Forgot Password?
          </a>
        </div>

        {error && (
          <p className="text-xs text-center" style={{ color: error.startsWith('Account') ? '#22c55e' : '#D91E28' }}>
            {error}
          </p>
        )}

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
};

export default LoginForm;
