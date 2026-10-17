export default function TrophyIllustration({ size = 120 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <style>{`
        .ti-root { --ink: #1a1a1a; }
        @media (prefers-color-scheme: dark) { .ti-root { --ink: #e8e8e8; } }
        .ti-sk  { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .ti-sk2 { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: 0.5; }
        .ti-h   { stroke: var(--ink); fill: none; stroke-linecap: round; opacity: 0.14; }
        .ti-fi  { fill: var(--ink); stroke: none; }
      `}</style>
      <g className="ti-root">
        {/* shadow */}
        <ellipse cx="52" cy="87" rx="28" ry="4" className="ti-sk" strokeWidth="0.7" fill="var(--ink)" opacity="0.07"/>
        <ellipse cx="52" cy="87" rx="28" ry="4" className="ti-sk2" strokeWidth="0.4"/>

        {/* trophy, tipped ~20° */}
        <g transform="translate(50,54) rotate(20)">
          <path d="M-17,30 Q-16,27 -13,26 L13,26 Q16,27 17,30 Z" className="ti-sk" strokeWidth="1.2" fill="var(--ink)" opacity="0.07"/>
          <path d="M-17,30 Q-16,27 -13,26 L13,26 Q16,27 17,30 Z" className="ti-sk2" strokeWidth="0.7"/>
          <path d="M-11,26 Q-10,23 -8,22 L8,22 Q10,23 11,26 Z" className="ti-sk" strokeWidth="1.2" fill="var(--ink)" opacity="0.07"/>
          <path d="M-11,26 Q-10,23 -8,22 L8,22 Q10,23 11,26 Z" className="ti-sk2" strokeWidth="0.7"/>
          <path d="M-4,22 L-4,15 Q-5,13 -5,11 L5,11 Q5,13 4,15 L4,22 Z" className="ti-sk" strokeWidth="1.2" fill="var(--ink)" opacity="0.07"/>
          <path d="M-4,22 L-4,15 Q-5,13 -5,11 L5,11 Q5,13 4,15 L4,22 Z" className="ti-sk2" strokeWidth="0.7"/>
          <line x1="-4" y1="14" x2="4" y2="14" className="ti-h" strokeWidth="1"/>
          <line x1="-4" y1="17" x2="4" y2="17" className="ti-h" strokeWidth="1"/>
          <line x1="-4" y1="20" x2="4" y2="20" className="ti-h" strokeWidth="1"/>
          <path d="M-5,11 Q-6,8 -16,0 Q-20,-8 -18,-18 Q-14,-26 0,-28 Q14,-26 18,-18 Q20,-8 16,0 Q6,8 5,11 Z" className="ti-sk" strokeWidth="1.4" fill="var(--ink)" opacity="0.06"/>
          <path d="M-5,11 Q-6,8 -16,0 Q-20,-8 -18,-18 Q-14,-26 0,-28 Q14,-26 18,-18 Q20,-8 16,0 Q6,8 5,11 Z" className="ti-sk2" strokeWidth="0.8"/>
          <line x1="-14" y1="-2" x2="-4" y2="10" className="ti-h" strokeWidth="1.2"/>
          <line x1="-16" y1="-10" x2="-6" y2="8" className="ti-h" strokeWidth="1.2"/>
          <line x1="-16" y1="-18" x2="-8" y2="6" className="ti-h" strokeWidth="1.2"/>
          <path d="M-13,-20 Q-18,-10 -17,0" className="ti-sk" strokeWidth="0.9" opacity="0.2"/>
          <path d="M-16,0 Q-26,-2 -27,-10 Q-27,-20 -18,-19" className="ti-sk" strokeWidth="1.3"/>
          <path d="M-16,0 Q-26,-2 -27,-10 Q-27,-20 -18,-19" className="ti-sk2" strokeWidth="0.7"/>
          <path d="M16,0 Q26,-2 27,-10 Q27,-20 18,-19" className="ti-sk" strokeWidth="1.3"/>
          <path d="M16,0 Q26,-2 27,-10 Q27,-20 18,-19" className="ti-sk2" strokeWidth="0.7"/>
          <path d="M-18,-18 Q-12,-24 0,-25 Q12,-24 18,-18 Q12,-12 0,-11 Q-12,-12 -18,-18 Z" className="ti-sk" strokeWidth="1" fill="var(--ink)" opacity="0.04"/>
          <path d="M-18,-18 Q-12,-24 0,-25 Q12,-24 18,-18 Q12,-12 0,-11 Q-12,-12 -18,-18 Z" className="ti-sk2" strokeWidth="0.6"/>
        </g>

        {/* impact stars */}
        <g transform="translate(76,28)" opacity="0.5">
          <line x1="0" y1="-5" x2="0" y2="5" className="ti-sk" strokeWidth="1.1"/>
          <line x1="-5" y1="0" x2="5" y2="0" className="ti-sk" strokeWidth="1.1"/>
          <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" className="ti-sk" strokeWidth="0.8"/>
          <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" className="ti-sk" strokeWidth="0.8"/>
        </g>
        <g transform="translate(84,42)" opacity="0.35">
          <line x1="0" y1="-3.5" x2="0" y2="3.5" className="ti-sk" strokeWidth="0.9"/>
          <line x1="-3.5" y1="0" x2="3.5" y2="0" className="ti-sk" strokeWidth="0.9"/>
          <line x1="-2.5" y1="-2.5" x2="2.5" y2="2.5" className="ti-sk" strokeWidth="0.7"/>
          <line x1="2.5" y1="-2.5" x2="-2.5" y2="2.5" className="ti-sk" strokeWidth="0.7"/>
        </g>

        {/* motion arcs */}
        <path d="M22,72 Q24,68 27,72" className="ti-sk" strokeWidth="0.9" opacity="0.3"/>
        <path d="M17,79 Q20,74 24,79" className="ti-sk" strokeWidth="0.8" opacity="0.22"/>

        {/* question mark */}
        <g transform="translate(14,22)" opacity="0.3">
          <path d="M0,0 Q0,-6 4,-7 Q8,-8 8,-4 Q8,0 4,3 Q4,5 4,7" className="ti-sk" strokeWidth="1.3"/>
          <circle cx="4" cy="10" r="1" className="ti-fi" opacity="0.5"/>
        </g>
      </g>
    </svg>
  )
}
