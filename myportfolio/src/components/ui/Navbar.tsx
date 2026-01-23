"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { useNavigation } from "@/hooks/useNavigation";

export default function Navbar() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { handleNavigation } = useNavigation();


  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(!!session);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <header
      style={{
        borderBottom: "1px solid #eee",
        padding: "16px 0",
        marginBottom: 32,
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" onClick={handleNavigation("/")}>
          MyPortfolio
        </Link>

        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/portfolio" onClick={handleNavigation("/portfolio")}>
            Portfolio
          </Link>
          <Link href="/gallery" onClick={handleNavigation("/gallery")}>
            Gallery
          </Link>
          <Link href="/about" onClick={handleNavigation("/about")}>
            About
          </Link>
          <Link href="/contact" onClick={handleNavigation("/contact")}>
            Contact
          </Link>

          {isLoggedIn && (
            <>
              <Link href="/admin/portfolio">Admin</Link>
              <Link href="/admin/gallery">Gallery CMS</Link>
              <Link href="/admin/categories">Categories</Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/admin/login";
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
