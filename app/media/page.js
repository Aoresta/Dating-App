import { MemberGrid, PageHero, Shell } from "../components";
import { mediaMembers, parties } from "../data";

export default function MediaPage() {
  return (
    <Shell>
      <PageHero
        partyKey="media"
        eyebrow="Press Gallery"
        title={parties.media.name}
        copy={parties.media.intro}
      />
      <MemberGrid members={mediaMembers} title="Media Members" />
    </Shell>
  );
}
