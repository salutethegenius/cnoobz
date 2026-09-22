-- Newsletter: one subscriber list + sent campaigns.

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active',
  source text not null default 'pay',
  unsubscribe_token text not null unique,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists newsletters (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  headline text,
  body text,
  hero_image_path text,
  extra_images jsonb not null default '[]'::jsonb,
  cta_label text,
  cta_url text,
  status text not null default 'draft',
  sent_at timestamptz,
  recipient_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscribers_status on subscribers (status);
create index if not exists idx_subscribers_email on subscribers (email);
create index if not exists idx_newsletters_created_at on newsletters (created_at desc);

alter table subscribers enable row level security;
alter table newsletters enable row level security;
