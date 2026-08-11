"use client";

import { Check } from "lucide-react";

export const STEP4_GOV_ID_WARNING =
  "Please upload your ID document before submitting.";

export const STEP4_AGREEMENT_WARNING =
  "Please Check All Agreement checkboxes to accept Terms and Conditions.";

interface StepSubmitDetailsProps {
  warnings: string[];
  canSubmit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onPrevious: () => void;
  onSubmit: () => Promise<void>;
}

export default function StepSubmitDetails({
  warnings,
  canSubmit,
  isSubmitting,
  submitError,
  onPrevious,
  onSubmit,
}: StepSubmitDetailsProps) {
  const submitDisabled = !canSubmit || isSubmitting;

  return (
    <section className="onboarding-step-panel onboarding-step-panel--submit">
      <div className="onboarding-submit__icon-wrap" aria-hidden="true">
        <span className="onboarding-submit__deco onboarding-submit__deco--tl" />
        <span className="onboarding-submit__deco onboarding-submit__deco--tr" />
        <span className="onboarding-submit__deco onboarding-submit__deco--bl" />
        <span className="onboarding-submit__deco onboarding-submit__deco--br" />
        <div className="onboarding-submit__icon">
          <Check className="onboarding-submit__check" strokeWidth={3} />
        </div>
      </div>

      <h2 className="onboarding-submit__title">You&apos;re Almost Done</h2>
      <p className="onboarding-submit__copy">
        You&apos;re just one step away from completing your profile.
      </p>

      <div className="onboarding-submit__actions">
        <button
          type="button"
          className={[
            "onboarding-form__next",
            "onboarding-submit__submit",
            canSubmit
              ? "onboarding-submit__submit--enabled"
              : "onboarding-submit__submit--disabled",
          ].join(" ")}
          onClick={() => {
            if (!canSubmit || isSubmitting) return;
            void onSubmit();
          }}
          disabled={submitDisabled}
          aria-disabled={submitDisabled}
        >
          {isSubmitting ? "Submitting…" : "Submit"}
        </button>

        {warnings.length > 0 ? (
          <div className="onboarding-submit__warnings" role="alert">
            {warnings.map((warning) => (
              <p key={warning} className="onboarding-submit__warning">
                {warning}
              </p>
            ))}
          </div>
        ) : null}

        {submitError ? (
          <p className="onboarding-submit__warning" role="alert">
            {submitError}
          </p>
        ) : null}

        <button
          type="button"
          className="onboarding-form__prev"
          onClick={onPrevious}
          disabled={isSubmitting}
        >
          Previous step
        </button>
      </div>
    </section>
  );
}
