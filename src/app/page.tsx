"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Client navigate — avoids HTTP redirect that Safari SWs reject. */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/lineups");
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
      Opening lineups…
    </main>
  );
}
