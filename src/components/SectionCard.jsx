export default function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`section-card ${className}`}>
      <div className="section-card-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}