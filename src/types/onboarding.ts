import type { ProfileFormData } from "@/types/profile";
import type { AcknowledgmentState } from "@/components/onboarding/steps/MemberAcknowledgment";

/** Shared multi-step /complete-profile wizard state (parent-owned). */
export interface CompleteProfileWizardState {
  currentStep: 1 | 2 | 3 | 4;
  form: ProfileFormData;
  acknowledgments: AcknowledgmentState;
  /** True after Step 3 checkboxes accepted in this session (or loaded from Memberstack). */
  agreementsAccepted: boolean;
  /** True when Memberstack gov-id has a non-empty value. */
  hasGovernmentId: boolean;
}
