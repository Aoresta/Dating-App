import "./globals.css";

export const metadata = {
  title: "School Youth Parliament",
  description: "A deployable school Youth Parliament website."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
