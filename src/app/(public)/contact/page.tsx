import ContactClient from "./ContactClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Obloqulov Muhammad",
  description:
    "Yangi loyiha, hamkorlik yoki maslahat uchun bog'laning. UX/UI dizayn, 3D va raqamli mahsulotlar.",
};

export default function Contact() {
  return <ContactClient />;
}
