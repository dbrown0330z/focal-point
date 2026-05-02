-- Allow members to overwrite (update) files in their own storage folder.
-- The images bucket already has INSERT and DELETE policies scoped to the
-- owner's folder; UPDATE was missing, causing upsert to fail on re-upload.

create policy "Members can update own images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
