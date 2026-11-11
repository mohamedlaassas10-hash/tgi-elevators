"use client";

import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

const authMessages: Record<string, string> = {
  "firebase/configuration-incomplete":
    "Le service de connexion n’est pas configuré. Contactez votre administrateur.",
  "auth/invalid-email": "L’adresse e-mail n’est pas valide.",
  "auth/invalid-credential": "L’adresse e-mail ou le mot de passe est incorrect.",
  "auth/user-disabled": "Ce compte a été désactivé. Contactez votre administrateur.",
  "auth/too-many-requests": "Trop de tentatives. Veuillez réessayer plus tard.",
  "auth/network-request-failed": "Connexion impossible. Vérifiez votre accès à Internet."
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError(authMessages["firebase/configuration-incomplete"]);
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      router.replace("/dashboard");
    } catch (cause) {
      const code =
        typeof cause === "object" && cause !== null && "code" in cause
          ? String(cause.code)
          : "";
      setError(
        authMessages[code] ??
          "La connexion a échoué. Vérifiez vos identifiants et réessayez."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            TGI Ascenseurs
          </p>
          <h1 className="text-2xl font-semibold text-white">Connexion à votre espace</h1>
          <p className="mt-2 text-sm text-slate-400">
            Technique Général Installation · Casablanca
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200">
            Adresse e-mail
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Mot de passe
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error && (
            <p aria-live="polite" className="rounded-lg border border-red-900/70 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">Gestion sécurisée · MAD</p>
      </section>
    </main>
  );
}
