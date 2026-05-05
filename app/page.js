import Link from "next/link";
import { CountBand, Hero, PartyLinks, Shell } from "./components";

export default function HomePage() {
  return (
    <Shell>
      <Hero
        eyebrow="Annual School Youth Parliament"
        title="Young voices. Real debate. Responsible leadership."
        copy="A deployable political website for your school event, built with separate pages for the ruling party, opposition, media, table officers, gallery, and about section."
        partyKey="ruling"
        actions={
          <>
            <Link className="primary-action" href="/ruling-party">
              Ruling Party
            </Link>
            <Link className="secondary-action" href="/opposition">
              Opposition
            </Link>
          </>
        }
      />
      <CountBand />
      <PartyLinks />
    </Shell>
  );
}
