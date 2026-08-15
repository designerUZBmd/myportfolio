"use client";
import { useRevealer } from "@/hooks/useRevealer";
import Image from "next/image";
import { GalleryMedia, CaseSection } from "@/types/database";

type CaseItem = {
  id: string;
  title: string;
  year: number;
  cover_url: string;
  cover_type: "image" | "video";
  excerpt: string;
  gallery?: GalleryMedia[];
  sections?: CaseSection[];
};

export default function CaseClient({ item }: { item: CaseItem }) {
  useRevealer();

  return (
    <>
      <div className="revealer"></div>
      <article style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Title */}
        <h1>{item.title}</h1>
        <p>{item.year}</p>

        {/* Cover */}
        {item.cover_type === "image" ? (
          <Image
            src={item.cover_url}
            alt={item.title}
            width={900}
            height={500}
          />
        ) : (
          <video src={item.cover_url} controls width="100%" />
        )}

        {/* Excerpt */}
        <p>{item.excerpt}</p>

        {/* Gallery */}
        {item.gallery && item.gallery.length > 0 && (
          <section>
            <h2>Gallery</h2>
            <div style={{ display: "grid", gap: 24 }}>
              {item.gallery.map((media: GalleryMedia, i: number) => (
                <div key={i}>
                  {media.type === "image" ? (
                    <Image src={media.url} alt="" width={800} height={450} />
                  ) : (
                    <video src={media.url} controls width="100%" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        {item.sections && item.sections.length > 0 && (
          <section>
            {item.sections.map((section: CaseSection, i: number) => (
              <div key={i}>
                <h3>{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))}
          </section>
        )}
      </article>
    </>
  );
}
