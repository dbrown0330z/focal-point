'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

type SeasonOption = { year: number; label: string; isCurrent: boolean }

export default function SeasonPicker({
  options,
  current,
  clubSlug,
}: {
  options:   SeasonOption[]
  current:   number
  clubSlug:  string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(value: string) {
    startTransition(() => {
      const p = new URLSearchParams(searchParams.toString())
      p.set('season', value)
      router.push(`/${clubSlug}/competitions/results?${p.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Season</span>
      <Select
        size="small"
        value={current}
        onChange={e => handleChange(String(e.target.value))}
        sx={{
          fontSize: 13,
          fontFamily: 'inherit',
          minWidth: 120,
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          '& .MuiSelect-select': { color: 'var(--text-primary)' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-default)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-strong)' },
          '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
        }}
      >
        {options.map(o => (
          <MenuItem key={o.year} value={o.year} sx={{ fontSize: 13, fontFamily: 'inherit' }}>
            {o.label}{o.isCurrent ? ' (current)' : ''}
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}
