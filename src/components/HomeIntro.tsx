"use client";

import { useEffect, useRef } from "react";
import { Logo } from "./Logo";

export function HomeIntro() {
  const introRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) { intro.style.display = "none"; return; }
    let ended = false;
    let exitTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    const animations: Animation[] = [];
    const mark = intro.querySelector(".home-intro-mark");
    const line = intro.querySelector(".home-intro-line");
    if (mark) animations.push(mark.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 700, fill: "both", easing: "ease-out" }));
    if (line) animations.push(line.animate([{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }], { duration: 1400, fill: "both", easing: "ease-out" }));
    const start = performance.now();
    const reveal = () => {
      if (ended) return;
      ended = true;
      exitTimer = setTimeout(() => {
        intro.classList.add("home-intro-exit");
        const exit = intro.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], { duration: 1100, fill: "forwards", easing: "cubic-bezier(.76,0,.24,1)" });
        animations.push(exit);
        const hide = () => { intro.style.display = "none"; };
        exit.onfinish = hide;
        hideTimer = setTimeout(hide, 1300);
        window.dispatchEvent(new Event("box-scene-reveal"));
      }, Math.max(0, 1100 - (performance.now() - start)));
    };
    const observer = new MutationObserver(() => {
      if (document.querySelector('[data-scene="webgl"], [data-scene="fallback"]')) reveal();
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-scene"] });
    if (document.querySelector('[data-scene="webgl"], [data-scene="fallback"]')) reveal();
    const deadline = setTimeout(reveal, 2200);
    return () => { observer.disconnect(); clearTimeout(deadline); clearTimeout(exitTimer); clearTimeout(hideTimer); animations.forEach(animation => animation.cancel()); };
  }, []);
  return <div ref={introRef} aria-hidden="true" className="home-intro pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#142331] text-white">
    <div className="home-intro-mark text-center">
      <Logo tone="light" iconClassName="h-12 w-12" textClassName="text-3xl" />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[.35em] text-slate-400">Votre espace de formation</p>
      <div className="mx-auto mt-8 h-px w-40 overflow-hidden bg-white/15"><span className="home-intro-line block h-full w-full bg-brand-300" /></div>
    </div>
  </div>;
}
