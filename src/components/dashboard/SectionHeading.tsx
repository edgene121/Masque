interface SectionHeadingProps {
  children: string;
  variant?: "default" | "featured-event";
  badge?: string;
}

export default function SectionHeading({
  children,
  variant = "default",
  badge,
}: SectionHeadingProps) {
  return (
    <div
      className={`dashboard-section-heading${
        variant === "featured-event" ? " dashboard-section-heading--featured" : ""
      }`}
    >
      <span className="dashboard-section-heading__line" aria-hidden="true" />
      <span className="dashboard-section-heading__text">{children}</span>
      {badge ? <span className="dashboard-section-heading__badge">{badge}</span> : null}
    </div>
  );
}
