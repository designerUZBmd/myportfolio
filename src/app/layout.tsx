import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { ViewTransitions } from "next-view-transitions";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Obloqulov — Digital Designer & Creative Developer",
  description:
    "UX/UI dizayn orqali murakkab g'oyalarni sodda va tushunarli interfeyslarga aylantiraman.",
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
          <link rel="preconnect" href="https://res.cloudinary.com" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
          <link rel="preconnect" href="https://bwuelpuepfmptrekvejc.supabase.co" />
        </head>
        <body>
          <Navbar />
          <SmoothScroll>{children}</SmoothScroll>
        </body>
      </html>
    </ViewTransitions>
  );
}
