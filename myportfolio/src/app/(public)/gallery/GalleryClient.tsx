"use client";

import { useRevealer } from "@/hooks/useRevealer";

export default function GalleryClient({
  sections,
}: {
  sections: {
    id: string;
    title: string;
    items: any[];
  }[];
}) {
  useRevealer();

  return (
    <>
      <div className="revealer"></div>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
        <h1>Gallery</h1>

        {sections.map((section) =>
          section.items.length ? (
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
                    <img key={item.id} src={item.url} />
                  ) : (
                    <video key={item.id} src={item.url} controls />
                  ),
                )}
              </div>
            </section>
          ) : null,
        )}
      </main>
    </>
  );
}
