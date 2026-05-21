-- SaaS global catalogs are intentionally readable before login so the product
-- shell, onboarding, and public plan/package views can render from Supabase.
-- Tenant-scoped and clinical patient data remain protected by authenticated RLS.

drop policy if exists "plans are readable" on public.subscription_plans;
create policy "plans are publicly readable"
on public.subscription_plans
for select
to anon, authenticated
using (true);

drop policy if exists "packs are readable" on public.specialty_packs;
create policy "packs are publicly readable"
on public.specialty_packs
for select
to anon, authenticated
using (true);
