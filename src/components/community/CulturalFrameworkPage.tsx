"use client";

import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CommunityFooterCard from "@/components/dashboard/CommunityFooterCard";
import { navSections } from "@/data/dashboard";
import {
  culturalFrameworkIntro,
  culturalFrameworkSections,
} from "@/data/cultural-framework";
import { useMemberstackUser } from "@/lib/memberstack";
import heroBanner from "../../assets/featured-dispatch.png";

export default function CulturalFrameworkPage() {
  const user = useMemberstackUser();

  return (
    <DashboardLayout user={user} navSections={navSections}>
      <section
        className="framework-hero"
        style={{ backgroundImage: `url(${heroBanner.src})` }}
      >
        <div className="framework-hero__overlay">
          <h1 className="framework-hero__title">Masque Cultural Framework</h1>
        </div>
      </section>

      <nav className="framework-breadcrumb" aria-label="Breadcrumb">
        <Link href="/home">Dashboard</Link>
        <span aria-hidden="true"> / </span>
        <span>Masque Cultural Framework</span>
      </nav>

      <article className="framework-article">
        <h2 className="framework-article__intro-heading">Introduction</h2>
        {culturalFrameworkIntro.map((paragraph) => {
          const isBeliefLead =
            paragraph === "The project is built around a simple belief:";
          return (
            <p
              key={paragraph.slice(0, 48)}
              className={isBeliefLead ? "framework-article__emphasis" : undefined}
            >
              {isBeliefLead ? <strong>{paragraph}</strong> : paragraph}
            </p>
          );
        })}

        {culturalFrameworkSections.map((section) => (
          <section
            key={section.number}
            className="framework-article__section"
            id={`section-${section.number}`}
          >
            <h2>
              {section.number}. {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={`${section.number}-${paragraph.slice(0, 40)}`}>
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={`${section.number}-${item}`}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.trailingParagraphs?.map((paragraph) => (
              <p key={`${section.number}-trail-${paragraph.slice(0, 40)}`}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>

      <CommunityFooterCard />
    </DashboardLayout>
  );
}
