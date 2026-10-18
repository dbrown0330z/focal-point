export default function GalleryIllustration({ width = 400 }: { width?: number }) {
  const height = Math.round(width * (280 / 480))
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 480 280"
      aria-hidden="true"
    >
      <style>{`
        .gi-root { --ink: #1a1a1a; --ink-light: rgba(26,26,26,0.25); }
        @media (prefers-color-scheme: dark) {
          .gi-root { --ink: #e8e8e8; --ink-light: rgba(232,232,232,0.25); }
        }
        .gi-sk { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; }
      `}</style>
      <g transform="translate(234, 148)" className="gi-root gi-sk">

        {/* Frame 1: large landscape, left */}
        <g transform="rotate(-2, -120, 0)">
          <rect x="-188" y="-52" width="88" height="66" rx="3" strokeWidth="2"/>
          <rect x="-188" y="-52" width="88" height="66" rx="3" strokeWidth="0.5" stroke="var(--ink-light)" transform="translate(1,1)"/>
          <rect x="-180" y="-44" width="72" height="50" rx="2" strokeWidth="1.2" opacity="0.5"/>
          <line x1="-180" y1="-44" x2="-108" y2="6" strokeWidth="0.9" opacity="0.2"/>
          <line x1="-108" y1="-44" x2="-180" y2="6" strokeWidth="0.9" opacity="0.2"/>
          <path d="M-168,-52 C-164,-64 -152,-68 -144,-68 C-136,-68 -124,-64 -120,-52" strokeWidth="1.3" opacity="0.5"/>
          <circle cx="-144" cy="-69" r="2.5" strokeWidth="1.2" opacity="0.5"/>
        </g>

        {/* Frame 2: portrait, centre-left */}
        <g transform="rotate(1.5, -20, 0)">
          <rect x="-50" y="-64" width="56" height="76" rx="3" strokeWidth="2"/>
          <rect x="-50" y="-64" width="56" height="76" rx="3" strokeWidth="0.5" stroke="var(--ink-light)" transform="translate(1,1)"/>
          <rect x="-42" y="-56" width="40" height="60" rx="2" strokeWidth="1.2" opacity="0.5"/>
          <line x1="-42" y1="-56" x2="-2" y2="4" strokeWidth="0.9" opacity="0.2"/>
          <line x1="-2" y1="-56" x2="-42" y2="4" strokeWidth="0.9" opacity="0.2"/>
          <path d="M-36,-64 C-32,-76 -20,-80 -12,-80 C-4,-80 8,-76 6,-64" strokeWidth="1.3" opacity="0.5"/>
          <circle cx="-12" cy="-81" r="2.5" strokeWidth="1.2" opacity="0.5"/>
        </g>

        {/* Frame 3: small square, right of centre */}
        <g transform="rotate(-1, 82, -10)">
          <rect x="58" y="-50" width="52" height="52" rx="3" strokeWidth="2"/>
          <rect x="58" y="-50" width="52" height="52" rx="3" strokeWidth="0.5" stroke="var(--ink-light)" transform="translate(1,1)"/>
          <rect x="66" y="-42" width="36" height="36" rx="2" strokeWidth="1.2" opacity="0.5"/>
          <line x1="66" y1="-42" x2="102" y2="-6" strokeWidth="0.9" opacity="0.2"/>
          <line x1="102" y1="-42" x2="66" y2="-6" strokeWidth="0.9" opacity="0.2"/>
          <path d="M70,-50 C74,-62 82,-66 84,-66 C92,-66 100,-62 100,-50" strokeWidth="1.3" opacity="0.5"/>
          <circle cx="84" cy="-67" r="2.5" strokeWidth="1.2" opacity="0.5"/>
        </g>

        {/* Frame 4: landscape, far right */}
        <g transform="rotate(2, 168, 10)">
          <rect x="126" y="-40" width="80" height="58" rx="3" strokeWidth="2"/>
          <rect x="126" y="-40" width="80" height="58" rx="3" strokeWidth="0.5" stroke="var(--ink-light)" transform="translate(1,1)"/>
          <rect x="134" y="-32" width="64" height="42" rx="2" strokeWidth="1.2" opacity="0.5"/>
          <line x1="134" y1="-32" x2="198" y2="10" strokeWidth="0.9" opacity="0.2"/>
          <line x1="198" y1="-32" x2="134" y2="10" strokeWidth="0.9" opacity="0.2"/>
          <path d="M142,-40 C146,-52 156,-56 166,-56 C176,-56 186,-52 188,-40" strokeWidth="1.3" opacity="0.5"/>
          <circle cx="166" cy="-57" r="2.5" strokeWidth="1.2" opacity="0.5"/>
        </g>

        {/* Dust mote dots */}
        <circle cx="-168" cy="84" r="1.5" fill="var(--ink)" stroke="none" opacity="0.18"/>
        <circle cx="-80" cy="85" r="1.2" fill="var(--ink)" stroke="none" opacity="0.18"/>
        <circle cx="30" cy="84" r="1.5" fill="var(--ink)" stroke="none" opacity="0.18"/>
        <circle cx="158" cy="85" r="1.2" fill="var(--ink)" stroke="none" opacity="0.18"/>
      </g>
    </svg>
  )
}
