type Placement = { nameX: number; nameY: number; fontSize: number; align: string };

export function readAttestationPlacement(formData: FormData, existing?: Placement | null): Placement {
  function numberField(key: string, fallback: number): number {
    const raw = formData.get(key);
    if (typeof raw !== "string" || !raw.trim()) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }
  const size = numberField("fontSize", existing?.fontSize ?? 24);
  const align = formData.get("align") ?? existing?.align ?? "center";
  return {
    nameX: Math.min(1, Math.max(0, numberField("nameX", existing?.nameX ?? 0.5))),
    nameY: Math.min(1, Math.max(0, numberField("nameY", existing?.nameY ?? 0.35))),
    fontSize: size > 0 ? Math.min(size, 120) : existing?.fontSize ?? 24,
    align: align === "left" ? "left" : "center",
  };
}
