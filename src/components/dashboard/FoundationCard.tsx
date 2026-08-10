import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";
import type { FoundationCardData } from "@/types/dashboard";

interface FoundationCardProps {
  card: FoundationCardData;
}

export default function FoundationCard({ card }: FoundationCardProps) {
  const Icon = card.icon === "shield" ? ShieldCheck : BookOpen;

  return (
    <article className="foundation-card">
      <div className="foundation-icon" aria-hidden="true">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <div className="foundation-card-content">
        <h3 className="foundation-card__title">{card.title}</h3>
        <p className="foundation-card__desc">{card.description}</p>
        <Link href={card.href} className="foundation-read-more">
          Read More →
        </Link>
      </div>
    </article>
  );
}
