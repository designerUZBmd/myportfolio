"use client";

import React, { useEffect } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { usePathname } from "next/navigation";

// Intercept harmless browser-level View Transition timeout/abort errors
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || String(event.reason || "");
    const name = event.reason?.name || "";
    if (
      name === "TimeoutError" ||
      name === "AbortError" ||
      msg.includes("Transition was aborted") ||
      msg.includes("timeout in DOM update")
    ) {
      event.preventDefault();
    }
  });
}

export function useNavigation() {
  const router = useTransitionRouter();
  const pathname = usePathname();

  const triggerPageTransition = React.useCallback(() => {
    try {
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.animate(
          [
            {
              clipPath: "polygon(25% 75%, 75% 75%, 75% 75%, 25% 75%)",
            },
            {
              clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
            },
          ],
          {
            duration: 1200,
            easing: "cubic-bezier(0.9, 0, 0.1, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      }
    } catch {
      // Ignore transition animation errors if aborted
    }
  }, []);

  const navigateTo = React.useCallback(
    (path: string) => {
      if (path === pathname) {
        return;
      }

      try {
        router.push(path, {
          onTransitionReady: triggerPageTransition,
        });
      } catch {
        window.location.href = path;
      }
    },
    [pathname, router, triggerPageTransition]
  );

  const handleNavigation = React.useCallback(
    (path: string) => (e?: React.MouseEvent) => {
      if (e && typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      navigateTo(path);
    },
    [navigateTo]
  );

  return { handleNavigation, navigateTo };
}
