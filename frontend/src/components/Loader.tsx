interface Props { label?: string; sublabel?: string; items: string[]; }
export default function Loader({ label, sublabel, items }: Props) {
  return (
    <div className="loader-block show">
      <div className="loader-ring" />
      <div className="loader-head">{label}</div>
      <div className="loader-sub">{sublabel}</div>
      <div className="loader-checklist">
        {items.map((text, i) => (
          <div key={i} className="lc-item active">
            <div className="lc-status" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
