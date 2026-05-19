"use client";
import { useRevealer } from "@/hooks/useRevealer";
import ContactForm from "@/components/ui/ContactForm";

export default function Contact() {
  useRevealer();

  return (
    <>
      <div className="revealer"></div>
      <main>
        <ContactForm />
      </main>
    </>
  );
}
