const Field = ({ type = "text", placeholder, value, onChange, icon, rightSlot }) => (
  <div
    className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-150"
    style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)" }}
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

export default Field;
