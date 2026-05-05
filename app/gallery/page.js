import { PageHero, Shell } from "../components";
import { gallery } from "../data";

export default function GalleryPage() {
  return (
    <Shell>
      <PageHero
        partyKey="media"
        eyebrow="Gallery"
        title="Session moments and media coverage."
        copy="A clean gallery page for photos, debate highlights, certificates, committee work, and event reports."
      />
      <section className="gallery-grid">
        {gallery.map(([title, text], index) => (
          <article className="gallery-card" key={title}>
            <div className="gallery-art" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <h2>{title}</h2>
            <p>{text}</p>
            <small>Photo slot {index + 1}</small>
          </article>
        ))}
      </section>
    </Shell>
  );
}
