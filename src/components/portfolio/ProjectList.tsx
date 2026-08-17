"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [activeMobileId, setActiveMobileId] = useState<string | null>(null);

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

  const [mobileTilt, setMobileTilt] = useState({ x: 0, z: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const currentActiveIdRef = useRef<string | null>(null);

  // Mobile scroll physics and section bounds tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let tiltVelocity = 0;
    let animId: number;

    const updatePhysics = () => {
      if (Math.abs(tiltVelocity) > 0.05) {
        tiltVelocity *= 0.85; // smooth spring decay
        const clampedTiltX = Math.max(Math.min(tiltVelocity * 0.45, 18), -18);
        const clampedTiltZ = Math.max(Math.min(-tiltVelocity * 0.08, 4), -4);
        setMobileTilt({ x: clampedTiltX, z: clampedTiltZ });
        animId = requestAnimationFrame(updatePhysics);
      } else {
        if (tiltVelocity !== 0) {
          tiltVelocity = 0;
          setMobileTilt({ x: 0, z: 0 });
        }
      }
    };

    const checkActiveItem = () => {
      if (window.innerWidth > 768) {
        if (currentActiveIdRef.current !== null) {
          currentActiveIdRef.current = null;
          setActiveMobileId(null);
          setActiveProject(null);
        }
        ticking = false;
        return;
      }

      const section = sectionRef.current;
      if (!section) {
        ticking = false;
        return;
      }

      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const diff = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      tiltVelocity = diff;
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(updatePhysics);

      const sectionRect = section.getBoundingClientRect();
      const centerY = window.innerHeight * 0.5;

      // Only active while screen center is inside the project-list section
      if (sectionRect.top <= centerY && sectionRect.bottom >= centerY) {
        let closestProject: ProjectItemData | null = null;
        let minDistance = Infinity;

        itemRefs.current.forEach((el, index) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const elCenter = rect.top + rect.height / 2;
          const dist = Math.abs(elCenter - centerY);

          if (dist < minDistance) {
            minDistance = dist;
            closestProject = projectsList[index] || null;
          }
        });

        const newId = closestProject ? (closestProject as ProjectItemData).id : null;
        if (newId !== currentActiveIdRef.current) {
          currentActiveIdRef.current = newId;
          setActiveMobileId(newId);
          setActiveProject(closestProject);
        }
      } else {
        // Outside the project-list section height -> hide preview
        if (currentActiveIdRef.current !== null) {
          currentActiveIdRef.current = null;
          setActiveMobileId(null);
          setActiveProject(null);
        }
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(checkActiveItem);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    checkActiveItem();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [projectsList]);

  return (
    <section ref={sectionRef} className="project-list">
      <div className="project-list__header">
        <span>TANLANGAN LOYIHALAR /</span>
      </div>

      <div className="project-list__items">
        {projectsList.map((project, index) => {
          const isMobileActive = activeMobileId === project.id;
          return (
            <Link
              key={project.id}
              data-index={index}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              href={project.href}
              className={`project-item ${isMobileActive ? "is-active" : ""}`}
              onClick={handleNavigation(project.href)}
              onMouseEnter={() => {
                if (window.innerWidth > 768) {
                  setActiveProject(project);
                }
              }}
              onMouseLeave={() => {
                if (window.innerWidth > 768) {
                  setActiveProject(null);
                }
              }}
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
          );
        })}

        {/* View All Projects Row */}
        <Link
          href="/portfolio"
          className="project-item project-item--all"
          onClick={handleNavigation("/portfolio")}
          onMouseEnter={() => {
            if (window.innerWidth > 768) {
              setActiveProject(null);
            }
          }}
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

      {/* Mobile CSS 3D Hardware-Accelerated Center Floating Card */}
      <div
        className={`project-mobile-3d-stage ${activeProject ? "is-visible" : ""}`}
        style={
          {
            "--tilt-x": `${mobileTilt.x}deg`,
            "--tilt-z": `${mobileTilt.z}deg`,
          } as React.CSSProperties
        }
      >
        <div className="project-mobile-3d-card">
          {projectsList.map((project) => (
            <div
              key={project.id}
              className={`project-mobile-3d-slide ${
                activeProject?.id === project.id ? "is-active" : ""
              }`}
            >
              <img
                src={project.image || "/images/process1.jpg"}
                alt={project.title}
                loading="eager"
                className="project-mobile-3d-img"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Three.js WebGL Floating Paper / Cloth Wave Preview (Desktop Only) */}
      <ProjectPreviewWebGL
        activeProject={activeProject}
        projects={projectsList}
      />
    </section>
  );
}
