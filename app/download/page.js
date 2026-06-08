import Link from "next/link";
import { Shell } from "../components";

const GITHUB_REPO = "Aoresta/Dating-App";
const APK_DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/amour-release.apk`;
const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
const AMOUR_WEBSITE = "https://amour-sooty.vercel.app";

const products = [
  {
    key: "dating",
    name: "Dating",
    tagline: "Find your match",
    description:
      "Discover meaningful connections with people who share your values and interests. Swipe, match, and start conversations that matter.",
    color: "#c9972b",
    dark: "#5b4216",
    icon: "💛",
    cta: { label: "Coming Soon", href: null },
    platform: "Web"
  },
  {
    key: "friends",
    name: "Friends",
    tagline: "Expand your circle",
    description:
      "Not looking for romance? Meet like-minded people for friendships, activities, and hangouts in your area.",
    color: "#1f6f55",
    dark: "#143e35",
    icon: "💚",
    cta: { label: "Coming Soon", href: null },
    platform: "Web"
  },
  {
    key: "amour",
    name: "Amour",
    tagline: "Your private couples space",
    description:
      "A beautiful, intimate app designed exclusively for couples. Share memories, track your journey together, set moods, and keep your love story alive — all in one private space.",
    color: "#8d1f2d",
    dark: "#3d1018",
    icon: "❤️",
    cta: { label: "Download APK", href: APK_DOWNLOAD_URL },
    platform: "Android",
    isAmour: true
  }
];

const amourFeatures = [
  {
    title: "Shared Memories",
    desc: "Upload photos, add captions, and build a private timeline of your journey together."
  },
  {
    title: "Mood Tracker",
    desc: "Check in on each other's feelings with a simple, beautiful mood widget."
  },
  {
    title: "Couple Doodles",
    desc: "Draw together on a shared canvas and save your doodles forever."
  },
  {
    title: "Daily Questions",
    desc: "Get a new question each day to spark conversations and learn something new about your partner."
  },
  {
    title: "Day Counter",
    desc: "See exactly how many days you have been together — right on your home screen."
  },
  {
    title: "Home Screen Widgets",
    desc: "Five beautiful Android widgets to keep your love story front and center."
  }
];

export default function DownloadPage() {
  return (
    <Shell>
      <section className="download-hero">
        <p className="eyebrow">Choose Your Experience</p>
        <h1 className="download-title">Dating · Friends · Amour</h1>
        <p className="download-subtitle">
          Three ways to connect — whether you are looking for love, friendship,
          or a private space for you and your partner.
        </p>
      </section>

      <div className="product-grid">
        {products.map((product) => (
          <article
            key={product.key}
            className={`product-card${product.isAmour ? " product-card--amour" : ""}`}
            style={{ "--theme": product.color, "--theme-dark": product.dark }}
          >
            <div className="product-card-header">
              <span className="product-icon">{product.icon}</span>
              <span className="product-platform">{product.platform}</span>
            </div>
            <h2 className="product-name">{product.name}</h2>
            <p className="product-tagline">{product.tagline}</p>
            <p className="product-desc">{product.description}</p>
            {product.isAmour ? (
              <a
                className="product-cta"
                href={product.cta.href}
                download
              >
                {product.cta.label}
                <span className="cta-arrow">↓</span>
              </a>
            ) : product.cta.href ? (
              <a className="product-cta" href={product.cta.href}>
                {product.cta.label}
                <span className="cta-arrow">→</span>
              </a>
            ) : (
              <span className="product-cta product-cta--disabled">
                {product.cta.label}
              </span>
            )}
          </article>
        ))}
      </div>

      {/* Amour details section */}
      <section className="amour-details" id="amour">
        <div className="amour-details-header">
          <p className="eyebrow" style={{ color: "#8d1f2d" }}>
            Amour for Android
          </p>
          <h2 className="amour-details-title">
            Everything you need, in one intimate app
          </h2>
          <p className="amour-details-subtitle">
            Amour is a private couples app with shared memories, mood tracking,
            daily questions, doodle canvas, and beautiful home-screen widgets.
          </p>
        </div>

        <div className="amour-features">
          {amourFeatures.map((feature) => (
            <article key={feature.title} className="amour-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>

        <div className="amour-screenshots">
          <p className="eyebrow" style={{ color: "#8d1f2d" }}>
            Screenshots
          </p>
          <div className="screenshot-grid">
            {["Home", "Memories", "Mood", "Doodle"].map((label) => (
              <div key={label} className="screenshot-placeholder">
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="amour-download-box">
          <div className="amour-download-info">
            <h3>Download Amour</h3>
            <p>
              Version: <strong>1.0.0</strong> · Platform:{" "}
              <strong>Android 7.0+</strong> · Size: <strong>~5 MB</strong>
            </p>
            <p className="amour-download-note">
              APK is automatically built from the latest tagged release.{" "}
              <a href={RELEASES_URL}>View all releases →</a>
            </p>
          </div>
          <div className="amour-download-actions">
            <a className="amour-download-btn" href={APK_DOWNLOAD_URL} download>
              ↓ Download APK
            </a>
            <a className="amour-web-link" href={AMOUR_WEBSITE}>
              Open Amour Web →
            </a>
          </div>
        </div>
      </section>
    </Shell>
  );
}
