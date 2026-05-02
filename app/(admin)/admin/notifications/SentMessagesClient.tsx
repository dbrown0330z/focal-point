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

export type SentMessage = {
  id: string
  subject: string
  sent_to: string
  sent_at: string
  sent_by: string
}

export default function SentMessagesClient({ messages }: { messages: SentMessage[] }) {
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
            href="/admin/notifications/compose"
            sx={{ mt: 0.5 }}
          >
            Create message
          </Button>
        </Paper>
      ) : (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Subject
                </TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Sent To
                </TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Date Sent
                </TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                  Sent By
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages.map(msg => (
                <TableRow key={msg.id} hover>
                  <TableCell sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
                    {msg.subject}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {msg.sent_to}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {new Date(msg.sent_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {msg.sent_by}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  )
}
