import type { ConciergeMember } from "@/types/admin-concierge";
import { outstandingItemClass } from "@/lib/admin/concierge-display";

export default function OutstandingItemBadges({
  items,
  emptyLabel,
  large = false,
}: {
  items: string[];
  emptyLabel: string;
  large?: boolean;
}) {
  if (items.length === 0) {
    return <span className="admin-concierge-empty">{emptyLabel}</span>;
  }

  return (
    <div
      className={`admin-concierge-tags${large ? " admin-concierge-tags--large" : ""}`}
    >
      {items.map((item) => (
        <span
          key={item}
          className={`admin-concierge-tag ${outstandingItemClass(item)}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
