import type { LucideIcon } from "lucide-react";

interface ContactInfoCardProps {
  icon: LucideIcon;
  title: string;
  detail: string;
  href?: string;
}

export default function ContactInfoCard({
  icon: Icon,
  title,
  detail,
  href,
}: ContactInfoCardProps) {
  return (
    <article className="contact-info-card">
      <div className="contact-info-card__icon" aria-hidden="true">
        <Icon strokeWidth={1.5} />
      </div>
      <div className="contact-info-card__copy">
        <h3 className="contact-info-card__title">{title}</h3>
        {href ? (
          <a href={href} className="contact-info-card__detail">
            {detail}
          </a>
        ) : (
          <p className="contact-info-card__detail">{detail}</p>
        )}
      </div>
    </article>
  );
}
