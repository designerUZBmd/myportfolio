"use client";

import { useEffect, useRef } from "react";
import initialSettings from "@/data/siteSettings.json";

export default function DynamicTabTitle() {
  const currentIndexRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
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
      let currentWordIdx = 0;
      let currentText = words[0];
      document.title = currentText;

      const holdDuration = Math.max(1200, intervalSec * 1000);
      const eraseSpeed = 35; // ms per char when deleting
      const typeSpeed = 55;  // ms per char when typing

      function cycleToNextWord() {
        if (isCancelled) return;

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

      timer = setTimeout(cycleToNextWord, holdDuration);
    }

    initTitleRotation();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
