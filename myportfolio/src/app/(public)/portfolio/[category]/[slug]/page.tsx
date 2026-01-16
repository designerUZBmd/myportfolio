import Image from "next/image";

type Props = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

async function getCase(slug: string) {
  const res = await fetch(
    `http://localhost:3000/api/portfolio?slug=${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function CaseDetailPage({ params }: Props) {
  // 🔥 MUHIM QATOR
  const { slug } = await params;

  const item = await getCase(slug);

  if (!item) {
    return <h1>Case not found</h1>;
  }

  return (
    <article style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>{item.title}</h1>
      <p>{item.year}</p>

      {item.coverMedia.type === "image" ? (
        <Image
          src={item.coverMedia.url}
          alt={item.title}
          width={900}
          height={500}
        />
      ) : (
        <video src={item.coverMedia.url} controls width="100%" />
      )}

      <p>{item.excerpt}</p>

      {/* Gallery */}
      <section>
        {item.gallery?.map((media: any, i: number) => (
          <div key={i}>
            {media.type === "image" ? (
              <Image src={media.url} alt="" width={800} height={450} />
            ) : (
              <video src={media.url} controls width="100%" />
            )}
          </div>
        ))}
      </section>

      {/* Sections */}
      <section>
        {item.sections?.map((section: any, i: number) => (
          <div key={i}>
            <h3>{section.title}</h3>
            <p>{section.content}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
