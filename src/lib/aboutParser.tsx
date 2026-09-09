import React from "react";
import Image from "next/image";

export interface TextToken {
  type: "text" | "bold" | "image" | "badge";
  content: string;
}

/**
 * Matn ichidagi **bold**, [img: url], [badge: matn] tokenlarini ajratuvchi funksiya.
 */
export function parseAboutText(raw: string): TextToken[] {
  if (!raw) return [];
  // Tokenlarni ajratish regexi
  const regex = /(\*\*[\s\S]*?\*\*|\[img:\s*[^\]]+\]|\[badge:\s*[^\]]+\])/g;
  const parts = raw.split(regex);
  const tokens: TextToken[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      tokens.push({
        type: "bold",
        content: part.slice(2, -2),
      });
    } else if (part.startsWith("[img:") && part.endsWith("]")) {
      const url = part.slice(5, -1).trim();
      if (url) {
        tokens.push({
          type: "image",
          content: url,
        });
      }
    } else if (part.startsWith("[badge:") && part.endsWith("]")) {
      const badgeText = part.slice(7, -1).trim();
      if (badgeText) {
        tokens.push({
          type: "badge",
          content: badgeText,
        });
      }
    } else {
      tokens.push({
        type: "text",
        content: part,
      });
    }
  }

  return tokens;
}

/**
 * Matnlarni so'z va harflarga ajratuvchi komponent.
 * Har bir harf alohida span.char bo'lib chiqadi.
 * So'zlar qator oxirida noo'rin sinmasligi uchun span.word ichida turadi.
 */
export function CharSpan({ text, bold = false }: { text: string; bold?: boolean }) {
  const tokens = text.match(/\S+|\s+/g) || [];

  return (
    <>
      {tokens.map((token, tIdx) => {
        if (/^\s+$/.test(token)) {
          return (
            <span key={`s-${tIdx}`} className="credits-space">
              {" "}
            </span>
          );
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

/**
 * Pars qilingan tokenlarni About page stillariga mos render qilish.
 */
export function RenderAboutTokens({
  tokens,
  chunkIndex,
}: {
  tokens: TextToken[];
  chunkIndex: number;
}) {
  return (
    <>
      {tokens.map((token, idx) => {
        if (token.type === "text") {
          return <CharSpan key={`t-${chunkIndex}-${idx}`} text={token.content} bold={false} />;
        }
        if (token.type === "bold") {
          return <CharSpan key={`b-${chunkIndex}-${idx}`} text={token.content} bold={true} />;
        }
        if (token.type === "image") {
          return (
            <span key={`m-${chunkIndex}-${idx}`} className="credits-inline-media">
              <Image
                src={token.content}
                alt=""
                fill
                className="credits-inline-img"
                sizes="160px"
                priority={chunkIndex === 0}
              />
            </span>
          );
        }
        if (token.type === "badge") {
          const hasStar = token.content.includes("★");
          const displayText = token.content.replace("★", "").trim();
          return (
            <span key={`bdg-${chunkIndex}-${idx}`} className="credits-inline-badge">
              {hasStar && <span className="credits-inline-star">★</span>}
              {" "}{displayText}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}
