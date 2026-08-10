export interface ArchiveDispatch {
  id: string;
  title: string;
  description: string;
  href: string;
}

// TODO: Replace with Airtable Dispatch Archive records
export const archiveDispatches: ArchiveDispatch[] = [
  {
    id: "what-masque-is",
    title: "What Masque Is",
    description: "Masqué is an experiment in social architecture.",
    href: "#",
  },
  {
    id: "why-masque-verifies-members",
    title: "Why Masqué Verifies Members",
    description:
      "Masqué is a private membership community—not a public nightlife event.",
    href: "#",
  },
  {
    id: "what-preserves-the-room",
    title: "What Preserves The Room",
    description:
      "The structure around Masqué exists to protect the atmosphere, not control it.",
    href: "#",
  },
];
