"use client";

import React from "react";
import "./FooterSection.css";

export default function FooterSection() {
  return (
    <footer className="footer-section">
      <div className="footer-grid">
        {/* Left Sky Blue Card (#82D9FF) */}
        <div className="footer-card footer-card--blue">
          {/* Statement Content */}
          <div className="footer-card__content">
            <div className="footer-card__media-group">
              <span className="footer-card__label">Xullas /</span>
              <div className="footer-card__media-box" />
            </div>
            <p className="footer-card__statement">
              Men UX/UI dizayn orqali murakkab g‘oyalarni sodda va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman.
            </p>
          </div>
        </div>

        {/* Right Solid Black Architecture Block (#13110e) */}
        <div className="footer-card footer-card--black" />
      </div>
    </footer>
  );
}
