-- Seed administrative membership for an existing Auth user.
--
-- Security note:
-- This migration intentionally does not create or update auth.users,
-- and does not manage credentials.
-- Create or invite the Auth user through Supabase Auth Dashboard or the
-- secure admin-invite-user Edge Function before running this seed.

do $$
declare
  v_email text := 'ysalek@gmail.com';
  v_user_id uuid;
  v_membership_san_mateo uuid;
  v_membership_elite uuid;
  v_role_platform_superadmin uuid;
  v_role_tenant_owner uuid;
begin
  select id into v_role_platform_superadmin
  from public.roles
  where tenant_id is null
    and code = 'platform_superadmin'
  limit 1;

  select id into v_role_tenant_owner
  from public.roles
  where tenant_id is null
    and code = 'tenant_owner'
  limit 1;

  if v_role_platform_superadmin is null or v_role_tenant_owner is null then
    raise exception 'Required platform roles are missing.';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    raise notice 'Auth user % does not exist. Skipping platform superadmin seed without creating credentials.', v_email;
    return;
  end if;

  insert into public.user_profiles (id, full_name, email, initials, title, locale, timezone)
  values (v_user_id, 'Ysalek', v_email, 'YS', 'Superadministrador plataforma', 'es-CO', 'America/Bogota')
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    initials = excluded.initials,
    title = excluded.title,
    locale = excluded.locale,
    timezone = excluded.timezone,
    updated_at = now();

  insert into public.tenant_memberships (tenant_id, user_id, status, title)
  values
    ('11111111-1111-4111-8111-111111111111', v_user_id, 'active', 'Superadministrador plataforma'),
    ('22222222-2222-4222-8222-222222222222', v_user_id, 'active', 'Superadministrador plataforma')
  on conflict (tenant_id, user_id) do update
  set
    status = 'active',
    title = excluded.title,
    updated_at = now();

  select id into v_membership_san_mateo
  from public.tenant_memberships
  where tenant_id = '11111111-1111-4111-8111-111111111111'
    and user_id = v_user_id
  limit 1;

  select id into v_membership_elite
  from public.tenant_memberships
  where tenant_id = '22222222-2222-4222-8222-222222222222'
    and user_id = v_user_id
  limit 1;

  insert into public.membership_roles (membership_id, role_id)
  values
    (v_membership_san_mateo, v_role_platform_superadmin),
    (v_membership_san_mateo, v_role_tenant_owner),
    (v_membership_elite, v_role_tenant_owner)
  on conflict (membership_id, role_id) do nothing;

  delete from public.tenant_invites
  where lower(email) = lower(v_email);
end $$;
