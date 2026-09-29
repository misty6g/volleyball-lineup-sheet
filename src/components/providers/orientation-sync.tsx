"use client";

import { useEffect } from "react";

/**
 * Keeps <html data-orientation> in sync so landscape: utilities apply even
 * when a stale PWA manifest tried to lock portrait.
 */
export function OrientationSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(orientation: landscape)");
    const apply = () => {
      const next = mq.matches ? "landscape" : "portrait";
      document.documentElement.dataset.orientation = next;
      document.documentElement.classList.toggle("is-landscape", mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return null;
}
