-- Public read-only metadata for SaaS product configuration and tenant cards.
-- This intentionally excludes patient, encounter, membership, user, and audit data.

drop policy if exists "tenants publicly readable" on public.tenants;
create policy "tenants publicly readable"
on public.tenants
for select
to anon, authenticated
using (true);

drop policy if exists "tenant subscriptions publicly readable" on public.tenant_subscriptions;
create policy "tenant subscriptions publicly readable"
on public.tenant_subscriptions
for select
to anon, authenticated
using (true);

drop policy if exists "tenant limits publicly readable" on public.tenant_usage_limits;
create policy "tenant limits publicly readable"
on public.tenant_usage_limits
for select
to anon, authenticated
using (true);

drop policy if exists "tenant counters publicly readable" on public.tenant_usage_counters;
create policy "tenant counters publicly readable"
on public.tenant_usage_counters
for select
to anon, authenticated
using (true);

drop policy if exists "tenant settings publicly readable" on public.tenant_settings;
create policy "tenant settings publicly readable"
on public.tenant_settings
for select
to anon, authenticated
using (true);

drop policy if exists "tenant branding publicly readable" on public.branding_settings;
create policy "tenant branding publicly readable"
on public.branding_settings
for select
to anon, authenticated
using (true);

drop policy if exists "tenant enabled packs publicly readable" on public.tenant_enabled_packs;
create policy "tenant enabled packs publicly readable"
on public.tenant_enabled_packs
for select
to anon, authenticated
using (true);
