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
        duration: 450,
        easing: "cubic-bezier(0.76, 0, 0.24, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  }

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    if (path === pathname) {
      e.preventDefault();
      return;
    }

    router.push(path, {
      onTransitionReady: triggerPageTransition,
    });
  };

  return { handleNavigation };
}
