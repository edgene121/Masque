export interface ProspectStat {
  id: string;
  label: string;
  value: number;
}

// TODO: Replace with Airtable / Memberstack growth metrics
export const prospectStats: ProspectStat[] = [
  { id: "total", label: "Total", value: 16 },
  { id: "added-this-week", label: "Added This Week", value: 11 },
  { id: "awaiting-review", label: "Awaiting Review", value: 0 },
  { id: "ready-for-outreach", label: "Ready For Outreach", value: 1 },
  {
    id: "personal-introduction",
    label: "Personal Introduction Recommended",
    value: 0,
  },
  { id: "contacted", label: "Contacted", value: 0 },
  { id: "application-started", label: "Application Started", value: 0 },
  { id: "approved-members", label: "Approved Members", value: 0 },
  { id: "duplicate-review", label: "Duplicate Review Queue", value: 0 },
];
