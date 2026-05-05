import { PageHero, Shell } from "../components";

export default function AboutUsPage() {
  return (
    <Shell>
      <PageHero
        partyKey="table"
        eyebrow="About Us"
        title="Built for disciplined democratic learning."
        copy="The School Youth Parliament gives students a practical stage to understand democracy, public speaking, teamwork, rules of procedure, and respectful disagreement."
      />
      <section className="about-layout">
        <article>
          <h2>Purpose</h2>
          <p>
            To help students become informed, confident, and responsible citizens through
            research, debate, and parliamentary simulation.
          </p>
        </article>
        <article>
          <h2>Values</h2>
          <p>
            Discipline, dignity, fairness, accountability, service, evidence, and respect
            for every speaker in the House.
          </p>
        </article>
        <article>
          <h2>Contact Desk</h2>
          <p>
            Add your teacher coordinator, student secretariat, media convenor, and table
            office contact details here before deployment.
          </p>
        </article>
      </section>
    </Shell>
  );
}
