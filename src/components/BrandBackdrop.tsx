// Décor animé des panneaux de marque : lueurs qui dérivent, cubes (motif du logo)
// qui se dessinent et flottent, particules, reflet lumineux et mini-certificat
// qui s'écrit puis reçoit son sceau. Pur CSS/SVG, sans JS ni fichier à charger ;
// les animations sont désactivées si l'utilisateur préfère moins de mouvement.

type CubeSpec = {
  left: string;
  top: string;
  size: number;
  opacity: number;
  dur: number;
  delay: number;
  blur?: number;
  desktopOnly?: boolean;
};

const CUBES: CubeSpec[] = [
  { left: "58%", top: "6%", size: 130, opacity: 0.6, dur: 11, delay: 0.2 },
  { left: "84%", top: "28%", size: 68, opacity: 0.5, dur: 8, delay: 0.9 },
  { left: "76%", top: "50%", size: 84, opacity: 0.3, dur: 13, delay: 0.5, blur: 1.2, desktopOnly: true },
  { left: "52%", top: "91%", size: 48, opacity: 0.4, dur: 9, delay: 1.4 },
  { left: "88%", top: "4%", size: 40, opacity: 0.45, dur: 10, delay: 1.1 },
  { left: "26%", top: "2%", size: 58, opacity: 0.22, dur: 12, delay: 0.7, blur: 1.6 },
];

// Positions fixes (pas de Math.random) pour un rendu identique serveur / client.
const PARTICLES = [
  { left: "8%", size: 3, dur: 14, delay: 0, drift: 24 },
  { left: "17%", size: 2, dur: 11, delay: 3, drift: -18 },
  { left: "26%", size: 4, dur: 16, delay: 6, drift: 30 },
  { left: "36%", size: 2, dur: 12, delay: 1.5, drift: -26 },
  { left: "47%", size: 3, dur: 15, delay: 8, drift: 16 },
  { left: "56%", size: 2, dur: 10, delay: 4.5, drift: -12 },
  { left: "66%", size: 4, dur: 17, delay: 2, drift: 22 },
  { left: "74%", size: 3, dur: 13, delay: 7, drift: -30 },
  { left: "83%", size: 2, dur: 11, delay: 5, drift: 14 },
  { left: "92%", size: 3, dur: 15, delay: 9.5, drift: -20 },
];

function IsoCube({ spec }: { spec: CubeSpec }) {
  const { left, top, size, opacity, dur, delay, blur, desktopOnly } = spec;
  const vars = {
    "--dur": `${dur}s`,
    "--delay": `${delay}s`,
  } as React.CSSProperties;

  return (
    <div
      className={`anim-cube-in absolute ${desktopOnly ? "hidden lg:block" : ""}`}
      style={{ left, top, width: size, height: size, opacity, ...vars }}
    >
      <svg
        viewBox="0 0 48 48"
        className="anim-cube h-full w-full overflow-visible"
        style={{ ...vars, filter: blur ? `blur(${blur}px)` : undefined }}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Faces translucides */}
        <polygon points="6,15 24,5 42,15 24,25" fill="#45afec" fillOpacity="0.28" />
        <polygon points="6,15 24,25 24,43 6,33" fill="#ffffff" fillOpacity="0.05" />
        <polygon points="42,15 24,25 24,43 42,33" fill="#ffffff" fillOpacity="0.11" />
        {/* Arêtes qui se dessinent */}
        <g stroke="#ffffff" strokeWidth="1.3">
          {[
            [6, 15, 24, 25],
            [42, 15, 24, 25],
            [6, 15, 6, 33],
            [24, 25, 24, 43],
            [42, 15, 42, 33],
            [6, 33, 24, 43],
            [42, 33, 24, 43],
          ].map(([x1, y1, x2, y2]) => (
            <line
              key={`${x1}${y1}${x2}${y2}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              pathLength={1}
              className="cube-edge"
              style={vars}
            />
          ))}
        </g>
        <g stroke="#7cc7f4" strokeWidth="1.6">
          <line x1="6" y1="15" x2="24" y2="5" pathLength={1} className="cube-edge" style={vars} />
          <line x1="42" y1="15" x2="24" y2="5" pathLength={1} className="cube-edge" style={vars} />
        </g>
      </svg>
    </div>
  );
}

function CertificateMock() {
  const line = (w: string, delay: number, tone = "bg-white/45") => (
    <span
      className={`anim-cert-line block h-1.5 rounded-full ${tone}`}
      style={{ width: w, ["--delay" as string]: `${delay}s` }}
    />
  );

  return (
    <div className="anim-cert absolute bottom-28 right-6 hidden w-52 lg:block xl:right-10">
      <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-md">
        <div className="anim-cert-shine absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/25 to-transparent" />
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-300" />
          <span className="h-1.5 w-14 rounded-full bg-white/50" />
        </div>
        <div className="mt-4 space-y-2.5">
          {line("70%", 0.4, "bg-brand-200/70")}
          {line("92%", 0.9)}
          {line("80%", 1.4)}
          {line("55%", 1.9)}
        </div>
        {/* Sceau */}
        <div className="anim-cert-seal absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-brand-300 to-brand-600 shadow-lg shadow-brand-900/50 ring-2 ring-white/60">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <div className="mt-7 h-px w-20 bg-white/30" />
      </div>
    </div>
  );
}

export function BrandBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Lueurs qui dérivent */}
      <div className="anim-blob-a absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-400/35 blur-3xl" />
      <div className="anim-blob-b absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="anim-blob-b absolute left-1/3 top-1/3 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl" />

      {/* Reflet lumineux qui balaie le panneau */}
      <div
        className="anim-sweep absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(110deg, transparent 38%, rgb(124 199 244 / 0.16) 50%, transparent 62%)",
          backgroundSize: "250% 100%",
          backgroundPosition: "160% 0",
        }}
      />

      {/* Cubes du logo */}
      {CUBES.map((c) => (
        <IsoCube key={`${c.left}${c.top}`} spec={c} />
      ))}

      {/* Particules */}
      {PARTICLES.map((p) => (
        <span
          key={p.left}
          className="anim-particle absolute bottom-0 rounded-full bg-white/70"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--drift": `${p.drift}px`,
              "--rise": "820px",
              opacity: 0,
            } as React.CSSProperties
          }
        />
      ))}

      <CertificateMock />
    </div>
  );
}
