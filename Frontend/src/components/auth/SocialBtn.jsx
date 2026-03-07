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

export default SocialBtn;
