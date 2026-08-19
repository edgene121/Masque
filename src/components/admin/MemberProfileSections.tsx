import type { ConciergeMember } from "@/types/admin-concierge";
import {
  DataQualityCard,
  EventStatusCard,
  MemberInformationCard,
  OnboardingCard,
  OutstandingItemsCard,
} from "@/components/admin/MemberDetailCards";

export default function MemberProfileSections({
  member,
}: {
  member: ConciergeMember;
}) {
  return (
    <>
      <div className="admin-registered-detail__columns">
        <div className="admin-registered-detail__column">
          <MemberInformationCard member={member} />
          <EventStatusCard member={member} />
        </div>
        <div className="admin-registered-detail__column">
          <OutstandingItemsCard member={member} />
          <DataQualityCard member={member} />
        </div>
      </div>
      <OnboardingCard member={member} layout="wide" />
    </>
  );
}
