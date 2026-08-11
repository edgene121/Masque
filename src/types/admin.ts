export interface AdminSessionPayload {
  adminId: string;
  email: string;
  name: string;
  role: string;
}

export type AdminRole = "Admin" | "Super Admin" | string;
export type AdminStatus = "Active" | "Disabled" | string;
