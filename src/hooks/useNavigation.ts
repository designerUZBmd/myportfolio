"use client";

import React from "react";
import { useTransitionRouter } from "next-view-transitions";
import { usePathname } from "next/navigation";

export function useNavigation() {
  const router = useTransitionRouter();
  const pathname = usePathname();

  function triggerPageTransition() {
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
        duration: 2000,
        easing: "cubic-bezier(0.9, 0, 0.1, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }

  const navigateTo = (path: string) => {
    if (path === pathname) {
      return;
    }

    router.push(path, {
      onTransitionReady: triggerPageTransition,
    });
  };

  const handleNavigation = (path: string) => (e?: React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    navigateTo(path);
  };

  return { handleNavigation, navigateTo };
}
