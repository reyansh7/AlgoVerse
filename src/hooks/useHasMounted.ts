"use client";

import { useEffect, useState } from "react";

/** Avoid SSR/client mismatches from zustand persist / localStorage. */
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
