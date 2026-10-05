export default function MerciPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
          <svg
            className="h-8 w-8 text-brand-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Merci pour votre évaluation&nbsp;!
        </h1>
        <p className="mt-3 text-slate-600">
          Votre réponse a bien été enregistrée. Vos retours nous aident à
          améliorer la qualité de nos formations.
        </p>
        <p className="mt-6 text-sm text-slate-400">BOX AFRICA</p>
      </div>
    </main>
  );
}
