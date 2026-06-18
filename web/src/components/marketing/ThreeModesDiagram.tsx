const MODES = [
  {
    title: "Solo live sync",
    when: "You alone, saving normally",
    flow: "Save → version insert → mirror on other devices",
    color: "#fffbeb",
    border: "#d97706",
  },
  {
    title: "Async concurrent",
    when: "Two people save without pairing",
    flow: "Two version heads → fork → Pierre Merge",
    color: "#f5f5f4",
    border: "#d6d3d1",
  },
  {
    title: "Live collab",
    when: "Pair programming",
    flow: "Collab agent + relay → checkpoint → version",
    color: "#f5f5f4",
    border: "#d6d3d1",
  },
] as const;

export function ThreeModesDiagram() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {MODES.map((mode) => (
        <div
          key={mode.title}
          className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm"
          style={{ borderTopColor: mode.border, borderTopWidth: "3px" }}
        >
          <h3 className="text-base font-semibold text-foreground">{mode.title}</h3>
          <p className="mt-2 text-sm text-muted">{mode.when}</p>
          <div className="mt-4 rounded-lg bg-surface-muted px-3 py-2">
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">{mode.flow}</p>
          </div>
        </div>
      ))}
    </div>
  );
}