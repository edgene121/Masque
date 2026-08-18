"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ReferralDetailsSection from "@/components/profile/ReferralDetailsSection";
import SectionHeading from "@/components/dashboard/SectionHeading";
import type { PortalCreditsData } from "@/types/credits";

interface CreditsReferralsSectionProps {
  data: PortalCreditsData;
  statsLoading?: boolean;
}

function formatSummaryStat(value: number | null): string {
  if (value == null) return "0";
  return String(value);
}

function formatCreditsDelta(value: number | null): string {
  if (value == null) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

function statusBadgeClass(status: string): string {
  const key = status.trim().toLowerCase();
  if (key === "qualified" || key === "approved") {
    return "credits-status-badge credits-status-badge--qualified";
  }
  if (key === "pending") {
    return "credits-status-badge credits-status-badge--pending";
  }
  return "credits-status-badge";
}

function historyActivityLabel(row: {
  activity: string;
  details: string;
}): string {
  return [row.activity.trim(), row.details.trim()].filter(Boolean).join(" — ");
}

export default function CreditsReferralsSection({
  data,
  statsLoading = false,
}: CreditsReferralsSectionProps) {
  const [friendsOpen, setFriendsOpen] = useState(false);
  const invitedCount = data.invitedFriends.length;
  const stats = [
    { id: "available", label: "Available Credits", value: data.creditsAvailable },
    {
      id: "qualified",
      label: "Qualified Referrals",
      value: data.qualifiedReferrals,
    },
    { id: "redeemed", label: "Credits Redeemed", value: data.creditsRedeemed },
  ];

  return (
    <div className="credits-referrals">
      <SectionHeading>Credits & Referrals</SectionHeading>

      {statsLoading ? (
        <p className="credits-referrals__empty">Loading credits…</p>
      ) : (
        <div className="credits-referrals__stats">
          {stats.map((stat) => (
            <article key={stat.id} className="credits-stat-card">
              <p className="credits-stat-card__label">{stat.label}</p>
              <p className="credits-stat-card__value">
                {formatSummaryStat(stat.value)}
              </p>
              <p className="credits-stat-card__caption">{stat.label}</p>
            </article>
          ))}
        </div>
      )}

      <SectionHeading>Invite & Earn</SectionHeading>
      <section className="profile-section profile-section--card credits-invite-card">
        <p className="credits-invite-card__copy">
          Invite friends to Masqué and earn credits when they become qualified
          members.
        </p>
        <ReferralDetailsSection referralCode={data.referralCode} />
      </section>

      <section className="profile-section profile-section--card credits-friends-card">
        <button
          type="button"
          className="credits-friends__toggle"
          aria-expanded={friendsOpen}
          aria-controls="credits-invited-friends-panel"
          onClick={() => setFriendsOpen((open) => !open)}
        >
          <span className="credits-friends__toggle-copy">
            <span className="credits-friends__title">Invited Friends</span>
            {!statsLoading && invitedCount > 0 ? (
              <span className="credits-friends__summary">
                {invitedCount}{" "}
                {invitedCount === 1 ? "Invited Friend" : "Invited Friends"}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`credits-friends__chevron${friendsOpen ? " is-open" : ""}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        <div
          id="credits-invited-friends-panel"
          className={`credits-friends__panel${friendsOpen ? " is-open" : ""}`}
        >
          <div className="credits-friends__panel-inner">
            {statsLoading ? (
              <p className="credits-referrals__empty">Loading…</p>
            ) : data.invitedFriends.length === 0 ? (
              <p className="credits-referrals__empty">
                You haven&apos;t invited anyone yet.
              </p>
            ) : (
              <>
                <div className="credits-table-wrap credits-friends__table">
                  <table className="credits-table">
                    <thead>
                      <tr>
                        <th>Friend</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invitedFriends.map((friend) => (
                        <tr key={friend.id}>
                          <td>{friend.name}</td>
                          <td>
                            {friend.status ? (
                              <span className={statusBadgeClass(friend.status)}>
                                {friend.status}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{friend.applicationDate || "—"}</td>
                          <td>{friend.creditStatus || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="credits-friends__cards">
                  {data.invitedFriends.map((friend) => (
                    <li key={friend.id} className="credits-friend-card">
                      <p className="credits-friend-card__name">{friend.name}</p>
                      <p className="credits-friend-card__meta">
                        {friend.status ? (
                          <span className={statusBadgeClass(friend.status)}>
                            {friend.status}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                        <span className="credits-friend-card__dot" aria-hidden="true">
                          •
                        </span>
                        <span>{friend.applicationDate || "—"}</span>
                      </p>
                      {friend.creditStatus ? (
                        <p className="credits-friend-card__credit">
                          {friend.creditStatus}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      <SectionHeading>Invited By</SectionHeading>
      <section className="profile-section profile-section--card credits-invited-by">
        {statsLoading ? (
          <p className="credits-referrals__empty">Loading…</p>
        ) : data.invitedBy.trim() ? (
          <p className="credits-invited-by__name">{data.invitedBy.trim()}</p>
        ) : (
          <p className="credits-invited-by__name">No Referrer</p>
        )}
      </section>

      <SectionHeading>Credit History</SectionHeading>
      <section className="profile-section profile-section--card credits-table-card">
        {data.creditHistory.length === 0 ? (
          <p className="credits-referrals__empty">No credit activity yet.</p>
        ) : (
          <div className="credits-table-wrap">
            <table className="credits-table credits-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th className="credits-table__num">Credits</th>
                </tr>
              </thead>
              <tbody>
                {data.creditHistory.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date || "—"}</td>
                    <td>{historyActivityLabel(row) || "—"}</td>
                    <td
                      className={`credits-table__num${
                        (row.credits ?? 0) < 0
                          ? " credits-table__num--negative"
                          : (row.credits ?? 0) > 0
                            ? " credits-table__num--positive"
                            : ""
                      }`}
                    >
                      {formatCreditsDelta(row.credits)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
