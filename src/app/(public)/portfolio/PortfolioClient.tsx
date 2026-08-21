"use client";

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
