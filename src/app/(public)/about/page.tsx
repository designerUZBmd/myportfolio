"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useRevealer } from "@/hooks/useRevealer";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./about.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CareerEntry {
  year: string;
  company: string;
  role: string;
}

const CAREER_LIST: CareerEntry[] = [
  { year: "2025 — 2026", company: "KDB Bank Uzbekistan", role: "UX/UI Designer" },
  { year: "2024 — 2025", company: "Unity ELD / NTP Freight", role: "Product & 3D Designer" },
  { year: "2023 — 2024", company: "BRO-STOREE (MacBro)", role: "Graphic, Web & Motion Designer" },
  { year: "2023", company: "Toshkent Davlat Iqtisodiyot Universiteti (TSUE)", role: "Full Stack Designer" },
  { year: "2021 — 2022", company: "Novas Studio", role: "UX/UI & 3D Designer" },
  { year: "2020 — 2021", company: "605 Creative Agency", role: "Brand Designer & Art Director" },
  { year: "2019 — 2020", company: "KDB Bank Uzbekistan", role: "UI/UX Web Designer" },
  { year: "2019 — 2020", company: "Silkroad Express", role: "SMM, UI/UX & Graphic Designer" },
  { year: "2018 — 2019", company: "YUZ1", role: "UI/UX Web Designer" },
];

/**
 * Matnlarni so'z va harflarga ajratuvchi komponent.
 * Har bir harf alohida span.char bo'lib chiqadi.
 * So'zlar qator oxirida noo'rin sinmasligi uchun span.word ichida turadi.
 */
function CharSpan({ text, bold = false }: { text: string; bold?: boolean }) {
  const tokens = text.match(/\S+|\s+/g) || [];

  return (
    <>
      {tokens.map((token, tIdx) => {
        if (/^\s+$/.test(token)) {
          return token.split("").map((_, sIdx) => (
            <span key={`s-${tIdx}-${sIdx}`} className="char char-space">
              &nbsp;
            </span>
          ));
        }

        return (
          <span key={`w-${tIdx}`} className={`word ${bold ? "word-bold" : ""}`}>
            {token.split("").map((c, cIdx) => (
              <span key={`c-${tIdx}-${cIdx}`} className={`char ${bold ? "char-bold" : ""}`}>
                {c}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}

export default function AboutPage() {
  useRevealer();
  const pageRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const stage = stageRef.current;
        const stream = streamRef.current;
        if (!stage || !stream) return;

        const chars0 = gsap.utils.toArray<HTMLElement>("#chunk-0 .char");
        const chars1 = gsap.utils.toArray<HTMLElement>("#chunk-1 .char");
        const chars2 = gsap.utils.toArray<HTMLElement>("#chunk-2 .char");
        const chars3 = gsap.utils.toArray<HTMLElement>("#chunk-3 .char");
        const chars4 = gsap.utils.toArray<HTMLElement>("#chunk-4 .char");

        // --------------------------------------------------------------------
        // 1. BOSHLANG'ICH HOLAT: Harflar to'liq ko'rinmas (opacity: 0, y: 16)
        // --------------------------------------------------------------------
        gsap.set(chars0, { opacity: 0, y: 16 });
        gsap.set("#inline-media-0", { opacity: 0, scale: 0.6, y: 16 });

        gsap.set([chars1, chars2, chars3, chars4], { opacity: 0, y: 16 });
        gsap.set("#inline-media-2", { opacity: 0, scale: 0.6, y: 16 });
        gsap.set("#inline-badge-3", { opacity: 0, scale: 0.6, y: 16 });

        // --------------------------------------------------------------------
        // 2. KIRISH ANIMATSIYASI: Sahifa ochilgach (qora parda ketgach ~1.3s da)
        // --------------------------------------------------------------------
        const introTl = gsap.timeline({ delay: 1.3 });

        introTl.to(chars0, {
          opacity: 1,
          y: 0,
          stagger: 0.012,
          duration: 0.45,
          ease: "power2.out",
        });

        introTl.to(
          "#inline-media-0",
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.8)",
          },
          "-=0.35"
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

        const isMobile = window.innerWidth <= 768;
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: isMobile ? "+=6200" : "+=11500",
            pin: true,
            scrub: isMobile ? 1.0 : 1.4,
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
        // CHUNK 0: Skroll boshlanishi bilan o'chadi
        // ====================================================================
        scrollTl.to(
          chars0,
          {
            opacity: 0,
            y: -16,
            stagger: 0.025,
            duration: 2.0,
            ease: "power1.in",
          },
          1.2
        );
        scrollTl.to(
          "#inline-media-0",
          {
            opacity: 0,
            scale: 0.7,
            y: -16,
            duration: 1.8,
            ease: "power1.in",
          },
          3.5
        );

        // ====================================================================
        // CHUNK 1: 1-gap ketishi bilanoq darhol kirib keladi (uzilishsiz)
        // ====================================================================
        const tc1 = timeCenters[1];
        const enter1Start = Math.max(1.5, tc1 - 8.0);
        scrollTl.to(
          chars1,
          {
            opacity: 1,
            y: 0,
            stagger: (6.0 / chars1.length),
            duration: 2.0,
            ease: "power2.out",
          },
          enter1Start
        );
        scrollTl.to(
          chars1,
          {
            opacity: 0,
            y: -16,
            stagger: (5.0 / chars1.length),
            duration: 2.0,
            ease: "power1.in",
          },
          tc1 + 6.5
        );

        // ====================================================================
        // CHUNK 2: Markazga keladi + 3D rasm, to'liq o'qiladi, so'ng o'chadi
        // ====================================================================
        const tc2 = timeCenters[2];
        const enter2Start = tc2 - 6.5;
        scrollTl.to(
          chars2,
          {
            opacity: 1,
            y: 0,
            stagger: (5.5 / chars2.length),
            duration: 2.0,
            ease: "power2.out",
          },
          enter2Start
        );
        scrollTl.to(
          "#inline-media-2",
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 2.5,
            ease: "back.out(1.6)",
          },
          enter2Start + 3.5
        );
        scrollTl.to(
          chars2,
          {
            opacity: 0,
            y: -16,
            stagger: (5.0 / chars2.length),
            duration: 2.0,
            ease: "power1.in",
          },
          tc2 + 6.5
        );
        scrollTl.to(
          "#inline-media-2",
          {
            opacity: 0,
            scale: 0.7,
            y: -16,
            duration: 2.0,
            ease: "power1.in",
          },
          tc2 + 7.5
        );

        // ====================================================================
        // CHUNK 3: Markazga keladi + Cannes nishoni, to'liq o'qiladi, so'ng o'chadi
        // ====================================================================
        const tc3 = timeCenters[3];
        const enter3Start = tc3 - 6.5;
        scrollTl.to(
          chars3,
          {
            opacity: 1,
            y: 0,
            stagger: (5.5 / chars3.length),
            duration: 2.0,
            ease: "power2.out",
          },
          enter3Start
        );
        scrollTl.to(
          "#inline-badge-3",
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 2.5,
            ease: "back.out(1.6)",
          },
          enter3Start + 3.5
        );
        scrollTl.to(
          chars3,
          {
            opacity: 0,
            y: -16,
            stagger: (5.0 / chars3.length),
            duration: 2.0,
            ease: "power1.in",
          },
          tc3 + 6.5
        );
        scrollTl.to(
          "#inline-badge-3",
          {
            opacity: 0,
            scale: 0.7,
            y: -16,
            duration: 2.0,
            ease: "power1.in",
          },
          tc3 + 7.5
        );

        // ====================================================================
        // CHUNK 4: ENG OXIRGI GAP — MARKAZGA KELADI, TO'LIQ O'QILADI VA O'CHADI
        // ====================================================================
        const tc4 = timeCenters[4];
        const enter4Start = tc4 - 6.5;
        scrollTl.to(
          chars4,
          {
            opacity: 1,
            y: 0,
            stagger: (5.5 / chars4.length),
            duration: 2.0,
            ease: "power2.out",
          },
          enter4Start
        );
        scrollTl.to(
          chars4,
          {
            opacity: 0,
            y: -16,
            stagger: (5.0 / chars4.length),
            duration: 2.0,
            ease: "power1.in",
          },
          tc4 + 6.5
        );
      }, pageRef);

      return () => ctx.revert();
    }, 60);

    return () => clearTimeout(timer);
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
              {/* CHUNK 0: Kirish jumlasi — Sahifa ochilganda o'zi yoziladi */}
              <div id="chunk-0" className="credits-chunk">
                <CharSpan text="Salom. Men " />
                <CharSpan text="Muhammad Obloqulov" bold />
                <span id="inline-media-0" className="credits-inline-media">
                  <Image
                    src="/images/photo.jpg"
                    alt="Muhammad Obloqulov"
                    fill
                    className="credits-inline-img"
                    sizes="120px"
                    priority
                  />
                </span>
                <CharSpan text=" — raqamli mahsulotlar va 3D tajribalarni loyihalashtiruvchi dizaynerman. Mening yo‘lim 2018-yilda, ilk bor interfeyslar va inson tajribasiga qiziqib qolganimda boshlangan." />
              </div>

              {/* CHUNK 1: Bank va tizimlar — Skroll bilan bitta oqimda keladi */}
              <div id="chunk-1" className="credits-chunk">
                <CharSpan text="Dastlab oddiy veb-sahifalardan boshlab, yillar davomida murakkab korporativ ekotizimlargacha bo‘lgan yo‘lni bosib o‘tdim. Har kuni minglab insonlar va soha mutaxassislari foydalanadigan " />
                <CharSpan text="bank ilovalari, ichki boshqaruv vositalari" bold />
                <CharSpan text=" hamda " />
                <CharSpan text="internet-banking tizimlarini" bold />
                <CharSpan text=" loyihalashtirdim." />
              </div>

              {/* CHUNK 2: 3D modellashtirish — Skroll bilan bitta oqimda keladi */}
              <div id="chunk-2" className="credits-chunk">
                <CharSpan text="Lekin men uchun dizayn faqat 2D ekranlar bilan cheklanmaydi. Men mahsulotlarni " />
                <CharSpan text="3D modellashtirish, fazoviy chuqurlik va vizualizatsiyani" bold />
                <CharSpan text=" yaxshi ko‘raman." />
                <span id="inline-media-2" className="credits-inline-media">
                  <Image
                    src="/images/process2.jpg"
                    alt="3D Visualization"
                    fill
                    className="credits-inline-img"
                    sizes="120px"
                  />
                </span>
                <CharSpan text=" Logistika kompaniyalarining murakkab tizimlari va veb-saytlarini jonlantirishda 3D elementlardan faol foydalanaman." />
              </div>

              {/* CHUNK 3: Cannes festivali — Skroll bilan bitta oqimda keladi */}
              <div id="chunk-3" className="credits-chunk">
                <CharSpan text="2022-yilda ijodiy izlanishlarim xalqaro " />
                <CharSpan text="Young Lions Cannes" bold />
                <CharSpan text=" festivali elektron sertifikati bilan e'tirof etildi." />
                <span id="inline-badge-3" className="credits-inline-badge">
                  <span className="credits-inline-star">★</span> Cannes Young Lions &apos;22
                </span>
                <CharSpan text=" Har bir loyihada estetikani funksionallik va biznes natijasi bilan muvozanatda ushlashga harakat qilaman." />
              </div>

              {/* CHUNK 4: Falsafa va maqsad — Skroll bilan bitta oqimda keladi */}
              <div id="chunk-4" className="credits-chunk">
                <CharSpan text="Bugun men murakkab muammolarni " />
                <CharSpan text="sodda, nafis va esda qolarli mahsulotlarga" bold />
                <CharSpan text=" aylantirishda davom etmoqdaman. Har bir piksel, har bir harakat va har bir tajriba — mukammallikka bo‘lgan intilishimdir." />
              </div>
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
              {CAREER_LIST.map((item, idx) => (
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
                href="/resume/Obloqulov%20Muhammad.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download="Obloqulov_Muhammad_Resume.pdf"
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
                  href="https://t.me/obloqulo_v"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="story-footer-link"
                >
                  Telegram: @obloqulo_v
                </a>
                <a
                  href="mailto:muhammad1obloqulov@gmail.com"
                  className="story-footer-link"
                >
                  muhammad1obloqulov@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
