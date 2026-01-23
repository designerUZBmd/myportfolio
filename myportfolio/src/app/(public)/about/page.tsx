"use client";
import { useRevealer } from "@/hooks/useRevealer";

export default function About() {
  useRevealer();

  return (
    <>
      <div className="revealer"></div>
      <main>
        <h1>About Me</h1>
        <p>This is the about page content.</p>
      </main>
    </>
  );
}
