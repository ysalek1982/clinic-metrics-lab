-- SaaS Admin approvals and courtesy memberships.
-- Local migration only until explicitly applied with db push.

insert into public.permissions (id, resource, action, scope, description) values
  ('platform.manage', 'platform', 'manage', 'platform', 'Gestionar administracion global de la plataforma.'),
  ('saas.manage', 'saas', 'manage', 'platform', 'Aprobar usuarios, codigos e invitaciones SaaS.'),
  ('tenants.manage', 'tenants', 'manage', 'platform', 'Gestionar tenants desde administracion SaaS.'),
  ('subscriptions.manage', 'subscriptions', 'manage', 'platform', 'Gestionar planes, trials y cortesias.'),
  ('invites.manage', 'invites', 'manage', 'platform', 'Gestionar codigos de invitacion.'),
  ('access_requests.manage', 'access_requests', 'manage', 'platform', 'Gestionar solicitudes de acceso.')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

with platform_role as (
  select id as role_id
  from public.roles
  where tenant_id is null
    and code = 'platform_superadmin'
  limit 1
),
target_permissions as (
  select id as permission_id
  from public.permissions
  where id in (
    'platform.manage',
    'saas.manage',
    'tenants.manage',
    'subscriptions.manage',
    'invites.manage',
    'access_requests.manage',
    'users.read',
    'users.manage',
    'memberships.read',
    'memberships.manage',
    'roles.read',
    'roles.manage',
    'audit.read'
  )
)
insert into public.role_permissions (role_id, permission_id)
select platform_role.role_id, target_permissions.permission_id
from platform_role
cross join target_permissions
on conflict (role_id, permission_id) do nothing;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  job_title text,
  requested_tenant_id uuid references public.tenants(id) on delete set null,
  requested_invite_code text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_access_requests_user_status on public.access_requests(user_id, status);
create index if not exists idx_access_requests_email_status on public.access_requests(lower(email), status);
create index if not exists idx_access_requests_created on public.access_requests(created_at desc);

create table if not exists public.tenant_membership_grants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  membership_id uuid references public.tenant_memberships(id) on delete set null,
  plan_code text not null check (plan_code in ('courtesy', 'trial', 'paid', 'internal')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  granted_by uuid references auth.users(id),
  grant_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenant_membership_grants_tenant_status
  on public.tenant_membership_grants(tenant_id, status);
create index if not exists idx_tenant_membership_grants_user_status
  on public.tenant_membership_grants(user_id, status);

alter table public.tenant_invites
  add column if not exists plan_code text not null default 'courtesy',
  add column if not exists max_uses integer,
  add column if not exists used_count integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid references auth.users(id);

update public.tenant_invites
set max_uses = 1
where max_uses is null
  and invite_code in ('HSM-FOUNDATION-2026', 'EP-PERFORMANCE-2026');

create index if not exists idx_tenant_invites_active_usage
  on public.tenant_invites(tenant_id, is_active, status, expires_at);

alter table public.access_requests enable row level security;
alter table public.tenant_membership_grants enable row level security;

drop policy if exists "access requests own insert" on public.access_requests;
create policy "access requests own insert" on public.access_requests
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "access requests own select" on public.access_requests;
create policy "access requests own select" on public.access_requests
for select to authenticated
using (user_id = auth.uid() or public.is_platform_superadmin());

drop policy if exists "access requests platform update" on public.access_requests;
create policy "access requests platform update" on public.access_requests
for update to authenticated
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

drop policy if exists "membership grants own select" on public.tenant_membership_grants;
create policy "membership grants own select" on public.tenant_membership_grants
for select to authenticated
using (user_id = auth.uid() or public.is_platform_superadmin());

drop policy if exists "membership grants platform manage" on public.tenant_membership_grants;
create policy "membership grants platform manage" on public.tenant_membership_grants
for all to authenticated
using (public.is_platform_superadmin())
with check (public.is_platform_superadmin());

drop policy if exists "tenant invites platform manage" on public.tenant_invites;
create policy "tenant invites platform manage" on public.tenant_invites
for all to authenticated
using (
  public.is_platform_superadmin()
  or public.has_tenant_permission(tenant_id, 'invites.manage')
  or public.has_tenant_permission(tenant_id, 'users.manage')
)
with check (
  public.is_platform_superadmin()
  or public.has_tenant_permission(tenant_id, 'invites.manage')
  or public.has_tenant_permission(tenant_id, 'users.manage')
);

create or replace function public.submit_access_request(
  p_full_name text,
  p_job_title text default null,
  p_requested_invite_code text default null,
  p_message text default null,
  p_requested_tenant_id uuid default null
)
returns table (
  request_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_existing uuid;
  v_request_id uuid;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if nullif(trim(p_full_name), '') is null then
    raise exception 'Nombre completo requerido.';
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  if nullif(v_email, '') is null then
    raise exception 'El usuario autenticado no tiene email.';
  end if;

  select id into v_existing
  from public.access_requests
  where user_id = v_user_id
    and status = 'pending'
  order by created_at desc
  limit 1;

  if v_existing is not null then
    update public.access_requests
    set full_name = trim(p_full_name),
        job_title = nullif(trim(coalesce(p_job_title, '')), ''),
        requested_invite_code = nullif(upper(trim(coalesce(p_requested_invite_code, ''))), ''),
        message = nullif(trim(coalesce(p_message, '')), ''),
        requested_tenant_id = p_requested_tenant_id,
        updated_at = v_now
    where id = v_existing
    returning id into v_request_id;
  else
    insert into public.access_requests (
      user_id,
      email,
      full_name,
      job_title,
      requested_tenant_id,
      requested_invite_code,
      message,
      status
    )
    values (
      v_user_id,
      lower(v_email),
      trim(p_full_name),
      nullif(trim(coalesce(p_job_title, '')), ''),
      p_requested_tenant_id,
      nullif(upper(trim(coalesce(p_requested_invite_code, ''))), ''),
      nullif(trim(coalesce(p_message, '')), ''),
      'pending'
    )
    returning id into v_request_id;
  end if;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    p_requested_tenant_id,
    v_user_id,
    'access_request.submitted',
    'access_request',
    v_request_id,
    jsonb_build_object('email', lower(v_email), 'status', 'pending')
  );

  return query
  select v_request_id, 'pending'::text, v_now;
end;
$$;

create or replace function public.admin_list_access_requests(p_status text default null)
returns table (
  request_id uuid,
  user_id uuid,
  email text,
  full_name text,
  job_title text,
  requested_tenant_id uuid,
  requested_tenant_name text,
  requested_invite_code text,
  message text,
  status text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  return query
  select
    ar.id,
    ar.user_id,
    ar.email,
    ar.full_name,
    ar.job_title,
    ar.requested_tenant_id,
    t.name,
    ar.requested_invite_code,
    ar.message,
    ar.status,
    ar.reviewed_by,
    ar.reviewed_at,
    ar.review_note,
    ar.created_at,
    ar.updated_at
  from public.access_requests ar
  left join public.tenants t on t.id = ar.requested_tenant_id
  where p_status is null or p_status = 'all' or ar.status = p_status
  order by ar.created_at desc;
end;
$$;

create or replace function public.admin_approve_access_request(
  p_request_id uuid,
  p_tenant_id uuid,
  p_role_code text,
  p_plan_code text default 'courtesy',
  p_ends_at timestamptz default null,
  p_review_note text default null
)
returns table (
  request_id uuid,
  membership_id uuid,
  grant_id uuid,
  tenant_id uuid,
  user_id uuid,
  email text,
  role_code text,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.access_requests%rowtype;
  v_user auth.users%rowtype;
  v_role_id uuid;
  v_membership_id uuid;
  v_grant_id uuid;
  v_profile_name text;
  v_initials text;
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(trim(p_role_code), '') is null then
    raise exception 'Tenant y rol son obligatorios.';
  end if;

  if p_plan_code not in ('courtesy', 'trial', 'paid', 'internal') then
    raise exception 'Tipo de membresia invalido.';
  end if;

  select * into v_request
  from public.access_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Solicitud no encontrada.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'La solicitud ya fue revisada.';
  end if;

  select * into v_user
  from auth.users au
  where au.id = v_request.user_id
     or lower(au.email) = lower(v_request.email)
  limit 1;

  if v_user.id is null then
    raise exception 'El usuario debe existir en Supabase Auth antes de aprobar.';
  end if;

  select id into v_role_id
  from public.roles
  where code = trim(p_role_code)
    and (tenant_id is null or tenant_id = p_tenant_id)
  order by (tenant_id is null) asc
  limit 1;

  if v_role_id is null then
    raise exception 'Rol no encontrado.';
  end if;

  v_profile_name := coalesce(nullif(trim(v_request.full_name), ''), v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', v_user.email, 'Usuario');
  v_initials := upper(left(split_part(v_profile_name, ' ', 1), 1) || left(split_part(v_profile_name, ' ', 2), 1));
  v_initials := coalesce(nullif(v_initials, ''), upper(left(coalesce(v_user.email, 'US'), 2)));

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (
    v_user.id,
    v_profile_name,
    coalesce(v_user.email, v_request.email),
    v_initials,
    nullif(trim(coalesce(v_request.job_title, '')), '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    initials = excluded.initials,
    title = coalesce(excluded.title, public.user_profiles.title),
    updated_at = now();

  insert into public.tenant_memberships (tenant_id, user_id, status, title, invited_by)
  values (p_tenant_id, v_user.id, 'active', nullif(trim(coalesce(v_request.job_title, '')), ''), v_actor)
  on conflict (tenant_id, user_id) do update set
    status = 'active',
    title = coalesce(excluded.title, public.tenant_memberships.title),
    invited_by = coalesce(public.tenant_memberships.invited_by, excluded.invited_by),
    updated_at = now()
  returning id into v_membership_id;

  delete from public.membership_roles
  where membership_id = v_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_role_id)
  on conflict (membership_id, role_id) do nothing;

  insert into public.tenant_membership_grants (
    tenant_id,
    user_id,
    membership_id,
    plan_code,
    status,
    ends_at,
    granted_by,
    grant_reason
  )
  values (
    p_tenant_id,
    v_user.id,
    v_membership_id,
    p_plan_code,
    'active',
    p_ends_at,
    v_actor,
    nullif(trim(coalesce(p_review_note, '')), '')
  )
  returning id into v_grant_id;

  update public.access_requests
  set status = 'approved',
      requested_tenant_id = p_tenant_id,
      reviewed_by = v_actor,
      reviewed_at = now(),
      review_note = nullif(trim(coalesce(p_review_note, '')), ''),
      updated_at = now()
  where id = p_request_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values
    (
      p_tenant_id,
      v_actor,
      'user.approved',
      'access_request',
      p_request_id,
      jsonb_build_object('email', v_request.email, 'role_code', p_role_code, 'plan_code', p_plan_code)
    ),
    (
      p_tenant_id,
      v_actor,
      'membership.granted',
      'tenant_membership',
      v_membership_id,
      jsonb_build_object('email', v_request.email, 'grant_id', v_grant_id, 'plan_code', p_plan_code)
    );

  return query
  select
    p_request_id,
    v_membership_id,
    v_grant_id,
    p_tenant_id,
    v_user.id,
    coalesce(v_user.email, v_request.email),
    trim(p_role_code),
    p_plan_code,
    'approved'::text;
end;
$$;

create or replace function public.admin_reject_access_request(
  p_request_id uuid,
  p_review_note text default null
)
returns table (
  request_id uuid,
  status text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.access_requests%rowtype;
  v_reviewed_at timestamptz := now();
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  select * into v_request
  from public.access_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'Solicitud no encontrada.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'La solicitud ya fue revisada.';
  end if;

  update public.access_requests
  set status = 'rejected',
      reviewed_by = v_actor,
      reviewed_at = v_reviewed_at,
      review_note = nullif(trim(coalesce(p_review_note, '')), ''),
      updated_at = v_reviewed_at
  where id = p_request_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    v_request.requested_tenant_id,
    v_actor,
    'user.rejected',
    'access_request',
    p_request_id,
    jsonb_build_object('email', v_request.email, 'note_set', p_review_note is not null)
  );

  return query
  select p_request_id, 'rejected'::text, v_reviewed_at;
end;
$$;

create or replace function public.admin_list_courtesy_memberships(p_status text default null)
returns table (
  grant_id uuid,
  tenant_id uuid,
  tenant_name text,
  user_id uuid,
  email text,
  full_name text,
  membership_id uuid,
  plan_code text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  granted_by uuid,
  grant_reason text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  return query
  select
    g.id,
    g.tenant_id,
    t.name,
    g.user_id,
    coalesce(up.email, au.email, '')::text,
    coalesce(up.full_name, au.raw_user_meta_data->>'full_name', au.email, 'Usuario')::text,
    g.membership_id,
    g.plan_code,
    g.status,
    g.starts_at,
    g.ends_at,
    g.granted_by,
    g.grant_reason,
    g.created_at
  from public.tenant_membership_grants g
  join public.tenants t on t.id = g.tenant_id
  left join public.user_profiles up on up.id = g.user_id
  left join auth.users au on au.id = g.user_id
  where p_status is null or p_status = 'all' or g.status = p_status
  order by g.created_at desc;
end;
$$;

create or replace function public.admin_grant_courtesy_membership(
  p_tenant_id uuid,
  p_user_email text,
  p_role_code text default 'clinical_nutritionist',
  p_plan_code text default 'courtesy',
  p_ends_at timestamptz default null,
  p_grant_reason text default null
)
returns table (
  grant_id uuid,
  membership_id uuid,
  tenant_id uuid,
  user_id uuid,
  email text,
  role_code text,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_user auth.users%rowtype;
  v_role_id uuid;
  v_membership_id uuid;
  v_grant_id uuid;
  v_profile_name text;
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(trim(p_user_email), '') is null then
    raise exception 'Tenant y email son obligatorios.';
  end if;

  if p_plan_code not in ('courtesy', 'trial', 'paid', 'internal') then
    raise exception 'Tipo de membresia invalido.';
  end if;

  select * into v_user
  from auth.users au
  where lower(au.email) = lower(trim(p_user_email))
  limit 1;

  if v_user.id is null then
    raise exception 'El usuario debe existir en Supabase Auth antes de asignar cortesia.';
  end if;

  select id into v_role_id
  from public.roles
  where code = trim(p_role_code)
    and (tenant_id is null or tenant_id = p_tenant_id)
  order by (tenant_id is null) asc
  limit 1;

  if v_role_id is null then
    raise exception 'Rol no encontrado.';
  end if;

  v_profile_name := coalesce(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', v_user.email, 'Usuario');

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (
    v_user.id,
    v_profile_name,
    coalesce(v_user.email, lower(trim(p_user_email))),
    upper(left(v_profile_name, 2)),
    null
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
    initials = coalesce(nullif(public.user_profiles.initials, ''), excluded.initials),
    updated_at = now();

  insert into public.tenant_memberships (tenant_id, user_id, status, invited_by)
  values (p_tenant_id, v_user.id, 'active', v_actor)
  on conflict (tenant_id, user_id) do update set
    status = 'active',
    invited_by = coalesce(public.tenant_memberships.invited_by, excluded.invited_by),
    updated_at = now()
  returning id into v_membership_id;

  delete from public.membership_roles
  where membership_id = v_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_role_id)
  on conflict (membership_id, role_id) do nothing;

  insert into public.tenant_membership_grants (
    tenant_id,
    user_id,
    membership_id,
    plan_code,
    status,
    ends_at,
    granted_by,
    grant_reason
  )
  values (
    p_tenant_id,
    v_user.id,
    v_membership_id,
    p_plan_code,
    'active',
    p_ends_at,
    v_actor,
    nullif(trim(coalesce(p_grant_reason, '')), '')
  )
  returning id into v_grant_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    p_tenant_id,
    v_actor,
    'membership.granted',
    'tenant_membership',
    v_membership_id,
    jsonb_build_object('email', coalesce(v_user.email, p_user_email), 'grant_id', v_grant_id, 'plan_code', p_plan_code)
  );

  return query
  select v_grant_id, v_membership_id, p_tenant_id, v_user.id, coalesce(v_user.email, p_user_email), trim(p_role_code), p_plan_code, 'active'::text;
end;
$$;

create or replace function public.admin_revoke_courtesy_membership(
  p_grant_id uuid,
  p_reason text default null
)
returns table (
  grant_id uuid,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_grant public.tenant_membership_grants%rowtype;
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  select * into v_grant
  from public.tenant_membership_grants
  where id = p_grant_id
  for update;

  if v_grant.id is null then
    raise exception 'Cortesia no encontrada.';
  end if;

  update public.tenant_membership_grants
  set status = 'cancelled',
      grant_reason = coalesce(nullif(trim(coalesce(p_reason, '')), ''), grant_reason),
      updated_at = v_now
  where id = p_grant_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, before_data, after_data)
  values (
    v_grant.tenant_id,
    v_actor,
    'membership.courtesy_cancelled',
    'tenant_membership_grant',
    p_grant_id,
    to_jsonb(v_grant),
    jsonb_build_object('status', 'cancelled', 'reason_set', p_reason is not null)
  );

  return query
  select p_grant_id, 'cancelled'::text, v_now;
end;
$$;

create or replace function public.admin_create_invite_code(
  p_tenant_id uuid,
  p_code text,
  p_role_code text,
  p_plan_code text default 'courtesy',
  p_max_uses integer default 1,
  p_expires_at timestamptz default null
)
returns table (
  invite_id uuid,
  tenant_id uuid,
  invite_code text,
  role_code text,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_invite_id uuid;
  v_code text := upper(trim(p_code));
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(v_code, '') is null or nullif(trim(p_role_code), '') is null then
    raise exception 'Tenant, codigo y rol son obligatorios.';
  end if;

  if p_plan_code not in ('courtesy', 'trial', 'paid', 'internal') then
    raise exception 'Tipo de membresia invalido.';
  end if;

  if p_max_uses is not null and p_max_uses < 1 then
    raise exception 'max_uses debe ser mayor a cero.';
  end if;

  if not exists (
    select 1
    from public.roles
    where code = trim(p_role_code)
      and (tenant_id is null or tenant_id = p_tenant_id)
  ) then
    raise exception 'Rol no encontrado.';
  end if;

  insert into public.tenant_invites (
    tenant_id,
    email,
    invite_code,
    role_code,
    status,
    expires_at,
    plan_code,
    max_uses,
    used_count,
    is_active,
    created_by
  )
  values (
    p_tenant_id,
    null,
    v_code,
    trim(p_role_code),
    'active',
    p_expires_at,
    p_plan_code,
    p_max_uses,
    0,
    true,
    v_actor
  )
  on conflict (invite_code) do update set
    tenant_id = excluded.tenant_id,
    role_code = excluded.role_code,
    status = 'active',
    expires_at = excluded.expires_at,
    plan_code = excluded.plan_code,
    max_uses = excluded.max_uses,
    is_active = true,
    updated_at = now()
  returning id into v_invite_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    p_tenant_id,
    v_actor,
    'invite.created',
    'tenant_invite',
    v_invite_id,
    jsonb_build_object('role_code', p_role_code, 'plan_code', p_plan_code, 'max_uses', p_max_uses)
  );

  return query
  select v_invite_id, p_tenant_id, v_code, trim(p_role_code), p_plan_code, 'active'::text;
end;
$$;

create or replace function public.admin_deactivate_invite_code(p_invite_id uuid)
returns table (
  invite_id uuid,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_invite public.tenant_invites%rowtype;
  v_now timestamptz := now();
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  select * into v_invite
  from public.tenant_invites
  where id = p_invite_id
  for update;

  if v_invite.id is null then
    raise exception 'Codigo no encontrado.';
  end if;

  update public.tenant_invites
  set status = 'revoked',
      is_active = false,
      updated_at = v_now
  where id = p_invite_id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, before_data, after_data)
  values (
    v_invite.tenant_id,
    v_actor,
    'invite.revoked',
    'tenant_invite',
    p_invite_id,
    to_jsonb(v_invite),
    jsonb_build_object('status', 'revoked')
  );

  return query
  select p_invite_id, 'revoked'::text, v_now;
end;
$$;

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
  v_next_used_count integer;
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
  where invite_code = upper(trim(p_invite_code))
    and status = 'active'
    and coalesce(is_active, true)
    and (expires_at is null or expires_at > now())
    and (max_uses is null or coalesce(used_count, 0) < max_uses)
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

  if v_invite.plan_code in ('courtesy', 'trial', 'paid', 'internal') then
    insert into public.tenant_membership_grants (
      tenant_id,
      user_id,
      membership_id,
      plan_code,
      status,
      granted_by,
      grant_reason
    )
    values (
      v_invite.tenant_id,
      v_user_id,
      v_membership_id,
      v_invite.plan_code,
      'active',
      coalesce(v_invite.created_by, v_user_id),
      'redeem_tenant_invite'
    );
  end if;

  v_next_used_count := coalesce(v_invite.used_count, 0) + 1;

  update public.tenant_invites
  set status = case
        when v_invite.max_uses is null or v_next_used_count < v_invite.max_uses then 'active'
        else 'redeemed'
      end,
      used_count = v_next_used_count,
      redeemed_by = v_user_id,
      redeemed_at = now(),
      updated_at = now()
  where id = v_invite.id;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    v_invite.tenant_id,
    v_user_id,
    'invite.redeemed',
    'tenant_invite',
    v_invite.id,
    jsonb_build_object('membership_id', v_membership_id, 'role_code', v_invite.role_code, 'plan_code', v_invite.plan_code)
  );

  return query
  select t.id, t.slug, t.name, v_membership_id, v_invite.role_code
  from public.tenants t
  where t.id = v_invite.tenant_id;
end;
$$;

do $$
declare
  v_user_id uuid;
  v_tenant_id uuid := '11111111-1111-4111-8111-111111111111';
  v_role_id uuid;
  v_membership_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = 'ysalek@gmail.com'
  limit 1;

  if v_user_id is null then
    insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
    values (
      null,
      null,
      'platform_admin.ensure_skipped',
      'auth_user',
      null,
      jsonb_build_object('email', 'ysalek@gmail.com', 'reason', 'auth_user_missing')
    );
  else
    select id into v_role_id
    from public.roles
    where tenant_id is null
      and code = 'platform_superadmin'
    limit 1;

    insert into public.user_profiles (id, full_name, email, initials, title)
    values (v_user_id, 'Ysalek', 'ysalek@gmail.com', 'YS', 'Administrador SaaS')
    on conflict (id) do update set
      email = excluded.email,
      full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
      initials = coalesce(nullif(public.user_profiles.initials, ''), excluded.initials),
      title = coalesce(public.user_profiles.title, excluded.title),
      updated_at = now();

    insert into public.tenant_memberships (tenant_id, user_id, status, title)
    values (v_tenant_id, v_user_id, 'active', 'Administrador SaaS')
    on conflict (tenant_id, user_id) do update set
      status = 'active',
      title = coalesce(public.tenant_memberships.title, excluded.title),
      updated_at = now()
    returning id into v_membership_id;

    if v_role_id is not null then
      insert into public.membership_roles (membership_id, role_id)
      values (v_membership_id, v_role_id)
      on conflict (membership_id, role_id) do nothing;
    end if;

    insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
    values (
      v_tenant_id,
      null,
      'platform_admin.ensure',
      'tenant_membership',
      v_membership_id,
      jsonb_build_object('email', 'ysalek@gmail.com', 'role', 'platform_superadmin')
    );
  end if;
end;
$$;

revoke all on function public.submit_access_request(text, text, text, text, uuid) from public;
revoke all on function public.admin_list_access_requests(text) from public;
revoke all on function public.admin_approve_access_request(uuid, uuid, text, text, timestamptz, text) from public;
revoke all on function public.admin_reject_access_request(uuid, text) from public;
revoke all on function public.admin_list_courtesy_memberships(text) from public;
revoke all on function public.admin_grant_courtesy_membership(uuid, text, text, text, timestamptz, text) from public;
revoke all on function public.admin_revoke_courtesy_membership(uuid, text) from public;
revoke all on function public.admin_create_invite_code(uuid, text, text, text, integer, timestamptz) from public;
revoke all on function public.admin_deactivate_invite_code(uuid) from public;

grant execute on function public.submit_access_request(text, text, text, text, uuid) to authenticated;
grant execute on function public.admin_list_access_requests(text) to authenticated;
grant execute on function public.admin_approve_access_request(uuid, uuid, text, text, timestamptz, text) to authenticated;
grant execute on function public.admin_reject_access_request(uuid, text) to authenticated;
grant execute on function public.admin_list_courtesy_memberships(text) to authenticated;
grant execute on function public.admin_grant_courtesy_membership(uuid, text, text, text, timestamptz, text) to authenticated;
grant execute on function public.admin_revoke_courtesy_membership(uuid, text) to authenticated;
grant execute on function public.admin_create_invite_code(uuid, text, text, text, integer, timestamptz) to authenticated;
grant execute on function public.admin_deactivate_invite_code(uuid) to authenticated;
