import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { ViewTransitions } from "next-view-transitions";
import siteSettings from "@/data/siteSettings.json";
import DynamicTabTitle from "@/components/ui/DynamicTabTitle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const favicon = siteSettings?.favicon_url || "/images/photo.jpg";

export const metadata: Metadata = {
  title: "Obloqulov — Digital Designer & Creative Developer",
  description:
    "UX/UI dizayn orqali murakkab g'oyalarni sodda va tushunarli interfeyslarga aylantiraman.",
  icons: {
    icon: favicon,
    apple: favicon,
  },
  openGraph: {
    title: "Obloqulov — Digital Designer",
    description:
      "UX/UI dizayn orqali murakkab g'oyalarni sodda va tushunarli interfeyslarga aylantiraman.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <html lang="en" className={inter.variable}>
        <head>
          <link rel="icon" href={favicon} sizes="any" />
          <link rel="apple-touch-icon" href={favicon} />
          <link rel="preconnect" href="https://res.cloudinary.com" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
          <link rel="preconnect" href="https://bwuelpuepfmptrekvejc.supabase.co" />
          <link
            rel="preload"
            href="/fonts/HelveticaNeueRoman.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            href="/fonts/HelveticaNeueBold.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        </head>
        <body>
          <DynamicTabTitle />
          <Navbar />
          <SmoothScroll>{children}</SmoothScroll>
        </body>
      </html>
    </ViewTransitions>
  );
}
