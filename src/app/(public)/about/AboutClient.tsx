"use client";

import React, { useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRevealer } from "@/hooks/useRevealer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AboutSettings, AboutSection, AboutCareer } from "@/types/database";
import { parseAboutText, RenderAboutTokens } from "@/lib/aboutParser";
import "./about.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SLOT_CLASS_MAP: Record<number, string[]> = {
  0: ["slot-0-1", "slot-0-2", "slot-0-3"],
  1: ["slot-1-1", "slot-1-2", "slot-1-3"],
  2: ["slot-2-1", "slot-2-2", "slot-2-3"],
  3: ["slot-3-1", "slot-3-2"],
  4: ["slot-4-1", "slot-4-2"],
};

/**
 * Matn atrofida suzuvchi (parallax) rasm o'rni.
 * Agar imageUrl bo'lsa rasm ko'rinadi, bo'lmasa stilize qilingan placeholder.
 */
function ImageSlot({
  slotId,
  number,
  title,
  imageUrl,
  className = "",
}: {
  slotId: string;
  number: string;
  title: string;
  imageUrl?: string;
  className?: string;
}) {
  return (
    <div className={`floating-card ${className}`} data-slot={slotId}>
      <div className="floating-card-inner">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title || number}
            fill
            className="floating-card-img"
            sizes="(max-width: 768px) 150px, 280px"
          />
        ) : (
          <div className="slot-placeholder-content">
            <span className="slot-num">{number}</span>
            <span className="slot-title">{title}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AboutClient({ settings }: { settings: AboutSettings }) {
  useRevealer();
  const pageRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  const sections: AboutSection[] = settings.sections;
  const careerList: AboutCareer[] = settings.career_list;
  const resumeUrl = settings.resume_url;
  const resumeFilename = settings.resume_filename;
  const telegramUrl = settings.telegram_url;
  const telegramHandle = settings.telegram_handle;
  const email = settings.email;

  // Har bir chunk uchun tokenlarni hisoblash
  const parsedChunks = useMemo(() => {
    return sections.map((sec) => parseAboutText(sec.text));
  }, [sections]);

  useEffect(() => {
    let ctx: gsap.Context;

    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        const stage = stageRef.current;
        const stream = streamRef.current;
        if (!stage || !stream) return;

        const isMobile = window.innerWidth <= 768;
        const selector = isMobile ? ".word" : ".char";

        const items0 = gsap.utils.toArray<HTMLElement>(`#chunk-0 ${selector}`);
        const items1 = gsap.utils.toArray<HTMLElement>(`#chunk-1 ${selector}`);
        const items2 = gsap.utils.toArray<HTMLElement>(`#chunk-2 ${selector}`);
        const items3 = gsap.utils.toArray<HTMLElement>(`#chunk-3 ${selector}`);
        const items4 = gsap.utils.toArray<HTMLElement>(`#chunk-4 ${selector}`);

        const media0 = gsap.utils.toArray<HTMLElement>("#chunk-0 .credits-inline-media, #chunk-0 .credits-inline-badge");
        const media1 = gsap.utils.toArray<HTMLElement>("#chunk-1 .credits-inline-media, #chunk-1 .credits-inline-badge");
        const media2 = gsap.utils.toArray<HTMLElement>("#chunk-2 .credits-inline-media, #chunk-2 .credits-inline-badge");
        const media3 = gsap.utils.toArray<HTMLElement>("#chunk-3 .credits-inline-media, #chunk-3 .credits-inline-badge");
        const media4 = gsap.utils.toArray<HTMLElement>("#chunk-4 .credits-inline-media, #chunk-4 .credits-inline-badge");

        const float0 = gsap.utils.toArray<HTMLElement>("#chunk-0 .floating-card");
        const float1 = gsap.utils.toArray<HTMLElement>("#chunk-1 .floating-card");
        const float2 = gsap.utils.toArray<HTMLElement>("#chunk-2 .floating-card");
        const float3 = gsap.utils.toArray<HTMLElement>("#chunk-3 .floating-card");
        const float4 = gsap.utils.toArray<HTMLElement>("#chunk-4 .floating-card");

        const yShift = isMobile ? 10 : 16;

        // --------------------------------------------------------------------
        // 1. BOSHLANG'ICH HOLAT: Elementlar ko'rinmas
        // --------------------------------------------------------------------
        gsap.set(items0, { opacity: 0, y: yShift });
        if (media0.length > 0) gsap.set(media0, { opacity: 0, scale: 0.6, y: yShift });

        gsap.set([items1, items2, items3, items4], { opacity: 0, y: yShift });
        if (media1.length > 0) gsap.set(media1, { opacity: 0, scale: 0.6, y: yShift });
        if (media2.length > 0) gsap.set(media2, { opacity: 0, scale: 0.6, y: yShift });
        if (media3.length > 0) gsap.set(media3, { opacity: 0, scale: 0.6, y: yShift });
        if (media4.length > 0) gsap.set(media4, { opacity: 0, scale: 0.6, y: yShift });

        // Suzuvchi placeholder kartalari
        gsap.set(float0, { opacity: 0, scale: 0.8, y: isMobile ? 25 : 45 });
        gsap.set([float1, float2, float3, float4], { opacity: 0, scale: 0.8, y: isMobile ? 35 : 70 });

        // --------------------------------------------------------------------
        // 2. KIRISH ANIMATSIYASI: Sahifa ochilgach (qora parda ketgach ~1.3s da)
        // --------------------------------------------------------------------
        const introTl = gsap.timeline({ delay: 1.3 });

        introTl.to(items0, {
          opacity: 1,
          y: 0,
          stagger: isMobile ? 0.028 : 0.012,
          duration: 0.45,
          ease: "power2.out",
        });

        if (media0.length > 0) {
          introTl.to(
            media0,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              stagger: 0.1,
              duration: 0.5,
              ease: "back.out(1.8)",
            },
            "-=0.35"
          );
        }

        // Kirishdagi suzuvchi rasmlar paydo bo'ladi
        introTl.to(
          float0,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.75,
            ease: "power2.out",
          },
          "-=0.25"
        );

        // --------------------------------------------------------------------
        // 3. ANIQ GEOMETRIYA HISOBLASH
        // --------------------------------------------------------------------
        const vh = window.innerHeight;
        const chunkEls = [0, 1, 2, 3, 4].map((i) =>
          document.getElementById(`chunk-${i}`)
        );

        const centersInStream = chunkEls.map((el) => {
          if (!el) return 0;
          return el.offsetTop + el.offsetHeight / 2;
        });

        const streamYsForCenter = centersInStream.map((c) => 0.5 * vh - c);
        const finalTravel = Math.abs(streamYsForCenter[4]) + vh * 0.5;
        const timeCenters = streamYsForCenter.map(
          (ty) => (Math.abs(ty) / finalTravel) * 100
        );

        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: isMobile ? "+=5500" : "+=11500",
            pin: true,
            scrub: isMobile ? 0.35 : 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        scrollTl.to(
          stream,
          {
            y: -finalTravel,
            ease: "none",
            duration: 100,
          },
          0
        );

        // ====================================================================
        // CHUNK 0: Skroll boshlanishi bilan o'chadi + rasmlari yuqoriga suzib ketadi
        // ====================================================================
        scrollTl.to(
          items0,
          {
            opacity: 0,
            y: -yShift,
            stagger: isMobile ? (3.0 / Math.max(1, items0.length)) : 0.025,
            duration: 2.0,
            ease: "power1.in",
          },
          1.2
        );
        if (media0.length > 0) {
          scrollTl.to(
            media0,
            {
              opacity: 0,
              scale: 0.7,
              y: -yShift,
              stagger: 0.05,
              duration: 1.8,
              ease: "power1.in",
            },
            3.5
          );
        }
        scrollTl.to(
          float0,
          {
            opacity: 0,
            scale: 0.88,
            y: (i) => (i % 2 === 0 ? -60 : -100),
            stagger: 0.08,
            duration: 2.0,
            ease: "power1.in",
          },
          1.2
        );

        // ====================================================================
        // CHUNK 1: 1-gap ketishi bilanoq darhol kirib keladi
        // ====================================================================
        const tc1 = timeCenters[1];
        const enter1Start = Math.max(1.5, tc1 - 8.0);
        scrollTl.to(
          items1,
          {
            opacity: 1,
            y: 0,
            stagger: (6.0 / Math.max(1, items1.length)),
            duration: 2.0,
            ease: "power2.out",
          },
          enter1Start
        );
        if (media1.length > 0) {
          scrollTl.to(
            media1,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              stagger: 0.1,
              duration: 2.5,
              ease: "back.out(1.6)",
            },
            enter1Start + 3.0
          );
        }
        scrollTl.to(
          float1,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.15,
            duration: 2.2,
            ease: "power2.out",
          },
          enter1Start
        );
        scrollTl.to(
          items1,
          {
            opacity: 0,
            y: -yShift,
            stagger: (5.0 / Math.max(1, items1.length)),
            duration: 2.0,
            ease: "power1.in",
          },
          tc1 + 6.5
        );
        if (media1.length > 0) {
          scrollTl.to(
            media1,
            {
              opacity: 0,
              scale: 0.7,
              y: -yShift,
              stagger: 0.05,
              duration: 2.0,
              ease: "power1.in",
            },
            tc1 + 7.0
          );
        }
        scrollTl.to(
          float1,
          {
            opacity: 0,
            scale: 0.88,
            y: (i) => (i % 2 === 0 ? -70 : -120),
            stagger: 0.08,
            duration: 2.0,
            ease: "power1.in",
          },
          tc1 + 6.5
        );

        // ====================================================================
        // CHUNK 2: Markazga keladi, to'liq o'qiladi, so'ng o'chadi
        // ====================================================================
        const tc2 = timeCenters[2];
        const enter2Start = tc2 - 6.5;
        scrollTl.to(
          items2,
          {
            opacity: 1,
            y: 0,
            stagger: (5.5 / Math.max(1, items2.length)),
            duration: 2.0,
            ease: "power2.out",
          },
          enter2Start
        );
        if (media2.length > 0) {
          scrollTl.to(
            media2,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              stagger: 0.1,
              duration: 2.5,
              ease: "back.out(1.6)",
            },
            enter2Start + 3.5
          );
        }
        scrollTl.to(
          float2,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.15,
            duration: 2.2,
            ease: "power2.out",
          },
          enter2Start
        );
        scrollTl.to(
          items2,
          {
            opacity: 0,
            y: -yShift,
            stagger: (5.0 / Math.max(1, items2.length)),
            duration: 2.0,
            ease: "power1.in",
          },
          tc2 + 6.5
        );
        if (media2.length > 0) {
          scrollTl.to(
            media2,
            {
              opacity: 0,
              scale: 0.7,
              y: -yShift,
              stagger: 0.05,
              duration: 2.0,
              ease: "power1.in",
            },
            tc2 + 7.5
          );
        }
        scrollTl.to(
          float2,
          {
            opacity: 0,
            scale: 0.88,
            y: (i) => (i % 2 === 0 ? -80 : -130),
            stagger: 0.08,
            duration: 2.0,
            ease: "power1.in",
          },
          tc2 + 6.5
        );

        // ====================================================================
        // CHUNK 3: Markazga keladi, to'liq o'qiladi, so'ng o'chadi
        // ====================================================================
        const tc3 = timeCenters[3];
        const enter3Start = tc3 - 6.5;
        scrollTl.to(
          items3,
          {
            opacity: 1,
            y: 0,
            stagger: (5.5 / Math.max(1, items3.length)),
            duration: 2.0,
            ease: "power2.out",
          },
          enter3Start
        );
        if (media3.length > 0) {
          scrollTl.to(
            media3,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              stagger: 0.1,
              duration: 2.5,
              ease: "back.out(1.6)",
            },
            enter3Start + 3.5
          );
        }
        scrollTl.to(
          float3,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.15,
            duration: 2.2,
            ease: "power2.out",
          },
          enter3Start
        );
        scrollTl.to(
          items3,
          {
            opacity: 0,
            y: -yShift,
            stagger: (5.0 / Math.max(1, items3.length)),
            duration: 2.0,
            ease: "power1.in",
          },
          tc3 + 6.5
        );
        if (media3.length > 0) {
          scrollTl.to(
            media3,
            {
              opacity: 0,
              scale: 0.7,
              y: -yShift,
              stagger: 0.05,
              duration: 2.0,
              ease: "power1.in",
            },
            tc3 + 7.5
          );
        }
        scrollTl.to(
          float3,
          {
            opacity: 0,
            scale: 0.88,
            y: (i) => (i % 2 === 0 ? -75 : -125),
            stagger: 0.08,
            duration: 2.0,
            ease: "power1.in",
          },
          tc3 + 6.5
        );

        // ====================================================================
        // CHUNK 4: ENG OXIRGI GAP — MARKAZGA KELADI, TO'LIQ O'QILADI VA O'CHADI
        // ====================================================================
        const tc4 = timeCenters[4];
        const enter4Start = tc4 - 6.5;
        scrollTl.to(
          items4,
          {
            opacity: 1,
            y: 0,
            stagger: (5.5 / Math.max(1, items4.length)),
            duration: 2.0,
            ease: "power2.out",
          },
          enter4Start
        );
        if (media4.length > 0) {
          scrollTl.to(
            media4,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              stagger: 0.1,
              duration: 2.5,
              ease: "back.out(1.6)",
            },
            enter4Start + 3.5
          );
        }
        scrollTl.to(
          float4,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            stagger: 0.15,
            duration: 2.2,
            ease: "power2.out",
          },
          enter4Start
        );
        scrollTl.to(
          items4,
          {
            opacity: 0,
            y: -yShift,
            stagger: (5.0 / Math.max(1, items4.length)),
            duration: 2.0,
            ease: "power1.in",
          },
          tc4 + 6.5
        );
        if (media4.length > 0) {
          scrollTl.to(
            media4,
            {
              opacity: 0,
              scale: 0.7,
              y: -yShift,
              stagger: 0.05,
              duration: 2.0,
              ease: "power1.in",
            },
            tc4 + 7.5
          );
        }
        scrollTl.to(
          float4,
          {
            opacity: 0,
            scale: 0.88,
            y: (i) => (i % 2 === 0 ? -80 : -130),
            stagger: 0.08,
            duration: 2.0,
            ease: "power1.in",
          },
          tc4 + 6.5
        );
      }, pageRef);
    }, 60);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <>
      <div className="revealer"></div>
      <main ref={pageRef} className="story-page">
        {/* ================================================================
            KINO TITRLARI SAHNASI (Bitta yaxlit oqim, har bir jumla markazga keladi)
            ================================================================ */}
        <section ref={stageRef} className="credits-stage">
          <div className="credits-viewport">
            <div ref={streamRef} className="credits-stream">
              {sections.map((chunk, idx) => (
                <div key={chunk.id ?? idx} id={`chunk-${idx}`} className="credits-chunk">
                  {/* Suzuvchi vizual kartalar guruhi */}
                  <div className={`floating-media-group group-${idx}`}>
                    {chunk.floating_cards?.map((card, cIdx) => (
                      <ImageSlot
                        key={card.id || `${idx}-${cIdx}`}
                        slotId={card.id}
                        number={card.number}
                        title={card.title}
                        imageUrl={card.image_url}
                        className={SLOT_CLASS_MAP[idx]?.[cIdx] || ""}
                      />
                    ))}
                  </div>

                  {/* Dinamik matn (bold, inline rasm va nishonlar bilan) */}
                  <RenderAboutTokens
                    tokens={parsedChunks[idx] || []}
                    chunkIndex={idx}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            MINIMAL ISH TAJRIBASI VA CV YUKLAB OLISH
            ================================================================ */}
        <section className="story-bottom-section">
          <div className="story-timeline-container">
            <div className="story-timeline-header">
              <span>Ish tajriba</span>
              <span>2018 — 2026</span>
            </div>

            <div className="story-timeline-list">
              {careerList.map((item, idx) => (
                <div key={idx} className="story-timeline-row">
                  <span className="story-timeline-year">{item.year}</span>
                  <span className="story-timeline-company">{item.company}</span>
                  <span className="story-timeline-role">{item.role}</span>
                </div>
              ))}
            </div>

            {/* Resume va Aloqa */}
            <div className="story-footer-actions">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={resumeFilename}
                className="story-cv-btn"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download CV (PDF)</span>
              </a>

              <div className="story-footer-links">
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="story-footer-link"
                >
                  Telegram: {telegramHandle}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="story-footer-link"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
