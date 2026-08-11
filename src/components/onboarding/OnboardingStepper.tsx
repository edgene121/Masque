const STEPS = [
  { id: 1, label: "Your Details" },
  { id: 2, label: "Verification" },
  { id: 3, label: "Agreements" },
  { id: 4, label: "Submit Details" },
] as const;

interface OnboardingStepperProps {
  currentStep: number;
}

export default function OnboardingStepper({
  currentStep,
}: OnboardingStepperProps) {
  return (
    <ol className="onboarding-stepper" aria-label="Profile completion steps">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = step.id < currentStep;

        return (
          <li
            key={step.id}
            className={[
              "onboarding-stepper__item",
              isActive ? "is-active" : "",
              isComplete ? "is-complete" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {index > 0 ? (
              <span
                className={[
                  "onboarding-stepper__connector",
                  isActive || isComplete ? "is-filled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden="true"
              />
            ) : null}

            <div className="onboarding-stepper__content">
              <span className="onboarding-stepper__circle" aria-hidden="true">
                {step.id}
              </span>
              <span className="onboarding-stepper__label">{step.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
