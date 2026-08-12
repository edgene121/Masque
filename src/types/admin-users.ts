export interface AdminApplicationRow {
  id: string;
  name: string;
  email: string;
  /** Airtable "Phone" field */
  phone: string;
  vettingStatus: string;
  memberStatus: string;
  /** Raw Airtable created time (ISO) */
  createdTime: string;
  /** Formatted for display */
  joinedDisplay: string;
}

/** Display-safe Government ID metadata (no URL). */
export interface AdminGovernmentIdInfo {
  filename: string;
  contentType: string;
  size: number;
  isImage: boolean;
  isPdf: boolean;
}

export interface AdminDetailField {
  label: string;
  value: string;
}

export interface AdminApplicationDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  vettingStatus: string;
  memberStatus: string;
  createdTime: string;
  submittedDisplay: string;
  summary: AdminDetailField[];
  personal: AdminDetailField[];
  application: AdminDetailField[];
  referral: AdminDetailField[];
  internal: AdminDetailField[];
  governmentId: AdminGovernmentIdInfo | null;
}
