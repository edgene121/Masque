"use client";

import Link from "next/link";

interface MemberSegmentCardProps {
  href: string;
  title: string;
  count: number;
  description: string;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export default function MemberSegmentCard({
  href,
  title,
  count,
  description,
}: MemberSegmentCardProps) {
  return (
    <Link href={href} className="admin-dash-segment">
      <span className="admin-dash-segment__title">{title}</span>
      <span className="admin-dash-segment__count">
        {formatCount(count)} Members
      </span>
      <span className="admin-dash-segment__hint">{description}</span>
    </Link>
  );
}
