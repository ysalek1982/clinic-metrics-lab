insert into public.permissions (id, resource, action, scope, description) values
  ('users.read', 'users', 'read', 'tenant', 'Leer usuarios y memberships del tenant.'),
  ('users.manage', 'users', 'manage', 'tenant', 'Gestionar usuarios y accesos del tenant.'),
  ('memberships.read', 'memberships', 'read', 'tenant', 'Leer asignaciones de usuarios a tenants.'),
  ('memberships.manage', 'memberships', 'manage', 'tenant', 'Crear, actualizar y desactivar memberships.'),
  ('roles.read', 'roles', 'read', 'tenant', 'Leer roles y permisos.'),
  ('roles.manage', 'roles', 'manage', 'tenant', 'Gestionar roles y permisos.')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

with target_roles as (
  select r.id as role_id
  from public.roles r
  where r.code in ('platform_superadmin', 'tenant_owner')
),
target_permissions as (
  select p.id as permission_id
  from public.permissions p
  where p.id in (
    'users.read',
    'users.manage',
    'memberships.read',
    'memberships.manage',
    'roles.read',
    'roles.manage'
  )
)
insert into public.role_permissions (role_id, permission_id)
select distinct
  tr.role_id,
  tp.permission_id
from target_roles tr
cross join target_permissions tp
on conflict (role_id, permission_id) do nothing;

create or replace function public.can_manage_memberships(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_superadmin()
    or public.has_tenant_permission(p_tenant_id, 'users.manage')
    or public.has_tenant_permission(p_tenant_id, 'memberships.manage');
$$;

create or replace function public.admin_list_memberships(p_tenant_id uuid default null)
returns table (
  membership_id uuid,
  tenant_id uuid,
  tenant_name text,
  user_id uuid,
  email text,
  full_name text,
  initials text,
  title text,
  status text,
  role_codes text[],
  role_names text[],
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

  return query
  select
    tm.id as membership_id,
    tm.tenant_id,
    t.name as tenant_name,
    tm.user_id,
    coalesce(up.email, au.email, '')::text as email,
    coalesce(up.full_name, au.raw_user_meta_data->>'full_name', au.email, tm.user_id::text)::text as full_name,
    coalesce(up.initials, upper(left(coalesce(au.raw_user_meta_data->>'full_name', au.email, 'US'), 2)), 'US')::text as initials,
    coalesce(tm.title, up.title)::text as title,
    tm.status,
    coalesce(array_agg(distinct r.code) filter (where r.code is not null), '{}'::text[]) as role_codes,
    coalesce(array_agg(distinct r.name) filter (where r.name is not null), '{}'::text[]) as role_names,
    tm.updated_at
  from public.tenant_memberships tm
  join public.tenants t on t.id = tm.tenant_id
  left join public.user_profiles up on up.id = tm.user_id
  left join auth.users au on au.id = tm.user_id
  left join public.membership_roles mr on mr.membership_id = tm.id
  left join public.roles r on r.id = mr.role_id
  where (p_tenant_id is null or tm.tenant_id = p_tenant_id)
    and (
      public.is_platform_superadmin()
      or public.has_tenant_permission(tm.tenant_id, 'users.manage')
      or public.has_tenant_permission(tm.tenant_id, 'memberships.manage')
      or public.has_tenant_permission(tm.tenant_id, 'memberships.read')
    )
  group by
    tm.id,
    tm.tenant_id,
    t.name,
    tm.user_id,
    au.email,
    au.raw_user_meta_data,
    up.email,
    up.full_name,
    up.initials,
    up.title,
    tm.title,
    tm.status,
    tm.updated_at
  order by t.name, full_name;
end;
$$;

create or replace function public.admin_upsert_membership(
  p_tenant_id uuid,
  p_user_email text,
  p_role_code text,
  p_status text default 'active',
  p_title text default null
)
returns table (
  membership_id uuid,
  tenant_id uuid,
  tenant_name text,
  user_id uuid,
  email text,
  full_name text,
  initials text,
  title text,
  status text,
  role_codes text[],
  role_names text[],
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_user auth.users%rowtype;
  v_role_id uuid;
  v_role_code text;
  v_membership_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_before_roles text[];
  v_event_type text;
  v_profile_name text;
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if p_tenant_id is null or nullif(trim(p_user_email), '') is null or nullif(trim(p_role_code), '') is null then
    raise exception 'Tenant, email y rol son obligatorios.';
  end if;

  if p_status not in ('active', 'invited', 'inactive') then
    raise exception 'Estado de membership invalido.';
  end if;

  if not public.can_manage_memberships(p_tenant_id) then
    raise exception 'No tienes permiso para gestionar memberships en este tenant.';
  end if;

  select *
    into v_user
  from auth.users au
  where lower(au.email) = lower(trim(p_user_email))
  limit 1;

  if v_user.id is null then
    raise exception 'El usuario debe existir en Supabase Auth antes de asignar membership.';
  end if;

  select r.id, r.code
    into v_role_id, v_role_code
  from public.roles r
  where r.code = trim(p_role_code)
    and (r.tenant_id is null or r.tenant_id = p_tenant_id)
  order by (r.tenant_id is null) asc
  limit 1;

  if v_role_id is null then
    raise exception 'El rol solicitado no existe para este tenant.';
  end if;

  if v_role_code = 'platform_superadmin' and not public.is_platform_superadmin() then
    raise exception 'No puedes asignar rol platform_superadmin.';
  end if;

  v_profile_name := coalesce(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name', v_user.email, 'Usuario');

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (
    v_user.id,
    v_profile_name,
    coalesce(v_user.email, lower(trim(p_user_email))),
    upper(left(v_profile_name, 2)),
    p_title
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
    initials = coalesce(nullif(public.user_profiles.initials, ''), excluded.initials),
    title = coalesce(excluded.title, public.user_profiles.title),
    updated_at = now();

  select to_jsonb(tm)
    into v_before
  from public.tenant_memberships tm
  where tm.tenant_id = p_tenant_id
    and tm.user_id = v_user.id;

  select coalesce(array_agg(r.code), '{}'::text[])
    into v_before_roles
  from public.tenant_memberships tm
  join public.membership_roles mr on mr.membership_id = tm.id
  join public.roles r on r.id = mr.role_id
  where tm.tenant_id = p_tenant_id
    and tm.user_id = v_user.id;

  insert into public.tenant_memberships (tenant_id, user_id, status, title, invited_by)
  values (p_tenant_id, v_user.id, p_status, p_title, v_actor)
  on conflict (tenant_id, user_id) do update set
    status = excluded.status,
    title = coalesce(excluded.title, public.tenant_memberships.title),
    updated_at = now()
  returning id into v_membership_id;

  delete from public.membership_roles mr
  where mr.membership_id = v_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_role_id)
  on conflict (membership_id, role_id) do nothing;

  select to_jsonb(tm)
    into v_after
  from public.tenant_memberships tm
  where tm.id = v_membership_id;

  v_event_type := case
    when v_before is null then 'membership.create'
    when p_status = 'inactive' and coalesce(v_before->>'status', '') <> 'inactive' then 'membership.deactivate'
    when p_status = 'active' and coalesce(v_before->>'status', '') = 'inactive' then 'membership.reactivate'
    else 'membership.update'
  end;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, before_data, after_data)
  values (
    p_tenant_id,
    v_actor,
    v_event_type,
    'tenant_membership',
    v_membership_id,
    v_before,
    v_after || jsonb_build_object('email', coalesce(v_user.email, lower(trim(p_user_email))), 'role_code', v_role_code)
  );

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, before_data, after_data)
  values (
    p_tenant_id,
    v_actor,
    'role.assign',
    'tenant_membership',
    v_membership_id,
    jsonb_build_object('role_codes', coalesce(v_before_roles, '{}'::text[])),
    jsonb_build_object('role_code', v_role_code)
  );

  return query
  select *
  from public.admin_list_memberships(p_tenant_id) alm
  where alm.membership_id = v_membership_id;
end;
$$;

create or replace function public.admin_update_membership_status(
  p_membership_id uuid,
  p_status text
)
returns table (
  membership_id uuid,
  tenant_id uuid,
  tenant_name text,
  user_id uuid,
  email text,
  full_name text,
  initials text,
  title text,
  status text,
  role_codes text[],
  role_names text[],
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_tenant_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_event_type text;
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if p_status not in ('active', 'invited', 'inactive') then
    raise exception 'Estado de membership invalido.';
  end if;

  select tm.tenant_id, to_jsonb(tm)
    into v_tenant_id, v_before
  from public.tenant_memberships tm
  where tm.id = p_membership_id;

  if v_tenant_id is null then
    raise exception 'Membership no encontrado.';
  end if;

  if not public.can_manage_memberships(v_tenant_id) then
    raise exception 'No tienes permiso para gestionar memberships en este tenant.';
  end if;

  update public.tenant_memberships tm
  set status = p_status,
      updated_at = now()
  where tm.id = p_membership_id;

  select to_jsonb(tm)
    into v_after
  from public.tenant_memberships tm
  where tm.id = p_membership_id;

  v_event_type := case
    when p_status = 'inactive' then 'membership.deactivate'
    when p_status = 'active' and coalesce(v_before->>'status', '') = 'inactive' then 'membership.reactivate'
    else 'membership.update'
  end;

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, before_data, after_data)
  values (v_tenant_id, v_actor, v_event_type, 'tenant_membership', p_membership_id, v_before, v_after);

  return query
  select *
  from public.admin_list_memberships(v_tenant_id) alm
  where alm.membership_id = p_membership_id;
end;
$$;

revoke all on function public.can_manage_memberships(uuid) from public;
revoke all on function public.admin_list_memberships(uuid) from public;
revoke all on function public.admin_upsert_membership(uuid, text, text, text, text) from public;
revoke all on function public.admin_update_membership_status(uuid, text) from public;

grant execute on function public.can_manage_memberships(uuid) to authenticated;
grant execute on function public.admin_list_memberships(uuid) to authenticated;
grant execute on function public.admin_upsert_membership(uuid, text, text, text, text) to authenticated;
grant execute on function public.admin_update_membership_status(uuid, text) to authenticated;
