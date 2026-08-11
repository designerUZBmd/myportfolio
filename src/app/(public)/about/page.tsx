"use client";
import { useRevealer } from "@/hooks/useRevealer";

export default function About() {
  useRevealer();

  return (
    <>
      <div className="revealer"></div>
      <main>
        <section>
          <h1>About</h1>
          <p className="hero__bio">
            Men UX/UI dizayn orqali murakkab g&apos;oyalarni sodda va tushunarli interfeyslarga aylantiraman.
          </p>
        </section>

        <section>
          <h2>Xizmatlar</h2>
          <ul>
            <li>UX/UI Design</li>
            <li>Web Design</li>
            <li>Motion Design</li>
            <li>Branding</li>
          </ul>
        </section>

        <section>
          <h2>Tajriba</h2>
          <p>
            Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn
            yo&apos;nalishlaridan foydalanaman.
          </p>
        </section>
      </main>
    </>
  );
}
