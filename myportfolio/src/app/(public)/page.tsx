"use client";
import { useRevealer } from "@/hooks/useRevealer";
import ContactForm from "@/components/ui/ContactForm";

export default function Home() {
  useRevealer();
  return (
    <>
      <div className="revealer">qonday</div>
      <main>
        <h1>Welcome to My Portfolio</h1>
        <ContactForm />
      </main>
    </>
  );
}
