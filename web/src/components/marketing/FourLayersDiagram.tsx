export function FourLayersDiagram() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4 sm:p-6">
      <svg
        viewBox="0 0 720 320"
        className="mx-auto w-full max-w-3xl"
        role="img"
        aria-label="Four layers: Storage, Sync, Work, Collaboration flowing from Sync Store to editors"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#a8a29e" />
          </marker>
        </defs>

        <rect x="20" y="24" width="160" height="56" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
        <text x="100" y="48" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
          Sync Store
        </text>
        <text x="100" y="66" textAnchor="middle" className="fill-muted text-[11px]">
          Storage layer
        </text>

        <rect x="210" y="24" width="140" height="56" rx="8" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" />
        <text x="280" y="48" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
          WebSockets
        </text>
        <text x="280" y="66" textAnchor="middle" className="fill-muted text-[11px]">
          Sync layer
        </text>

        <rect x="380" y="24" width="140" height="56" rx="8" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" />
        <text x="450" y="48" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
          Mirror
        </text>
        <text x="450" y="66" textAnchor="middle" className="fill-muted text-[11px]">
          Work layer
        </text>

        <rect x="550" y="24" width="150" height="56" rx="8" fill="#f5f5f4" stroke="#d6d3d1" strokeWidth="1.5" />
        <text x="625" y="48" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
          Any editor
        </text>
        <text x="625" y="66" textAnchor="middle" className="fill-muted text-[11px]">
          nvim · VS Code · Zed
        </text>

        <line x1="180" y1="52" x2="208" y2="52" stroke="#a8a29e" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="350" y1="52" x2="378" y2="52" stroke="#a8a29e" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="520" y1="52" x2="548" y2="52" stroke="#a8a29e" strokeWidth="1.5" markerEnd="url(#arrow)" />

        <rect x="20" y="120" width="680" height="72" rx="8" fill="#fafaf9" stroke="#e7e5e4" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="360" y="148" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
          Collaboration layer
        </text>
        <text x="360" y="170" textAnchor="middle" className="fill-muted text-[11px]">
          Collab relay → Collab agent → checkpoint → version insert
        </text>

        <path d="M100 80 L100 118" stroke="#d97706" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <path d="M625 80 L625 118 L520 118" stroke="#a8a29e" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />

        <rect x="20" y="220" width="210" height="72" rx="8" fill="#ffffff" stroke="#e7e5e4" strokeWidth="1.5" />
        <text x="125" y="248" textAnchor="middle" className="fill-foreground text-[12px] font-medium">
          Files = rows
        </text>
        <text x="125" y="268" textAnchor="middle" className="fill-muted text-[11px]">
          Versions = append-only history
        </text>

        <rect x="255" y="220" width="210" height="72" rx="8" fill="#ffffff" stroke="#e7e5e4" strokeWidth="1.5" />
        <text x="360" y="248" textAnchor="middle" className="fill-foreground text-[12px] font-medium">
          Live push in seconds
        </text>
        <text x="360" y="268" textAnchor="middle" className="fill-muted text-[11px]">
          No commit / push / pull
        </text>

        <rect x="490" y="220" width="210" height="72" rx="8" fill="#ffffff" stroke="#e7e5e4" strokeWidth="1.5" />
        <text x="595" y="248" textAnchor="middle" className="fill-foreground text-[12px] font-medium">
          $HOME/Projects mirror
        </text>
        <text x="595" y="268" textAnchor="middle" className="fill-muted text-[11px]">
          Your editor, your terminal
        </text>
      </svg>
    </div>
  );
}