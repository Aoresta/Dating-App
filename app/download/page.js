const APK_URL = "https://github.com/Aoresta/Dating-App/releases/latest/download/amour-release.apk";
const WEB_URL = "https://amour-sooty.vercel.app";

export const metadata = {
  title: "Download Amour",
  description: "Download the Amour Android app — a private couples space."
};

export default function DownloadPage() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoMark}>A</div>
          <h1 style={styles.title}>Amour</h1>
          <p style={styles.subtitle}>Your private couples space</p>
        </header>

        {/* App Card */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badge}>Android</span>
            <span style={styles.version}>v1.0.0</span>
          </div>

          <p style={styles.description}>
            A beautiful, intimate app designed exclusively for couples. Share
            memories, track your journey together, set moods, and keep your love
            story alive — all in one private space.
          </p>

          <div style={styles.features}>
            {[
              "Shared Memories",
              "Mood Tracker",
              "Couple Doodles",
              "Daily Questions",
              "Day Counter",
              "Home Screen Widgets"
            ].map((feature) => (
              <span key={feature} style={styles.featureChip}>
                {feature}
              </span>
            ))}
          </div>

          <div style={styles.actions}>
            <a href={APK_URL} download style={styles.downloadBtn}>
              Download APK
            </a>
            <a href={WEB_URL} style={styles.webBtn}>
              Open Web App
            </a>
          </div>

          <p style={styles.meta}>
            Platform: Android 7.0+ · Size: ~5 MB · Signed release build
          </p>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <p>
            Built by{" "}
            <a href="https://github.com/Aoresta" style={styles.footerLink}>
              Aoresta
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
  },
  container: {
    width: "100%",
    maxWidth: "480px"
  },
  header: {
    textAlign: "center",
    marginBottom: "32px"
  },
  logoMark: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #e63946, #a8001e)",
    color: "white",
    fontSize: "28px",
    fontWeight: "900",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    boxShadow: "0 8px 32px rgba(230, 57, 70, 0.4)"
  },
  title: {
    fontSize: "2.4rem",
    fontWeight: "900",
    color: "white",
    margin: "0 0 4px"
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "1.1rem",
    margin: 0
  },
  card: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px"
  },
  badge: {
    background: "rgba(230, 57, 70, 0.15)",
    color: "#ff6b7a",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "700"
  },
  version: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "0.85rem"
  },
  description: {
    color: "rgba(255,255,255,0.85)",
    lineHeight: "1.7",
    fontSize: "1rem",
    margin: "0 0 20px"
  },
  features: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "28px"
  },
  featureChip: {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.8)",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.82rem",
    fontWeight: "600",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  actions: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px"
  },
  downloadBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 20px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "1rem",
    color: "white",
    background: "linear-gradient(135deg, #e63946, #a8001e)",
    textDecoration: "none",
    boxShadow: "0 6px 24px rgba(230, 57, 70, 0.4)",
    transition: "transform 150ms ease"
  },
  webBtn: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 20px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "1rem",
    color: "white",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    textDecoration: "none",
    transition: "transform 150ms ease"
  },
  meta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.8rem",
    textAlign: "center",
    margin: 0
  },
  footer: {
    textAlign: "center",
    marginTop: "24px",
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.85rem"
  },
  footerLink: {
    color: "rgba(255,255,255,0.6)",
    textDecoration: "underline"
  }
};
