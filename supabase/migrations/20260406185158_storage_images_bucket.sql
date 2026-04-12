-- Public bucket: anyone with the URL can view images.
-- Uploads and deletes are restricted to the owning member.
insert into storage.buckets (id, name, public)
values ('images', 'images', true);

-- Storage path convention: {user_id}/{filename}
-- The first folder segment must match the uploading user's ID.

create policy "Members can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Members can delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'images');
