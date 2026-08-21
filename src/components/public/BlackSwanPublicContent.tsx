"use client";

import Link from "next/link";
import {
  trackEvent,
  type BlackSwanAnalyticsProps,
} from "@/lib/analytics";

const MEMBER_ACCESS_HREF = "/login?next=/events/black-swan-theory";
const REQUEST_ACCESS_HREF = "/request-access";

interface BlackSwanPublicContentProps {
  analyticsContext: BlackSwanAnalyticsProps;
}

export default function BlackSwanPublicContent({
  analyticsContext,
}: BlackSwanPublicContentProps) {
  const context = analyticsContext;

  return (
    <>
      <section
        className="bst-section bst-section--intro bst-opening"
        aria-labelledby="bst-opening-heading"
      >
        <h1 id="bst-opening-heading" className="bst-sr-only">
          Black Swan Theory
        </h1>
        <p className="bst-lede">Some nights unfold exactly as expected.</p>
        <p className="bst-lede">This one isn&apos;t designed to.</p>
        <p className="bst-body bst-opening__body">
          Masqué : Atelier returns September 26, unfolding across a sprawling
          multi-level environment of music, performance, atmosphere, and
          late-night movement — rooftop spaces, hidden rooms, shifting dance
          floors, live acts, and spaces designed for connection, curiosity, and
          discovery.
        </p>
      </section>

      <section
        className="bst-section bst-public-access"
        aria-label="Black Swan Theory access"
      >
        <div className="bst-invite__actions">
          <Link
            href={MEMBER_ACCESS_HREF}
            className="bst-cta bst-cta--primary"
            aria-label="Members — access event"
            onClick={() =>
              trackEvent("black_swan_member_access_clicked", context)
            }
          >
            MEMBERS — ACCESS EVENT
          </Link>
          <Link
            href={REQUEST_ACCESS_HREF}
            className="bst-cta bst-cta--secondary"
            aria-label="Request membership"
            onClick={() =>
              trackEvent("black_swan_request_membership_clicked", context)
            }
          >
            REQUEST MEMBERSHIP
          </Link>
        </div>
      </section>

      <section className="bst-section" aria-labelledby="bst-theory-heading">
        <h2 id="bst-theory-heading" className="bst-subheading">
          BLACK SWAN THEORY
        </h2>
        <div className="bst-prose">
          <p className="bst-body">
            Inspired by the idea that the events which affect us most are often
            the ones we never see coming, Black Swan Theory builds
            unpredictability into the architecture of the night.
          </p>
          <p className="bst-body">Across the space, environments shift.</p>
          <p className="bst-body">
            Performances emerge without announcement.
          </p>
          <p className="bst-body">Energy moves from one room to another.</p>
          <p className="bst-body">
            What begins as one kind of evening may become something entirely
            different.
          </p>
          <p className="bst-emphasis">
            Not everything will be disclosed in advance.
          </p>
          <p className="bst-emphasis bst-emphasis--point">That&apos;s the point.</p>
        </div>
      </section>

      <section className="bst-section" aria-labelledby="bst-music-heading">
        <h2 id="bst-music-heading" className="bst-subheading">
          MUSIC & EXPERIENCE
        </h2>
        <div className="bst-prose">
          <p className="bst-body">
            Multiple sound environments operate simultaneously throughout the
            night — from hypnotic house and darker late-night dance floors to
            more intimate spaces built for conversation, connection, play and
            discovery.
          </p>
          <p className="bst-body">
            Music. Performance. Unexpected interventions.
          </p>
          <p className="bst-body">There is no prescribed way through the night.</p>
          <p className="bst-emphasis">Follow what draws you.</p>
        </div>
        {/* Official DJs, performers, experiences, and announcements can be added here later. */}
        <div className="bst-lineup" />
      </section>

      <section className="bst-section" aria-labelledby="bst-dress-heading">
        <h2 id="bst-dress-heading" className="bst-subheading">
          DRESS
        </h2>
        <div className="bst-prose">
          <p className="bst-body">
            Interpret Black Swan Theory rather than dressing as a black swan.
          </p>
          <p className="bst-body">
            Elevated lingerie and bodywear, sculptural silhouettes, sharp
            tailoring, leather, lace, sheer layers, dramatic proportion, masks
            and unexpected details are natural starting points — but not
            requirements.
          </p>
          <p className="bst-body">
            Color is yours to interpret. Wear what the idea inspires.
          </p>
          <p className="bst-body">
            For women: lingerie-forward, body-conscious and provocative rather
            than conventional cocktail dresses or gowns.
          </p>
          <p className="bst-body">
            For men: seductive formalwear, sharp tailoring, avant-garde
            eveningwear, leather, fetish-inspired elements and other elevated
            interpretations.
          </p>
          <p className="bst-body">
            Think elegant, intentional, provocative and slightly improbable.
          </p>
          <p className="bst-body">
            Avoid novelty and costume-shop interpretations.
          </p>
          <p className="bst-emphasis bst-emphasis--condition">
            The dress standard is a condition of entry. Guests who do not meet
            it will be denied admission.
          </p>
        </div>

        <aside
          className="bst-mens-dress"
          aria-labelledby="bst-mens-dress-heading"
        >
          <h3 id="bst-mens-dress-heading" className="bst-mens-dress__heading">
            MEN&apos;S DRESS CLARIFICATION
          </h3>
          <p className="bst-body">
            For men: a standard button-up shirt, polo, jeans, or conventional
            night-out attire is not sufficient. The dress standard is mandatory,
            and guests who arrive dressed this way{" "}
            <span className="bst-denied">WILL BE DENIED ENTRY</span>.
          </p>
          <p className="bst-body">
            The purpose is not to prohibit a button-up shirt from ever appearing
            as one element of a sophisticated look. It is to make unmistakably
            clear that an ordinary shirt-and-jeans / standard bar-going outfit
            does not satisfy the Masqué dress standard.
          </p>
        </aside>
      </section>

      <section className="bst-section" aria-labelledby="bst-private-heading">
        <h2 id="bst-private-heading" className="bst-subheading">
          PRIVATE BY DESIGN
        </h2>
        <div className="bst-prose">
          <p className="bst-body">
            Masqué : Atelier is a private, curated members event.
          </p>
          <p className="bst-body">
            Attendance is limited to approved Masqué members and eligible
            guests.
          </p>
          <p className="bst-body">
            Event details and location information are shared privately with
            confirmed attendees.
          </p>
        </div>
      </section>

      <section className="bst-section bst-convert" aria-label="Become part of the night">
        <p className="bst-convert__date">SEPTEMBER 26 · WASHINGTON, DC</p>
        <div className="bst-convert__grid">
          <div className="bst-convert__path">
            <p className="bst-convert__kicker">ALREADY A MEMBER?</p>
            <Link
              href={MEMBER_ACCESS_HREF}
              className="bst-cta bst-cta--primary"
              aria-label="Access Black Swan Theory"
              onClick={() =>
                trackEvent("black_swan_member_access_clicked", context)
              }
            >
              ACCESS BLACK SWAN THEORY →
            </Link>
          </div>
          <div className="bst-convert__path">
            <p className="bst-convert__kicker">NOT YET A MEMBER?</p>
            <Link
              href={REQUEST_ACCESS_HREF}
              className="bst-cta bst-cta--secondary"
              aria-label="Request membership"
              onClick={() =>
                trackEvent("black_swan_request_membership_clicked", context)
              }
            >
              REQUEST MEMBERSHIP →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
