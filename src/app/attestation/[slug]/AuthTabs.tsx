"use client";

import { useState } from "react";
import {
  registerParticipantAction,
  loginParticipantAction,
} from "@/lib/attestation-actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";
const labelClass = "block text-sm font-medium text-slate-700";

export function AuthTabs({
  slug,
  defaultTab,
  error,
}: {
  slug: string;
  defaultTab: "register" | "login";
  error?: string;
}) {
  const [tab, setTab] = useState<"register" | "login">(defaultTab);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Onglets */}
      <div className="grid grid-cols-2 border-b border-slate-200 text-sm font-medium">
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`px-4 py-3 transition ${
            tab === "register"
              ? "border-b-2 border-brand-600 text-brand-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Créer mon compte
        </button>
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`px-4 py-3 transition ${
            tab === "login"
              ? "border-b-2 border-brand-600 text-brand-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Déjà inscrit
        </button>
      </div>

      <div className="p-6">
        {error && <ErrorBanner code={error} />}

        {tab === "register" ? (
          <form action={registerParticipantAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="nom">
                  Nom
                </label>
                <input id="nom" name="nom" required className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="prenom">
                  Prénom
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="telephone">
                Numéro de téléphone
              </label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="password-reg">
                Mot de passe
              </label>
              <input
                id="password-reg"
                name="password"
                type="password"
                required
                minLength={4}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-400">
                Il vous permettra de revenir consulter votre attestation.
              </p>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Créer mon compte et accéder
            </button>
          </form>
        ) : (
          <form action={loginParticipantAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <div>
              <label className={labelClass} htmlFor="email-login">
                Email
              </label>
              <input
                id="email-login"
                name="email"
                type="email"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="password-login">
                Mot de passe
              </label>
              <input
                id="password-login"
                name="password"
                type="password"
                required
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Se connecter
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ code }: { code: string }) {
  const messages: Record<string, string> = {
    champs: "Merci de remplir tous les champs (mot de passe d'au moins 4 caractères).",
    existe: "Un compte existe déjà avec cet email. Connectez-vous.",
    identifiants: "Email ou mot de passe incorrect.",
  };
  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
      {messages[code] ?? "Une erreur est survenue."}
    </div>
  );
}
