import { Headphones, Mail, Phone } from "lucide-react";

export default function AssistanceFooter() {
  return (
    <footer className="assistance-footer">
      <div className="assistance-footer__inner">
        <div className="assistance-left">
          <div className="assistance-icon">
            <Headphones
              className="assistance-icon__svg"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </div>
          <div className="assistance-title">Need Assistance?</div>
        </div>

        <div className="assistance-footer__right">
          <p className="assistance-footer__copy">
            Our Concierge team is available{" "}
            <strong>Monday–Friday</strong>,{" "}
            <strong>11:00 AM–8:00 PM ET</strong> to assist with membership,
            tickets, verification, and event questions.
          </p>

          <div className="assistance-contact-row">
            <div className="contact-item">
              <Phone aria-hidden="true" />
              <a href="tel:+18559010776">
                <span>(855) 901-0776</span>
              </a>
            </div>

            <div className="contact-divider" />

            <div className="contact-item">
              <Mail aria-hidden="true" />
              <a href="mailto:concierge@masque.co">
                <span>concierge@masque.co</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
