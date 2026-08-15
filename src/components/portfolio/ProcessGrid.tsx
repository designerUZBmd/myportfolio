"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import "./ProcessGrid.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProcessGridProps {
  text?: string;
}

export default function ProcessGrid({
  text = "Foydalanuvchi muammosidan boshlab, dizayn va texnik yechimlargacha bo'lgan jarayon. Har bir qaror real ehtiyoj va aniq natijaga asoslanadi.",
}: ProcessGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);

  const img1Ref = useRef<HTMLDivElement>(null);
  const img2Ref = useRef<HTMLDivElement>(null);
  const img3Ref = useRef<HTMLDivElement>(null);

  const textRef = useRef<HTMLParagraphElement>(null);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // --- Card 1: Top-to-Bottom Clip Reveal + Deep Parallax ---
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
          card1Ref.current,
          { yPercent: 35 },
          {
            yPercent: -45,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );

        gsap.fromTo(
          img1Ref.current,
          { yPercent: -25 },
          {
            yPercent: 25,
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

      // --- Card 2: Top-to-Bottom Clip Reveal + Parallax ---
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
          card2Ref.current,
          { yPercent: 55 },
          {
            yPercent: -35,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          }
        );

        gsap.fromTo(
          img2Ref.current,
          { yPercent: -25 },
          {
            yPercent: 25,
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

      // --- Card 3: Top-to-Bottom Clip Reveal + Parallax ---
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
          card3Ref.current,
          { yPercent: 40 },
          {
            yPercent: -30,
            ease: "none",
            scrollTrigger: {
              trigger: card3Ref.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );

        gsap.fromTo(
          img3Ref.current,
          { yPercent: -25 },
          {
            yPercent: 25,
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

      // Re-triggerable Text reveal trigger
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
    }, container);

    return () => ctx.revert();
  }, []);

  const words = text.split(" ");

  return (
    <section ref={containerRef} className="process-grid">
      <div className="process-grid__top">
        <div ref={card1Ref} className="process-grid__card process-grid__card--1">
          <div ref={img1Ref} className="process-grid__image-wrapper">
            <Image
              src="/images/process1.jpg"
              alt="Design Process 1"
              fill
              className="process-grid__image"
              sizes="(max-width: 992px) 100vw, 50vw"
            />
          </div>
        </div>

        <div ref={card2Ref} className="process-grid__card process-grid__card--2">
          <div ref={img2Ref} className="process-grid__image-wrapper">
            <Image
              src="/images/process2.jpg"
              alt="Design Process 2"
              fill
              className="process-grid__image"
              sizes="(max-width: 992px) 100vw, 40vw"
            />
          </div>
        </div>
      </div>

      <div className="process-grid__bottom">
        <div ref={card3Ref} className="process-grid__card process-grid__card--3">
          <div ref={img3Ref} className="process-grid__image-wrapper">
            <Image
              src="/images/process3.jpg"
              alt="Design Process 3"
              fill
              className="process-grid__image"
              sizes="(max-width: 992px) 100vw, 30vw"
            />
          </div>
        </div>

        <div className="process-grid__text-container">
          <p ref={textRef} className="process-grid__text">
            {words.map((word, i) => (
              <React.Fragment key={i}>
                <span
                  className={`process-grid__word ${textVisible ? "is-visible" : ""}`}
                  style={{
                    transitionDelay: `${i * 0.04}s`,
                  }}
                >
                  {word}
                </span>
                {i < words.length - 1 && " "}
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
