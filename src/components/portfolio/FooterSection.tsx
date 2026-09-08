"use client";

import React from "react";
import "./FooterSection.css";

interface FooterSectionProps {
  label?: string;
  statement?: string;
}

export default function FooterSection({
  label = "Xullas /",
  statement = "Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman.",
}: FooterSectionProps = {}) {
  return (
    <footer className="footer-section">
      <div className="footer-card footer-card--blue">
        {/* Top Header Label */}
        <div className="footer-card__header">
          <span className="footer-card__label">{label}</span>
        </div>

        {/* Statement Content */}
        <div className="footer-card__body">
          <p className="footer-card__statement">{statement}</p>
        </div>

        {/* Bottom Bar matching design mockup */}
        <div className="footer-card__bottom">
          <span className="footer-card__brand">obloqulov</span>
          <span className="footer-card__role">CREATIVE DESIGNER &amp; DEVELOPER</span>
        </div>
      </div>
    </footer>
  );
}
