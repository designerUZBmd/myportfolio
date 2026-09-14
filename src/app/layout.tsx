import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { ViewTransitions } from "next-view-transitions";
import DynamicTabTitle from "@/components/ui/DynamicTabTitle";
import { getSiteSettings } from "@/lib/getSiteSettings";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const initialTitle =
    Array.isArray(settings.title_words) && settings.title_words.length > 0
      ? settings.title_words[0]
      : "Obloqulov";
  const icon = settings.favicon_url || "/icon.svg";

  return {
    title: initialTitle,
    description:
      "UX/UI dizayn orqali murakkab g'oyalarni sodda va tushunarli interfeyslarga aylantiraman.",
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
    openGraph: {
      title: initialTitle,
      description:
        "UX/UI dizayn orqali murakkab g'oyalarni sodda va tushunarli interfeyslarga aylantiraman.",
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const favicon = settings.favicon_url || "/icon.svg";

  return (
    <ViewTransitions>
      <html lang="en" className={inter.variable}>
        <head>
          <link rel="icon" href={favicon} sizes="any" />
          <link rel="shortcut icon" href={favicon} />
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
          <DynamicTabTitle initialSettings={settings} />
          <Navbar />
          <SmoothScroll>{children}</SmoothScroll>
        </body>
      </html>
    </ViewTransitions>
  );
}
