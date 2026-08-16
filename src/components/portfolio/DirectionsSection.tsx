"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DirectionPreviewWebGL, { DirectionItemData } from "./DirectionPreviewWebGL";
import "./DirectionsSection.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type { DirectionItemData };

const directions: DirectionItemData[] = [
  {
    id: "ux-ui",
    number: "01",
    title: "UX/UI Dizayn",
    description:
      "Foydalanuvchi tadqiqotlari, axborot arxitekturasi, wireframe va yuqori aniqlikdagi interaktiv prototiplar yaratish.",
    image: "/images/process1.jpg",
  },
  {
    id: "web-mobile",
    number: "02",
    title: "Web & Mobile Tajriba",
    description:
      "Murakkab veb-platformalar, SaaS mahsulotlar va iOS / Android mobil ilovalari uchun intuitiv interfeyslar.",
    image: "/images/process2.jpg",
  },
  {
    id: "3d-motion",
    number: "03",
    title: "3D & Motion Dizayn",
    description:
      "Raqamli mahsulotlarni jonlantiruvchi 3D vizuallar, interaktiv animatsiyalar va brend estetikasi.",
    image: "/images/process3.jpg",
  },
  {
    id: "design-systems",
    number: "04",
    title: "Dizayn Tizimlari",
    description:
      "Katta jamoalar uchun kengaytiriladigan, moslashuvchan UI Kitlar, dizayn tokenlari va komponentlar kutubxonasi.",
    image: "/images/photo.jpg",
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

const statementText =
  "Murakkab g‘oyalardan tortib vizual jihatdan mukammal raqamli mahsulotlargacha. Har bir detalda chuqur foydalanuvchi qulayligi, aniq funksionallik va zamonaviy estetika uyg‘unligi.";

export default function DirectionsSection() {
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const bannerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const img1Ref = useRef<HTMLDivElement>(null);
  const img2Ref = useRef<HTMLDivElement>(null);
  const img3Ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [textVisible, setTextVisible] = useState(false);

  const [activeDirection, setActiveDirection] = useState<DirectionItemData | null>(null);
  const [activeSlotRect, setActiveSlotRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return;

    // Continuous smooth horizontal marquee
    tweenRef.current = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 35,
      repeat: -1,
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) return;

    const ctx = gsap.context(() => {
      // --- Card 1: Clip Reveal + Parallax ---
      if (card1Ref.current && img1Ref.current) {
        gsap.fromTo(
          card1Ref.current,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: card1Ref.current,
              start: "top 85%",
              toggleActions: "play reverse play reverse",
            },
          }
        );

        gsap.fromTo(
          img1Ref.current,
          { yPercent: -20 },
          {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: card1Ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );
      }

      // --- Card 2: Clip Reveal + Parallax ---
      if (card2Ref.current && img2Ref.current) {
        gsap.fromTo(
          card2Ref.current,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: card2Ref.current,
              start: "top 85%",
              toggleActions: "play reverse play reverse",
            },
          }
        );

        gsap.fromTo(
          img2Ref.current,
          { yPercent: -20 },
          {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: card2Ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          }
        );
      }

      // --- Card 3: Clip Reveal + Parallax ---
      if (card3Ref.current && img3Ref.current) {
        gsap.fromTo(
          card3Ref.current,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: card3Ref.current,
              start: "top 85%",
              toggleActions: "play reverse play reverse",
            },
          }
        );

        gsap.fromTo(
          img3Ref.current,
          { yPercent: -20 },
          {
            yPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: card3Ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );
      }

      // --- Text Word-by-Word trigger ---
      if (textRef.current) {
        ScrollTrigger.create({
          trigger: textRef.current,
          start: "top 85%",
          onEnter: () => setTextVisible(true),
          onLeave: () => setTextVisible(false),
          onEnterBack: () => setTextVisible(true),
          onLeaveBack: () => setTextVisible(false),
        });
      }
    }, banner);

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, {
        timeScale: 0,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, {
        timeScale: 1,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const statementWords = statementText.split(" ");

  const updateActiveSlot = (itemEl: HTMLElement, item: DirectionItemData) => {
    const itemRect = itemEl.getBoundingClientRect();
    const numberEl = itemEl.querySelector(".direction-item__number") as HTMLElement;
    const titleEl = itemEl.querySelector(".direction-item__title") as HTMLElement;

    if (numberEl && titleEl) {
      const numberRect = numberEl.getBoundingClientRect();
      const titleRect = titleEl.getBoundingClientRect();
      const left = numberRect.right;
      const width = titleRect.left - numberRect.right;

      setActiveSlotRect({
        left,
        top: itemRect.top,
        width,
        height: itemRect.height,
      });
    } else {
      const slot = itemEl.querySelector(
        ".direction-item__image-slot"
      ) as HTMLElement;
      if (slot) {
        const slotRect = slot.getBoundingClientRect();
        setActiveSlotRect({
          left: slotRect.left,
          top: itemRect.top,
          width: slotRect.width,
          height: itemRect.height,
        });
      }
    }
    setActiveDirection(item);
  };

  const handleItemMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    item: DirectionItemData
  ) => {
    updateActiveSlot(e.currentTarget, item);
  };

  const handleItemMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    item: DirectionItemData
  ) => {
    updateActiveSlot(e.currentTarget, item);
  };

  const handleListMouseLeave = () => {
    setActiveDirection(null);
  };

  return (
    <section className="directions-section">
      {/* 1. Extended Full-Bleed 100vw Banner */}
      <div ref={bannerRef} className="directions-banner">
        {/* Infinite Horizontal Image Marquee */}
        <div
          className="directions-marquee"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div ref={marqueeTrackRef} className="directions-marquee__track">
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

        {/* 2-Column Editorial Row: Full 28vw Flush Left Image + Right Baseline Composition */}
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

          <div className="directions-editorial-content">
            <div className="directions-editorial-layout">
              {/* 1-Rasm (Uzunroq / Tall, aligned to bottom baseline) */}
              <div ref={card1Ref} className="directions-editorial__card directions-editorial__card--tall">
                <div ref={img1Ref} className="directions-editorial__img-wrapper">
                  <Image
                    src="/images/process1.jpg"
                    alt="Design Process 1"
                    fill
                    className="directions-editorial__img"
                    sizes="(max-width: 992px) 50vw, 28vw"
                  />
                </div>
              </div>

              {/* O‘ng guruh: Tepada gap, pastda 2 va 3-rasm */}
              <div className="directions-editorial-right-group">
                <div ref={textRef} className="directions-editorial-statement">
                  <p className="directions-editorial__text">
                    {statementWords.map((word, i) => (
                      <React.Fragment key={i}>
                        <span
                          className={`directions-editorial__word ${textVisible ? "is-visible" : ""}`}
                          style={{
                            transitionDelay: `${i * 0.03}s`,
                          }}
                        >
                          {word}
                        </span>
                        {i < statementWords.length - 1 && " "}
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                <div className="directions-editorial-cards-subrow">
                  {/* 2-Rasm (Sal pastroq) */}
                  <div ref={card2Ref} className="directions-editorial__card directions-editorial__card--short-1">
                    <div ref={img2Ref} className="directions-editorial__img-wrapper">
                      <Image
                        src="/images/photo.jpg"
                        alt="Design Process 2"
                        fill
                        className="directions-editorial__img"
                        sizes="(max-width: 992px) 50vw, 22vw"
                      />
                    </div>
                  </div>

                  {/* 3-Rasm (Sal pastroq) */}
                  <div ref={card3Ref} className="directions-editorial__card directions-editorial__card--short-2">
                    <div ref={img3Ref} className="directions-editorial__img-wrapper">
                      <Image
                        src="/images/process2.jpg"
                        alt="Design Process 3"
                        fill
                        className="directions-editorial__img"
                        sizes="(max-width: 992px) 50vw, 30vw"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full-Width Directions List with Three.js Cloth Wave Ripple Preview */}
      <div className="directions-content">
        <div className="directions-header">
          <span className="directions-header__label">ASOSIY YO‘NALISHLAR /</span>
        </div>

        <div className="directions-list" onMouseLeave={handleListMouseLeave}>
          {directions.map((item) => (
            <div
              key={item.id}
              className="direction-item"
              onMouseEnter={(e) => handleItemMouseEnter(e, item)}
              onMouseMove={(e) => handleItemMouseMove(e, item)}
            >
              <div className="direction-item__main">
                <span className="direction-item__number">{item.number}</span>

                {/* Empty slot next to number where Three.js cloth wave mesh positions itself */}
                <div className="direction-item__image-slot" />

                <h3 className="direction-item__title">{item.title}</h3>
                <p className="direction-item__desc">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Three.js Cloth Wave Ripple WebGL Canvas */}
        <DirectionPreviewWebGL
          activeDirection={activeDirection}
          activeSlotRect={activeSlotRect}
          directions={directions}
        />
      </div>
    </section>
  );
}
