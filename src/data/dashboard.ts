import type {
  DispatchData,
  FoundationCardData,
  NavSectionData,
} from "@/types/dashboard";

export const navSections: NavSectionData[] = [
  {
    id: "primary",
    items: [
      { id: "home", label: "Home", href: "/home", icon: "home" },
      { id: "profile", label: "Profile", href: "/profile", icon: "user" },
      {
        id: "growth",
        label: "Growth Contributors",
        href: "/growth-contributors",
        icon: "userPlus",
      },
    ],
  },
  {
    id: "community",
    label: "Community Foundation",
    items: [
      {
        id: "cultural",
        label: "Cultural Framework",
        href: "/cultural-framework",
        icon: "bookOpen",
      },
      {
        id: "conduct",
        label: "Code Of Conduct",
        href: "/code-of-conduct",
        icon: "shield",
      },
      {
        id: "dispatch-archive",
        label: "Dispatch Archive",
        href: "/dispatch-archive",
        icon: "list",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    items: [
      {
        id: "events",
        label: "Events",
        href: "/events",
        icon: "ticket",
        badge: "New",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [
      {
        id: "support",
        label: "Contact Support",
        href: "/contact-support",
        icon: "headphones",
      },
    ],
  },
];

export const dispatch: DispatchData = {
  number: "Dispatch #1",
  title: "What Masqué Is",
  description:
    "Masqué is a private membership community, not a public nightlife event.",
};

export const foundationCards: FoundationCardData[] = [
  {
    id: "cultural-framework",
    title: "Cultural Framework",
    description:
      "The principals, values, and philosophy that shape the masque environment.",
    href: "/cultural-framework",
    icon: "book",
  },
  {
    id: "code-of-conduct",
    title: "Member Code Of Conduct",
    description:
      "The expectation and standards that help preserve the room.",
    href: "/code-of-conduct",
    icon: "shield",
  },
];
