"use client";

import { useEffect } from "react";
import type { SiteSettings } from "@/lib/getSiteSettings";

interface DynamicTabTitleProps {
  initialSettings?: SiteSettings;
}

function updateBrowserFavicon(url: string) {
  if (typeof document === "undefined" || !url) return;
  try {
    const existing = document.querySelectorAll("link[rel*='icon']");
    existing.forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = url;
    document.head.appendChild(link);

    const shortcutLink = document.createElement("link");
    shortcutLink.rel = "shortcut icon";
    shortcutLink.href = url;
    document.head.appendChild(shortcutLink);

    const appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    appleLink.href = url;
    document.head.appendChild(appleLink);
  } catch {
    // ignore DOM edge error
  }
}

export default function DynamicTabTitle({ initialSettings }: DynamicTabTitleProps) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    // Use initialSettings immediately without waiting for network request
    let enabled = initialSettings?.title_rotation_enabled !== false;
    let intervalSec = Number(initialSettings?.title_rotation_interval) || 2.5;
    let words: string[] =
      Array.isArray(initialSettings?.title_words) && initialSettings.title_words.length > 0
        ? initialSettings.title_words
        : ["Obloqulov"];
    let faviconUrl = initialSettings?.favicon_url || "";

    if (faviconUrl) {
      updateBrowserFavicon(faviconUrl);
    }

    if (words[0] && typeof document !== "undefined" && !document.title) {
      document.title = words[0];
    }

    let currentWordIdx = 0;
    let currentText = words[0] || "Obloqulov";

    const eraseSpeed = 35; // ms per char when deleting
    const typeSpeed = 55; // ms per char when typing

    function cycleToNextWord() {
      if (isCancelled) return;

      const holdDuration = Math.max(1200, intervalSec * 1000);
      const nextIdx = (currentWordIdx + 1) % words.length;
      const targetWord = words[nextIdx];

      // If tab is in background, update immediately to prevent browser throttle lags
      if (typeof document !== "undefined" && document.hidden) {
        currentWordIdx = nextIdx;
        currentText = targetWord;
        document.title = targetWord;
        timer = setTimeout(cycleToNextWord, holdDuration);
        return;
      }

      // Step 1: Smoothly erase previous word down to 1 letter (never empty, so browser never shows URL)
      function erase() {
        if (isCancelled) return;
        if (currentText.length > 1) {
          currentText = currentText.slice(0, -1);
          document.title = currentText;
          timer = setTimeout(erase, eraseSpeed);
        } else {
          // 1 letter left, brief pause, then start typing next word from its 1st letter
          timer = setTimeout(() => {
            typeNext(1);
          }, 80);
        }
      }

      // Step 2: Smoothly type next word letter-by-letter starting from 1st char
      function typeNext(charCount: number) {
        if (isCancelled) return;
        if (charCount <= targetWord.length) {
          currentText = targetWord.slice(0, charCount);
          document.title = currentText;
          timer = setTimeout(() => typeNext(charCount + 1), typeSpeed);
        } else {
          // Fully typed, hold for user-configured duration
          currentWordIdx = nextIdx;
          currentText = targetWord;
          document.title = targetWord;
          timer = setTimeout(cycleToNextWord, holdDuration);
        }
      }

      erase();
    }

    // Start cycle if enabled and multiple words
    if (enabled && words.length > 1) {
      const holdDuration = Math.max(1200, intervalSec * 1000);
      timer = setTimeout(cycleToNextWord, holdDuration);
    }

    // In parallel, fetch fresh settings from API in background (without flickering initial title)
    async function syncFreshSettings() {
      try {
        const res = await fetch("/api/admin/favicon");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || isCancelled) return;

        if (typeof data.title_rotation_enabled === "boolean") {
          enabled = data.title_rotation_enabled;
        }
        if (data.title_rotation_interval) {
          intervalSec = Number(data.title_rotation_interval);
        }
        if (Array.isArray(data.title_words) && data.title_words.length > 0) {
          words = data.title_words;
        }
        if (data.favicon_url && data.favicon_url !== faviconUrl) {
          faviconUrl = data.favicon_url;
          updateBrowserFavicon(faviconUrl);
        }
      } catch {
        // ignore background fetch error
      }
    }

    syncFreshSettings();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [initialSettings]);

  return null;
}
