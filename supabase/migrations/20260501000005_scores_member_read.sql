-- Members can read scores for closed competitions
-- This enables the member-facing results page to display scores.
-- Scores for non-closed competitions remain hidden from members.

create policy "scores: member read closed competitions"
  on public.scores for select
  using (
    is_approved_member() AND
    exists (
      select 1
        from public.submissions s
        join public.competitions c on c.id = s.competition_id
       where s.id = scores.submission_id
         and c.status = 'closed'
    )
  );
