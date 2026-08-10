import type { ProspectStat } from "@/data/prospects";

interface ProspectStatCardProps {
  stat: ProspectStat;
}

export default function ProspectStatCard({ stat }: ProspectStatCardProps) {
  return (
    <article className="prospect-stat-card">
      <p className="prospect-stat-card__label">{stat.label}</p>
      <p className="prospect-stat-card__value">{stat.value}</p>
    </article>
  );
}
