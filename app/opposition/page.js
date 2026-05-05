import { MemberGrid, PageHero, Shell } from "../components";
import { oppositionMembers, parties } from "../data";

export default function OppositionPage() {
  return (
    <Shell>
      <PageHero
        partyKey="opposition"
        eyebrow="Accountability Bench"
        title={parties.opposition.name}
        copy={parties.opposition.intro}
      />
      <MemberGrid members={oppositionMembers} title="Opposition Members" />
    </Shell>
  );
}
