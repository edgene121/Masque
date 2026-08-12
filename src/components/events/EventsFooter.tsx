"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

/** Policy labels shown for visual parity; no project routes/URLs exist yet. */
const POLICY_LABELS = [
  "Terms & Conditions",
  "Privacy Policy",
  "Refund Policy",
] as const;

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function EventsFooter() {
  return (
    <footer className="events-footer" aria-label="Masqué">
      <div className="events-footer__inner">
        <div className="events-footer__main">
          <div className="events-footer__left">
            <p className="events-footer__wordmark">MASQUÉ</p>
          </div>

          <div className="events-footer__divider" aria-hidden="true" />

          <div className="events-footer__right">
            <nav className="events-footer__links" aria-label="Footer">
              <Link href="/contact-support" className="events-footer__link">
                Masqué Concierge
              </Link>
              {POLICY_LABELS.map((label) => (
                <span key={label} className="events-footer__link is-static">
                  {label}
                </span>
              ))}
            </nav>

            <div className="events-footer__social">
              <span
                className="events-footer__icon is-static"
                aria-label="Instagram"
                title="Instagram"
              >
                <InstagramIcon />
              </span>
              <a
                className="events-footer__icon"
                href="mailto:concierge@masque.co"
                aria-label="Email Concierge"
              >
                <Mail strokeWidth={1.5} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="events-footer__bottom">
          <p className="events-footer__tagline">
            Discretion is part of the experience.
          </p>
          <p className="events-footer__member-line">
            Already a member? Sign in to the{" "}
            <Link href="/login" className="events-footer__member-link">
              Member Portal
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
