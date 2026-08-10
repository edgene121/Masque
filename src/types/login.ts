export type LoginTab = "signin" | "howitworks";

export interface SignInFormState {
  email: string;
  password: string;
}

export interface SignInFormProps {
  onForgotPassword?: () => void;
}

export interface TabSwitcherProps {
  activeTab: LoginTab;
  onTabChange: (tab: LoginTab) => void;
}

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
}
