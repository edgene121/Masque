export interface AdminApplicationRow {
  id: string;
  name: string;
  email: string;
  vettingStatus: string;
  memberStatus: string;
  /** Raw Airtable created time (ISO) */
  createdTime: string;
  /** Formatted for display */
  joinedDisplay: string;
}
