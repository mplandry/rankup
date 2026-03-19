import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RankUp - Fire Promo Prep",
  description: "Firefighter promotional exam preparation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
