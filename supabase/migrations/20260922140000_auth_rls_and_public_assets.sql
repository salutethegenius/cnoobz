-- Better Auth tables are only used via DATABASE_URL (postgres role).
-- Enable RLS with no anon policies so the Data API cannot read sessions or passwords.
alter table "user" enable row level security;
alter table "session" enable row level security;
alter table "account" enable row level security;
alter table "verification" enable row level security;

-- Public newsletter / brand assets: anyone can read objects in this bucket.
-- Uploads still go through the Next.js server with the service role key.
drop policy if exists "Public read cnoobz-assets" on storage.objects;
create policy "Public read cnoobz-assets"
  on storage.objects
  for select
  to public
  using (bucket_id = 'cnoobz-assets');
