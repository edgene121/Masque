import type { ProfileFormData } from "@/types/profile";
import { emptyProfileForm } from "@/lib/profile-memberstack";

/** Empty profile shape — live values come from Memberstack on the Profile page. */
export const profileDefaults: ProfileFormData = emptyProfileForm;
