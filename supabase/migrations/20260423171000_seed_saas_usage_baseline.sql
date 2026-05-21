insert into public.tenant_subscriptions (
  id, tenant_id, plan_id, status, trial_ends_at, current_period_start, current_period_end,
  billing_customer_ref, billing_subscription_ref
) values
  (
    'aaaaaaa1-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    'hospital_enterprise',
    'active',
    null,
    '2026-04-01T00:00:00Z',
    '2026-04-30T23:59:59Z',
    'cus_hsm_001',
    'sub_hsm_001'
  ),
  (
    'bbbbbbb2-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    'sports_performance',
    'active',
    null,
    '2026-04-01T00:00:00Z',
    '2026-04-30T23:59:59Z',
    'cus_ep_001',
    'sub_ep_001'
  )
on conflict (id) do update set
  plan_id = excluded.plan_id,
  status = excluded.status,
  trial_ends_at = excluded.trial_ends_at,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end,
  billing_customer_ref = excluded.billing_customer_ref,
  billing_subscription_ref = excluded.billing_subscription_ref,
  updated_at = now();

insert into public.tenant_usage_limits (
  tenant_id, users_limit, branches_limit, active_patients_limit, enabled_packs_limit,
  monthly_reports_limit, ai_events_limit, storage_gb_limit
) values
  (
    '11111111-1111-4111-8111-111111111111',
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    20,
    4,
    1200,
    5,
    400,
    1500,
    60
  )
on conflict (tenant_id) do update set
  users_limit = excluded.users_limit,
  branches_limit = excluded.branches_limit,
  active_patients_limit = excluded.active_patients_limit,
  enabled_packs_limit = excluded.enabled_packs_limit,
  monthly_reports_limit = excluded.monthly_reports_limit,
  ai_events_limit = excluded.ai_events_limit,
  storage_gb_limit = excluded.storage_gb_limit,
  updated_at = now();

insert into public.tenant_usage_counters (
  tenant_id, users_count, branches_count, active_patients_count, enabled_packs_count,
  monthly_reports_count, ai_events_count, storage_gb, period_start
) values
  (
    '11111111-1111-4111-8111-111111111111',
    48,
    3,
    336,
    8,
    184,
    622,
    34.0,
    '2026-04-01'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    16,
    1,
    212,
    3,
    121,
    301,
    9.0,
    '2026-04-01'
  )
on conflict (tenant_id) do update set
  users_count = excluded.users_count,
  branches_count = excluded.branches_count,
  active_patients_count = excluded.active_patients_count,
  enabled_packs_count = excluded.enabled_packs_count,
  monthly_reports_count = excluded.monthly_reports_count,
  ai_events_count = excluded.ai_events_count,
  storage_gb = excluded.storage_gb,
  period_start = excluded.period_start,
  updated_at = now();
