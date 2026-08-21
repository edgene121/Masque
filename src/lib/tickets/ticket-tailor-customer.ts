export type TicketTailorCustomer = {
  firstName: string;
  lastName: string;
  email: string;
};

type TicketTailorMemberSource = {
  auth?: { email?: string | null } | null;
  customFields?: Record<string, unknown> | null;
} | null;

function fieldValue(
  customFields: Record<string, unknown> | null | undefined,
  key: string,
): string {
  const value = customFields?.[key];
  if (value == null) return "";
  return String(value).trim();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts[parts.length - 1],
  };
}

function logCustomerPrep(customer: TicketTailorCustomer | null) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[Ticket Tailor] customer prefill prepared", {
    hasFirstName: Boolean(customer?.firstName),
    hasLastName: Boolean(customer?.lastName),
    hasEmail: Boolean(customer?.email),
  });
}

/**
 * Normalize the logged-in Memberstack member into Ticket Tailor checkout
 * prefill fields. Does not call Ticket Tailor.
 */
export function toTicketTailorCustomer(
  member: TicketTailorMemberSource,
): TicketTailorCustomer | null {
  if (!member) {
    logCustomerPrep(null);
    return null;
  }

  const email = normalizeEmail(member.auth?.email ?? "");
  if (!email) {
    logCustomerPrep(null);
    return null;
  }

  const customFields = member.customFields ?? {};
  const dedicatedFirst = fieldValue(customFields, "first-name");
  const dedicatedLast = fieldValue(customFields, "last-name");

  let firstName = dedicatedFirst;
  let lastName = dedicatedLast;

  if (!dedicatedFirst && !dedicatedLast) {
    const profileName =
      fieldValue(customFields, "profile-name") ||
      fieldValue(customFields, "display-name");
    const parsed = splitFullName(profileName);
    firstName = parsed.firstName;
    lastName = parsed.lastName;
  }

  const customer: TicketTailorCustomer = {
    firstName,
    lastName,
    email,
  };

  logCustomerPrep(customer);
  return customer;
}
