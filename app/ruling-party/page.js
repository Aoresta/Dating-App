import { MemberGrid, PageHero, Shell } from "../components";
import { parties, rulingMembers } from "../data";

export default function RulingPartyPage() {
  return (
    <Shell>
      <PageHero
        partyKey="ruling"
        eyebrow="Government Bench"
        title={parties.ruling.name}
        copy={parties.ruling.intro}
      />
      <MemberGrid members={rulingMembers} title="Ruling Party Members" />
    </Shell>
  );
}
