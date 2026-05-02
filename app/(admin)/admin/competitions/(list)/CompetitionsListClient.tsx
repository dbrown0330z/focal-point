'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  Chip,
  MenuItem,
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
import { unarchiveCompetition } from '../actions'
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
  fontSize: 14, py: 1.25, px: 2,
  borderBottom: '1px solid', borderColor: 'divider',
  fontFamily: 'inherit',
}

export default function CompetitionsListClient({
  meetingLocations = [],
  competitions,
  templates,
  members,
  clubCategories = [],
  clubDefaults = {},
}: {
  competitions:      Competition[]
  templates:         Template[]
  members:           { id: string; name: string; email?: string }[]
  meetingLocations?: string[]
  clubCategories?:   string[]
  clubDefaults?:     Partial<CompetitionConfig>
}) {
  const [filter,     setFilter]     = useState<Filter>('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [,           startTransition] = useTransition()

  const filtered = (() => {
    if (filter === 'all')       return competitions
    if (filter === 'archived')  return competitions.filter(c => c.archived_at !== null)
    if (filter === 'cancelled') return competitions.filter(c => c.status === 'cancelled')
    // active: not archived, not cancelled
    return competitions.filter(c => c.archived_at === null && c.status !== 'cancelled')
  })()

  const countActive    = competitions.filter(c => c.archived_at === null && c.status !== 'cancelled').length
  const countArchived  = competitions.filter(c => c.archived_at !== null).length
  const countCancelled = competitions.filter(c => c.status === 'cancelled').length

  return (
    <>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
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
            All ({competitions.length})
          </MenuItem>
        </Select>

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
                        href={`/admin/competitions/${comp.id}`}
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
                            href={`/admin/competitions/${comp.id}#judge`}
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
                      {isArchived ? (
                        <Typography
                          component="button"
                          onClick={() => startTransition(() => unarchiveCompetition(comp.id))}
                          sx={{
                            fontSize: 13, fontWeight: 400,
                            color: 'text.secondary',
                            textDecoration: 'none',
                            fontFamily: 'inherit',
                            background: 'none', border: 'none',
                            cursor: 'pointer', p: 0,
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Unarchive
                        </Typography>
                      ) : (
                        <Typography
                          component={Link}
                          href={`/admin/competitions/${comp.id}`}
                          sx={{
                            fontSize: 14, fontWeight: 400,
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontFamily: 'inherit',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {isComplete ? 'Details' : 'Edit'}
                        </Typography>
                      )}
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
      />
    </>
  )
}
