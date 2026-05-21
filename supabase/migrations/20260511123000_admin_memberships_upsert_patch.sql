-- Patch Fase 12D: elimina referencias ambiguas en admin_upsert_membership.
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
  on conflict on constraint tenant_memberships_tenant_id_user_id_key do update set
    status = excluded.status,
    title = coalesce(excluded.title, public.tenant_memberships.title),
    updated_at = now()
  returning public.tenant_memberships.id into v_membership_id;

  delete from public.membership_roles mr
  where mr.membership_id = v_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_role_id)
  on conflict on constraint membership_roles_pkey do nothing;

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
  select
    alm.membership_id,
    alm.tenant_id,
    alm.tenant_name,
    alm.user_id,
    alm.email,
    alm.full_name,
    alm.initials,
    alm.title,
    alm.status,
    alm.role_codes,
    alm.role_names,
    alm.updated_at
  from public.admin_list_memberships(p_tenant_id) alm
  where alm.membership_id = v_membership_id;
end;
$$;

grant execute on function public.admin_upsert_membership(uuid, text, text, text, text) to authenticated;
