"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ interval = 15000 }) {
  const router = useRouter();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const id = setInterval(() => {
      if (mounted.current) router.refresh();
    }, interval);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [router, interval]);

  return null;
}
