create or replace function public.ensure_free_subscription_for_current_user(
  p_full_name text default null,
  p_title text default null
)
returns table (
  tenant_id uuid,
  tenant_slug text,
  tenant_name text,
  membership_id uuid,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_name text;
  v_initials text;
  v_slug text;
  v_tenant_id uuid;
  v_tenant_name text;
  v_membership_id uuid;
  v_role_id uuid;
  v_subscription_id uuid;
  v_org_id uuid;
  v_branch_id uuid;
  v_department_id uuid;
begin
  if v_user_id is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  if nullif(v_email, '') is null then
    raise exception 'El usuario autenticado no tiene email.';
  end if;

  v_name := coalesce(nullif(trim(p_full_name), ''), split_part(v_email, '@', 1), 'Usuario Free');
  v_initials := upper(left(split_part(v_name, ' ', 1), 1) || left(split_part(v_name, ' ', 2), 1));
  v_initials := coalesce(nullif(v_initials, ''), upper(left(v_email, 2)));

  insert into public.user_profiles (id, full_name, email, initials, title)
  values (v_user_id, v_name, lower(v_email), v_initials, nullif(trim(coalesce(p_title, '')), ''))
  on conflict (id) do update set
    full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
    email = excluded.email,
    initials = coalesce(nullif(public.user_profiles.initials, ''), excluded.initials),
    title = coalesce(nullif(trim(coalesce(excluded.title, '')), ''), public.user_profiles.title),
    updated_at = now();

  select tm.tenant_id, tm.id
  into v_tenant_id, v_membership_id
  from public.tenant_memberships tm
  where tm.user_id = v_user_id
    and tm.status = 'active'
  order by tm.created_at asc
  limit 1;

  if v_tenant_id is null then
    v_slug := 'free-' || left(replace(v_user_id::text, '-', ''), 12);
    v_tenant_name := 'Cuenta Free ' || split_part(v_email, '@', 1);

    insert into public.tenants (slug, name, status, plan_id, institution_type, region)
    values (v_slug, v_tenant_name, 'active', 'free', 'private_clinic', 'LatAm')
    on conflict (slug) do update set
      name = excluded.name,
      status = 'active',
      plan_id = 'free',
      updated_at = now()
    returning id, name into v_tenant_id, v_tenant_name;

    insert into public.tenant_settings (tenant_id, language, timezone, unit_system, default_follow_up_days, strict_formula_versioning, ai_assist_enabled, require_plan_approval)
    values (v_tenant_id, 'es', 'America/La_Paz', 'metric', 14, true, false, true)
    on conflict on constraint tenant_settings_pkey do nothing;

    insert into public.branding_settings (tenant_id, commercial_name, logo_initials, primary_color, accent_color)
    values (v_tenant_id, v_tenant_name, 'FR', '#13c8df', '#a6e13a')
    on conflict on constraint branding_settings_pkey do nothing;

    insert into public.organizations (tenant_id, name, type, status)
    values (v_tenant_id, v_tenant_name, 'private_clinic', 'active')
    on conflict on constraint organizations_tenant_id_name_key do update set
      status = 'active',
      updated_at = now()
    returning id into v_org_id;

    insert into public.branches (tenant_id, organization_id, name, city, timezone, status)
    values (v_tenant_id, v_org_id, 'Sede principal', 'La Paz', 'America/La_Paz', 'active')
    returning id into v_branch_id;

    insert into public.departments (tenant_id, organization_id, branch_id, name, clinical_area)
    values (v_tenant_id, v_org_id, v_branch_id, 'Consulta nutricional', 'Ambulatorio')
    returning id into v_department_id;

    insert into public.services (tenant_id, department_id, name, default_pack_id, care_setting)
    values (v_tenant_id, v_department_id, 'Consulta nutricional', 'clinical', 'outpatient');

    insert into public.tenant_enabled_packs (tenant_id, pack_id, enabled, config)
    select v_tenant_id, sp.id, true, '{}'::jsonb
    from public.specialty_packs sp
    where sp.id in ('clinical')
    on conflict on constraint tenant_enabled_packs_pkey do nothing;

    select r.id into v_role_id
    from public.roles r
    where r.tenant_id is null
      and r.code = 'free_member'
    limit 1;

    if v_role_id is null then
      select r.id into v_role_id
      from public.roles r
      where r.tenant_id is null
        and r.code = 'clinical_nutritionist'
      limit 1;
    end if;

    insert into public.tenant_memberships (tenant_id, user_id, status, title)
    values (v_tenant_id, v_user_id, 'active', coalesce(nullif(trim(coalesce(p_title, '')), ''), 'Cuenta Free'))
    on conflict on constraint tenant_memberships_tenant_id_user_id_key do update set
      status = 'active',
      title = coalesce(public.tenant_memberships.title, excluded.title),
      updated_at = now()
    returning id into v_membership_id;

    if v_role_id is not null then
      insert into public.membership_roles (membership_id, role_id)
      values (v_membership_id, v_role_id)
      on conflict on constraint membership_roles_pkey do nothing;
    end if;
  else
    select name into v_tenant_name
    from public.tenants
    where id = v_tenant_id;
  end if;

  select ts.id into v_subscription_id
  from public.tenant_subscriptions ts
  where ts.tenant_id = v_tenant_id
  order by ts.created_at desc
  limit 1
  for update;

  if v_subscription_id is null then
    insert into public.tenant_subscriptions (
      tenant_id,
      plan_id,
      plan_code,
      status,
      starts_at,
      current_period_start,
      payment_provider,
      granted_by,
      notes
    )
    values (
      v_tenant_id,
      'free',
      'free',
      'active',
      now(),
      now(),
      'none',
      v_user_id,
      'auto-free-default'
    )
    returning id into v_subscription_id;
  else
    update public.tenant_subscriptions as ts
    set plan_id = case when ts.status in ('expired', 'cancelled') then 'free' else ts.plan_id end,
        plan_code = case when ts.status in ('expired', 'cancelled') then 'free' else coalesce(ts.plan_code, ts.plan_id, 'free') end,
        status = case when ts.status in ('expired', 'cancelled') then 'active' else ts.status end,
        starts_at = coalesce(ts.starts_at, ts.current_period_start, ts.created_at, now()),
        current_period_start = coalesce(ts.current_period_start, ts.starts_at, ts.created_at, now()),
        payment_provider = coalesce(ts.payment_provider, 'none'),
        updated_at = now()
    where ts.id = v_subscription_id;
  end if;

  update public.tenants as t
  set plan_id = coalesce(t.plan_id, 'free'),
      status = case when t.status = 'suspended' then 'active' else t.status end,
      updated_at = now()
  where t.id = v_tenant_id;

  insert into public.subscription_events (tenant_id, subscription_id, event_type, actor_id, metadata)
  values (
    v_tenant_id,
    v_subscription_id,
    'free_subscription.ensured',
    v_user_id,
    jsonb_build_object('source', 'ensure_free_subscription_for_current_user')
  );

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    v_tenant_id,
    v_user_id,
    'free_subscription.ensured',
    'tenant_subscription',
    v_subscription_id,
    jsonb_build_object('plan_code', 'free')
  );

  return query
  select
    t.id,
    t.slug,
    t.name,
    v_membership_id,
    coalesce(ts.plan_code, ts.plan_id, 'free'),
    ts.status
  from public.tenants t
  join public.tenant_subscriptions ts on ts.id = v_subscription_id
  where t.id = v_tenant_id;
end;
$$;

revoke all on function public.ensure_free_subscription_for_current_user(text, text) from public;
grant execute on function public.ensure_free_subscription_for_current_user(text, text) to authenticated;
