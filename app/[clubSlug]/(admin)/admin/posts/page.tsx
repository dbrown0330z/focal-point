import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubSlug } from '@/lib/club-context'
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

export const dynamic = 'force-dynamic'

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

export default async function AdminPostsPage() {
  const clubSlug = await requireClubSlug()
  const admin = createServiceClient()

  const { data: posts } = await admin
    .from('posts')
    .select('id, title, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">News &amp; Posts</h1>
          <p className="mt-1 text-sm text-content-secondary">Create and manage club news posts for members.</p>
        </Box>
        <Button variant="contained" component={Link} href={`/${clubSlug}/admin/posts/new`}>
          New post
        </Button>
      </Box>

      {!posts?.length ? (
        <Paper variant="outlined" sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>No posts yet</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Create your first news post to share updates with members.
          </Typography>
          <Button variant="contained" component={Link} href={`/${clubSlug}/admin/posts/new`} sx={{ mt: 0.5 }}>
            New post
          </Button>
        </Paper>
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Title', 'Status', 'Date'].map(h => (
                  <TableCell key={h} sx={COL_HEAD}>{h}</TableCell>
                ))}
                <TableCell sx={COL_HEAD} />
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map(post => (
                <TableRow key={post.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ ...COL_CELL, fontWeight: 500 }}>
                    {post.title}
                  </TableCell>
                  <TableCell sx={COL_CELL}>
                    <Chip
                      label={post.published_at ? 'Published' : 'Draft'}
                      size="small"
                      sx={post.published_at
                        ? { bgcolor: 'success.light', color: 'success.contrastText', fontFamily: 'inherit', fontSize: 11 }
                        : { bgcolor: 'background.default', color: 'text.secondary', fontFamily: 'inherit', fontSize: 11 }
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    }
                  </TableCell>
                  <TableCell sx={{ ...COL_CELL, width: 60 }} align="right">
                    <Typography
                      component={Link}
                      href={`/${clubSlug}/admin/posts/${post.id}`}
                      sx={{ fontSize: 14, fontFamily: 'inherit', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Edit
                    </Typography>
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
