"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AutoRefresh() {
  const router = useRouter();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    const channel = supabase
      .channel("org-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_members" },
        () => { if (mounted.current) router.refresh(); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jabatan" },
        () => { if (mounted.current) router.refresh(); },
      )
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
