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
