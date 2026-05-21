create table if not exists public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text,
  invite_code text not null unique,
  role_code text not null,
  status text not null default 'active' check (status in ('active', 'redeemed', 'revoked', 'expired')),
  expires_at timestamptz,
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenant_invites_tenant_status on public.tenant_invites(tenant_id, status);
create index if not exists idx_tenant_invites_code on public.tenant_invites(invite_code);

alter table public.tenant_invites enable row level security;

drop policy if exists "tenant invites isolated" on public.tenant_invites;
create policy "tenant invites isolated" on public.tenant_invites
for select to authenticated
using (tenant_id = any(public.current_tenant_ids()) or public.is_platform_superadmin());

insert into public.roles (id, tenant_id, code, name, description, level, is_system) values
  ('10000000-0000-4000-8000-000000000001', null, 'platform_superadmin', 'Superadmin plataforma', 'Operacion SaaS, tenants, planes y soporte.', 'platform', true),
  ('10000000-0000-4000-8000-000000000002', null, 'tenant_owner', 'Owner del tenant', 'Control total sobre configuracion, usuarios y suscripcion.', 'tenant', true),
  ('10000000-0000-4000-8000-000000000003', null, 'nutrition_director', 'Director de nutricion', 'Gobierno clinico, protocolos, reportes y aprobaciones.', 'clinical', true),
  ('10000000-0000-4000-8000-000000000004', null, 'clinical_nutritionist', 'Nutricionista clinico', 'Atencion clinica, planes y evolucion.', 'clinical', true),
  ('10000000-0000-4000-8000-000000000005', null, 'anthropometrist', 'Antropometrista', 'Medicion avanzada y control de calidad.', 'clinical', true),
  ('10000000-0000-4000-8000-000000000006', null, 'sports_nutritionist', 'Nutricionista deportivo', 'Atletas, composicion corporal y ciclos de entrenamiento.', 'clinical', true),
  ('10000000-0000-4000-8000-000000000007', null, 'auditor', 'Auditor', 'Lectura de datos y trazabilidad sin modificar registros.', 'operational', true)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  description = excluded.description,
  level = excluded.level,
  is_system = excluded.is_system,
  updated_at = now();

insert into public.role_permissions (role_id, permission_id) values
  ('10000000-0000-4000-8000-000000000001', 'platform.tenants.manage'),
  ('10000000-0000-4000-8000-000000000001', 'audit.read'),
  ('10000000-0000-4000-8000-000000000002', 'billing.manage'),
  ('10000000-0000-4000-8000-000000000002', 'settings.manage'),
  ('10000000-0000-4000-8000-000000000002', 'users.manage'),
  ('10000000-0000-4000-8000-000000000002', 'patients.read'),
  ('10000000-0000-4000-8000-000000000002', 'reports.export'),
  ('10000000-0000-4000-8000-000000000002', 'audit.read'),
  ('10000000-0000-4000-8000-000000000002', 'ai.assist'),
  ('10000000-0000-4000-8000-000000000003', 'patients.read'),
  ('10000000-0000-4000-8000-000000000003', 'patients.update'),
  ('10000000-0000-4000-8000-000000000003', 'encounters.manage'),
  ('10000000-0000-4000-8000-000000000003', 'anthropometry.validate'),
  ('10000000-0000-4000-8000-000000000003', 'screening.create'),
  ('10000000-0000-4000-8000-000000000003', 'nutrition_plans.approve'),
  ('10000000-0000-4000-8000-000000000003', 'reports.export'),
  ('10000000-0000-4000-8000-000000000003', 'audit.read'),
  ('10000000-0000-4000-8000-000000000003', 'ai.assist'),
  ('10000000-0000-4000-8000-000000000004', 'patients.read'),
  ('10000000-0000-4000-8000-000000000004', 'patients.create'),
  ('10000000-0000-4000-8000-000000000004', 'patients.update'),
  ('10000000-0000-4000-8000-000000000004', 'encounters.manage'),
  ('10000000-0000-4000-8000-000000000004', 'screening.create'),
  ('10000000-0000-4000-8000-000000000004', 'nutrition_plans.approve'),
  ('10000000-0000-4000-8000-000000000004', 'ai.assist'),
  ('10000000-0000-4000-8000-000000000005', 'patients.read'),
  ('10000000-0000-4000-8000-000000000005', 'anthropometry.create'),
  ('10000000-0000-4000-8000-000000000005', 'anthropometry.validate'),
  ('10000000-0000-4000-8000-000000000005', 'reports.export'),
  ('10000000-0000-4000-8000-000000000006', 'patients.read'),
  ('10000000-0000-4000-8000-000000000006', 'patients.create'),
  ('10000000-0000-4000-8000-000000000006', 'patients.update'),
  ('10000000-0000-4000-8000-000000000006', 'anthropometry.create'),
  ('10000000-0000-4000-8000-000000000006', 'nutrition_plans.approve'),
  ('10000000-0000-4000-8000-000000000006', 'reports.export'),
  ('10000000-0000-4000-8000-000000000006', 'ai.assist'),
  ('10000000-0000-4000-8000-000000000007', 'patients.read'),
  ('10000000-0000-4000-8000-000000000007', 'reports.export'),
  ('10000000-0000-4000-8000-000000000007', 'audit.read')
on conflict (role_id, permission_id) do nothing;

create or replace function public.redeem_tenant_invite(
  p_invite_code text,
  p_full_name text,
  p_title text default null
)
returns table (
  tenant_id uuid,
  tenant_slug text,
  tenant_name text,
  membership_id uuid,
  role_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invite public.tenant_invites%rowtype;
  v_membership_id uuid;
  v_role_id uuid;
  v_initials text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email into v_user_email
  from auth.users
  where id = v_user_id;

  select *
  into v_invite
  from public.tenant_invites
  where invite_code = p_invite_code
    and status = 'active'
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_invite.id is null then
    raise exception 'Invite code is invalid or expired';
  end if;

  if v_invite.email is not null and lower(v_invite.email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'Invite email does not match authenticated user';
  end if;

  v_initials := upper(left(split_part(trim(p_full_name), ' ', 1), 1) || left(split_part(trim(p_full_name), ' ', 2), 1));
  v_initials := coalesce(nullif(v_initials, ''), upper(left(coalesce(v_user_email, 'U'), 2)));

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (v_user_id, p_full_name, coalesce(v_user_email, ''), v_initials, p_title)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    initials = excluded.initials,
    title = coalesce(excluded.title, public.user_profiles.title),
    updated_at = now();

  insert into public.tenant_memberships (tenant_id, user_id, status, title)
  values (v_invite.tenant_id, v_user_id, 'active', p_title)
  on conflict (tenant_id, user_id) do update set
    status = 'active',
    title = coalesce(excluded.title, public.tenant_memberships.title),
    updated_at = now()
  returning id into v_membership_id;

  if v_membership_id is null then
    select id into v_membership_id
    from public.tenant_memberships
    where tenant_id = v_invite.tenant_id
      and user_id = v_user_id
    limit 1;
  end if;

  select id into v_role_id
  from public.roles
  where tenant_id is null
    and code = v_invite.role_code
  limit 1;

  if v_role_id is null then
    raise exception 'Role code % not found', v_invite.role_code;
  end if;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_role_id)
  on conflict (membership_id, role_id) do nothing;

  update public.tenant_invites
  set status = 'redeemed',
      redeemed_by = v_user_id,
      redeemed_at = now(),
      updated_at = now()
  where id = v_invite.id;

  return query
  select t.id, t.slug, t.name, v_membership_id, v_invite.role_code
  from public.tenants t
  where t.id = v_invite.tenant_id;
end;
$$;

insert into public.tenant_invites (id, tenant_id, email, invite_code, role_code, status, expires_at) values
  (
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    null,
    'HSM-FOUNDATION-2026',
    'tenant_owner',
    'active',
    '2027-12-31T23:59:59Z'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    null,
    'EP-PERFORMANCE-2026',
    'sports_nutritionist',
    'active',
    '2027-12-31T23:59:59Z'
  )
on conflict (id) do update set
  email = excluded.email,
  invite_code = excluded.invite_code,
  role_code = excluded.role_code,
  status = excluded.status,
  expires_at = excluded.expires_at,
  updated_at = now();
