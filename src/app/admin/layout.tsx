"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./admin.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    async function checkAuth() {
      if (isLoginPage) {
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/admin/login";
      } else {
        setUserEmail(session.user.email || "Admin");
        setLoading(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        window.location.href = "/admin/login";
      } else if (session) {
        setUserEmail(session.user.email || "Admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  // Login page layout
  if (isLoginPage) {
    return <div className="admin-body">{children}</div>;
  }

  if (loading) {
    return (
      <div className="admin-body" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--adm-text-muted)", fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Yuklanmoqda...
        </p>
      </div>
    );
  }

  const navItems = [
    {
      title: "Boshqaruv",
      href: "/admin",
      exact: true,
    },
    {
      title: "Portfolio",
      href: "/admin/portfolio",
      exact: false,
    },
    {
      title: "Kategoriyalar",
      href: "/admin/categories",
      exact: false,
    },
    {
      title: "Galereya",
      href: "/admin/gallery",
      exact: false,
    },
  ];

  return (
    <div className="admin-body">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar__header">
            <Link href="/admin" className="admin-sidebar__logo">
              <span>OBLOQULOV</span>
              <span className="admin-sidebar__badge">CMS</span>
            </Link>
          </div>

          <nav className="admin-sidebar__nav">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${isActive ? "is-active" : ""}`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="admin-sidebar__footer">
            <Link
              href="/"
              target="_blank"
              className="admin-btn admin-btn--secondary admin-btn--sm"
              style={{ width: "100%" }}
            >
              Saytni ko‘rish ↗
            </Link>

            <div className="admin-user-info">
              <span className="admin-user-email">{userEmail}</span>
              <span className="admin-user-role">Super Admin</span>
            </div>

            <button
              onClick={handleLogout}
              className="admin-btn admin-btn--danger admin-btn--sm"
              style={{ width: "100%" }}
            >
              Chiqish
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-breadcrumbs">
              <span>Admin</span>
              <span>/</span>
              <span className="admin-breadcrumbs__current">
                {navItems.find((n) =>
                  n.exact ? pathname === n.href : pathname.startsWith(n.href)
                )?.title || "Boshqaruv"}
              </span>
            </div>

            <div className="admin-topbar__actions">
              <Link
                href="/admin/portfolio/create"
                className="admin-btn admin-btn--primary admin-btn--sm"
              >
                + Yangi Keys
              </Link>
            </div>
          </header>

          <main className="admin-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
