"use client";

import { useEffect, useRef } from "react";
import initialSettings from "@/data/siteSettings.json";

export default function DynamicTabTitle() {
  const currentIndexRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let isCancelled = false;

    async function initTitleRotation() {
      let enabled = initialSettings?.title_rotation_enabled !== false;
      let intervalSec = Number(initialSettings?.title_rotation_interval) || 2.5;
      let words: string[] = Array.isArray(initialSettings?.title_words)
        ? initialSettings.title_words
        : [];
      let faviconUrl = initialSettings?.favicon_url || "";

      // Fetch fresh settings from API
      try {
        const res = await fetch("/api/admin/favicon");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (typeof data.title_rotation_enabled === "boolean") {
              enabled = data.title_rotation_enabled;
            }
            if (data.title_rotation_interval) {
              intervalSec = Number(data.title_rotation_interval);
            }
            if (Array.isArray(data.title_words) && data.title_words.length > 0) {
              words = data.title_words;
            }
            if (data.favicon_url) {
              faviconUrl = data.favicon_url;
            }
          }
        }
      } catch {
        // Fall back to local bundled settings
      }

      if (isCancelled) return;

      // Update favicon in DOM if provided
      if (faviconUrl) {
        try {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = faviconUrl;
        } catch {
          // ignore DOM edge error
        }
      }

      // If rotation disabled or single word
      if (!enabled || words.length <= 1) {
        if (words.length === 1 && words[0]) {
          document.title = words[0];
        }
        return;
      }

      // Set initial word
      currentIndexRef.current = 0;
      document.title = words[0];

      const intervalMs = Math.max(1000, intervalSec * 1000);

      timer = setInterval(() => {
        if (isCancelled) return;
        currentIndexRef.current = (currentIndexRef.current + 1) % words.length;
        document.title = words[currentIndexRef.current];
      }, intervalMs);
    }

    initTitleRotation();

    return () => {
      isCancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return null;
}
