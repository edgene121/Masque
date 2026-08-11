"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";

export type AcknowledgmentKey =
  | "memberAgreement"
  | "frameworkAndConduct"
  | "abideConduct"
  | "privacyDiscretion"
  | "acceptRisks";

export type AcknowledgmentState = Record<AcknowledgmentKey, boolean>;

export const EMPTY_ACKNOWLEDGMENTS: AcknowledgmentState = {
  memberAgreement: false,
  frameworkAndConduct: false,
  abideConduct: false,
  privacyDiscretion: false,
  acceptRisks: false,
};

export function areAllAcknowledgmentsChecked(
  acks: AcknowledgmentState,
): boolean {
  return Object.values(acks).every(Boolean);
}

interface MemberAcknowledgmentProps {
  /** True when Memberstack `gov-id` has a non-empty value (member already loaded). */
  hasGovernmentId: boolean;
  acknowledgments: AcknowledgmentState;
  onToggle: (key: AcknowledgmentKey) => void;
  isSubmitting: boolean;
  error: string | null;
  onPrevious: () => void;
  onSubmit: () => Promise<void>;
}

function GoldDocLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="onboarding-ack__link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </Link>
  );
}

export default function MemberAcknowledgment({
  hasGovernmentId,
  acknowledgments: acks,
  onToggle,
  isSubmitting,
  error,
  onPrevious,
  onSubmit,
}: MemberAcknowledgmentProps) {
  const displayError = error;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Agreements] gov.ID present: ${hasGovernmentId ? "true" : "false"}`,
      );
    }
  }, [hasGovernmentId]);

  const handleNext = async () => {
    // No checkbox / gov.ID validation on Step 3 — final checks are on Step 4.
    await onSubmit();
  };

  return (
    <section className="onboarding-step-panel onboarding-step-panel--ack">
      <h2 className="onboarding-step-panel__title onboarding-step-panel__title--left onboarding-ack__title">
        Member Acknowledgment
      </h2>
      <p className="onboarding-ack__subtext">
        By checking the acknowledgment box below, I confirm that:
      </p>

      <ul className="onboarding-ack__list">
        <li className="onboarding-ack__item">
          <label className="onboarding-ack__label">
            <input
              type="checkbox"
              className="onboarding-ack__checkbox"
              checked={acks.memberAgreement}
              onChange={() => onToggle("memberAgreement")}
              disabled={isSubmitting}
            />
            <span className="onboarding-ack__text">
              I have read and understood the{" "}
              <GoldDocLink href="/code-of-conduct">
                Masqué Member Agreement
              </GoldDocLink>
            </span>
          </label>
        </li>

        <li className="onboarding-ack__item">
          <label className="onboarding-ack__label">
            <input
              type="checkbox"
              className="onboarding-ack__checkbox"
              checked={acks.frameworkAndConduct}
              onChange={() => onToggle("frameworkAndConduct")}
              disabled={isSubmitting}
            />
            <span className="onboarding-ack__text">
              I acknowledge that I have been provided access to the{" "}
              <GoldDocLink href="/cultural-framework">
                Masqué Cultural Framework
              </GoldDocLink>{" "}
              and{" "}
              <GoldDocLink href="/code-of-conduct">
                Member Code of Conduct
              </GoldDocLink>{" "}
              and i have read and understood both documents.
            </span>
          </label>
        </li>

        <li className="onboarding-ack__item">
          <label className="onboarding-ack__label">
            <input
              type="checkbox"
              className="onboarding-ack__checkbox"
              checked={acks.abideConduct}
              onChange={() => onToggle("abideConduct")}
              disabled={isSubmitting}
            />
            <span className="onboarding-ack__text">
              I agree to abide by the{" "}
              <GoldDocLink href="/code-of-conduct">
                Masqué Member Code of Conduct
              </GoldDocLink>
              .
            </span>
          </label>
        </li>

        <li className="onboarding-ack__item">
          <label className="onboarding-ack__label">
            <input
              type="checkbox"
              className="onboarding-ack__checkbox"
              checked={acks.privacyDiscretion}
              onChange={() => onToggle("privacyDiscretion")}
              disabled={isSubmitting}
            />
            <span className="onboarding-ack__text">
              I understand the verification, privacy, confidentiality, and
              discretion requirements of the community.
            </span>
          </label>
        </li>

        <li className="onboarding-ack__item">
          <label className="onboarding-ack__label">
            <input
              type="checkbox"
              className="onboarding-ack__checkbox"
              checked={acks.acceptRisks}
              onChange={() => onToggle("acceptRisks")}
              disabled={isSubmitting}
            />
            <span className="onboarding-ack__text">
              I voluntarily accept the responsibilities and risks associated
              with participation in Masqué events and community activities.
            </span>
          </label>
        </li>
      </ul>

      {!hasGovernmentId ? (
        <p className="onboarding-ack__id-warning" role="status">
          Please upload your ID document before submitting.
        </p>
      ) : null}

      {displayError ? (
        <p className="onboarding-form__error" role="alert">
          {displayError}
        </p>
      ) : null}

      <div className="onboarding-verification__actions">
        <button
          type="button"
          className="onboarding-form__prev"
          onClick={onPrevious}
          disabled={isSubmitting}
        >
          Previous step
        </button>
        <button
          type="button"
          className="onboarding-form__next"
          onClick={() => void handleNext()}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Next step"}
        </button>
      </div>
    </section>
  );
}
