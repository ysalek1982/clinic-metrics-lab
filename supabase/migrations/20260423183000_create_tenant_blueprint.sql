create or replace function public.create_tenant_blueprint(
  p_name text,
  p_slug text,
  p_plan_id text,
  p_institution_type text,
  p_region text default 'LatAm',
  p_language text default 'es',
  p_timezone text default 'America/La_Paz',
  p_unit_system text default 'metric',
  p_primary_color text default '#13c8df',
  p_accent_color text default '#a6e13a',
  p_logo_initials text default 'NS',
  p_enabled_packs text[] default array['clinical'],
  p_organization_name text default null,
  p_branch_name text default 'Sede principal',
  p_department_name text default 'Nutricion',
  p_service_name text default 'Nutricion clinica'
)
returns table (
  tenant_id uuid,
  tenant_slug text,
  organization_id uuid,
  branch_id uuid,
  department_id uuid,
  service_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_tenant_id uuid := gen_random_uuid();
  v_organization_id uuid := gen_random_uuid();
  v_branch_id uuid := gen_random_uuid();
  v_department_id uuid := gen_random_uuid();
  v_service_id uuid := gen_random_uuid();
  v_membership_id uuid := gen_random_uuid();
  v_subscription_id uuid := gen_random_uuid();
  v_owner_role_id uuid;
  v_trial_ends_at timestamptz := now() + interval '14 days';
  v_slug text := lower(regexp_replace(trim(coalesce(p_slug, '')), '[^a-z0-9-]+', '-', 'g'));
  v_logo_initials text := upper(left(regexp_replace(trim(coalesce(p_logo_initials, 'NS')), '[^A-Za-z0-9]+', '', 'g'), 4));
  v_organization_name text := coalesce(nullif(trim(p_organization_name), ''), trim(p_name));
  v_enabled_packs text[] := coalesce(p_enabled_packs, array['clinical']);
  v_plan record;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Only platform superadmins can create tenants';
  end if;

  if trim(coalesce(p_name, '')) = '' then
    raise exception 'Tenant name is required';
  end if;

  if v_slug = '' then
    raise exception 'Tenant slug is required';
  end if;

  select *
  into v_plan
  from public.subscription_plans
  where id = p_plan_id;

  if not found then
    raise exception 'Subscription plan not found';
  end if;

  select r.id
  into v_owner_role_id
  from public.roles r
  where r.code = 'tenant_owner'
    and r.tenant_id is null
  limit 1;

  if v_owner_role_id is null then
    raise exception 'Base role tenant_owner is not available';
  end if;

  insert into public.tenants (
    id,
    slug,
    name,
    status,
    plan_id,
    institution_type,
    region,
    trial_ends_at,
    renewal_date
  )
  values (
    v_tenant_id,
    v_slug,
    trim(p_name),
    'trial',
    p_plan_id,
    p_institution_type,
    coalesce(nullif(trim(p_region), ''), 'LatAm'),
    v_trial_ends_at,
    v_trial_ends_at::date
  );

  insert into public.tenant_subscriptions (
    id,
    tenant_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  values (
    v_subscription_id,
    v_tenant_id,
    p_plan_id,
    'trialing',
    v_trial_ends_at,
    now(),
    v_trial_ends_at
  );

  insert into public.branding_settings (
    tenant_id,
    commercial_name,
    logo_initials,
    primary_color,
    accent_color,
    report_theme
  )
  values (
    v_tenant_id,
    trim(p_name),
    case when v_logo_initials = '' then 'NS' else v_logo_initials end,
    coalesce(nullif(trim(p_primary_color), ''), '#13c8df'),
    coalesce(nullif(trim(p_accent_color), ''), '#a6e13a'),
    '{}'::jsonb
  );

  insert into public.tenant_settings (
    tenant_id,
    language,
    timezone,
    unit_system,
    default_follow_up_days,
    strict_formula_versioning,
    ai_assist_enabled,
    require_plan_approval,
    settings
  )
  values (
    v_tenant_id,
    coalesce(nullif(trim(p_language), ''), 'es'),
    coalesce(nullif(trim(p_timezone), ''), 'America/La_Paz'),
    coalesce(nullif(trim(p_unit_system), ''), 'metric'),
    14,
    true,
    coalesce(v_plan.ai_enabled, false),
    true,
    '{}'::jsonb
  );

  insert into public.tenant_usage_limits (
    tenant_id,
    users_limit,
    branches_limit,
    active_patients_limit,
    enabled_packs_limit,
    monthly_reports_limit,
    ai_events_limit,
    storage_gb_limit
  )
  values (
    v_tenant_id,
    v_plan.included_users,
    v_plan.branch_limit,
    v_plan.active_patient_limit,
    v_plan.enabled_pack_limit,
    case when p_plan_id in ('enterprise', 'hospital_enterprise', 'sports_performance', 'custom') then 200 else 50 end,
    case when v_plan.ai_enabled then 500 else 0 end,
    case when p_plan_id in ('enterprise', 'hospital_enterprise', 'sports_performance', 'custom') then 100 else 20 end
  );

  insert into public.tenant_usage_counters (
    tenant_id,
    users_count,
    branches_count,
    active_patients_count,
    enabled_packs_count,
    monthly_reports_count,
    ai_events_count,
    storage_gb,
    period_start
  )
  values (
    v_tenant_id,
    1,
    1,
    0,
    cardinality(v_enabled_packs),
    0,
    0,
    0,
    date_trunc('month', now())::date
  );

  insert into public.organizations (
    id,
    tenant_id,
    name,
    type,
    legal_name,
    status
  )
  values (
    v_organization_id,
    v_tenant_id,
    v_organization_name,
    p_institution_type,
    v_organization_name,
    'active'
  );

  insert into public.branches (
    id,
    tenant_id,
    organization_id,
    name,
    city,
    timezone,
    status
  )
  values (
    v_branch_id,
    v_tenant_id,
    v_organization_id,
    coalesce(nullif(trim(p_branch_name), ''), 'Sede principal'),
    null,
    coalesce(nullif(trim(p_timezone), ''), 'America/La_Paz'),
    'active'
  );

  insert into public.departments (
    id,
    tenant_id,
    organization_id,
    branch_id,
    name,
    clinical_area
  )
  values (
    v_department_id,
    v_tenant_id,
    v_organization_id,
    v_branch_id,
    coalesce(nullif(trim(p_department_name), ''), 'Nutricion'),
    'Core'
  );

  insert into public.services (
    id,
    tenant_id,
    department_id,
    name,
    default_pack_id,
    care_setting
  )
  values (
    v_service_id,
    v_tenant_id,
    v_department_id,
    coalesce(nullif(trim(p_service_name), ''), 'Nutricion clinica'),
    v_enabled_packs[1],
    case
      when p_institution_type = 'sports_center' then 'sports'
      when p_institution_type in ('general_hospital', 'pediatric_hospital', 'maternal_unit') then 'inpatient'
      else 'mixed'
    end
  );

  insert into public.tenant_enabled_packs (tenant_id, pack_id, enabled, config)
  select v_tenant_id, pack_id, true, '{}'::jsonb
  from unnest(v_enabled_packs) as pack_id
  on conflict on constraint tenant_enabled_packs_pkey do update
  set enabled = true,
      config = excluded.config;

  insert into public.tenant_memberships (
    id,
    tenant_id,
    user_id,
    status,
    title,
    invited_by
  )
  values (
    v_membership_id,
    v_tenant_id,
    v_actor_user_id,
    'active',
    'Tenant owner',
    v_actor_user_id
  )
  on conflict on constraint tenant_memberships_tenant_id_user_id_key do update
  set status = 'active',
      updated_at = now()
  returning id into v_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (v_membership_id, v_owner_role_id)
  on conflict do nothing;

  insert into public.activity_logs (
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  )
  values (
    v_tenant_id,
    v_actor_user_id,
    'tenant.create',
    'tenants',
    v_tenant_id,
    'Creacion inicial de tenant desde onboarding SaaS',
    jsonb_build_object(
      'plan_id', p_plan_id,
      'institution_type', p_institution_type,
      'enabled_packs', v_enabled_packs
    )
  );

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    after_data
  )
  values (
    v_tenant_id,
    v_actor_user_id,
    'tenant.create',
    'tenants',
    v_tenant_id,
    jsonb_build_object(
      'name', trim(p_name),
      'slug', v_slug,
      'plan_id', p_plan_id,
      'institution_type', p_institution_type
    )
  );

  tenant_id := v_tenant_id;
  tenant_slug := v_slug;
  organization_id := v_organization_id;
  branch_id := v_branch_id;
  department_id := v_department_id;
  service_id := v_service_id;

  return next;
end;
$$;
