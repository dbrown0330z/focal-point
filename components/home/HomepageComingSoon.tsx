import Link from 'next/link'

export default function HomepageComingSoon({
  clubName,
  clubSlug,
}: {
  clubName: string
  clubSlug: string
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14">
      {/* Text content */}
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--text-secondary)',
        marginBottom: 16,
      }}>
        Welcome
      </p>

      <h1 style={{
        fontFamily:    'var(--font-lora, Georgia, serif)',
        fontSize:      32,
        fontWeight:    700,
        letterSpacing: '-0.02em',
        color:         'var(--text-primary)',
        lineHeight:    1.25,
        marginBottom:  18,
      }}>
        Welcome to {clubName}!
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 22 }}>
        Your new home for everything {clubName} — competitions, galleries, member profiles, and more.
        We&apos;re still putting the finishing touches on things, but there&apos;s plenty to explore in the meantime.
      </p>

      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
        Here&apos;s a great place to start:
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          {
            href: `/${clubSlug}/library`,
            label: 'Upload your photos',
            desc: 'add images to your personal library and create galleries you can share with the club or make public',
          },
          {
            href: `/${clubSlug}/profile`,
            label: 'Complete your member profile',
            desc: 'add a photo, a short bio, and your photography interests so the community gets to know you',
          },
          {
            href: `/${clubSlug}/our-club/members`,
            label: 'Browse the member directory',
            desc: 'see who else has joined and start connecting',
          },
          {
            href: `/${clubSlug}/calendar`,
            label: 'Check the calendar',
            desc: 'see upcoming meetings and events',
          },
        ].map(item => (
          <li key={item.href} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <span style={{ marginTop: 4, flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)', display: 'inline-block' }} />
            <span>
              <Link href={item.href} style={{ color: 'var(--action-primary)', fontWeight: 500, textDecoration: 'none' }}>
                {item.label}
              </Link>
              {' '}— {item.desc}
            </span>
          </li>
        ))}
      </ul>

      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
        Check back soon — the homepage will be up shortly.
      </p>

      {/* Illustration */}
      <div style={{ marginTop: 52, width: '100%' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 540" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <style>{`
            .nvpc-root { --ink: #1a1a1a; }
            @media (prefers-color-scheme: dark) { .nvpc-root { --ink: #e8e8e8; } }
            .sk  { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; }
            .sk2 { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: 0.55; }
            .hatch { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: 0.13; }
            .fill-ink { fill: var(--ink); stroke: none; }
            .dot { fill: var(--ink); }
          `}</style>

          <g className="nvpc-root">

          {/* BLOCK 1: LARGE GALLERY */}
          <g transform="translate(20,20)">
            <rect x="1" y="1" width="420" height="260" rx="10" className="sk" strokeWidth="2"/>
            <rect x="2.5" y="2.5" width="419" height="259" rx="9.5" className="sk2" strokeWidth="1.2"/>
            <text x="16" y="22" fontFamily="Georgia, serif" fontSize="11" fill="var(--ink)" opacity="0.5" fontStyle="italic">Gallery</text>
            <rect x="14" y="30" width="260" height="162" rx="5" className="sk" strokeWidth="1.8"/>
            <rect x="15.5" y="31.5" width="259" height="161" rx="4.5" className="sk2" strokeWidth="1"/>
            <line x1="20" y1="38" x2="268" y2="38" className="hatch" strokeWidth="1.2"/>
            <line x1="20" y1="44" x2="268" y2="44" className="hatch" strokeWidth="1.2"/>
            <line x1="20" y1="50" x2="268" y2="50" className="hatch" strokeWidth="1.2"/>
            <line x1="20" y1="56" x2="268" y2="56" className="hatch" strokeWidth="1.2"/>
            <polyline points="14,130 55,72 90,100 130,60 175,98 220,65 268,95 268,192 14,192" className="sk" strokeWidth="1.5" fill="var(--ink)" opacity="0.07"/>
            <polyline points="14,130 55,72 90,100 130,60 175,98 220,65 268,95 268,192 14,192" className="sk2" strokeWidth="0.8"/>
            <circle cx="240" cy="52" r="12" className="sk" strokeWidth="1.5"/>
            <circle cx="240" cy="52" r="12" className="sk2" strokeWidth="0.8"/>
            <path d="M14,155 Q80,148 140,158 Q200,165 268,152" className="sk" strokeWidth="1.3"/>
            <line x1="14" y1="200" x2="160" y2="200" className="sk" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="14" y1="208" x2="110" y2="208" className="sk" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
            <g transform="translate(245,35)">
              <circle cx="16" cy="16" r="13" className="sk" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="13" className="sk2" strokeWidth="0.8"/>
              <circle cx="16" cy="16" r="8" className="sk" strokeWidth="1.2"/>
              <path d="M16,3 Q19,9 16,8 Q13,9 16,3" className="sk" strokeWidth="0.9"/>
              <path d="M29,16 Q23,19 24,16 Q23,13 29,16" className="sk" strokeWidth="0.9"/>
              <path d="M16,29 Q13,23 16,24 Q19,23 16,29" className="sk" strokeWidth="0.9"/>
              <path d="M3,16 Q9,13 8,16 Q9,19 3,16" className="sk" strokeWidth="0.9"/>
              <polygon points="16,10 17.5,14.5 22,14.5 18.5,17 20,21.5 16,19 12,21.5 13.5,17 10,14.5 14.5,14.5" className="sk" strokeWidth="0.8" fill="var(--ink)" opacity="0.12"/>
              <path d="M10,28 L8,38 L16,34 L24,38 L22,28" className="sk" strokeWidth="1.2"/>
            </g>
            <g transform="translate(284,30)">
              <rect x="0" y="0" width="62" height="46" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="1.2" width="61" height="45" rx="3.5" className="sk2" strokeWidth="0.9"/>
              <path d="M4,30 L18,14 L30,24 L42,10 L58,26 L58,42 L4,42 Z" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.08"/>
              <rect x="0" y="54" width="62" height="46" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="55.2" width="61" height="45" rx="3.5" className="sk2" strokeWidth="0.9"/>
              <circle cx="30" cy="77" r="14" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.06"/>
              <line x1="20" y1="60" x2="45" y2="94" className="hatch" strokeWidth="1"/>
              <line x1="28" y1="58" x2="55" y2="95" className="hatch" strokeWidth="1"/>
              <rect x="0" y="108" width="62" height="46" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="109.2" width="61" height="45" rx="3.5" className="sk2" strokeWidth="0.9"/>
              <path d="M4,140 Q20,118 38,128 Q52,112 60,130 L60,150 L4,150 Z" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.08"/>
              <rect x="0" y="162" width="62" height="46" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="163.2" width="61" height="45" rx="3.5" className="sk2" strokeWidth="0.9"/>
              <line x1="8" y1="170" x2="55" y2="200" className="hatch" strokeWidth="2"/>
              <line x1="16" y1="166" x2="60" y2="200" className="hatch" strokeWidth="2"/>
              <line x1="5" y1="178" x2="48" y2="205" className="hatch" strokeWidth="2"/>
            </g>
            <line x1="14" y1="245" x2="70" y2="245" className="sk" strokeWidth="1" opacity="0.4"/>
            <polyline points="62,241 70,245 62,249" className="sk" strokeWidth="1.2" opacity="0.4"/>
          </g>

          {/* BLOCK 2: MEMBER SPOTLIGHT */}
          <g transform="translate(458,20)">
            <rect x="1" y="1" width="220" height="260" rx="10" className="sk" strokeWidth="2"/>
            <rect x="2.5" y="2.5" width="219" height="259" rx="9.5" className="sk2" strokeWidth="1.2"/>
            <text x="14" y="22" fontFamily="Georgia, serif" fontSize="11" fill="var(--ink)" opacity="0.5" fontStyle="italic">Member Spotlight</text>
            <clipPath id="hp-avatarClip">
              <circle cx="110" cy="85" r="52"/>
            </clipPath>
            <circle cx="110" cy="85" r="52" className="sk" strokeWidth="2"/>
            <circle cx="110" cy="85" r="52" className="sk2" strokeWidth="1"/>
            <g clipPath="url(#hp-avatarClip)">
              <path d="M38,138 Q55,106 110,106 Q165,106 182,138 L182,140 L38,140 Z" className="sk" strokeWidth="1.8" fill="var(--ink)" opacity="0.1"/>
              <path d="M38,138 Q55,106 110,106 Q165,106 182,138 L182,140 L38,140 Z" className="sk2" strokeWidth="1"/>
              <rect x="101" y="96" width="18" height="14" rx="3" className="sk" strokeWidth="1.3" fill="var(--ink)" opacity="0.06"/>
              <circle cx="110" cy="68" r="28" className="sk" strokeWidth="1.8" fill="var(--ink)" opacity="0.06"/>
              <circle cx="110" cy="68" r="28" className="sk2" strokeWidth="1"/>
              <path d="M82,62 Q84,38 110,36 Q136,38 138,62 Q138,54 110,52 Q82,54 82,62 Z" className="sk" strokeWidth="1.3" fill="var(--ink)" opacity="0.15"/>
              <ellipse cx="101" cy="66" rx="4" ry="4.5" className="sk" strokeWidth="1.3"/>
              <ellipse cx="119" cy="66" rx="4" ry="4.5" className="sk" strokeWidth="1.3"/>
              <circle cx="102" cy="67" r="1.8" className="fill-ink" opacity="0.6"/>
              <circle cx="120" cy="67" r="1.8" className="fill-ink" opacity="0.6"/>
              <path d="M110,72 Q107,78 109,80 Q112,82 115,80" className="sk" strokeWidth="1.1"/>
              <path d="M103,84 Q110,89 117,84" className="sk" strokeWidth="1.4"/>
            </g>
            <line x1="68" y1="138" x2="152" y2="138" className="sk" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
            <line x1="82" y1="148" x2="138" y2="148" className="sk" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
            <text x="18" y="178" fontFamily="Georgia, serif" fontSize="24" fill="var(--ink)" opacity="0.2">&ldquo;</text>
            <line x1="18" y1="185" x2="200" y2="185" className="sk" strokeWidth="1" opacity="0.3"/>
            <line x1="18" y1="193" x2="200" y2="193" className="sk" strokeWidth="1" opacity="0.3"/>
            <line x1="18" y1="201" x2="148" y2="201" className="sk" strokeWidth="1" opacity="0.3"/>
            <g transform="translate(58,218)">
              <polygon points="8,0 10,6 16,6 11,10 13,16 8,12 3,16 5,10 0,6 6,6" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.6"/>
              <polygon points="24,0 26,6 32,6 27,10 29,16 24,12 19,16 21,10 16,6 22,6" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.6"/>
              <polygon points="40,0 42,6 48,6 43,10 45,16 40,12 35,16 37,10 32,6 38,6" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.6"/>
              <polygon points="56,0 58,6 64,6 59,10 61,16 56,12 51,16 53,10 48,6 54,6" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.6"/>
              <polygon points="72,0 74,6 80,6 75,10 77,16 72,12 67,16 69,10 64,6 70,6" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.25"/>
              <polygon points="72,0 74,6 80,6 75,10 77,16 72,12 67,16 69,10 64,6 70,6" className="sk" strokeWidth="1"/>
            </g>
            <line x1="68" y1="248" x2="152" y2="248" className="sk" strokeWidth="1" opacity="0.35"/>
          </g>

          {/* BLOCK 3: MY LIBRARY */}
          <g transform="translate(20,298)">
            <rect x="1" y="1" width="200" height="220" rx="10" className="sk" strokeWidth="2"/>
            <rect x="2.5" y="2.5" width="199" height="219" rx="9.5" className="sk2" strokeWidth="1.2"/>
            <text x="14" y="22" fontFamily="Georgia, serif" fontSize="11" fill="var(--ink)" opacity="0.5" fontStyle="italic">My Library</text>
            <g transform="translate(12,30)">
              <rect x="0" y="0" width="82" height="56" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="1.2" width="81" height="55" rx="3.5" className="sk2" strokeWidth="0.8"/>
              <path d="M4,38 L22,18 L38,30 L54,12 L78,30 L78,52 L4,52 Z" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.07"/>
              <rect x="92" y="0" width="82" height="56" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="93.2" y="1.2" width="81" height="55" rx="3.5" className="sk2" strokeWidth="0.8"/>
              <circle cx="134" cy="26" r="14" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.06"/>
              <rect x="0" y="66" width="82" height="56" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="67.2" width="81" height="55" rx="3.5" className="sk2" strokeWidth="0.8"/>
              <line x1="4" y1="72" x2="78" y2="116" className="hatch" strokeWidth="2"/>
              <line x1="14" y1="68" x2="80" y2="108" className="hatch" strokeWidth="2"/>
              <rect x="92" y="66" width="82" height="56" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="93.2" y="67.2" width="81" height="55" rx="3.5" className="sk2" strokeWidth="0.8"/>
              <path d="M96,110 Q116,88 134,98 Q152,80 170,100 L170,120 L96,120 Z" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.08"/>
              <rect x="0" y="132" width="82" height="56" rx="4" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="133.2" width="81" height="55" rx="3.5" className="sk2" strokeWidth="0.8"/>
              <path d="M4,160 L24,140 L44,150 L78,136 L78,184 L4,184 Z" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.07"/>
              <rect x="92" y="132" width="82" height="56" rx="4" className="sk" strokeWidth="1.5" fill="var(--ink)" opacity="0.06"/>
              <rect x="92" y="132" width="82" height="56" rx="4" className="sk" strokeWidth="1.5"/>
              <text x="133" y="164" fontFamily="Georgia, serif" fontSize="14" fill="var(--ink)" opacity="0.55" textAnchor="middle" fontStyle="italic">+48</text>
              <text x="133" y="178" fontFamily="Georgia, serif" fontSize="9" fill="var(--ink)" opacity="0.35" textAnchor="middle">more</text>
            </g>
          </g>

          {/* BLOCK 4: SCHEDULE */}
          <g transform="translate(238,298)">
            <rect x="1" y="1" width="220" height="220" rx="10" className="sk" strokeWidth="2"/>
            <rect x="2.5" y="2.5" width="219" height="219" rx="9.5" className="sk2" strokeWidth="1.2"/>
            <text x="14" y="22" fontFamily="Georgia, serif" fontSize="11" fill="var(--ink)" opacity="0.5" fontStyle="italic">Schedule</text>
            <g transform="translate(14,28)">
              <rect x="0" y="6" width="30" height="26" rx="3" className="sk" strokeWidth="1.5"/>
              <rect x="0.8" y="6.8" width="29" height="25" rx="2.5" className="sk2" strokeWidth="0.8"/>
              <line x1="0" y1="14" x2="30" y2="14" className="sk" strokeWidth="1.2"/>
              <line x1="9" y1="2" x2="9" y2="12" className="sk" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="21" y1="2" x2="21" y2="12" className="sk" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="7" cy="20" r="1.5" className="dot" opacity="0.5"/>
              <circle cx="15" cy="20" r="1.5" className="dot" opacity="0.5"/>
              <circle cx="23" cy="20" r="1.5" className="dot" opacity="0.5"/>
              <circle cx="7" cy="27" r="1.5" className="dot" opacity="0.5"/>
              <circle cx="15" cy="27" r="1.5" className="dot" opacity="0.8"/>
              <circle cx="23" cy="27" r="1.5" className="dot" opacity="0.5"/>
            </g>
            <g transform="translate(12,72)">
              <rect x="0" y="0" width="34" height="36" rx="4" className="sk" strokeWidth="1.5" fill="var(--ink)" opacity="0.07"/>
              <rect x="0" y="0" width="34" height="36" rx="4" className="sk" strokeWidth="1.5"/>
              <line x1="0" y1="12" x2="34" y2="12" className="sk" strokeWidth="1" opacity="0.4"/>
              <text x="17" y="9" fontFamily="Georgia, serif" fontSize="7" fill="var(--ink)" opacity="0.4" textAnchor="middle">NOV</text>
              <text x="17" y="29" fontFamily="Georgia, serif" fontSize="14" fill="var(--ink)" opacity="0.7" textAnchor="middle" fontWeight="bold">14</text>
              <line x1="44" y1="10" x2="196" y2="10" className="sk" strokeWidth="1.5" opacity="0.5"/>
              <line x1="44" y1="20" x2="160" y2="20" className="sk" strokeWidth="1" opacity="0.3"/>
              <line x1="44" y1="29" x2="130" y2="29" className="sk" strokeWidth="0.9" opacity="0.2"/>
            </g>
            <g transform="translate(12,120)">
              <rect x="0" y="0" width="34" height="36" rx="4" className="sk" strokeWidth="1.5" fill="var(--ink)" opacity="0.07"/>
              <rect x="0" y="0" width="34" height="36" rx="4" className="sk" strokeWidth="1.5"/>
              <line x1="0" y1="12" x2="34" y2="12" className="sk" strokeWidth="1" opacity="0.4"/>
              <text x="17" y="9" fontFamily="Georgia, serif" fontSize="7" fill="var(--ink)" opacity="0.4" textAnchor="middle">NOV</text>
              <text x="17" y="29" fontFamily="Georgia, serif" fontSize="14" fill="var(--ink)" opacity="0.7" textAnchor="middle" fontWeight="bold">21</text>
              <line x1="44" y1="10" x2="196" y2="10" className="sk" strokeWidth="1.5" opacity="0.5"/>
              <line x1="44" y1="20" x2="150" y2="20" className="sk" strokeWidth="1" opacity="0.3"/>
              <line x1="44" y1="29" x2="180" y2="29" className="sk" strokeWidth="0.9" opacity="0.2"/>
            </g>
            <g transform="translate(12,168)">
              <rect x="0" y="0" width="34" height="36" rx="4" className="sk" strokeWidth="1.5" fill="var(--ink)" opacity="0.07"/>
              <rect x="0" y="0" width="34" height="36" rx="4" className="sk" strokeWidth="1.5"/>
              <line x1="0" y1="12" x2="34" y2="12" className="sk" strokeWidth="1" opacity="0.4"/>
              <text x="17" y="9" fontFamily="Georgia, serif" fontSize="7" fill="var(--ink)" opacity="0.4" textAnchor="middle">DEC</text>
              <text x="17" y="29" fontFamily="Georgia, serif" fontSize="14" fill="var(--ink)" opacity="0.7" textAnchor="middle" fontWeight="bold">5</text>
              <line x1="44" y1="10" x2="196" y2="10" className="sk" strokeWidth="1.5" opacity="0.5"/>
              <line x1="44" y1="20" x2="170" y2="20" className="sk" strokeWidth="1" opacity="0.3"/>
              <line x1="44" y1="29" x2="140" y2="29" className="sk" strokeWidth="0.9" opacity="0.2"/>
            </g>
          </g>

          {/* BLOCK 5: NEWS */}
          <g transform="translate(476,298)">
            <rect x="1" y="1" width="202" height="220" rx="10" className="sk" strokeWidth="2"/>
            <rect x="2.5" y="2.5" width="201" height="219" rx="9.5" className="sk2" strokeWidth="1.2"/>
            <text x="14" y="22" fontFamily="Georgia, serif" fontSize="11" fill="var(--ink)" opacity="0.5" fontStyle="italic">News</text>
            <g transform="translate(12,30)">
              <rect x="0" y="0" width="52" height="42" rx="3" className="sk" strokeWidth="1.5"/>
              <rect x="1.2" y="1.2" width="51" height="41" rx="2.5" className="sk2" strokeWidth="0.8"/>
              <path d="M4,30 L16,14 L28,22 L40,8 L48,18 L48,38 L4,38 Z" className="sk" strokeWidth="1" fill="var(--ink)" opacity="0.08"/>
              <line x1="60" y1="8" x2="178" y2="8" className="sk" strokeWidth="1.5" opacity="0.5"/>
              <line x1="60" y1="17" x2="178" y2="17" className="sk" strokeWidth="1.3" opacity="0.4"/>
              <line x1="60" y1="26" x2="148" y2="26" className="sk" strokeWidth="1.1" opacity="0.3"/>
              <circle cx="172" cy="6" r="5" className="sk" strokeWidth="1.2" fill="var(--ink)" opacity="0.7"/>
              <line x1="60" y1="36" x2="120" y2="36" className="sk" strokeWidth="0.9" opacity="0.2"/>
            </g>
            <line x1="12" y1="84" x2="190" y2="84" className="sk" strokeWidth="0.8" strokeDasharray="3,4" opacity="0.25"/>
            <g transform="translate(12,92)">
              <line x1="0" y1="0" x2="178" y2="0" className="sk" strokeWidth="1.3" opacity="0.4"/>
              <line x1="0" y1="9" x2="155" y2="9" className="sk" strokeWidth="1.1" opacity="0.3"/>
              <line x1="0" y1="17" x2="100" y2="17" className="sk" strokeWidth="0.9" opacity="0.2"/>
            </g>
            <line x1="12" y1="120" x2="190" y2="120" className="sk" strokeWidth="0.8" strokeDasharray="3,4" opacity="0.25"/>
            <g transform="translate(12,128)">
              <line x1="0" y1="0" x2="178" y2="0" className="sk" strokeWidth="1.3" opacity="0.4"/>
              <line x1="0" y1="9" x2="162" y2="9" className="sk" strokeWidth="1.1" opacity="0.3"/>
              <line x1="0" y1="17" x2="120" y2="17" className="sk" strokeWidth="0.9" opacity="0.2"/>
            </g>
            <line x1="12" y1="156" x2="190" y2="156" className="sk" strokeWidth="0.8" strokeDasharray="3,4" opacity="0.25"/>
            <g transform="translate(12,164)">
              <line x1="0" y1="0" x2="178" y2="0" className="sk" strokeWidth="1.3" opacity="0.4"/>
              <line x1="0" y1="9" x2="140" y2="9" className="sk" strokeWidth="1.1" opacity="0.3"/>
              <line x1="0" y1="17" x2="90" y2="17" className="sk" strokeWidth="0.9" opacity="0.2"/>
            </g>
            <line x1="12" y1="208" x2="80" y2="208" className="sk" strokeWidth="1" opacity="0.35"/>
            <polyline points="72,204 80,208 72,212" className="sk" strokeWidth="1.2" opacity="0.35"/>
          </g>

          {/* DECORATIVE ACCENTS */}
          <path d="M8,18 L8,8 L18,8" className="sk" strokeWidth="1.5" opacity="0.3"/>
          <path d="M692,18 L692,8 L682,8" className="sk" strokeWidth="1.5" opacity="0.3"/>
          <path d="M8,522 L8,532 L18,532" className="sk" strokeWidth="1.5" opacity="0.3"/>
          <path d="M692,522 L692,532 L682,532" className="sk" strokeWidth="1.5" opacity="0.3"/>
          <g transform="translate(444,60)" opacity="0.4">
            <line x1="0" y1="-8" x2="0" y2="8" className="sk" strokeWidth="1.5"/>
            <line x1="-8" y1="0" x2="8" y2="0" className="sk" strokeWidth="1.5"/>
            <line x1="-5" y1="-5" x2="5" y2="5" className="sk" strokeWidth="1"/>
            <line x1="5" y1="-5" x2="-5" y2="5" className="sk" strokeWidth="1"/>
          </g>
          <g transform="translate(228,390)" opacity="0.35">
            <line x1="0" y1="-7" x2="0" y2="7" className="sk" strokeWidth="1.4"/>
            <line x1="-7" y1="0" x2="7" y2="0" className="sk" strokeWidth="1.4"/>
            <line x1="-4" y1="-4" x2="4" y2="4" className="sk" strokeWidth="0.9"/>
            <line x1="4" y1="-4" x2="-4" y2="4" className="sk" strokeWidth="0.9"/>
          </g>
          <g transform="translate(466,390)" opacity="0.35">
            <line x1="0" y1="-7" x2="0" y2="7" className="sk" strokeWidth="1.4"/>
            <line x1="-7" y1="0" x2="7" y2="0" className="sk" strokeWidth="1.4"/>
            <line x1="-4" y1="-4" x2="4" y2="4" className="sk" strokeWidth="0.9"/>
            <line x1="4" y1="-4" x2="-4" y2="4" className="sk" strokeWidth="0.9"/>
          </g>
          <circle cx="350" cy="290" r="2.5" className="dot" opacity="0.2"/>
          <circle cx="340" cy="290" r="1.5" className="dot" opacity="0.15"/>
          <circle cx="360" cy="290" r="1.5" className="dot" opacity="0.15"/>

          </g>
        </svg>
      </div>
    </div>
  )
}
