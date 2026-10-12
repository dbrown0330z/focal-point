'use client'

import { useEffect, useState } from 'react'
import { completeSetup } from './actions'
import { WelcomeTemplatePicker } from '@/components/setup/WelcomeTemplatePicker'
import type { WelcomeContent } from '@/lib/homepage/types'
import { WELCOME_TEMPLATES, resolveTemplate } from '@/lib/homepage/welcome-templates'

interface Props {
  clubSlug: string
  clubId:   string
  clubName: string
  adminEmail: string
}

const STEPS = [
  { id: 1, title: 'Welcome',          desc: "Let's get your club set up in a few minutes" },
  { id: 2, title: 'Club settings',    desc: 'A few details that keep things running smoothly' },
  { id: 3, title: 'Your homepage',    desc: 'How you introduce your club to the world' },
  { id: 4, title: "You're all set",   desc: 'Your club site is ready to go' },
]

// ── Timezone data ─────────────────────────────────────────────────────────────

const TZ_GROUPS: { group: string; zones: { value: string; label: string }[] }[] = [
  { group: 'Americas', zones: [
    { value: 'America/New_York',    label: 'Eastern Time — New York, Toronto'     },
    { value: 'America/Chicago',     label: 'Central Time — Chicago, Dallas'       },
    { value: 'America/Denver',      label: 'Mountain Time — Denver, Phoenix'      },
    { value: 'America/Los_Angeles', label: 'Pacific Time — Los Angeles, Vancouver'},
    { value: 'America/Anchorage',   label: 'Alaska Time'                          },
    { value: 'Pacific/Honolulu',    label: 'Hawaii Time'                          },
    { value: 'America/Halifax',     label: 'Atlantic Time — Halifax'              },
    { value: 'America/St_Johns',    label: 'Newfoundland Time'                    },
    { value: 'America/Sao_Paulo',   label: 'Brasília Time'                        },
    { value: 'America/Buenos_Aires',label: 'Argentina Time'                       },
    { value: 'America/Mexico_City', label: 'Central Time — Mexico City'           },
  ]},
  { group: 'Europe', zones: [
    { value: 'Europe/London',       label: 'GMT/BST — London, Dublin'             },
    { value: 'Europe/Paris',        label: 'Central European — Paris, Berlin'     },
    { value: 'Europe/Helsinki',     label: 'Eastern European — Helsinki, Kyiv'    },
    { value: 'Europe/Istanbul',     label: 'Turkey Time — Istanbul'               },
    { value: 'Europe/Moscow',       label: 'Moscow Time'                          },
  ]},
  { group: 'Asia-Pacific', zones: [
    { value: 'Asia/Dubai',          label: 'Gulf Time — Dubai, Abu Dhabi'         },
    { value: 'Asia/Kolkata',        label: 'India Standard Time'                  },
    { value: 'Asia/Bangkok',        label: 'Indochina Time — Bangkok, Jakarta'    },
    { value: 'Asia/Singapore',      label: 'Singapore / Kuala Lumpur Time'        },
    { value: 'Asia/Hong_Kong',      label: 'Hong Kong / China Time'               },
    { value: 'Asia/Tokyo',          label: 'Japan / Korea Time'                   },
    { value: 'Australia/Sydney',    label: 'Australian Eastern — Sydney, Melbourne'},
    { value: 'Australia/Adelaide',  label: 'Australian Central Time'              },
    { value: 'Australia/Perth',     label: 'Australian Western Time'              },
    { value: 'Pacific/Auckland',    label: 'New Zealand Time'                     },
  ]},
  { group: 'Africa & Middle East', zones: [
    { value: 'Africa/Cairo',        label: 'Egypt Time — Cairo'                   },
    { value: 'Africa/Johannesburg', label: 'South Africa Time'                    },
    { value: 'Africa/Lagos',        label: 'West Africa Time — Lagos'             },
    { value: 'Africa/Nairobi',      label: 'East Africa Time — Nairobi'           },
  ]},
]

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Default welcome content ────────────────────────────────────────────────────

function defaultWelcome(clubName: string): WelcomeContent {
  const t = WELCOME_TEMPLATES[0]
  const resolved = resolveTemplate(t, clubName, {})
  return {
    heading:      resolved.heading,
    body:         resolved.body,
    ctaLabel:     'Join the club',
    ctaLink:      '/apply',
    templateId:   t.id,
    templateVars: {},
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SetupWizard({ clubSlug, clubId, clubName, adminEmail }: Props) {
  const [step, setStep] = useState(1)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Step 2 fields
  const [shortName, setShortName]     = useState('')
  const [timezone, setTimezone]       = useState('America/New_York')
  const [fromEmail, setFromEmail]     = useState(adminEmail)
  const [seasonStart, setSeasonStart] = useState(9)  // September
  const [seasonEnd, setSeasonEnd]     = useState(6)  // June

  // Step 3: welcome block
  const [welcome, setWelcome] = useState<WelcomeContent>(() => defaultWelcome(clubName))

  // Detect browser timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const all = TZ_GROUPS.flatMap(g => g.zones)
      if (all.some(z => z.value === tz)) setTimezone(tz)
    } catch { /* keep default */ }
  }, [])

  async function finish() {
    setSaving(true)
    setError(null)
    const result = await completeSetup({
      clubId,
      clubName,
      shortName,
      timezone,
      fromEmail,
      seasonStart,
      seasonEnd,
      welcome,
    })
    if (result.error) { setError(result.error); setSaving(false) }
    // On success the server action redirects
  }

  return (
    <div className="w-full max-w-lg">

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              step === s.id ? 'bg-[#1A6FC4] text-white' :
              step >  s.id ? 'bg-green-500 text-white'  :
                             'bg-gray-200 text-gray-500'
            }`}>
              {step > s.id ? '✓' : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-10 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step-1].title}</h2>
          <p className="text-sm text-gray-500 mb-6">{STEPS[step-1].desc}</p>

          {/* ── Step 1: Welcome ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Welcome to Focal Point! Your club site is provisioned and ready to configure.
                This quick setup takes about five minutes and gets you ready for your first
                competition.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  'Set your timezone and contact email',
                  'Write your homepage welcome message',
                  'Download the setup guide',
                ].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-[#1A6FC4] font-bold">→</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Step 2: Club settings ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <Field label="Club abbreviation" hint="e.g. SRPC — used in email subjects and tight UI spaces">
                <input
                  type="text"
                  value={shortName}
                  onChange={e => setShortName(e.target.value)}
                  placeholder={clubName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 6)}
                  className={inputCls}
                />
              </Field>

              <Field label="Timezone">
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
                  {TZ_GROUPS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.zones.map(z => (
                        <option key={z.value} value={z.value}>{z.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>

              <Field label="Club contact email" hint="Shown in outgoing emails as the reply address for members">
                <input
                  type="email"
                  value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  placeholder="info@yourclub.com"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Season start">
                  <select value={seasonStart} onChange={e => setSeasonStart(Number(e.target.value))} className={inputCls}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Season end">
                  <select value={seasonEnd} onChange={e => setSeasonEnd(Number(e.target.value))} className={inputCls}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </Field>
              </div>
              <p className="text-xs text-gray-400">Season months affect how competitions are grouped and points-of-year are calculated.</p>
            </div>
          )}

          {/* ── Step 3: Homepage welcome ─────────────────────────────────── */}
          {step === 3 && (
            <WelcomeTemplatePicker
              clubName={clubName}
              value={welcome}
              onChange={setWelcome}
            />
          )}

          {/* ── Step 4: Done ─────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-gray-700 leading-relaxed">
                  <strong>{clubName}</strong> is configured and ready. Head to your
                  dashboard to create your first competition or start inviting members.
                </p>
              </div>
              <a
                href="/setup-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">Download the setup guide</p>
                  <p className="text-xs text-gray-500 mt-0.5">Step-by-step walkthrough of everything in Focal Point</p>
                </div>
                <span className="text-gray-400 group-hover:text-blue-500 text-lg">↗</span>
              </a>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-100 px-8 py-4 flex justify-between items-center">
          {step > 1 && step < 4 ? (
            <button onClick={() => setStep(s => s - 1)} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </button>
          ) : <div />}

          {step < 3 && (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-5 py-2 bg-[#1A6FC4] text-white rounded-lg text-sm font-semibold hover:bg-[#155AA3] transition-colors"
            >
              Continue →
            </button>
          )}

          {step === 3 && (
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2 bg-[#1A6FC4] text-white rounded-lg text-sm font-semibold hover:bg-[#155AA3] transition-colors"
            >
              Continue →
            </button>
          )}

          {step === 4 && (
            <button
              onClick={finish}
              disabled={saving}
              className="px-5 py-2 bg-[#1A6FC4] text-white rounded-lg text-sm font-semibold hover:bg-[#155AA3] transition-colors disabled:opacity-50"
            >
              {saving ? 'Setting up…' : 'Go to admin dashboard →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
