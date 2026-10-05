"use client";

import { useEffect, useState } from "react";
import { CRITERIA, CRITERIA_GROUPS, SCALE } from "@/lib/criteria";
import { submitResponseAction } from "@/lib/actions";

// Génère ou récupère un identifiant d'appareil anonyme (anti-doublon).
function getDeviceId(): string {
  const KEY = "box_eval_device";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export default function EvalForm({ slug }: { slug: string }) {
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    setDeviceId(getDeviceId());
    setAlreadyDone(localStorage.getItem(`box_eval_done_${slug}`) === "1");
  }, [slug]);

  const allRated = CRITERIA.every((c) => notes[c.key]);

  if (alreadyDone) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
        <p className="font-semibold text-brand-800">
          Vous avez déjà répondu à cette évaluation depuis cet appareil.
        </p>
        <p className="mt-1 text-sm text-brand-700">
          Merci pour votre participation&nbsp;! Une seule réponse par appareil
          est autorisée.
        </p>
      </div>
    );
  }

  return (
    <form
      action={submitResponseAction}
      onSubmit={() => {
        setSubmitting(true);
        // Marque l'appareil comme ayant répondu (le serveur vérifie aussi).
        localStorage.setItem(`box_eval_done_${slug}`, "1");
      }}
      className="space-y-8"
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="deviceId" value={deviceId} />

      {/* Critères, regroupés */}
      {CRITERIA_GROUPS.map((group) => (
        <fieldset
          key={group}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-brand-700">
            {group}
          </legend>
          <div className="mt-2 divide-y divide-slate-100">
            {CRITERIA.filter((c) => c.group === group).map((c) => (
              <div key={c.key} className="py-4">
                <p className="text-sm font-medium text-slate-800">{c.label}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SCALE.map((s) => {
                    const selected = notes[c.key] === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() =>
                          setNotes((prev) => ({ ...prev, [c.key]: s.value }))
                        }
                        className={`flex flex-col items-center rounded-lg border px-3 py-2 text-xs transition min-w-[58px] ${
                          selected
                            ? "border-brand-600 bg-brand-600 text-white shadow"
                            : "border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50"
                        }`}
                      >
                        <span className="text-base font-bold">{s.value}</span>
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* valeur réellement envoyée */}
                <input
                  type="hidden"
                  name={c.key}
                  value={notes[c.key] ?? ""}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      {/* Commentaires */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label
          htmlFor="commentaire"
          className="block text-sm font-medium text-slate-700"
        >
          Commentaires <span className="text-slate-400">(facultatif)</span>
        </label>
        <textarea
          id="commentaire"
          name="commentaire"
          rows={4}
          placeholder="Vos remarques, suggestions d'amélioration…"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <p className="text-center text-xs text-slate-400">
        Cette évaluation est anonyme.
      </p>

      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur">
        {!allRated && (
          <p className="mb-2 text-center text-xs text-amber-600">
            Merci de noter les {CRITERIA.length}{" "}critères avant
            d&apos;envoyer.
          </p>
        )}
        <button
          type="submit"
          disabled={!allRated || submitting}
          className="w-full rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Envoi en cours…" : "Envoyer mon évaluation"}
        </button>
      </div>
    </form>
  );
}
