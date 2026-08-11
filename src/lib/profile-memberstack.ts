import type { Member } from "@memberstack/dom";
import type { MemberstackUser } from "@/types/dashboard";
import type { ProfileFormData } from "@/types/profile";

/** Custom-field keys that must never be overwritten from the Profile UI. */
export const PROFILE_SYSTEM_FIELD_KEYS = [
  "agreement-signed",
  "compliance-state",
  "onboarding-state",
  "portal-access-state",
  "referralcode",
  "gov-id",
] as const;

export const emptyProfileForm: ProfileFormData = {
  profileName: "",
  displayName: "",
  bio: "Bio (Coming soon)",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  instagram: "",
  gender: "",
  profilePhotoUrl: undefined,
};

function fieldValue(
  customFields: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const value = customFields?.[key];
  if (value == null) return "";
  return String(value);
}

/** Normalize Memberstack birthdate values for `<input type="date">`. */
export function toDateInputValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMemberInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName.trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

export function mapMemberToProfileForm(member: Member): ProfileFormData {
  const customFields = (member.customFields ?? {}) as Record<string, unknown>;
  const firstName = fieldValue(customFields, "first-name");
  const lastName = fieldValue(customFields, "last-name");

  return {
    profileName: fieldValue(customFields, "profile-name"),
    displayName: fieldValue(customFields, "display-name"),
    bio: "Bio (Coming soon)",
    firstName,
    lastName,
    dateOfBirth: toDateInputValue(fieldValue(customFields, "birthdate")),
    phone: fieldValue(customFields, "phone"),
    email: member.auth?.email ?? "",
    address: fieldValue(customFields, "address"),
    city: fieldValue(customFields, "city"),
    state: fieldValue(customFields, "state"),
    zipCode: fieldValue(customFields, "zip-code"),
    instagram: fieldValue(customFields, "instagram-link"),
    gender: fieldValue(customFields, "gender"),
    profilePhotoUrl: member.profileImage || undefined,
  };
}

export function mapMemberToHeaderUser(member: Member): MemberstackUser {
  const form = mapMemberToProfileForm(member);
  const name =
    form.profileName.trim() ||
    [form.firstName, form.lastName].filter(Boolean).join(" ").trim() ||
    form.email;

  return {
    name,
    email: form.email,
    initials: getMemberInitials(form.firstName, form.lastName),
  };
}

/** Memberstack custom field key for UI label "Onboarding Status". */
export const ONBOARDING_STATUS_FIELD_KEY = "onboarding-state";

/** Memberstack custom field key for UI label "Agreement Signed". */
export const AGREEMENT_SIGNED_FIELD_KEY = "agreement-signed";

/** Value written after Step 3 acknowledgments are accepted. */
export const AGREEMENT_SIGNED_COMPLETED_VALUE = "completed";

/** Memberstack custom field key for UI label "gov.ID". */
export const GOV_ID_FIELD_KEY = "gov-id";

/** Memberstack custom field key for UI label "Compliance Status". */
export const COMPLIANCE_STATUS_FIELD_KEY = "compliance-state";

export function getGovIdUrl(member: Member | null | undefined): string {
  if (!member) return "";
  const customFields = (member.customFields ?? {}) as Record<string, unknown>;
  return fieldValue(customFields, GOV_ID_FIELD_KEY).trim();
}

export function hasGovId(member: Member | null | undefined): boolean {
  const value = getGovIdUrl(member);
  return Boolean(value);
}

export function getAgreementSigned(
  member: Member | null | undefined,
): string {
  if (!member) return "";
  const customFields = (member.customFields ?? {}) as Record<string, unknown>;
  return fieldValue(customFields, AGREEMENT_SIGNED_FIELD_KEY).trim();
}

/** True when Agreement Signed is the completed value from Step 3. */
export function isAgreementSigned(member: Member | null | undefined): boolean {
  return (
    getAgreementSigned(member).toLowerCase() ===
    AGREEMENT_SIGNED_COMPLETED_VALUE.toLowerCase()
  );
}

/**
 * Profile is complete only when Onboarding Status === "Submitted".
 * Any other/missing value is treated as incomplete.
 */
export function getOnboardingStatus(member: Member | null | undefined): string {
  if (!member) return "";
  const customFields = (member.customFields ?? {}) as Record<string, unknown>;
  return String(customFields[ONBOARDING_STATUS_FIELD_KEY] ?? "").trim();
}

export function isProfileComplete(member: Member | null | undefined): boolean {
  return getOnboardingStatus(member).toLowerCase() === "submitted";
}

export function customFieldsForMasqueProfile(form: ProfileFormData) {
  return {
    "profile-name": form.profileName,
    "display-name": form.displayName,
  };
}

export function customFieldsForLegal(form: ProfileFormData) {
  return {
    "first-name": form.firstName,
    "last-name": form.lastName,
    birthdate: form.dateOfBirth,
    phone: form.phone,
  };
}

export function customFieldsForUploadedDetails(form: ProfileFormData) {
  return {
    address: form.address,
    city: form.city,
    state: form.state,
    "zip-code": form.zipCode,
    "instagram-link": form.instagram,
    gender: form.gender,
  };
}

/**
 * Step 1 of /complete-profile onboarding.
 * Does NOT update onboarding-state or other system fields.
 */
export function customFieldsForOnboardingStep1(form: ProfileFormData) {
  return {
    "first-name": form.firstName.trim(),
    "last-name": form.lastName.trim(),
    address: form.address.trim(),
    state: form.state.trim(),
    "zip-code": form.zipCode.trim(),
    "display-name": form.displayName.trim(),
    "profile-name": form.profileName.trim(),
    phone: form.phone.trim(),
    birthdate: form.dateOfBirth.trim(),
    gender: form.gender.trim(),
    "instagram-link": form.instagram.trim(),
  };
}
