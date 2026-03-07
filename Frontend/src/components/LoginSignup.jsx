import { useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import supabase from '../library/supabaseClient';
import PromoPanel from './auth/PromoPanel';
import LoginForm from './auth/LoginForm';
import SignupForm from './auth/SignupForm';

const LoginSignup = () => {
  const [mode, setMode] = useState("login");

  /* Login state */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass]   = useState("");

  /* Signup state */
  const [signupName, setSignupName]   = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPass, setSignupPass]   = useState("");

  const [fading, setFading]   = useState(false);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const navigate = useNavigate();

  const switchMode = useCallback((next) => {
    setError(null);
    setFading(true);
    setTimeout(() => {
      setMode(next);
      setTimeout(() => setFading(false), 30);
    }, 260);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/dashboard');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPass,
      options: { data: { full_name: signupName } },
    });
    setLoading(false);
    if (error) setError(error.message);
    else if (data.session) {
      // Email confirmation is OFF — user is immediately logged in
      navigate('/dashboard');
    } else {
      // Email confirmation is ON — ask user to verify then sign in
      switchMode("login");
      setTimeout(() => setError("Account created! Please sign in."), 300);
    }
  };

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "#000000" }}>
      <div
        className="w-full max-w-4xl h-140 overflow-hidden rounded-3xl"
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
              <div className="flex flex-col justify-center" style={{ background: "#0D0D0D" }}>
                <LoginForm
                  loginEmail={loginEmail} setLoginEmail={setLoginEmail}
                  loginPass={loginPass}   setLoginPass={setLoginPass}
                  error={error} loading={loading}
                  handleLogin={handleLogin} handleOAuth={handleOAuth}
                  switchMode={switchMode}
                />
              </div>
              <div className="flex flex-col justify-center rounded-r-3xl overflow-hidden">
                <PromoPanel isLogin={isLogin} switchMode={switchMode} />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col justify-center rounded-l-3xl overflow-hidden">
                <PromoPanel isLogin={isLogin} switchMode={switchMode} />
              </div>
              <div className="flex flex-col justify-center" style={{ background: "#0D0D0D" }}>
                <SignupForm
                  signupName={signupName}   setSignupName={setSignupName}
                  signupEmail={signupEmail} setSignupEmail={setSignupEmail}
                  signupPass={signupPass}   setSignupPass={setSignupPass}
                  error={error} loading={loading}
                  handleSignup={handleSignup} handleOAuth={handleOAuth}
                  switchMode={switchMode}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;