"use client";

import { useSyncExternalStore } from "react";

function subscribeToDir(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
  return () => observer.disconnect();
}

/** True when <html dir="rtl"> (fa, ps). False during SSR, then syncs on the client. */
export function useIsRTL(): boolean {
  return useSyncExternalStore(
    subscribeToDir,
    () => document.documentElement.dir === "rtl",
    () => false,
  );
}

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribeToPointer(onChange: () => void) {
  const mq = window.matchMedia(FINE_POINTER_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True only for mouse-like devices (hover + fine pointer). False on touch and during SSR. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribeToPointer,
    () => window.matchMedia(FINE_POINTER_QUERY).matches,
    () => false,
  );
}