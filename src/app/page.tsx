"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      router.replace("/login");
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      router.replace(user ? "/dashboard" : "/login");
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center text-sm text-slate-400">
      Chargement de votre espace…
    </main>
  );
}
