"use client";

import Image from "next/image";
import { useRevealer } from "@/hooks/useRevealer";
import { GalleryItem } from "@/types/database";

interface GallerySectionWithItems {
  id: string;
  title: string;
  items: GalleryItem[];
}

export default function GalleryClient({
  sections,
}: {
  sections: GallerySectionWithItems[];
}) {
  useRevealer();

  return (
    <>
      <div className="revealer"></div>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
        <h1>Gallery</h1>

        {sections.map((section) =>
          section.items && section.items.length > 0 ? (
            <section key={section.id} style={{ marginTop: 48 }}>
              <h2>{section.title}</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                {section.items.map((item) =>
                  item.type === "image" ? (
                    <div
                      key={item.id}
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16/10",
                        overflow: "hidden",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      <Image
                        src={item.url}
                        alt={section.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <video
                      key={item.id}
                      src={item.url}
                      controls
                      style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }}
                    />
                  )
                )}
              </div>
            </section>
          ) : null
        )}
      </main>
    </>
  );
}
