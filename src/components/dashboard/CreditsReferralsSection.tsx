"use client";

import ReferralDetailsSection from "@/components/profile/ReferralDetailsSection";
import SectionHeading from "@/components/dashboard/SectionHeading";
import type { PortalCreditsData } from "@/types/credits";

interface CreditsReferralsSectionProps {
  data: PortalCreditsData;
  loading?: boolean;
}

function formatStat(value: number | null): string {
  if (value == null) return "—";
  return String(value);
}

function formatCreditsDelta(value: number | null): string {
  if (value == null) return "—";
  if (value > 0) return `+${value}`;
  return String(value);
}

export default function CreditsReferralsSection({
  data,
  loading = false,
}: CreditsReferralsSectionProps) {
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

      {loading ? (
        <p className="credits-referrals__empty">Loading credits…</p>
      ) : (
        <div className="credits-referrals__stats">
          {stats.map((stat) => (
            <article key={stat.id} className="credits-stat-card">
              <p className="credits-stat-card__label">{stat.label}</p>
              <p className="credits-stat-card__value">{formatStat(stat.value)}</p>
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

      <SectionHeading>Invited Friends</SectionHeading>
      <section className="profile-section profile-section--card credits-table-card">
        {loading ? (
          <p className="credits-referrals__empty">Loading…</p>
        ) : data.invitedFriends.length === 0 ? (
          <p className="credits-referrals__empty">
            You haven&apos;t invited anyone yet.
          </p>
        ) : (
          <div className="credits-table-wrap">
            <table className="credits-table">
              <thead>
                <tr>
                  <th>Friend</th>
                  <th>Status</th>
                  <th>Credit Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invitedFriends.map((friend) => (
                  <tr key={friend.id}>
                    <td>{friend.name}</td>
                    <td>{friend.status || "—"}</td>
                    <td>{friend.creditStatus || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SectionHeading>Invited By</SectionHeading>
      <section className="profile-section profile-section--card credits-invited-by">
        <p className="credits-invited-by__name">
          {loading ? "Loading…" : data.invitedBy.trim() || "No Referrer"}
        </p>
      </section>

      <SectionHeading>Credit History</SectionHeading>
      <section className="profile-section profile-section--card credits-table-card">
        {loading ? (
          <p className="credits-referrals__empty">Loading…</p>
        ) : data.creditHistory.length === 0 ? (
          <p className="credits-referrals__empty">No credit activity yet.</p>
        ) : (
          <div className="credits-table-wrap">
            <table className="credits-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity</th>
                  <th>Details</th>
                  <th className="credits-table__num">Credits</th>
                </tr>
              </thead>
              <tbody>
                {data.creditHistory.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date || "—"}</td>
                    <td>{row.activity || "—"}</td>
                    <td>{row.details || "—"}</td>
                    <td className="credits-table__num">
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
