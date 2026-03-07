const PromoPanel = ({ isLogin, switchMode }) => (
  <div
    className="flex flex-col items-center justify-center gap-6 px-10 py-12 text-center mr-10 ml-10"
    style={{ background: "linear-gradient(160deg, #B4121B 0%, #8B0D13 100%)" }}
  >
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

export default PromoPanel;
