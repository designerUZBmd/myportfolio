"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useNavigation } from "@/hooks/useNavigation";
import { PortfolioCase } from "@/types/database";
import ProjectPreviewWebGL from "./ProjectPreviewWebGL";
import "./ProjectList.css";

export interface ProjectItemData {
  id: string;
  title: string;
  category: string;
  year: string;
  image: string;
  href: string;
}

const defaultProjects: ProjectItemData[] = [
  {
    id: "ntp-uz",
    title: "NTP.UZ",
    category: "UX/UI & Web Design",
    year: "2025",
    image: "/images/process1.jpg",
    href: "/portfolio/web-design/ntp-uz",
  },
  {
    id: "fintech-app",
    title: "PAYME FINTECH",
    category: "Mobile Banking UX/UI",
    year: "2024",
    image: "/images/process2.jpg",
    href: "/portfolio/mobile/payme-fintech",
  },
  {
    id: "logistics-hub",
    title: "EXPRESS CARGO",
    category: "Dashboard & System Design",
    year: "2024",
    image: "/images/process3.jpg",
    href: "/portfolio/system-design/express-cargo",
  },
  {
    id: "nova-ai",
    title: "NOVA AI PLATFORM",
    category: "Product Design & Interface",
    year: "2024",
    image: "/images/process1.jpg",
    href: "/portfolio/product-design/nova-ai",
  },
  {
    id: "apex-ecommerce",
    title: "APEX E-COMMERCE",
    category: "Web Experience & Identity",
    year: "2023",
    image: "/images/process2.jpg",
    href: "/portfolio/web-design/apex-ecommerce",
  },
  {
    id: "urban-spaces",
    title: "URBAN SPACES",
    category: "3D & Digital Architecture",
    year: "2023",
    image: "/images/process3.jpg",
    href: "/portfolio/system-design/urban-spaces",
  },
];

export default function ProjectList({
  initialProjects,
}: {
  initialProjects?: ProjectItemData[];
}) {
  const { handleNavigation } = useNavigation();
  const [projectsList, setProjectsList] = useState<ProjectItemData[]>(
    initialProjects || defaultProjects
  );
  const [activeProject, setActiveProject] = useState<ProjectItemData | null>(null);

  useEffect(() => {
    async function loadRealProjects() {
      try {
        const { data, error } = await supabase
          .from("portfolio_cases")
          .select(`
            id,
            title,
            slug,
            year,
            cover_url,
            cover_type,
            excerpt,
            is_published,
            is_featured,
            categories ( id, title, slug )
          `)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          const cases = data as unknown as PortfolioCase[];
          const mapped: ProjectItemData[] = cases.map((item) => {
            const cat = Array.isArray(item.categories)
              ? item.categories[0]
              : item.categories;
            const categorySlug = cat?.slug || "general";
            const categoryTitle = cat?.title || "Design";

            return {
              id: item.id,
              title: item.title,
              category: categoryTitle,
              year: item.year ? String(item.year) : "",
              image: item.cover_url || "/images/process1.jpg",
              href: `/portfolio/${categorySlug}/${item.slug}`,
            };
          });

          setProjectsList(mapped);
        }
      } catch (err) {
        console.error("Failed to load portfolio cases from Supabase:", err);
      }
    }

    loadRealProjects();
  }, []);

  return (
    <section className="project-list">
      <div className="project-list__header">
        <span>TANLANGAN LOYIHALAR /</span>
      </div>

      <div className="project-list__items">
        {projectsList.map((project, index) => (
          <Link
            key={project.id}
            href={project.href}
            className="project-item"
            onClick={handleNavigation(project.href)}
            onMouseEnter={() => setActiveProject(project)}
            onMouseLeave={() => setActiveProject(null)}
          >
            <div className="project-item__left">
              <span className="project-item__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="project-item__title">{project.title}</h3>
            </div>

            <div className="project-item__right">
              <span className="project-item__category">{project.category}</span>
              <span className="project-item__year">{project.year}</span>
              <span className="project-item__arrow">→</span>
            </div>
          </Link>
        ))}

        {/* View All Projects Row */}
        <Link
          href="/portfolio"
          className="project-item project-item--all"
          onClick={handleNavigation("/portfolio")}
          onMouseEnter={() => setActiveProject(null)}
        >
          <div className="project-item__left">
            <span className="project-item__index">+</span>
            <h3 className="project-item__title">Barcha loyihalar</h3>
          </div>

          <div className="project-item__right">
            <span className="project-item__category">Portfolio arxivi</span>
            <span className="project-item__year">Arxiv</span>
            <span className="project-item__arrow">→</span>
          </div>
        </Link>
      </div>

      {/* Three.js WebGL Floating Paper / Cloth Wave Preview */}
      <ProjectPreviewWebGL
        activeProject={activeProject}
        projects={projectsList}
      />
    </section>
  );
}
