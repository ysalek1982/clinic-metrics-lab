-- Commercial SaaS entitlement correction:
-- Free/Pro are personal accounts. Clinic/Hospital is the institutional plan.
-- Courtesy is a temporary concession and must not grant platform administration.

with entitlements(plan_code, feature_key, enabled, limit_value) as (
  values
    ('free', 'settings.manage', false, 0),
    ('free', 'saas.manage', false, 0),
    ('pro', 'settings.manage', false, 0),
    ('pro', 'saas.manage', false, 0),
    ('clinic_hospital', 'settings.manage', true, null),
    ('clinic_hospital', 'saas.manage', false, 0),
    ('courtesy', 'settings.manage', false, 0),
    ('courtesy', 'saas.manage', false, 0)
)
insert into public.plan_entitlements (plan_code, feature_key, enabled, limit_value)
select plan_code, feature_key, enabled, limit_value
from entitlements
on conflict (plan_code, feature_key)
do update set
  enabled = excluded.enabled,
  limit_value = excluded.limit_value;

insert into public.subscription_events (
  tenant_id,
  subscription_id,
  event_type,
  actor_id,
  metadata
)
select
  ts.tenant_id,
  ts.id,
  'commercial_model.entitlements_corrected',
  null,
  jsonb_build_object(
    'free_personal_account', true,
    'pro_personal_account', true,
    'clinic_hospital_institutional', true,
    'saas_admin_platform_only', true
  )
from public.tenant_subscriptions ts
where ts.plan_code in ('free', 'pro', 'clinic_hospital', 'courtesy')
limit 1;
