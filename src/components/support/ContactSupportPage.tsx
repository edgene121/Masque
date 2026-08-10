"use client";

import { Clock3, Headphones, Mail, Phone } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CommunityFooterCard from "@/components/dashboard/CommunityFooterCard";
import { navSections } from "@/data/dashboard";
import { useMemberstackUser } from "@/lib/memberstack";
import ContactInfoCard from "./ContactInfoCard";
import ContactSupportForm from "./ContactSupportForm";

export default function ContactSupportPage() {
  const user = useMemberstackUser();

  return (
    <DashboardLayout user={user} navSections={navSections}>
      <div className="contact-support-main">
        <section className="contact-support-intro">
          <h1>Speak with Concierge</h1>
          <p>Questions about membership, your account, tickets, or events?</p>

          <div className="contact-info-grid">
            <ContactInfoCard
              icon={Phone}
              title="Call or Text Us"
              detail="(855) 901-0776"
              href="tel:+18559010776"
            />
            <ContactInfoCard
              icon={Mail}
              title="Email Us"
              detail="concierge@masque.co"
              href="mailto:concierge@masque.co"
            />
            <ContactInfoCard
              icon={Headphones}
              title="Schedule a Concierge Call"
              detail="Need help? We're here to help."
            />
            <ContactInfoCard
              icon={Clock3}
              title="Available"
              detail="Monday–Friday, 11:00 AM–8:00 PM ET"
            />
          </div>
        </section>

        <ContactSupportForm />

        <div className="contact-support-footer-wrap">
          <CommunityFooterCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
