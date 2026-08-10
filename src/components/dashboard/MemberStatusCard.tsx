import { Check, Clock, X } from "lucide-react";
import type {
  MembershipStatusVariant,
  MemberStatusData,
} from "@/types/dashboard";

interface MemberStatusCardProps {
  status: MemberStatusData;
}

const VARIANT_META: Record<
  MembershipStatusVariant,
  {
    className: string;
    Icon: typeof Check;
  }
> = {
  active: { className: "is-active", Icon: Check },
  pending: { className: "is-pending", Icon: Clock },
  inactive: { className: "is-inactive", Icon: X },
};

export default function MemberStatusCard({ status }: MemberStatusCardProps) {
  const meta = VARIANT_META[status.variant];
  const Icon = meta.Icon;

  return (
    <section className="member-status-card">
      <div className="member-status-card__status member-status-section">
        <div className="member-status-inner">
          <div
            className={`member-status-card__check ${meta.className}`}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="member-status-card__label">Member Status</p>
            <p className={`member-status-card__value ${meta.className}`}>
              {status.label}
            </p>
          </div>
        </div>
      </div>

      <div className="member-status-card__welcome welcome-content">
        <h1 className="member-status-card__heading">{status.welcomeHeading}</h1>
        <div
          className="member-status-card__rule welcome-title-line"
          aria-hidden="true"
        />
        <p className="member-status-card__copy welcome-description">
          {status.welcomeText}
        </p>
      </div>
    </section>
  );
}
