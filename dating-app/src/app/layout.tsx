import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amis",
  description: "Amis is a mobile-first dating MVP with onboarding, profiles, likes, and chat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
