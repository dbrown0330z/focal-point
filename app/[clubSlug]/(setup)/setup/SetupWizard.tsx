'use client'

import { useEffect, useState } from 'react'
import { completeSetup } from './actions'

interface Props {
  clubSlug:   string
  clubId:     string
  clubName:   string
  clubLocation: string
}

const TZ_GROUPS: { group: string; zones: { value: string; label: string }[] }[] = [
  { group: 'Americas', zones: [
    { value: 'America/New_York',    label: 'Eastern Time — New York, Toronto'      },
    { value: 'America/Chicago',     label: 'Central Time — Chicago, Dallas'        },
    { value: 'America/Denver',      label: 'Mountain Time — Denver, Phoenix'       },
    { value: 'America/Los_Angeles', label: 'Pacific Time — Los Angeles, Vancouver' },
    { value: 'America/Anchorage',   label: 'Alaska Time'                           },
    { value: 'Pacific/Honolulu',    label: 'Hawaii Time'                           },
    { value: 'America/Halifax',     label: 'Atlantic Time — Halifax'               },
    { value: 'America/St_Johns',    label: 'Newfoundland Time'                     },
    { value: 'America/Sao_Paulo',   label: 'Brasília Time'                         },
    { value: 'America/Buenos_Aires',label: 'Argentina Time'                        },
    { value: 'America/Mexico_City', label: 'Central Time — Mexico City'            },
  ]},
  { group: 'Europe', zones: [
    { value: 'Europe/London',       label: 'GMT/BST — London, Dublin'              },
    { value: 'Europe/Paris',        label: 'Central European — Paris, Berlin'      },
    { value: 'Europe/Helsinki',     label: 'Eastern European — Helsinki, Kyiv'     },
    { value: 'Europe/Istanbul',     label: 'Turkey Time — Istanbul'                },
    { value: 'Europe/Moscow',       label: 'Moscow Time'                           },
  ]},
  { group: 'Asia-Pacific', zones: [
    { value: 'Asia/Dubai',          label: 'Gulf Time — Dubai, Abu Dhabi'          },
    { value: 'Asia/Kolkata',        label: 'India Standard Time'                   },
    { value: 'Asia/Bangkok',        label: 'Indochina Time — Bangkok, Jakarta'     },
    { value: 'Asia/Singapore',      label: 'Singapore / Kuala Lumpur Time'         },
    { value: 'Asia/Hong_Kong',      label: 'Hong Kong / China Time'                },
    { value: 'Asia/Tokyo',          label: 'Japan / Korea Time'                    },
    { value: 'Australia/Sydney',    label: 'Australian Eastern — Sydney, Melbourne'},
    { value: 'Australia/Adelaide',  label: 'Australian Central Time'               },
    { value: 'Australia/Perth',     label: 'Australian Western Time'               },
    { value: 'Pacific/Auckland',    label: 'New Zealand Time'                      },
  ]},
  { group: 'Africa & Middle East', zones: [
    { value: 'Africa/Cairo',        label: 'Egypt Time — Cairo'                    },
    { value: 'Africa/Johannesburg', label: 'South Africa Time'                     },
    { value: 'Africa/Lagos',        label: 'West Africa Time — Lagos'              },
    { value: 'Africa/Nairobi',      label: 'East Africa Time — Nairobi'            },
  ]},
]

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white'

export default function SetupWizard({ clubSlug, clubId, clubName: initialClubName, clubLocation }: Props) {
  const [clubName,  setClubName]  = useState(initialClubName)
  const [shortName, setShortName] = useState('')
  const [location,  setLocation]  = useState(clubLocation)
  const [timezone,  setTimezone]  = useState('America/New_York')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Auto-detect timezone from browser
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const all = TZ_GROUPS.flatMap(g => g.zones)
      if (all.some(z => z.value === tz)) setTimezone(tz)
    } catch { /* keep default */ }
  }, [])

  async function handleNext(next: 'admin' | 'homepage') {
    setSaving(true)
    setError(null)
    const result = await completeSetup({ clubId, clubName, shortName, location, timezone, next })
    if (result.error) { setError(result.error); setSaving(false) }
    // On success the server action redirects
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Club basics</h2>
            <p className="text-sm text-gray-500 mt-1">A few details — you can update these anytime in your admin area.</p>
          </div>

          <Field label="Club name">
            <input
              type="text"
              value={clubName}
              onChange={e => setClubName(e.target.value)}
              placeholder="e.g. Six Rivers Photography Club"
              className={inputCls}
            />
          </Field>

          <Field
            label="Club short name"
            hint="Abbreviation used in emails and tight UI spaces — e.g. SRPC"
          >
            <input
              type="text"
              value={shortName}
              onChange={e => setShortName(e.target.value)}
              placeholder={
                clubName
                  .split(' ')
                  .filter(w => w.length > 2)
                  .map(w => w[0].toUpperCase())
                  .join('')
                  .slice(0, 6) || 'e.g. SRPC'
              }
              className={inputCls}
            />
          </Field>

          <Field label="Location" hint="City and province/state — e.g. Eureka, CA">
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Eureka, CA"
              className={inputCls}
            />
          </Field>

          <Field label="Timezone" hint="Auto-detected from your browser — you can change it">
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

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 px-8 py-5 flex flex-col gap-3">
          <p className="text-xs text-gray-400 text-center mb-1">
            More settings — competitions, members, homepage — are in your admin area.
          </p>
          <button
            onClick={() => handleNext('admin')}
            disabled={saving}
            className="w-full rounded-lg bg-[#1A6FC4] py-2.5 text-sm font-semibold text-white hover:bg-[#155AA3] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Continue to admin dashboard →'}
          </button>
          <button
            onClick={() => handleNext('homepage')}
            disabled={saving}
            className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            View my club homepage
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
