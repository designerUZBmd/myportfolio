import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { ViewTransitions } from "next-view-transitions";

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
      <html lang="en">
        <body>
          <Navbar />
          <SmoothScroll>{children}</SmoothScroll>
        </body>
      </html>
    </ViewTransitions>
  );
}
