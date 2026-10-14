"use client";

import { useState } from "react";
import {
  registerParticipantAction,
  loginParticipantAction,
} from "@/lib/attestation-actions";
import { Field } from "./ui";
import { Alert, buttonClass } from "./ui-base";

const TABS = [
  { id: "register", label: "Créer mon compte" },
  { id: "login", label: "Déjà inscrit" },
] as const;

export function AuthTabs({
  slug,
  defaultTab,
  error,
  allowRegister = true,
}: {
  slug: string;
  defaultTab: "register" | "login";
  error?: string;
  allowRegister?: boolean;
}) {
  const [tab, setTab] = useState<"register" | "login">(defaultTab);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {tab === "register" ? "Créez votre compte" : "Bon retour parmi nous"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {tab === "register"
          ? "Quelques informations suffisent pour accéder à votre attestation."
          : "Connectez-vous pour retrouver votre attestation."}
      </p>

      {/* Onglets */}
      <div
        role="tablist"
        className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
      >
        {TABS.filter((t) => allowRegister || t.id === "login").map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 transition ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error && (
          <div className="mb-5">
            <ErrorBanner code={error} />
          </div>
        )}

        {tab === "register" ? (
          <form action={registerParticipantAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="nom" name="nom" label="Nom" icon="user" autoComplete="family-name" />
              <Field id="prenom" name="prenom" label="Prénom" icon="user" autoComplete="given-name" />
            </div>
            <Field id="email" name="email" label="Email" type="email" icon="mail" autoComplete="email" />
            <Field
              id="telephone"
              name="telephone"
              label="Numéro de téléphone"
              type="tel"
              icon="phone"
              autoComplete="tel"
            />
            <Field
              id="password-reg"
              name="password"
              label="Mot de passe"
              type="password"
              icon="lock"
              minLength={8}
              maxLength={256}
              autoComplete="new-password"
              hint="Il vous permettra de revenir consulter votre attestation."
            />
            <button type="submit" className={`${buttonClass("primary")} mt-2`}>
              Créer mon compte et accéder
            </button>
          </form>
        ) : (
          <form action={loginParticipantAction} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <Field
              id="email-login"
              name="email"
              label="Email"
              type="email"
              icon="mail"
              autoComplete="email"
            />
            <Field
              id="password-login"
              name="password"
              label="Mot de passe"
              type="password"
              icon="lock"
              autoComplete="current-password"
            />
            <button type="submit" className={`${buttonClass("dark")} mt-2`}>
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
    champs: "Vérifiez les champs, l’adresse email et le mot de passe (8 caractères minimum).",
    existe: "Un compte existe déjà avec cet email. Connectez-vous.",
    identifiants: "Email ou mot de passe incorrect.",
  };
  return (
    <Alert tone="error">{messages[code] ?? "Une erreur est survenue."}</Alert>
  );
}
