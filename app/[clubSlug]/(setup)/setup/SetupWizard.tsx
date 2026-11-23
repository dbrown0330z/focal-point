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

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#292929',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  color: '#E8E8E8',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: '#9E9E9E',
  letterSpacing: '0.02em',
}

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#737373',
  marginTop: 4,
}

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
    <div style={{
      minHeight: '100vh',
      background: '#141414',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'var(--font-roboto-mono, "Roboto Mono", monospace)',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A90D4', marginBottom: 12 }}>
            One more step
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8E8E8', marginBottom: 8, letterSpacing: '-0.01em', margin: '0 0 8px' }}>
            Club basics
          </h1>
          <p style={{ fontSize: 14, color: '#737373', lineHeight: 1.6, margin: 0 }}>
            A few details to get started — you can update these anytime in your admin area.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1E1E1E',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '28px 28px 24px', display: 'grid', gap: 20 }}>

            <Field label="Club name" labelStyle={labelStyle}>
              <input
                type="text"
                value={clubName}
                onChange={e => setClubName(e.target.value)}
                placeholder="e.g. Six Rivers Photography Club"
                style={inputStyle}
              />
            </Field>

            <Field
              label="Club short name"
              labelStyle={labelStyle}
              hint="Abbreviation used in emails and tight UI spaces — e.g. SRPC"
              hintStyle={hintStyle}
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
                style={inputStyle}
              />
            </Field>

            <Field label="Location" labelStyle={labelStyle} hint="City and state/province — e.g. Eureka, CA" hintStyle={hintStyle}>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Eureka, CA"
                style={inputStyle}
              />
            </Field>

            <Field label="Timezone" labelStyle={labelStyle} hint="Auto-detected from your browser" hintStyle={hintStyle}>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
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
              <p style={{
                borderRadius: 8, padding: '10px 14px', fontSize: 13, margin: 0,
                background: 'rgba(211,47,47,0.12)', color: '#F09595',
                border: '1px solid rgba(211,47,47,0.25)',
              }}>
                {error}
              </p>
            )}
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '20px 28px',
            display: 'grid',
            gap: 10,
          }}>
            <p style={{ fontSize: 12, color: '#525252', textAlign: 'center', margin: '0 0 4px' }}>
              Competitions, members, and homepage customisation are in your admin area.
            </p>
            <button
              onClick={() => handleNext('admin')}
              disabled={saving}
              style={{
                width: '100%',
                background: saving ? 'rgba(74,144,212,0.40)' : '#4A90D4',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 20px',
                fontSize: 15,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.01em',
              }}
            >
              {saving ? 'Saving…' : 'Go to admin dashboard →'}
            </button>
            <button
              onClick={() => handleNext('homepage')}
              disabled={saving}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#9E9E9E',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '11px 20px',
                fontSize: 14,
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              View my club homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, hint, children, labelStyle, hintStyle,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  labelStyle: React.CSSProperties
  hintStyle?: React.CSSProperties
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {hint && <p style={{ ...hintStyle, marginBottom: 6 }}>{hint}</p>}
      {children}
    </div>
  )
}
