'use client'

import NextLink from 'next/link'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'

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

export type SentMessage = {
  id: string
  subject: string
  sent_to: string
  sent_at: string
  sent_by: string | null
}

export default function SentMessagesClient({ messages, clubSlug }: { messages: SentMessage[]; clubSlug: string }) {
  return (
    <Box>
      {messages.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <EmailIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
            No messages sent yet
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Emails sent to members will appear here.
          </Typography>
          <Button
            variant="contained"
            component={NextLink}
            href={`/${clubSlug}/admin/notifications/compose`}
            sx={{ mt: 0.5 }}
          >
            Create message
          </Button>
        </Paper>
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Subject', 'Sent To', 'Date Sent', 'Sent By'].map(h => (
                  <TableCell key={h} sx={COL_HEAD}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {messages.map((msg, i) => (
                <TableRow key={msg.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ ...COL_CELL, fontWeight: 500, color: 'text.primary' }}>
                    {msg.subject}
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, color: 'text.secondary' }}>
                    {msg.sent_to}
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {new Date(msg.sent_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, color: 'text.secondary' }}>
                    {msg.sent_by}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  )
}
