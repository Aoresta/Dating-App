import Link from "next/link";
import { counts, parties } from "./data";

export function Shell({ children }) {
  const links = [
    ["Home", "/"],
    ["Ruling Party", "/ruling-party"],
    ["Opposition", "/opposition"],
    ["Media", "/media"],
    ["Table Officer", "/table-officer"],
    ["Gallery", "/gallery"],
    ["About Us", "/about-us"]
  ];

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">YP</span>
          <span>
            <strong>Youth Parliament</strong>
            <small>School Democratic Assembly</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div>
          <strong>School Youth Parliament</strong>
          <p>Debate with discipline. Lead with responsibility. Serve with integrity.</p>
        </div>
        <Link href="/">Back to home</Link>
      </footer>
    </>
  );
}

export function Hero({ eyebrow, title, copy, partyKey = "ruling", actions }) {
  const party = parties[partyKey];
  return (
    <section
      className="hero"
      style={{
        "--theme": party.color,
        "--theme-dark": party.dark
      }}
    >
      <div className="hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
      </div>
      <div className="parliament-visual" aria-hidden="true">
        <div className="flag" />
        <div className="dome" />
        <div className="pillars">
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="steps" />
      </div>
    </section>
  );
}

export function PageHero({ partyKey, eyebrow, title, copy }) {
  const party = parties[partyKey];
  return (
    <section
      className="page-hero"
      style={{
        "--theme": party.color,
        "--theme-dark": party.dark
      }}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
    </section>
  );
}

export function CountBand() {
  return (
    <section className="stats-band" aria-label="Youth Parliament member counts">
      {counts.map(([label, value]) => (
        <article key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </article>
      ))}
    </section>
  );
}

export function PartyLinks() {
  return (
    <section className="party-links">
      {Object.entries(parties).map(([key, party]) => (
        <Link
          key={key}
          href={party.href}
          style={{ "--theme": party.color, "--theme-dark": party.dark }}
        >
          <span>{party.shortName}</span>
          <strong>{party.name}</strong>
          <small>{party.quote}</small>
        </Link>
      ))}
    </section>
  );
}

export function MemberGrid({ members, title = "Members" }) {
  return (
    <section className="member-section">
      <div className="section-heading">
        <p className="eyebrow">{title}</p>
        <h2>Click-ready member profiles in a formal card design.</h2>
        <p>Change names, roles, photos, and ideology text from the editable data file.</p>
      </div>
      <div className="member-grid">
        {members.map((member) => (
          <MemberButton key={`${member.name}-${member.role}`} member={member} />
        ))}
      </div>
    </section>
  );
}

export function MemberButton({ member }) {
  const party = parties[member.partyKey];
  return (
    <button
      className="member-button"
      type="button"
      style={{
        "--theme": party.color,
        "--theme-dark": party.dark
      }}
      aria-label={`${member.name}, ${member.role}`}
    >
      <span className="member-card-top" />
      <img src={member.image} alt="" className="member-photo" />
      <span className="member-name">{member.name}</span>
      <span className="member-role">{member.role}</span>
      <span className="ideology-label">Ideology</span>
      <span className="quote-mark">“</span>
      <span className="ideology-text">{member.ideology}</span>
    </button>
  );
}
