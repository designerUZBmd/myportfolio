"use client";

import { useEffect } from "react";
import { useRevealer } from "@/hooks/useRevealer";
import Portfolio3DShowcase, {
  Category,
  PortfolioItem,
} from "@/components/portfolio/Portfolio3DShowcase";

export default function PortfolioClient({
  categories,
  items,
  activeCategory,
}: {
  categories: Category[];
  items: PortfolioItem[];
  activeCategory?: string;
}) {
  useRevealer();

  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;

    document.body.style.backgroundColor = "#f5fcff";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  return (
    <>
      <div className="revealer"></div>
      <Portfolio3DShowcase
        categories={categories}
        items={items}
        activeCategory={activeCategory}
      />
    </>
  );
}
