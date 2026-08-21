"use client";

import Link from "next/link";

/**
 * Existing member Concierge contact route used by Events footer
 * ("Masqué Concierge") and Contact Support ("Speak with Concierge").
 * Phone/email live on that page; do not invent additional contacts here.
 */
const CONCIERGE_CONTACT_HREF = "/contact-support";

export default function BlackSwanConcierge() {
  return (
    <section
      className="bst-section bst-concierge"
      aria-labelledby="bst-concierge-heading"
    >
      <h2 id="bst-concierge-heading" className="bst-subheading">
        CONCIERGE
      </h2>
      <p className="bst-body">
        Questions about Black Swan Theory, membership, or attending? The Masqué
        Concierge is here to help.
      </p>
      <div className="bst-invite__actions">
        <Link
          href={CONCIERGE_CONTACT_HREF}
          className="bst-cta bst-cta--secondary"
        >
          CONTACT CONCIERGE
        </Link>
      </div>
    </section>
  );
}
