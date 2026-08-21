import { Check, Clock } from "lucide-react";
import type { MemberStatusData } from "@/types/dashboard";
import ProfileCompletionCard from "./ProfileCompletionCard";

interface MemberStatusCardProps {
  status: MemberStatusData;
  /** Show compact profile-completion card under Member Status (incomplete only). */
  showProfileCompletion?: boolean;
  /** Airtable People "Verification Status". Null when missing. */
  verificationStatus?: string | null;
  /** True until the People Verification Status request finishes. */
  verificationStatusLoading?: boolean;
}

function verificationValueClass(
  status: string | null,
  loading: boolean,
): string {
  if (loading) return "is-loading";
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "verified") return "is-active";
  if (normalized === "not verified") return "is-incomplete-home";
  return "is-incomplete-home";
}

function verificationIcon(status: string | null, loading: boolean) {
  if (loading) return Clock;
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "verified") return Check;
  return Clock;
}

function membershipStatusLabel(status: string | null, loading: boolean): string {
  if (loading) return "…";
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "verified") return "Membership Active";
  if (normalized === "not verified") return "Membership Inactive";
  return "—";
}

export default function MemberStatusCard({
  status,
  showProfileCompletion = false,
  verificationStatus = null,
  verificationStatusLoading = false,
}: MemberStatusCardProps) {
  const displayStatus = membershipStatusLabel(
    verificationStatus,
    verificationStatusLoading,
  );
  const valueClass = verificationValueClass(
    verificationStatus,
    verificationStatusLoading,
  );
  const StatusIcon = verificationIcon(
    verificationStatus,
    verificationStatusLoading,
  );

  const statusBlock = (
    <div className="member-status-card__status member-status-section">
      <div className="member-status-inner">
        <div
          className={`member-status-card__check ${valueClass || "is-incomplete-home"}`}
          aria-hidden="true"
        >
          <StatusIcon className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <div>
          <p className="member-status-card__label">Member Status</p>
          <p
            className={`member-status-card__value ${valueClass}`}
            aria-busy={verificationStatusLoading}
          >
            {displayStatus}
          </p>
        </div>
      </div>
    </div>
  );

  if (showProfileCompletion) {
    return (
      <section className="home-status-panel member-status-card has-profile-completion">
        <div className="home-status-left">
          {statusBlock}
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
      <div className="member-status-card__left">{statusBlock}</div>

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
