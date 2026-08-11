import Link from "next/link";
import type { CSSProperties } from "react";

interface ProfileCompletionCardProps {
  percent?: number;
  href?: string;
}

export default function ProfileCompletionCard({
  percent = 50,
  href = "/complete-profile",
}: ProfileCompletionCardProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="profile-completion-card">
      <span className="profile-completion-card__accent" aria-hidden="true" />

      <div className="profile-completion-card__top">
        <div className="profile-completion-card__progress" aria-hidden="true">
          <div
            className="profile-completion-card__ring"
            style={
              {
                "--profile-completion-percent": String(clamped),
              } as CSSProperties
            }
          >
            <span className="profile-completion-card__percent">{clamped}%</span>
          </div>
        </div>

        <div className="profile-completion-card__copy">
          <h2 className="profile-completion-card__title">Profile Complete</h2>
          <p className="profile-completion-card__text">
            Complete Your Profile to help us to know you better within the room.
          </p>
        </div>
      </div>

      <Link href={href} className="profile-completion-card__btn">
        Complete Profile →
      </Link>
    </div>
  );
}
