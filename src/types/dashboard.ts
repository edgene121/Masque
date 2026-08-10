export type MembershipStatusVariant = "active" | "pending" | "inactive";

export interface MemberStatusData {
  variant: MembershipStatusVariant;
  label: string;
  welcomeHeading: string;
  welcomeText: string;
}

export interface MemberstackUser {
  name: string;
  initials: string;
  email?: string;
}

export interface FeaturedEventData {
  id: string;
  title: string;
  description: string;
  /** ISO date string — formatted in the UI */
  date: string;
  accessLabel: string;
  href: string;
  imageSrc?: string;
}

export interface DispatchData {
  number: string;
  title: string;
  description: string;
  imageSrc?: string;
}

export interface FoundationCardData {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: "book" | "shield";
}

export type NavIcon =
  | "home"
  | "user"
  | "userPlus"
  | "bookOpen"
  | "shield"
  | "list"
  | "ticket"
  | "headphones";

export interface NavItemData {
  id: string;
  label: string;
  href: string;
  icon: NavIcon;
  badge?: string;
}

export interface NavSectionData {
  id: string;
  label?: string;
  items: NavItemData[];
}

/** @deprecated Prefer MemberStatusData + MemberstackUser */
export interface MemberData {
  name: string;
  status: string;
}
