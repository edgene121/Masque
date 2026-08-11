"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, Upload } from "lucide-react";

const ACCEPTED =
  "image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf";
const MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".pdf"]);

interface StepVerificationProps {
  hasExistingGovId: boolean;
  isSubmitting: boolean;
  error: string | null;
  onPrevious: () => void;
  onSubmit: (file: File | null) => Promise<void>;
}

function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0) return "";
  return fileName.slice(idx).toLowerCase();
}

function validateSelectedFile(file: File): string | null {
  if (file.size >= MAX_BYTES) {
    return "File size must be less than 2MB.";
  }

  const ext = extensionOf(file.name);
  if (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.has(ext)) {
    return "Please upload a JPG, JPEG, PNG, or PDF file.";
  }

  return null;
}

export default function StepVerification({
  hasExistingGovId,
  isSubmitting,
  error,
  onPrevious,
  onSubmit,
}: StepVerificationProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || error;
  const canContinue = !localError;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLocalError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateSelectedFile(file);
    if (validationError) {
      setSelectedFile(null);
      setLocalError(validationError);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleNext = async () => {
    if (selectedFile) {
      const validationError = validateSelectedFile(selectedFile);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
    }

    setLocalError(null);
    await onSubmit(selectedFile);
  };

  return (
    <section className="onboarding-step-panel onboarding-step-panel--verification">
      <h2 className="onboarding-step-panel__title onboarding-step-panel__title--left">
        Upload a Valid Government-Issued ID for Verification
      </h2>

      <div className="onboarding-verification__copy">
        <p>
          To maintain a safe, secure, and trusted community, all users are
          required to complete identity verification by uploading a valid
          government-issued photo ID. This verification process helps us confirm
          that each account belongs to a real individual, prevents fraudulent
          activity, and ensures compliance with our platform&apos;s security and
          regulatory requirements. Accepted forms of identification may include
          a driver&apos;s license, passport, national ID card, or other
          government-issued documents.
        </p>
        <p>
          Please ensure that the ID you upload is genuine, unaltered, and
          clearly visible. Providing false, expired, manipulated, or invalid
          identification may result in verification failure, account suspension,
          or restricted access to portal features. Once your identity has been
          successfully verified, you will receive full access to the platform
          and all available services. Accounts that remain unverified or fail
          the verification process may be limited to restricted access or
          temporarily suspended until valid documentation is provided and
          approved.
        </p>
        <p>
          <strong>Important:</strong> Your personal information is handled
          securely and used solely for identity verification and compliance
          purposes. We do not share your information with unauthorized third
          parties.
        </p>
      </div>

      <div className="onboarding-verification__warning" role="status">
        <AlertTriangle
          className="onboarding-verification__warning-icon"
          strokeWidth={2}
          aria-hidden="true"
        />
        <p>
          File size must be less than <strong>2MB</strong>.
        </p>
      </div>

      {hasExistingGovId && !selectedFile ? (
        <div className="onboarding-verification__existing" role="status">
          A government-issued ID has already been uploaded for this account. You
          may continue, or choose a new file to replace it.
        </div>
      ) : null}

      <div className="onboarding-verification__upload">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="onboarding-verification__file-input"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="onboarding-verification__upload-btn"
          onClick={() => inputRef.current?.click()}
          disabled={isSubmitting}
        >
          <Upload className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          {selectedFile || hasExistingGovId ? "Replace file" : "Choose file"}
        </button>
        <span className="onboarding-verification__filename">
          {selectedFile
            ? selectedFile.name
            : hasExistingGovId
              ? "ID already uploaded"
              : "No file selected"}
        </span>
      </div>

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
          disabled={isSubmitting || !canContinue}
        >
          {isSubmitting ? "Uploading…" : "Next step"}
        </button>
      </div>
    </section>
  );
}
