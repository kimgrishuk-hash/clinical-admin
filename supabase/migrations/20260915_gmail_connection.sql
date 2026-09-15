create table if not exists public.clinic_oauth_states (
  state_hash text primary key,
  provider text not null check (provider in ('gmail')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.clinic_oauth_states enable row level security;
revoke all on table public.clinic_oauth_states from anon, authenticated;

create table if not exists public.clinic_connections (
  provider text primary key check (provider in ('gmail')),
  account_address text,
  status text not null default 'connected' check (status in ('connected', 'error', 'disconnected')),
  refresh_token_ciphertext text,
  granted_scope text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinic_connections enable row level security;
revoke all on table public.clinic_connections from anon, authenticated;

alter table public.clinic_inbox_events
  add constraint clinic_inbox_events_channel_external_id_key unique (channel, external_id);

