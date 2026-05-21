create or replace function public.debug_seeded_auth_user(p_email text)
returns table (
  user_id uuid,
  email text,
  aud text,
  role text,
  email_confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz,
  is_sso_user boolean,
  is_anonymous boolean,
  app_meta jsonb,
  user_meta jsonb,
  identity_id uuid,
  provider text,
  provider_id text,
  identity_email text,
  identity_data jsonb
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id,
    u.email,
    u.aud,
    u.role,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at,
    u.deleted_at,
    u.is_sso_user,
    u.is_anonymous,
    u.raw_app_meta_data,
    u.raw_user_meta_data,
    i.id,
    i.provider,
    i.provider_id,
    i.email,
    i.identity_data
  from auth.users u
  left join auth.identities i on i.user_id = u.id
  where lower(u.email) = lower(p_email);
$$;
