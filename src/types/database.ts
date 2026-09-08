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

export interface Direction {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HomeSettings {
  id: string;
  hero_label: string;
  hero_image: string;
  hero_bio: string;
  process_text: string;
  process_images: string[];
  portfolio_btn_title?: string;
  portfolio_btn_category?: string;
  portfolio_btn_year?: string;
  directions_marquee_images?: string[];
  editorial_image_left?: string;
  editorial_image_tall?: string;
  editorial_image_short1?: string;
  editorial_image_short2?: string;
  directions_statement?: string;
  directions_label?: string;
  brands_label?: string;
  footer_label: string;
  footer_statement: string;
  updated_at?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string;
  height: number;
  order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}


