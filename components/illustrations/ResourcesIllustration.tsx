export default function ResourcesIllustration({ size = 160 }: { size?: number }) {
  const scale = size / 240
  const w = Math.round(320 * scale)
  const h = Math.round(240 * scale)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 240"
      width={w}
      height={h}
      aria-hidden="true"
    >
      <style>{`
        .ri-root { --ink: #1a1a1a; }
        @media (prefers-color-scheme: dark) { .ri-root { --ink: #e8e8e8; } }
        .ri-sk  { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .ri-sk2 { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: 0.5; }
        .ri-skd { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 4,4; opacity: 0.35; }
        .ri-hatch { stroke: var(--ink); fill: none; stroke-linecap: round; opacity: 0.12; }
        .ri-fi { fill: var(--ink); stroke: none; }
      `}</style>
      <g className="ri-root">
        {/* Folder back panel */}
        <path
          d="M32,72 L32,196 Q33,200 37,201 L283,201 Q287,200 288,196 L288,88 Q287,84 283,83 L148,83 Q144,82 141,78 L130,68 Q127,64 123,63 L37,63 Q33,64 32,68 Z"
          className="ri-sk" strokeWidth="2" fill="var(--ink)" opacity="0.05"
        />
        <path
          d="M32,72 L32,196 Q33,200 37,201 L283,201 Q287,200 288,196 L288,88 Q287,84 283,83 L148,83 Q144,82 141,78 L130,68 Q127,64 123,63 L37,63 Q33,64 32,68 Z"
          className="ri-sk2" strokeWidth="1.1"
        />
        {/* Folder tab */}
        <path d="M37,63 L123,63 Q127,64 130,68 L141,78 Q144,82 148,83 L283,83" className="ri-sk" strokeWidth="1.8"/>
        <path d="M37,63 L123,63 Q127,64 130,68 L141,78 Q144,82 148,83 L283,83" className="ri-sk2" strokeWidth="1"/>
        {/* Folder front face */}
        <path d="M32,196 Q33,202 37,203 L283,203 Q287,202 288,196" className="ri-sk" strokeWidth="2"/>
        <path d="M32,196 Q33,202 37,203 L283,203 Q287,202 288,196" className="ri-sk2" strokeWidth="1.1"/>
        {/* Hatch inside folder base */}
        <line x1="40" y1="170" x2="280" y2="170" className="ri-hatch" strokeWidth="1.2"/>
        <line x1="40" y1="180" x2="280" y2="180" className="ri-hatch" strokeWidth="1.2"/>
        <line x1="40" y1="190" x2="280" y2="190" className="ri-hatch" strokeWidth="1.2"/>
        {/* Ghost document (left) */}
        <g transform="translate(58,92) rotate(-6)">
          <path d="M0,0 L0,90 Q1,94 5,95 L65,95 Q69,94 70,90 L70,14 L56,0 Z" className="ri-skd" strokeWidth="1.6"/>
          <path d="M56,0 L56,14 L70,14" className="ri-skd" strokeWidth="1.2"/>
          <line x1="10" y1="28" x2="60" y2="28" className="ri-skd" strokeWidth="1.1"/>
          <line x1="10" y1="38" x2="60" y2="38" className="ri-skd" strokeWidth="1.1"/>
          <line x1="10" y1="48" x2="50" y2="48" className="ri-skd" strokeWidth="1.1"/>
          <line x1="10" y1="58" x2="55" y2="58" className="ri-skd" strokeWidth="1.1"/>
          <line x1="10" y1="68" x2="44" y2="68" className="ri-skd" strokeWidth="1.1"/>
        </g>
        {/* Ghost video / play button (centre) */}
        <g transform="translate(122,98) rotate(3)">
          <rect x="0" y="0" width="76" height="58" rx="4" className="ri-skd" strokeWidth="1.6"/>
          <rect x="6" y="-5" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <rect x="22" y="-5" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <rect x="38" y="-5" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <rect x="54" y="-5" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <rect x="6" y="57" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <rect x="22" y="57" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <rect x="38" y="57" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <rect x="54" y="57" width="8" height="6" rx="1" className="ri-skd" strokeWidth="1"/>
          <path d="M26,14 L26,44 L54,29 Z" className="ri-skd" strokeWidth="1.6"/>
        </g>
        {/* Ghost link (right) */}
        <g transform="translate(218,104) rotate(8)">
          <path d="M0,18 Q-2,8 6,4 L22,4 Q30,4 30,12 L30,22 Q30,30 22,30 L12,30" className="ri-skd" strokeWidth="1.6"/>
          <path d="M0,18 Q-2,8 6,4 L22,4 Q30,4 30,12 L30,22 Q30,30 22,30 L12,30" className="ri-skd" strokeWidth="0.9"/>
          <path d="M18,26 Q20,36 28,40 L44,40 Q52,40 52,32 L52,22 Q52,14 44,14 L30,14" className="ri-skd" strokeWidth="1.6"/>
          <path d="M18,26 Q20,36 28,40 L44,40 Q52,40 52,32 L52,22 Q52,14 44,14 L30,14" className="ri-skd" strokeWidth="0.9"/>
        </g>
        {/* Upward arrow */}
        <g transform="translate(160,28)" opacity="0.38">
          <line x1="0" y1="28" x2="0" y2="6" className="ri-sk" strokeWidth="1.8"/>
          <polyline points="-8,14 0,4 8,14" className="ri-sk" strokeWidth="1.8"/>
          <line x1="-10" y1="32" x2="10" y2="32" className="ri-sk" strokeWidth="1.5"/>
        </g>
        {/* Scattered dots */}
        <circle cx="96" cy="60" r="1.8" className="ri-fi" opacity="0.18"/>
        <circle cx="228" cy="58" r="1.5" className="ri-fi" opacity="0.15"/>
        <circle cx="158" cy="56" r="1.2" className="ri-fi" opacity="0.13"/>
      </g>
    </svg>
  )
}
