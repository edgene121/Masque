import Link from "next/link";
import type { HowItWorksStep } from "@/types/login";

const STEPS: HowItWorksStep[] = [
  {
    number: 1,
    title: "Activate your account",
    description:
      'Use the email address associated with your Masqué membership and select "Forgot Password?" to create your password and access the portal.',
  },
  {
    number: 2,
    title: "Complete verification",
    description:
      "Upload a valid government-issued ID and sign the Member Agreement. Verification helps maintain member safety, venue confidentiality, and accountability within the community.",
  },
  {
    number: 3,
    title: "Masqué reviews your submission",
    description:
      "Your information is reviewed by the Masqué team. Government identification is used solely for verification purposes and is not shared outside the review process.",
  },
  {
    number: 4,
    title: "Access your membership",
    description:
      "Once approved, you'll gain access to events, Dispatches, event briefings, member resources, and future portal features as they are introduced.",
  },
];

export default function HowItWorksPanel() {
  return (
    <div className="how-it-works">
      <h2 className="how-it-works__heading">Membership by invitation</h2>
      <p className="how-it-works__intro">
        Masque Bridge is an exclusive, invite-only community. Here&apos;s how
        membership works:
      </p>

      <ol className="how-it-works__steps">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step.number} className="how-it-works__step">
              <div className="how-it-works__rail">
                <div className="how-it-works__badge">{step.number}</div>
                {!isLast ? (
                  <span className="how-it-works__connector" aria-hidden="true" />
                ) : null}
              </div>
              <div className="how-it-works__content">
                <h3 className="how-it-works__step-title">{step.title}</h3>
                <p className="how-it-works__step-desc">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <Link href="/request-access" className="how-it-works__cta">
        Request an Access
      </Link>
    </div>
  );
}
