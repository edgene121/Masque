"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatErrorForUser, type Member } from "@memberstack/dom";
import {
  AGREEMENT_SIGNED_COMPLETED_VALUE,
  AGREEMENT_SIGNED_FIELD_KEY,
  customFieldsForOnboardingStep1,
  emptyProfileForm,
  isAgreementSigned,
  mapMemberToHeaderUser,
  mapMemberToProfileForm,
  ONBOARDING_STATUS_FIELD_KEY,
  PLACEHOLDER_HEADER_USER,
} from "@/lib/profile-memberstack";
import { getMemberstack } from "@/lib/memberstack";
import type { MemberstackUser } from "@/types/dashboard";
import type { ProfileFormData } from "@/types/profile";
import CompleteProfileHeader from "./CompleteProfileHeader";
import OnboardingStepper from "./OnboardingStepper";
import StepYourDetails from "./steps/StepYourDetails";
import StepVerification from "./steps/StepVerification";
import MemberAcknowledgment, {
  areAllAcknowledgmentsChecked,
  EMPTY_ACKNOWLEDGMENTS,
  type AcknowledgmentKey,
  type AcknowledgmentState,
} from "./steps/MemberAcknowledgment";
import StepSubmitDetails, {
  STEP4_AGREEMENT_WARNING,
  STEP4_GOV_ID_WARNING,
} from "./steps/StepSubmitDetails";

const ONBOARDING_SUBMITTED_VALUE = "Submitted";

function validateStep1(form: ProfileFormData): string | null {
  const required: Array<[keyof ProfileFormData, string]> = [
    ["firstName", "First Name"],
    ["lastName", "Last Name"],
    ["address", "Address"],
    ["state", "State"],
    ["zipCode", "Zip Code"],
    ["displayName", "Display Name"],
    ["profileName", "Masqué Profile Name"],
    ["phone", "Phone"],
    ["dateOfBirth", "Birthdate"],
    ["gender", "Gender"],
    ["instagram", "Instagram Name"],
  ];

  for (const [key, label] of required) {
    if (!String(form[key] ?? "").trim()) {
      return `${label} is required.`;
    }
  }

  if (!form.email.trim()) {
    return "Email Address is required.";
  }

  const instagram = form.instagram.trim();
  if (instagram.includes("@") || /https?:\/\//i.test(instagram)) {
    return "Enter your Instagram username only (no @ or URL).";
  }

  return null;
}

function buildStep4Warnings(options: {
  hasGovernmentId: boolean;
  allAgreementsAccepted: boolean;
}): string[] {
  const { hasGovernmentId, allAgreementsAccepted } = options;
  const warnings: string[] = [];

  if (!hasGovernmentId) {
    warnings.push(STEP4_GOV_ID_WARNING);
  }

  if (!allAgreementsAccepted) {
    warnings.push(STEP4_AGREEMENT_WARNING);
  }

  return warnings;
}

async function fetchGovernmentIdStatus(email: string): Promise<boolean> {
  const trimmed = email.trim();
  if (!trimmed) return false;

  const response = await fetch(
    `/api/onboarding/gov-id-status?email=${encodeURIComponent(trimmed)}`,
  );
  const payload = (await response.json()) as {
    hasGovernmentId?: boolean;
    error?: string;
  };

  if (!response.ok) {
    return false;
  }

  return Boolean(payload.hasGovernmentId);
}

async function uploadGovIdFile(file: File, email: string): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  body.append("email", email.trim());

  const response = await fetch("/api/onboarding/gov-id-upload", {
    method: "POST",
    body,
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    uploaded?: boolean;
    error?: string;
  };

  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.error || "Unable to upload your ID document. Please try again.",
    );
  }
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<ProfileFormData>(emptyProfileForm);
  const [headerUser, setHeaderUser] =
    useState<MemberstackUser>(PLACEHOLDER_HEADER_USER);
  const [acknowledgments, setAcknowledgments] = useState<AcknowledgmentState>(
    EMPTY_ACKNOWLEDGMENTS,
  );
  /** From Airtable Applications "Government ID" attachment — not Memberstack. */
  const [hasExistingGovId, setHasExistingGovId] = useState(false);
  /** Session + Memberstack: once true, stays true for this wizard run. */
  const [agreementsAccepted, setAgreementsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSavingStep2, setIsSavingStep2] = useState(false);
  const [isSavingStep3, setIsSavingStep3] = useState(false);
  const [isSavingStep4, setIsSavingStep4] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [step4Warnings, setStep4Warnings] = useState<string[]>([]);
  const [step4Error, setStep4Error] = useState<string | null>(null);

  const applyMember = (member: Member) => {
    setForm(mapMemberToProfileForm(member));
    setHeaderUser(mapMemberToHeaderUser(member));
    // Never clear a successful in-session acceptance if Memberstack lags.
    setAgreementsAccepted((prev) => prev || isAgreementSigned(member));
  };

  const refreshGovernmentIdFromAirtable = useCallback(async (email: string) => {
    try {
      const hasId = await fetchGovernmentIdStatus(email);
      setHasExistingGovId(hasId);
      return hasId;
    } catch {
      setHasExistingGovId(false);
      return false;
    }
  }, []);

  const loadMember = useCallback(async () => {
    setIsLoading(true);
    setHeaderUser(PLACEHOLDER_HEADER_USER);
    setStep1Error(null);
    setStep2Error(null);
    setStep3Error(null);
    setStep4Error(null);

    try {
      const memberstack = getMemberstack();
      const { data: member } = await memberstack.getCurrentMember();

      if (!member) {
        setForm(emptyProfileForm);
        setHeaderUser(PLACEHOLDER_HEADER_USER);
        setHasExistingGovId(false);
        return;
      }

      applyMember(member);
      const mapped = mapMemberToProfileForm(member);
      await refreshGovernmentIdFromAirtable(mapped.email);

      if (isAgreementSigned(member)) {
        setAcknowledgments((prev) =>
          areAllAcknowledgmentsChecked(prev)
            ? prev
            : {
                memberAgreement: true,
                frameworkAndConduct: true,
                abideConduct: true,
                privacyDiscretion: true,
                acceptRisks: true,
              },
        );
      }
    } catch (err) {
      setForm(emptyProfileForm);
      setHeaderUser(PLACEHOLDER_HEADER_USER);
      setHasExistingGovId(false);
      setStep1Error(formatErrorForUser(err) || "Unable to load your profile.");
    } finally {
      setIsLoading(false);
    }
  }, [refreshGovernmentIdFromAirtable]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  useEffect(() => {
    if (currentStep !== 4 || isLoading) return;

    void (async () => {
      const allChecked = areAllAcknowledgmentsChecked(acknowledgments);
      const email = form.email.trim();
      const hasId = email
        ? await refreshGovernmentIdFromAirtable(email)
        : false;

      let agreementsOk = allChecked || agreementsAccepted;
      try {
        const { data: member } = await getMemberstack().getCurrentMember();
        if (member) {
          agreementsOk = agreementsOk || isAgreementSigned(member);
          setAgreementsAccepted((prev) => prev || agreementsOk);
        }
      } catch {
        // Keep session agreement state.
      }

      setStep4Warnings(
        buildStep4Warnings({
          hasGovernmentId: hasId,
          allAgreementsAccepted: agreementsOk,
        }),
      );
    })();
    // Intentionally omit hasExistingGovId — refreshed inside this effect.
  }, [
    currentStep,
    isLoading,
    agreementsAccepted,
    acknowledgments,
    form.email,
    refreshGovernmentIdFromAirtable,
  ]);

  const handleFieldChange = (key: keyof ProfileFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAckToggle = (key: AcknowledgmentKey) => {
    setStep3Error(null);
    setAcknowledgments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStep1Submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSavingStep1) return;

    const validationError = validateStep1(form);
    if (validationError) {
      setStep1Error(validationError);
      return;
    }

    setIsSavingStep1(true);
    setStep1Error(null);

    try {
      const memberstack = getMemberstack();
      const { data: updated } = await memberstack.updateMember({
        customFields: customFieldsForOnboardingStep1(form),
      });

      if (updated) {
        applyMember(updated);
      } else {
        const { data: member } = await memberstack.getCurrentMember();
        if (member) applyMember(member);
      }

      await refreshGovernmentIdFromAirtable(form.email);
      setStep2Error(null);
      setCurrentStep(2);
    } catch (err) {
      setStep1Error(
        formatErrorForUser(err) ||
          "Unable to save your details. Please try again.",
      );
    } finally {
      setIsSavingStep1(false);
    }
  };

  const handleStep2Submit = async (file: File | null) => {
    if (isSavingStep2) return;

    setIsSavingStep2(true);
    setStep2Error(null);

    try {
      if (file) {
        const email = form.email.trim();
        if (!email) {
          throw new Error(
            "Email Address is required before uploading your government ID.",
          );
        }

        // Saves to Airtable only — does not write Memberstack gov-id.
        await uploadGovIdFile(file, email);
        setHasExistingGovId(true);
      }

      setStep3Error(null);
      setCurrentStep(3);
    } catch (err) {
      setStep2Error(
        err instanceof Error
          ? err.message
          : formatErrorForUser(err) ||
              "Unable to save your government ID. Please try again.",
      );
    } finally {
      setIsSavingStep2(false);
    }
  };

  const handleStep3Submit = async () => {
    if (isSavingStep3) return;

    setIsSavingStep3(true);
    setStep3Error(null);

    const allAccepted = areAllAcknowledgmentsChecked(acknowledgments);
    // Only mark Agreement Signed completed when all 5 boxes are checked.
    setAgreementsAccepted(allAccepted);

    try {
      if (allAccepted) {
        try {
          const memberstack = getMemberstack();
          const { data: updated } = await memberstack.updateMember({
            customFields: {
              [AGREEMENT_SIGNED_FIELD_KEY]: AGREEMENT_SIGNED_COMPLETED_VALUE,
            },
          });

          if (updated) {
            applyMember(updated);
          } else {
            const { data: member } = await memberstack.getCurrentMember();
            if (member) applyMember(member);
          }
        } catch (saveErr) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[Agreements] Memberstack agreement-signed save failed; continuing to Step 4.",
              formatErrorForUser(saveErr),
            );
          }
        }
      }

      // Always allow Step 3 → Step 4; final validation is on Step 4.
      setStep4Error(null);
      setCurrentStep(4);
    } catch (err) {
      setStep3Error(
        formatErrorForUser(err) || "Unable to continue. Please try again.",
      );
    } finally {
      setIsSavingStep3(false);
    }
  };

  const handleStep4Submit = async () => {
    if (isSavingStep4) return;

    const allChecked = areAllAcknowledgmentsChecked(acknowledgments);
    const email = form.email.trim();
    const hasId = email
      ? await refreshGovernmentIdFromAirtable(email)
      : hasExistingGovId;
    const canSubmitNow =
      hasId && (allChecked || agreementsAccepted);

    if (!canSubmitNow) {
      let agreementsOk = allChecked || agreementsAccepted;
      try {
        const { data: member } = await getMemberstack().getCurrentMember();
        agreementsOk =
          agreementsOk || isAgreementSigned(member);
      } catch {
        // Keep session state.
      }

      setStep4Warnings(
        buildStep4Warnings({
          hasGovernmentId: hasId,
          allAgreementsAccepted: agreementsOk,
        }),
      );
      return;
    }

    setIsSavingStep4(true);
    setStep4Error(null);

    try {
      const memberstack = getMemberstack();
      const { data: member } = await memberstack.getCurrentMember();
      const allAgreementsAccepted =
        allChecked || agreementsAccepted || isAgreementSigned(member);

      // Re-check Airtable Government ID (not Memberstack gov-id).
      const confirmedHasId = email
        ? await refreshGovernmentIdFromAirtable(email)
        : hasId;

      const warnings = buildStep4Warnings({
        hasGovernmentId: confirmedHasId,
        allAgreementsAccepted,
      });
      setStep4Warnings(warnings);

      if (warnings.length > 0 || !confirmedHasId) {
        return;
      }

      const { data: updated } = await memberstack.updateMember({
        customFields: {
          [ONBOARDING_STATUS_FIELD_KEY]: ONBOARDING_SUBMITTED_VALUE,
          [AGREEMENT_SIGNED_FIELD_KEY]: AGREEMENT_SIGNED_COMPLETED_VALUE,
        },
      });

      if (updated) {
        applyMember(updated);
      } else {
        const { data: refreshed } = await memberstack.getCurrentMember();
        if (refreshed) applyMember(refreshed);
      }

      router.replace("/home");
    } catch (err) {
      setStep4Error(
        formatErrorForUser(err) ||
          "Unable to submit your profile. Please try again.",
      );
    } finally {
      setIsSavingStep4(false);
    }
  };

  return (
    <div className="complete-profile-page">
      <CompleteProfileHeader user={headerUser} />

      <section className="complete-profile-hero">
        <div className="complete-profile-hero__inner">
          <h1 className="complete-profile-hero__title">Complete Your Profile</h1>
          <p className="complete-profile-hero__copy">
            Your profile helps other members get to know you better. Add your
            details, interests, and preferences to build meaningful connections,
            discover relevant content, and become an active part of our growing
            community.
          </p>
        </div>
      </section>

      <main className="complete-profile-main">
        <div className="complete-profile-main__inner">
          <OnboardingStepper currentStep={currentStep} />

          {isLoading ? (
            <p className="complete-profile-loading">Loading your profile…</p>
          ) : (
            <>
              {currentStep === 1 ? (
                <StepYourDetails
                  form={form}
                  error={step1Error}
                  isSaving={isSavingStep1}
                  onChange={handleFieldChange}
                  onSubmit={handleStep1Submit}
                />
              ) : null}

              {currentStep === 2 ? (
                <StepVerification
                  hasExistingGovId={hasExistingGovId}
                  isSubmitting={isSavingStep2}
                  error={step2Error}
                  onPrevious={() => {
                    setStep2Error(null);
                    setCurrentStep(1);
                  }}
                  onSubmit={handleStep2Submit}
                />
              ) : null}

              {currentStep === 3 ? (
                <MemberAcknowledgment
                  hasGovernmentId={hasExistingGovId}
                  acknowledgments={acknowledgments}
                  onToggle={handleAckToggle}
                  isSubmitting={isSavingStep3}
                  error={step3Error}
                  onPrevious={() => {
                    setStep3Error(null);
                    setCurrentStep(2);
                  }}
                  onSubmit={handleStep3Submit}
                />
              ) : null}

              {currentStep === 4 ? (
                <StepSubmitDetails
                  warnings={step4Warnings}
                  canSubmit={
                    hasExistingGovId &&
                    (areAllAcknowledgmentsChecked(acknowledgments) ||
                      agreementsAccepted)
                  }
                  isSubmitting={isSavingStep4}
                  submitError={step4Error}
                  onPrevious={() => {
                    setStep4Error(null);
                    setCurrentStep(3);
                  }}
                  onSubmit={handleStep4Submit}
                />
              ) : null}
            </>
          )}
        </div>
      </main>

      <footer className="complete-profile-footer">
        <p>© Copyright All Right Reserved.</p>
      </footer>
    </div>
  );
}
