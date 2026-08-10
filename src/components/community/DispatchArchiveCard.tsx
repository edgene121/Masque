import Link from "next/link";
import { FileText } from "lucide-react";
import type { ArchiveDispatch } from "@/data/dispatch-archive";

interface DispatchArchiveCardProps {
  dispatch: ArchiveDispatch;
}

export default function DispatchArchiveCard({
  dispatch,
}: DispatchArchiveCardProps) {
  return (
    <article className="dispatch-archive-item">
      <div className="dispatch-archive-item__icon" aria-hidden="true">
        <FileText strokeWidth={1.5} />
      </div>
      <h3 className="dispatch-archive-item__title">{dispatch.title}</h3>
      <p className="dispatch-archive-item__desc">{dispatch.description}</p>
      <Link href={dispatch.href} className="dispatch-archive-item__cta">
        Read More
      </Link>
    </article>
  );
}
