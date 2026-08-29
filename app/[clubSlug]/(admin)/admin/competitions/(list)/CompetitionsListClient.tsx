'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CreateCompetitionWizard from './CreateCompetitionWizard'
import { unarchiveCompetition, cancelCompetition } from '../actions'
import type { CompetitionConfig } from '@/types/competition'

type CompetitionStatus = 'draft' | 'open' | 'judging' | 'judging_on_hold' | 'closed' | 'cancelled' | 'results_pending' | 'results_published'

type Competition = {
  id:               string
  title:            string
  status:           CompetitionStatus
  opens_at:         string | null
  closes_at:        string | null
  judging_at:       string | null
  judging_opens_at: string | null
  template_id:      string | null
  judges:           string[]
  submissionCount:  number
  archived_at:      string | null
}

type Template = {
  id:     string
  name:   string
  config: CompetitionConfig
}

const STATUS_STYLE: Record<CompetitionStatus, { bgcolor: string; color: string }> = {
  draft:             { bgcolor: 'background.default', color: 'text.secondary' },
  open:              { bgcolor: 'success.light',      color: 'success.contrastText' },
  judging:           { bgcolor: 'warning.light',      color: 'warning.contrastText' },
  judging_on_hold:   { bgcolor: 'error.light',        color: 'error.contrastText' },
  closed:            { bgcolor: 'background.default', color: 'text.secondary' },
  cancelled:         { bgcolor: 'background.default', color: 'text.secondary' },
  results_pending:   { bgcolor: 'background.default', color: 'text.disabled' },
  results_published: { bgcolor: 'success.light',      color: 'success.contrastText' },
}

const STATUS_LABEL: Record<CompetitionStatus, string> = {
  draft:             'Draft',
  open:              'Open',
  judging:           'Judging',
  judging_on_hold:   'On hold',
  closed:            'Closed',
  cancelled:         'Cancelled',
  results_pending:   'Results pending',
  results_published: 'Results published',
}

type Filter = 'active' | 'archived' | 'cancelled' | 'all'

const CANCELABLE: CompetitionStatus[] = ['draft', 'open', 'judging', 'judging_on_hold']

// ─── Club year utilities ──────────────────────────────────────────────────────

/** Returns e.g. "2024" (calendar year) or "2024–25" (split year) */
function clubYearLabel(date: Date, startMonth: number): string {
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  if (startMonth === 1) return String(y)
  const sy = m >= startMonth ? y : y - 1
  return `${sy}–${String(sy + 1).slice(-2)}`
}

/** Returns the start and end Date for a given year label */
function clubYearRange(label: string, startMonth: number): { start: Date; end: Date } {
  if (startMonth === 1) {
    const y = parseInt(label)
    return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) }
  }
  const sy = parseInt(label.split('–')[0])
  return {
    start: new Date(sy,     startMonth - 1, 1),
    end:   new Date(sy + 1, startMonth - 1, 1),
  }
}

/** Reference date for a competition (first non-null: opens_at → closes_at → judging_at) */
function compRefDate(c: Competition): Date | null {
  const d = c.opens_at ?? c.closes_at ?? c.judging_at
  return d ? new Date(d) : null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const COL_HEAD = {
  fontSize: 11, fontWeight: 600, color: 'text.secondary',
  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  py: 1.25, px: 2, borderBottom: '1px solid', borderColor: 'divider',
  bgcolor: 'background.default', fontFamily: 'inherit',
}

const COL_CELL = {
  fontSize: 14, py: 2.75, px: 2,
  borderBottom: '1px solid', borderColor: 'divider',
  fontFamily: 'inherit',
}

export default function CompetitionsListClient({
  meetingLocations   = [],
  competitions,
  templates,
  members,
  clubCategories     = [],
  clubDefaults       = {},
  clubSlug,
  seasonStartMonth   = 1,
}: {
  competitions:        Competition[]
  templates:           Template[]
  members:             { id: string; name: string; email?: string }[]
  meetingLocations?:   string[]
  clubCategories?:     string[]
  clubDefaults?:       Partial<CompetitionConfig>
  clubSlug:            string
  seasonStartMonth?:   number
}) {
  // ── Club year options ──────────────────────────────────────────────────────
  const currentYearLabel = clubYearLabel(new Date(), seasonStartMonth)

  const yearOptions: string[] = (() => {
    const labels = new Set<string>()
    labels.add(currentYearLabel)
    for (const c of competitions) {
      const d = compRefDate(c)
      if (d) labels.add(clubYearLabel(d, seasonStartMonth))
    }
    return ['all', ...Array.from(labels).sort((a, b) => b.localeCompare(a))]
  })()

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filter,     setFilter]     = useState<Filter>('active')
  const [yearFilter, setYearFilter] = useState<string>(currentYearLabel)
  const [createOpen, setCreateOpen] = useState(false)
  const [,           startTransition] = useTransition()

  // ── Cancel dialog ──────────────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState<Competition | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling,   setCancelling]   = useState(false)

  // Filter by club year first, then by status filter
  const yearFiltered = (() => {
    if (yearFilter === 'all') return competitions
    const { start, end } = clubYearRange(yearFilter, seasonStartMonth)
    return competitions.filter(c => {
      const d = compRefDate(c)
      return d && d >= start && d < end
    })
  })()

  const filtered = (() => {
    if (filter === 'all')       return yearFiltered
    if (filter === 'archived')  return yearFiltered.filter(c => c.archived_at !== null)
    if (filter === 'cancelled') return yearFiltered.filter(c => c.status === 'cancelled')
    return yearFiltered.filter(c => c.archived_at === null && c.status !== 'cancelled')
  })()

  // Counts based on year-filtered set
  const countActive    = yearFiltered.filter(c => c.archived_at === null && c.status !== 'cancelled').length
  const countArchived  = yearFiltered.filter(c => c.archived_at !== null).length
  const countCancelled = yearFiltered.filter(c => c.status === 'cancelled').length

  return (
    <>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Year selector */}
          <Select
            size="small"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            sx={{ fontSize: 13, minWidth: 140, fontFamily: 'inherit' }}
          >
            <MenuItem value="all" sx={{ fontSize: 13, fontFamily: 'inherit' }}>All years</MenuItem>
            {yearOptions.filter(y => y !== 'all').map(y => (
              <MenuItem key={y} value={y} sx={{ fontSize: 13, fontFamily: 'inherit' }}>
                {y === currentYearLabel ? `${y} (current)` : y}
              </MenuItem>
            ))}
          </Select>

          {/* Status filter */}
          <Select
            size="small"
            value={filter}
            onChange={e => setFilter(e.target.value as Filter)}
            sx={{ fontSize: 13, minWidth: 160, fontFamily: 'inherit' }}
          >
            <MenuItem value="active" sx={{ fontSize: 13, fontFamily: 'inherit' }}>
              Active ({countActive})
            </MenuItem>
            <MenuItem value="archived" sx={{ fontSize: 13, fontFamily: 'inherit' }}>
              Archived ({countArchived})
            </MenuItem>
            <MenuItem value="cancelled" sx={{ fontSize: 13, fontFamily: 'inherit' }}>
              Cancelled ({countCancelled})
            </MenuItem>
            <MenuItem value="all" sx={{ fontSize: 13, fontFamily: 'inherit' }}>
              All ({yearFiltered.length})
            </MenuItem>
          </Select>
        </Box>

        {competitions.length > 0 && (
          <Button
            variant="contained"
            onClick={() => setCreateOpen(true)}
            startIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            New competition
          </Button>
        )}
      </Box>

      {/* Table */}
      {filtered.length === 0 ? (
        competitions.length === 0 ? (
          <Paper variant="outlined" sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
              No competitions created yet
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Create your first competition to get started.
            </Typography>
            <Button variant="contained" sx={{ mt: 0.5 }} onClick={() => setCreateOpen(true)}>
              New competition
            </Button>
          </Paper>
        ) : (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              No {filter} competitions.
            </Typography>
          </Box>
        )
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={COL_HEAD}>Status</TableCell>
                <TableCell sx={COL_HEAD}>Competition name</TableCell>
                <TableCell sx={COL_HEAD}>Results date</TableCell>
                <TableCell sx={COL_HEAD}>Judge(s)</TableCell>
                <TableCell sx={{ ...COL_HEAD, textAlign: 'right' }}>Submissions</TableCell>
                <TableCell sx={{ ...COL_HEAD, width: 80 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(comp => {
                const isComplete  = comp.status === 'closed' || comp.status === 'results_pending' || comp.status === 'results_published'
                const isArchived  = comp.archived_at !== null
                const resultsDate = comp.judging_at ?? comp.closes_at

                return (
                  <TableRow
                    key={comp.id}
                    sx={{ '&:last-child td': { borderBottom: 'none' }, '&:hover': { bgcolor: 'action.hover' }, opacity: isArchived ? 0.65 : 1 }}
                  >
                    <TableCell sx={COL_CELL}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Chip
                          label={STATUS_LABEL[comp.status]}
                          size="small"
                          sx={{
                            fontFamily: 'inherit', fontSize: 11, height: 22, fontWeight: 500,
                            ...STATUS_STYLE[comp.status],
                          }}
                        />
                        {isArchived && (
                          <Chip
                            label="Archived"
                            size="small"
                            sx={{ fontFamily: 'inherit', fontSize: 11, height: 22, fontWeight: 500, bgcolor: 'background.default', color: 'text.secondary' }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={COL_CELL}>
                      <Typography
                        component={Link}
                        href={`/${clubSlug}/admin/competitions/${comp.id}`}
                        sx={{
                          fontSize: 14, fontWeight: 400,
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontFamily: 'inherit',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {comp.title}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ ...COL_CELL, color: 'text.secondary' }}>
                      {formatDate(resultsDate)}
                    </TableCell>

                    <TableCell sx={{ ...COL_CELL, color: 'text.secondary' }}>
                      {comp.judges.length > 0 ? (
                        comp.judges.join(', ')
                      ) : comp.status !== 'draft' && comp.status !== 'closed' && comp.status !== 'cancelled' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography sx={{ fontSize: 12, color: 'warning.main', fontFamily: 'inherit' }}>
                            ⚠ No judge
                          </Typography>
                          <Typography
                            component={Link}
                            href={`/${clubSlug}/admin/competitions/${comp.id}#judge`}
                            sx={{
                              fontSize: 12, color: 'primary.main', fontFamily: 'inherit',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            Assign →
                          </Typography>
                        </Box>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell sx={{ ...COL_CELL, textAlign: 'right', color: 'text.secondary' }}>
                      {comp.submissionCount > 0 ? comp.submissionCount : '—'}
                    </TableCell>

                    <TableCell sx={{ ...COL_CELL, textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
                        {isArchived ? (
                          <Typography
                            component="button"
                            onClick={() => startTransition(() => unarchiveCompetition(comp.id))}
                            sx={{ fontSize: 13, color: 'text.secondary', background: 'none', border: 'none', cursor: 'pointer', p: 0, fontFamily: 'inherit', '&:hover': { textDecoration: 'underline' } }}
                          >
                            Unarchive
                          </Typography>
                        ) : (
                          <>
                            {CANCELABLE.includes(comp.status) && (
                              <Typography
                                component="button"
                                onClick={() => { setCancelTarget(comp); setCancelReason('') }}
                                sx={{ fontSize: 14, color: 'text.secondary', background: 'none', border: 'none', cursor: 'pointer', p: 0, fontFamily: 'inherit', '&:hover': { textDecoration: 'underline', color: 'error.main' } }}
                              >
                                Cancel
                              </Typography>
                            )}
                            <Typography
                              component={Link}
                              href={`/${clubSlug}/admin/competitions/${comp.id}`}
                              sx={{ fontSize: 14, color: 'primary.main', textDecoration: 'none', fontFamily: 'inherit', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {isComplete ? 'Details' : 'Edit'}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <CreateCompetitionWizard
        open={createOpen}
        onClose={() => { setCreateOpen(false) }}
        templates={templates}
        members={members}
        meetingLocations={meetingLocations}
        clubCategories={clubCategories}
        clubDefaults={clubDefaults}
        clubSlug={clubSlug}
      />

      {/* Cancel competition dialog */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => !cancelling && setCancelTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 2 } } }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>Cancel competition?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
            <strong>{cancelTarget?.title}</strong> will be marked as cancelled. Members who submitted entries will be notified and their images returned. This cannot be undone.
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.75, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Reason <span style={{ fontWeight: 400, textTransform: 'none' }}>(sent to members)</span>
          </Typography>
          <OutlinedInput
            fullWidth
            multiline
            minRows={2}
            size="small"
            placeholder="e.g. Insufficient entries received"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            disabled={cancelling}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>
            Keep competition
          </Button>
          <Button
            variant="outlined"
            disabled={cancelling || !cancelReason.trim()}
            onClick={async () => {
              if (!cancelTarget || !cancelReason.trim()) return
              setCancelling(true)
              try {
                await cancelCompetition(cancelTarget.id, cancelReason.trim())
                setCancelTarget(null)
              } finally {
                setCancelling(false)
              }
            }}
            sx={{
              bgcolor: 'error.light', color: 'error.contrastText',
              borderColor: 'error.main',
              '&:hover': { bgcolor: 'error.main', color: '#fff' },
              '&.Mui-disabled': { opacity: 0.5 },
            }}
          >
            {cancelling ? 'Cancelling…' : 'Cancel competition'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
