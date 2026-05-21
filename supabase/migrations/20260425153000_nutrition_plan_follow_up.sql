alter table public.nutrition_plans
add column if not exists next_follow_up_at timestamptz;

create index if not exists idx_nutrition_plans_tenant_follow_up
on public.nutrition_plans(tenant_id, next_follow_up_at)
where next_follow_up_at is not null;
