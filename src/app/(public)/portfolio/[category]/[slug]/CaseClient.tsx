"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
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

export default function CaseClient({ item }: { item: CaseItem }) {
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (heroContentRef.current) {
      gsap.fromTo(
        heroContentRef.current.children,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.1,
        }
      );
    }
  }, []);

  const categoryTitle = item.categories?.title || "Product Design";

  return (
    <main className="case-page">
      {/* 1. FULL-SCREEN SEAMLESS HERO (Matches the expanded 3D card image) */}
      <section className="case-hero">
        <div className="case-hero__media">
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
              style={{ objectFit: "cover" }}
            />
          )}
        </div>

        <div className="case-hero__gradient" />

        {/* Top bar with Back Button */}
        <div className="case-hero__top">
          <Link href="/portfolio" className="case-hero__back-btn">
            <span>←</span>
            <span>All Projects</span>
          </Link>

          <span className="case-hero__year-badge">{item.year}</span>
        </div>

        {/* Hero Bottom Headline & Excerpt */}
        <div ref={heroContentRef} className="case-hero__bottom">
          <div className="case-hero__category">{categoryTitle}</div>
          <h1 className="case-hero__title">{item.title}</h1>
          {item.excerpt && <p className="case-hero__excerpt">{item.excerpt}</p>}
        </div>
      </section>

      {/* 2. EDITORIAL BODY CONTENT */}
      <div className="case-body">
        {/* Project Metadata Grid */}
        <div className="case-meta-grid">
          <div className="case-meta-item">
            <span className="case-meta-label">Client</span>
            <p className="case-meta-value">{item.title}</p>
          </div>

          <div className="case-meta-item">
            <span className="case-meta-label">Service</span>
            <p className="case-meta-value">{categoryTitle}</p>
          </div>

          <div className="case-meta-item">
            <span className="case-meta-label">Year</span>
            <p className="case-meta-value">{item.year}</p>
          </div>

          <div className="case-meta-item">
            <span className="case-meta-label">Recognition</span>
            <p className="case-meta-value">
              {item.is_featured
                ? "Featured Project\nAwwwards Nominee"
                : "Digital Experience\nCreative Interface"}
            </p>
          </div>
        </div>

        {/* Case Sections */}
        {item.sections && item.sections.length > 0 && (
          <section className="case-sections">
            {item.sections.map((section: CaseSection, i: number) => (
              <div key={section.id || i} className="case-section-item">
                <h2 className="case-section-title">{section.title}</h2>
                <p className="case-section-content">{section.content}</p>
              </div>
            ))}
          </section>
        )}

        {/* Gallery */}
        {item.gallery && item.gallery.length > 0 && (
          <section className="case-gallery-section">
            <h2 className="case-gallery-heading">Visual Showcase</h2>
            <div className="case-gallery-grid">
              {item.gallery.map((media: GalleryMedia, i: number) => (
                <div key={media.id || i} className="case-gallery-item">
                  {media.type === "video" ? (
                    <video src={media.url} controls width="100%" />
                  ) : (
                    <Image
                      src={media.url}
                      alt={`${item.title} gallery ${i + 1}`}
                      width={1200}
                      height={750}
                      style={{ width: "100%", height: "auto" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
