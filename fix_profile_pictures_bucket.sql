-- Enable the storage extension if not already enabled (usually enabled by default)
-- create extension if not exists "storage" schema "extensions";

-- 1. Create the 'profile-pictures' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update
set public = true; -- Ensure it IS public

-- 2. Enable RLS on storage.objects (good practice, though often on by default)
alter table storage.objects enable row level security;

-- 3. Create Policy: Allow public access to view profile pictures
-- Drop existing policy if it exists to avoid conflicts/duplication during re-runs
drop policy if exists "Public Access to Profile Pictures" on storage.objects;

create policy "Public Access to Profile Pictures"
on storage.objects for select
using ( bucket_id = 'profile-pictures' );

-- 4. Create Policy: Allow authenticated users to upload their own profile pictures
drop policy if exists "Authenticated Users can Insert Profile Pictures" on storage.objects;

create policy "Authenticated Users can Insert Profile Pictures"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] != 'private' -- Optional safety
);

-- 5. Create Policy: Allow users to update their own profile pictures (if needed)
drop policy if exists "Authenticated Users can Update Profile Pictures" on storage.objects;

create policy "Authenticated Users can Update Profile Pictures"
on storage.objects for update
to authenticated
using ( bucket_id = 'profile-pictures' )
with check ( bucket_id = 'profile-pictures' );

-- 6. Create Policy: Allow users to delete their own profile pictures
drop policy if exists "Authenticated Users can Delete Profile Pictures" on storage.objects;

create policy "Authenticated Users can Delete Profile Pictures"
on storage.objects for delete
to authenticated
using ( bucket_id = 'profile-pictures' );
