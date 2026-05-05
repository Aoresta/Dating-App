import { MemberGrid, PageHero, Shell } from "../components";
import { parties, tableOfficerMembers } from "../data";

export default function TableOfficerPage() {
  return (
    <Shell>
      <PageHero
        partyKey="table"
        eyebrow="Speaker and Secretariat"
        title={parties.table.name}
        copy={parties.table.intro}
      />
      <MemberGrid members={tableOfficerMembers} title="Speaker and Table Officers" />
    </Shell>
  );
}
