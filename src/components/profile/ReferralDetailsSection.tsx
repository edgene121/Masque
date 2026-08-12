"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import {
  buildReferralLink,
} from "@/lib/profile-memberstack";

interface ReferralDetailsSectionProps {
  referralCode: string;
}

type CopyTarget = "link" | "code" | null;

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function ReferralDetailsSection({
  referralCode,
}: ReferralDetailsSectionProps) {
  const code = referralCode.trim();
  const hasCode = Boolean(code);
  const referralLink = hasCode ? buildReferralLink(code) : "";
  const [copied, setCopied] = useState<CopyTarget>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    if (!hasCode || !referralLink) return;
    const ok = await copyText(referralLink);
    if (ok) setCopied("link");
  };

  const handleCopyCode = async () => {
    if (!hasCode) return;
    const ok = await copyText(code);
    if (ok) setCopied("code");
  };

  return (
    <section className="profile-section profile-referral" aria-label="Referral Details">
      <div className="profile-referral__field">
        <label className="profile-field__label" htmlFor="referral-link">
          Referral Link
        </label>
        <div className="profile-referral__row">
          <input
            id="referral-link"
            className="profile-field__input profile-referral__value"
            type="text"
            value={
              hasCode ? referralLink : "Referral Code Not Available"
            }
            readOnly
            tabIndex={0}
          />
          <button
            type="button"
            className="profile-referral__copy-btn"
            onClick={handleCopyLink}
            disabled={!hasCode}
          >
            <Copy className="profile-referral__copy-icon" strokeWidth={2} aria-hidden="true" />
            {copied === "link" ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      <div className="profile-referral__field">
        <label className="profile-field__label" htmlFor="referral-code">
          Referral Code
        </label>
        <div className="profile-referral__row">
          <input
            id="referral-code"
            className="profile-field__input profile-referral__value"
            type="text"
            value={hasCode ? code : "Referral Code Not Available"}
            readOnly
            tabIndex={0}
          />
          <button
            type="button"
            className="profile-referral__copy-btn"
            onClick={handleCopyCode}
            disabled={!hasCode}
          >
            <Copy className="profile-referral__copy-icon" strokeWidth={2} aria-hidden="true" />
            {copied === "code" ? "Copied!" : "Copy Code"}
          </button>
        </div>
      </div>
    </section>
  );
}
