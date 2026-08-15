export interface Category {
  id: string;
  title: string;
  slug: string;
  order: number;
  is_active: boolean;
  created_at?: string;
}

export interface GalleryMedia {
  type: "image" | "video";
  url: string;
}

export interface CaseSection {
  title: string;
  content: string;
}

export interface PortfolioCase {
  id: string;
  title: string;
  slug: string;
  category_id?: string;
  year: number;
  cover_url: string;
  cover_type: "image" | "video";
  excerpt: string;
  description?: string;
  is_published: boolean;
  is_featured: boolean;
  order?: number;
  gallery?: GalleryMedia[];
  sections?: CaseSection[];
  created_at?: string;
  categories?: {
    id: string;
    title: string;
    slug: string;
  } | {
    id: string;
    title: string;
    slug: string;
  }[] | null;
}

export interface GallerySection {
  id: string;
  title: string;
  order?: number;
  created_at?: string;
  items?: GalleryItem[];
}

export interface GalleryItem {
  id: string;
  section_id: string;
  type: "image" | "video";
  url: string;
  order?: number;
  created_at?: string;
}
