-- Fix ambiguous column references in SaaS subscription admin RPCs.
-- The previous function used unqualified tenant_id/id references inside a RETURNS TABLE
-- function, which makes PostgreSQL treat them as possibly output variables.

create or replace function public.admin_assign_tenant_plan(
  p_tenant_id uuid,
  p_plan_code text,
  p_status text default 'active',
  p_ends_at timestamptz default null,
  p_notes text default null
)
returns table (
  subscription_id uuid,
  tenant_id uuid,
  plan_code text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_subscription_id uuid;
  v_status text := coalesce(nullif(trim(p_status), ''), 'active');
begin
  if v_actor is null then
    raise exception 'Usuario autenticado requerido.';
  end if;

  if not public.is_platform_superadmin() then
    raise exception 'Permiso de plataforma requerido.';
  end if;

  if p_tenant_id is null or nullif(trim(p_plan_code), '') is null then
    raise exception 'Tenant y plan son obligatorios.';
  end if;

  if not exists (select 1 from public.subscription_plans sp where sp.id = trim(p_plan_code) and sp.is_active) then
    raise exception 'Plan no encontrado o inactivo.';
  end if;

  if v_status not in ('active', 'trialing', 'courtesy', 'past_due', 'cancelled', 'expired') then
    raise exception 'Estado de suscripcion invalido.';
  end if;

  select ts.id
  into v_subscription_id
  from public.tenant_subscriptions ts
  where ts.tenant_id = p_tenant_id
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
      current_period_end,
      ends_at,
      trial_ends_at,
      courtesy_ends_at,
      payment_provider,
      granted_by,
      notes
    )
    values (
      p_tenant_id,
      trim(p_plan_code),
      trim(p_plan_code),
      v_status,
      now(),
      now(),
      p_ends_at,
      p_ends_at,
      case when v_status = 'trialing' then p_ends_at else null end,
      case when v_status = 'courtesy' then p_ends_at else null end,
      'none',
      v_actor,
      nullif(trim(coalesce(p_notes, '')), '')
    )
    returning public.tenant_subscriptions.id into v_subscription_id;
  else
    update public.tenant_subscriptions ts
    set plan_id = trim(p_plan_code),
        plan_code = trim(p_plan_code),
        status = v_status,
        starts_at = coalesce(ts.starts_at, now()),
        current_period_start = coalesce(ts.current_period_start, now()),
        current_period_end = p_ends_at,
        ends_at = p_ends_at,
        trial_ends_at = case when v_status = 'trialing' then p_ends_at else ts.trial_ends_at end,
        courtesy_ends_at = case when v_status = 'courtesy' then p_ends_at else null end,
        payment_provider = coalesce(ts.payment_provider, 'none'),
        granted_by = v_actor,
        notes = nullif(trim(coalesce(p_notes, '')), ''),
        updated_at = now()
    where ts.id = v_subscription_id;
  end if;

  update public.tenants t
  set plan_id = trim(p_plan_code),
      status = case
        when v_status in ('active', 'courtesy') then 'active'
        when v_status = 'trialing' then 'trial'
        when v_status = 'past_due' then 'past_due'
        when v_status in ('cancelled', 'expired') then 'suspended'
        else t.status
      end,
      updated_at = now()
  where t.id = p_tenant_id;

  insert into public.subscription_events (tenant_id, subscription_id, event_type, actor_id, metadata)
  values (
    p_tenant_id,
    v_subscription_id,
    'subscription.assigned',
    v_actor,
    jsonb_build_object('plan_code', trim(p_plan_code), 'status', v_status, 'ends_at', p_ends_at)
  );

  insert into public.audit_logs (tenant_id, actor_user_id, event_type, entity_type, entity_id, after_data)
  values (
    p_tenant_id,
    v_actor,
    'subscription.assigned',
    'tenant_subscription',
    v_subscription_id,
    jsonb_build_object('plan_code', trim(p_plan_code), 'status', v_status, 'ends_at', p_ends_at)
  );

  return query
  select v_subscription_id, p_tenant_id, trim(p_plan_code), v_status;
end;
$$;

revoke all on function public.admin_assign_tenant_plan(uuid, text, text, timestamptz, text) from public;
grant execute on function public.admin_assign_tenant_plan(uuid, text, text, timestamptz, text) to authenticated;
