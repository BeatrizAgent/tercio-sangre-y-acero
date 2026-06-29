"use client";

import ReactDOM from "react-dom";
import { usePathname } from "next/navigation";

/**
 * CriticalPreloads: emits <link rel="preload"> for resources that are
 * referenced from CSS (and therefore discovered late by the browser)
 * but are essential for first paint.
 *
 * The camp background lives in `body { background-image: ... }` so the
 * browser only sees the URL after parsing the stylesheet. Preloading it
 * The login screen owns its own LCP art, so this preload is skipped there.
 */
export function CriticalPreloads() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  ReactDOM.preload("/assets/generated/backgrounds/tercio-camp-background-v1-1280.webp", {
    as: "image",
    fetchPriority: "auto",
  });
  return null;
}
