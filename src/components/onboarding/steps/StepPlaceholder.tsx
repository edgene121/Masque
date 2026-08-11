interface StepPlaceholderProps {
  title: string;
  description: string;
}

export default function StepPlaceholder({
  title,
  description,
}: StepPlaceholderProps) {
  return (
    <section className="onboarding-step-panel">
      <h2 className="onboarding-step-panel__title">{title}</h2>
      <p className="onboarding-step-panel__desc">{description}</p>
      <p className="onboarding-step-panel__placeholder">
        This step will be implemented next. Your details from Step 1 have been
        saved.
      </p>
    </section>
  );
}
