// En-tête commun aux écrans attestation : reprend le style dégradé de l'évaluation.
export function AttestationHeader({
  titre,
  organisme,
  formateur,
  dateDebut,
  lieu,
}: {
  titre: string;
  organisme: string;
  formateur: string;
  dateDebut?: string | null;
  lieu?: string | null;
}) {
  return (
    <header className="rounded-xl bg-linear-to-br from-brand-600 to-brand-700 p-6 text-white shadow">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
        Attestation de formation — {organisme}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{titre}</h1>
      <dl className="mt-3 space-y-0.5 text-sm text-brand-50">
        <div>
          <span className="text-brand-200">Formateur :</span> {formateur}
        </div>
        {dateDebut && (
          <div>
            <span className="text-brand-200">Date :</span> {dateDebut}
          </div>
        )}
        {lieu && (
          <div>
            <span className="text-brand-200">Lieu :</span> {lieu}
          </div>
        )}
      </dl>
    </header>
  );
}
