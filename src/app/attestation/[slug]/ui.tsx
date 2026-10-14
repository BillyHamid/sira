"use client";

import { useState } from "react";
import { Icon, type IconName } from "./ui-base";

// Champ de formulaire interactif (affichage/masquage du mot de passe).
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pr-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100";

// Champ de formulaire avec libellé et icône à gauche.
export function Field({
  id,
  name,
  label,
  type = "text",
  icon,
  hint,
  required = true,
  minLength,
  maxLength,
  autoFocus,
  autoComplete,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  icon: IconName;
  hint?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoFocus?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        <input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${inputClass} pl-11 ${isPassword ? "pr-11" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={
              visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
          >
            <Icon name={visible ? "eye-off" : "eye"} className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
