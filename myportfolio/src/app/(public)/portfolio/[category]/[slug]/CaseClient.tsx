"use client";
import { useRevealer } from "@/hooks/useRevealer";
import Image from "next/image";

export default function CaseClient({ item }: { item: any }) {
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
        {item.gallery && (
          <section>
            <h2>Gallery</h2>
            <div style={{ display: "grid", gap: 24 }}>
              {item.gallery.map((media: any, i: number) => (
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
        {item.sections && (
          <section>
            {item.sections.map((section: any, i: number) => (
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
