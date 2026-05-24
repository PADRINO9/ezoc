import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "בון חכם | ניהול הזמנות לחנות דגים",
  description: "מערכת Hebrew RTL לניהול הזמנות וואטסאפ לחנויות דגים.",
  icons: {
    icon: "/nlego.png",
    apple: "/nlego.png",
  },
  openGraph: {
    title: "בון חכם | ניהול הזמנות לחנות דגים",
    description: "מערכת Hebrew RTL לניהול הזמנות וואטסאפ לחנויות דגים.",
    images: ["/nlego.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
