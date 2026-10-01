'use client'

import { useState } from 'react'
import { completeSetup } from './actions'

interface Props {
  clubSlug: string
  clubId:   string
  clubName: string
}

const STEPS = [
  { id: 1, title: 'Welcome',       description: "Let's get your club set up" },
  { id: 2, title: 'Club Details',  description: 'Basic information about your club' },
  { id: 3, title: 'Ready to Go',   description: 'Your club site is ready' },
]

export default function SetupWizard({ clubSlug, clubId, clubName }: Props) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ clubName, location: '', description: '', joinOpen: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function finish() {
    setSaving(true)
    setError(null)
    const result = await completeSetup({ clubId, ...form })
    if (result.error) {
      setError(result.error)
      setSaving(false)
    }
    // On success, server action redirects to admin
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              step === s.id  ? 'bg-[#1A6FC4] text-white' :
              step > s.id   ? 'bg-green-500 text-white' :
                              'bg-gray-200 text-gray-500'
            }`}>
              {step > s.id ? '✓' : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step-1].title}</h2>
          <p className="text-sm text-gray-500 mb-6">{STEPS[step-1].description}</p>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Welcome to Focal Point! Your club site is ready to configure. This quick setup
                will get you started in just a couple of minutes.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                {['Set your club details', 'Configure membership settings', 'Invite your members'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Club name">
                <input
                  type="text"
                  value={form.clubName}
                  onChange={e => update('clubName', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </Field>
              <Field label="Location (city/region)">
                <input
                  type="text"
                  value={form.location}
                  onChange={e => update('location', e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </Field>
              <Field label="Club description (optional)">
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  rows={3}
                  placeholder="A short description for your public club page..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </Field>
              <Field label="Open membership">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.joinOpen}
                    onChange={e => update('joinOpen', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Allow members to apply online</span>
                </label>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="text-5xl">🎉</div>
              <p className="text-gray-700 leading-relaxed">
                Your club <strong>{form.clubName}</strong> is all set up and ready to go.
                Head to your admin dashboard to start managing members and competitions.
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-8 py-4 flex justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="text-sm text-gray-500 hover:text-gray-700">
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-5 py-2 bg-[#1A6FC4] text-white rounded-lg text-sm font-medium hover:bg-[#155AA3] transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="px-5 py-2 bg-[#1A6FC4] text-white rounded-lg text-sm font-medium hover:bg-[#155AA3] transition-colors disabled:opacity-50"
            >
              {saving ? 'Setting up…' : 'Go to admin dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
