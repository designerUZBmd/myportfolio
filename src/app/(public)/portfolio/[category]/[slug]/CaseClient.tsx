"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useRevealer } from "@/hooks/useRevealer";
import { useNavigation } from "@/hooks/useNavigation";
import { GalleryMedia, CaseSection } from "@/types/database";
import "./CaseClient.css";

type CaseItem = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
  cover_type: "image" | "video";
  excerpt: string;
  is_featured?: boolean;
  categories?: {
    title: string;
    slug: string;
  } | null;
  gallery?: GalleryMedia[];
  sections?: CaseSection[];
};

type NextCaseItem = {
  id: string;
  title: string;
  slug: string;
  categories?:
    | {
        title: string;
        slug: string;
      }
    | {
        title: string;
        slug: string;
      }[]
    | null;
} | null;

export default function CaseClient({
  item,
  nextCase,
}: {
  item: CaseItem;
  nextCase?: NextCaseItem;
}) {
  useRevealer();
  const { handleNavigation } = useNavigation();
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroMediaRef = useRef<HTMLDivElement>(null);

  const nextCatSlug = Array.isArray(nextCase?.categories)
    ? nextCase?.categories[0]?.slug
    : (nextCase?.categories as { slug?: string } | null)?.slug || "design";
  const nextHref = nextCase?.slug ? `/portfolio/${nextCatSlug}/${nextCase.slug}` : null;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (heroContentRef.current) {
      gsap.fromTo(
        heroContentRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.1,
        }
      );
    }

    if (heroMediaRef.current) {
      gsap.fromTo(
        heroMediaRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.2,
        }
      );
    }
  }, []);

  return (
    <>
      <div className="revealer"></div>
      <main className="case-page">
        <div className="case-split">
          {/* 1. LEFT FIXED PANEL (~28% width with Sky-Blue Brand Gradient) */}
          <aside className="case-split__left">
            <div ref={heroContentRef} className="case-split__left-inner">
              <h1 className="case-split__title">{item.title}</h1>
              {item.excerpt && <p className="case-split__excerpt">{item.excerpt}</p>}
            </div>
          </aside>

          {/* 2. RIGHT SCROLLABLE AREA (~72% width: Cover Media, Sections, Visual Showcase) */}
          <section className="case-split__right">
            {/* Main Cover (Uncropped, crisp, 0px border-radius) */}
            <div ref={heroMediaRef} className="case-right__cover">
              {item.cover_type === "video" ? (
                <video
                  src={item.cover_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={item.cover_url}
                  alt={item.title}
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 992px) 100vw, 72vw"
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>

            {/* Case Body: Sections & Gallery */}
            <div className="case-right__body">
              {/* Sections (Problem, Solution, etc.) */}
              {item.sections && item.sections.length > 0 && (
                <div className="case-sections">
                  {item.sections.map((section: CaseSection, i: number) => (
                    <div key={i} className="case-section-item">
                      <h2 className="case-section-title">{section.title}</h2>
                      <p className="case-section-content">{section.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Visual Showcase Gallery */}
              {item.gallery && item.gallery.length > 0 && (
                <div className="case-gallery-section">
                  <h2 className="case-gallery-heading">Visual Showcase</h2>
                  <div className="case-gallery-grid">
                    {item.gallery.map((media: GalleryMedia, i: number) => (
                      <div key={i} className="case-gallery-item">
                        {media.type === "video" ? (
                          <video src={media.url} controls width="100%" />
                        ) : (
                          <Image
                            src={media.url}
                            alt={`${item.title} visual ${i + 1}`}
                            width={1600}
                            height={1000}
                            style={{ width: "100%", height: "auto" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Full-width Black Footer Navigation Bar */}
            <footer className="case-footer-bar">
              <div className="case-footer-bar__inner">
                <Link
                  href="/portfolio"
                  className="case-footer-bar__link case-footer-bar__link--prev"
                  onClick={handleNavigation("/portfolio")}
                >
                  <span className="case-footer-bar__arrow">←</span>
                  <span className="case-footer-bar__text">Barcha loyihalarga qaytish</span>
                </Link>

                {nextHref && nextCase && (
                  <Link
                    href={nextHref}
                    className="case-footer-bar__link case-footer-bar__link--next"
                    onClick={handleNavigation(nextHref)}
                  >
                    <span className="case-footer-bar__text">
                      Keyingi loyihaga o‘tish
                      {nextCase.title ? (
                        <span className="case-footer-bar__sub"> / {nextCase.title}</span>
                      ) : null}
                    </span>
                    <span className="case-footer-bar__arrow">→</span>
                  </Link>
                )}
              </div>
            </footer>
          </section>
        </div>
      </main>
  </>
  );
}
