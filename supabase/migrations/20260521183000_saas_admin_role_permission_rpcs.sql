create or replace function public.admin_assign_role_to_user(
  p_membership_id uuid,
  p_role_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_membership public.tenant_memberships%rowtype;
  v_role_id uuid;
begin
  if v_actor is null or not public.is_platform_superadmin() then
    raise exception 'No autorizado para asignar roles.';
  end if;

  select *
  into v_membership
  from public.tenant_memberships
  where id = p_membership_id;

  if not found then
    raise exception 'Membership no encontrado.';
  end if;

  select id
  into v_role_id
  from public.roles
  where code = p_role_code
    and (tenant_id = v_membership.tenant_id or tenant_id is null)
  order by (tenant_id is null) asc
  limit 1;

  if v_role_id is null then
    raise exception 'Rol no encontrado.';
  end if;

  insert into public.membership_roles (membership_id, role_id)
  values (p_membership_id, v_role_id)
  on conflict do nothing;

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    after_data
  )
  values (
    v_membership.tenant_id,
    v_actor,
    'role.assigned',
    'tenant_membership',
    p_membership_id,
    jsonb_build_object('role_code', p_role_code, 'user_id', v_membership.user_id)
  );

  return jsonb_build_object(
    'membership_id', p_membership_id,
    'role_code', p_role_code,
    'status', 'assigned'
  );
end;
$$;

create or replace function public.admin_remove_role_from_user(
  p_membership_id uuid,
  p_role_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_membership public.tenant_memberships%rowtype;
  v_role_id uuid;
begin
  if v_actor is null or not public.is_platform_superadmin() then
    raise exception 'No autorizado para quitar roles.';
  end if;

  select *
  into v_membership
  from public.tenant_memberships
  where id = p_membership_id;

  if not found then
    raise exception 'Membership no encontrado.';
  end if;

  select id
  into v_role_id
  from public.roles
  where code = p_role_code
    and (tenant_id = v_membership.tenant_id or tenant_id is null)
  order by (tenant_id is null) asc
  limit 1;

  if v_role_id is null then
    raise exception 'Rol no encontrado.';
  end if;

  delete from public.membership_roles
  where membership_id = p_membership_id
    and role_id = v_role_id;

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    after_data
  )
  values (
    v_membership.tenant_id,
    v_actor,
    'role.removed',
    'tenant_membership',
    p_membership_id,
    jsonb_build_object('role_code', p_role_code, 'user_id', v_membership.user_id)
  );

  return jsonb_build_object(
    'membership_id', p_membership_id,
    'role_code', p_role_code,
    'status', 'removed'
  );
end;
$$;

create or replace function public.admin_list_effective_permissions(
  p_user_id uuid default null,
  p_tenant_id uuid default null
)
returns table (
  tenant_id uuid,
  membership_id uuid,
  role_code text,
  permission_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_target uuid := coalesce(p_user_id, auth.uid());
begin
  if v_actor is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_platform_superadmin() then
    if v_target is distinct from v_actor then
      raise exception 'No autorizado para leer permisos de otro usuario.';
    end if;
    if p_tenant_id is not null and not (p_tenant_id = any(public.current_tenant_ids())) then
      raise exception 'No autorizado para leer este tenant.';
    end if;
  end if;

  return query
  select distinct
    tm.tenant_id,
    tm.id as membership_id,
    r.code as role_code,
    rp.permission_id
  from public.tenant_memberships tm
  join public.membership_roles mr on mr.membership_id = tm.id
  join public.roles r on r.id = mr.role_id
  join public.role_permissions rp on rp.role_id = r.id
  where tm.user_id = v_target
    and tm.status = 'active'
    and (p_tenant_id is null or tm.tenant_id = p_tenant_id)
  order by tm.tenant_id, r.code, rp.permission_id;
end;
$$;

revoke all on function public.admin_assign_role_to_user(uuid, text) from public;
revoke all on function public.admin_remove_role_from_user(uuid, text) from public;
revoke all on function public.admin_list_effective_permissions(uuid, uuid) from public;

grant execute on function public.admin_assign_role_to_user(uuid, text) to authenticated;
grant execute on function public.admin_remove_role_from_user(uuid, text) to authenticated;
grant execute on function public.admin_list_effective_permissions(uuid, uuid) to authenticated;
