"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        // Pick up Safari-safe SW (v2) promptly on already-installed phones.
        void reg.update();
      } catch {
        // Service worker optional in dev / unsupported contexts
      }
    };
    void register();
  }, []);
  return null;
}
