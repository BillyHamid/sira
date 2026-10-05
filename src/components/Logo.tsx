// Logo Box.academy : icône cube (inspirée du logo) + wordmark.
// Les arêtes supérieures sont dans le bleu de marque, le reste en noir.

export function CubeIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Arêtes noires : faces avant + montants verticaux */}
      <g stroke="#0b0b0b" strokeWidth="3">
        <line x1="6" y1="15" x2="24" y2="25" />
        <line x1="42" y1="15" x2="24" y2="25" />
        <line x1="6" y1="15" x2="6" y2="33" />
        <line x1="24" y1="25" x2="24" y2="43" />
        <line x1="42" y1="15" x2="42" y2="33" />
        <line x1="6" y1="33" x2="24" y2="43" />
        <line x1="42" y1="33" x2="24" y2="43" />
      </g>
      {/* Arêtes bleues : sommet du cube */}
      <g stroke="#1c9ce5" strokeWidth="3.4">
        <line x1="6" y1="15" x2="24" y2="5" />
        <line x1="42" y1="15" x2="24" y2="5" />
      </g>
    </svg>
  );
}

export function Logo({
  className = "",
  iconClassName = "h-7 w-7",
  textClassName = "text-lg",
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <CubeIcon className={iconClassName} />
      <span className={`font-semibold tracking-tight text-slate-900 ${textClassName}`}>
        Box.academy
      </span>
    </span>
  );
}
