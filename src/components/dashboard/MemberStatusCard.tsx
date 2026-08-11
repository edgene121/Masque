import { Check, Clock, X } from "lucide-react";
import type {
  MembershipStatusVariant,
  MemberStatusData,
} from "@/types/dashboard";
import ProfileCompletionCard from "./ProfileCompletionCard";

interface MemberStatusCardProps {
  status: MemberStatusData;
  /** Show compact profile-completion card under Member Status (incomplete only). */
  showProfileCompletion?: boolean;
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

export default function MemberStatusCard({
  status,
  showProfileCompletion = false,
}: MemberStatusCardProps) {
  const meta = VARIANT_META[status.variant];
  const Icon = meta.Icon;

  if (showProfileCompletion) {
    return (
      <section className="home-status-panel member-status-card has-profile-completion">
        <div className="home-status-left">
          <div className="member-status-card__status member-status-section">
            <div className="member-status-inner">
              <div
                className="member-status-card__check is-incomplete-home"
                aria-hidden="true"
              >
                <Check className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="member-status-card__label">Member Status</p>
                <p className="member-status-card__value is-incomplete-home">
                  Member Status
                </p>
              </div>
            </div>
          </div>

          <ProfileCompletionCard percent={50} href="/complete-profile" />
        </div>

        <div className="home-status-right">
          <h1 className="member-status-card__heading">{status.welcomeHeading}</h1>
          <div
            className="member-status-card__rule welcome-title-line"
            aria-hidden="true"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="member-status-card">
      <div className="member-status-card__left">
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
