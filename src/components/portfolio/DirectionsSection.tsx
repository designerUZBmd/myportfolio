"use client";

import React from "react";
import Image from "next/image";
import "./DirectionsSection.css";

interface DirectionItem {
  id: string;
  number: string;
  title: string;
  description: string;
  tags: string[];
}

const directions: DirectionItem[] = [
  {
    id: "ux-ui",
    number: "01",
    title: "UX/UI Dizayn",
    description:
      "Foydalanuvchi tadqiqotlari, axborot arxitekturasi, wireframe va yuqori aniqlikdagi interaktiv prototiplar yaratish.",
    tags: ["User Research", "Wireframing", "Prototyping", "Usability Testing"],
  },
  {
    id: "web-mobile",
    number: "02",
    title: "Web & Mobile Tajriba",
    description:
      "Murakkab veb-platformalar, SaaS mahsulotlar va iOS / Android mobil ilovalari uchun intuitiv interfeyslar.",
    tags: ["Responsive Web", "Mobile Apps", "SaaS Platforms", "Design Systems"],
  },
  {
    id: "3d-motion",
    number: "03",
    title: "3D & Motion Dizayn",
    description:
      "Raqamli mahsulotlarni jonlantiruvchi 3D vizuallar, interaktiv animatsiyalar va brend estetikasi.",
    tags: ["3D Modeling", "Micro-interactions", "Motion Graphics", "Visual Identity"],
  },
  {
    id: "design-systems",
    number: "04",
    title: "Dizayn Tizimlari",
    description:
      "Katta jamoalar uchun kengaytiriladigan, moslashuvchan UI Kitlar, dizayn tokenlari va komponentlar kutubxonasi.",
    tags: ["Component Libraries", "Design Tokens", "Documentation", "Scalability"],
  },
];

const marqueeImages = [
  { src: "/images/process1.jpg", alt: "Design showcase 1" },
  { src: "/images/process2.jpg", alt: "Design showcase 2" },
  { src: "/images/process3.jpg", alt: "Design showcase 3" },
  { src: "/images/photo.jpg", alt: "Creative work 4" },
  { src: "/images/process1.jpg", alt: "Design showcase 5" },
  { src: "/images/process2.jpg", alt: "Design showcase 6" },
  { src: "/images/process3.jpg", alt: "Design showcase 7" },
  { src: "/images/photo.jpg", alt: "Creative work 8" },
];

export default function DirectionsSection() {
  return (
    <section className="directions-section">
      {/* 1. Extended Full-Bleed 100vw Banner */}
      <div className="directions-banner">
        {/* Infinite Horizontal Image Marquee */}
        <div className="directions-marquee">
          <div className="directions-marquee__track">
            {/* First sequence */}
            {marqueeImages.map((img, index) => (
              <div key={`m1-${index}`} className="directions-marquee__item">
                <div className="directions-marquee__image-wrapper">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="directions-marquee__image"
                    sizes="280px"
                  />
                </div>
              </div>
            ))}

            {/* Duplicated sequence for seamless infinite loop */}
            {marqueeImages.map((img, index) => (
              <div key={`m2-${index}`} className="directions-marquee__item">
                <div className="directions-marquee__image-wrapper">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="directions-marquee__image"
                    sizes="280px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Editorial Row: Full 28vw Flush Left Image + Right Statement */}
        <div className="directions-editorial-row">
          <div className="directions-editorial-media">
            <div className="directions-editorial-image-wrapper">
              <Image
                src="/images/process3.jpg"
                alt="Design Vision"
                fill
                className="directions-editorial-image"
                sizes="28vw"
              />
            </div>
          </div>

          <div className="directions-editorial-text-col">
            <p className="directions-editorial__text">
              Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli
              mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi,
              aniq funksionallik va zamonaviy estetika uyg‘unligi.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Standard Right Column Area for the Directions List */}
      <div className="directions-content">
        {/* Section Label placed right above the directions list */}
        <div className="directions-header">
          <span className="directions-header__label">ASOSIY YO‘NALISHLAR /</span>
        </div>

        {/* Directions Interactive List */}
        <div className="directions-list">
          {directions.map((item) => (
            <div key={item.id} className="direction-item">
              <div className="direction-item__main">
                <div className="direction-item__left">
                  <span className="direction-item__number">{item.number}</span>
                  <h3 className="direction-item__title">{item.title}</h3>
                </div>

                <div className="direction-item__right">
                  <p className="direction-item__desc">{item.description}</p>
                  <div className="direction-item__tags">
                    {item.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="direction-item__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
