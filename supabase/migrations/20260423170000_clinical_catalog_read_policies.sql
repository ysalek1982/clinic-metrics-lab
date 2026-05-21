-- Clinical global catalogs are public read-only catalogs. Patient, screening
-- result, assessment, formula setting, and tenant protocol data remain RLS
-- isolated behind authenticated tenant membership policies.

drop policy if exists "measurement sites readable" on public.measurement_sites;
drop policy if exists "measurement sites publicly readable" on public.measurement_sites;
create policy "measurement sites publicly readable"
on public.measurement_sites
for select
to anon, authenticated
using (true);

drop policy if exists "measurement protocols readable" on public.measurement_protocols;
drop policy if exists "measurement protocols publicly readable" on public.measurement_protocols;
create policy "measurement protocols publicly readable"
on public.measurement_protocols
for select
to anon, authenticated
using (true);

drop policy if exists "formula library readable" on public.formula_library;
drop policy if exists "formula library publicly readable" on public.formula_library;
create policy "formula library publicly readable"
on public.formula_library
for select
to anon, authenticated
using (true);

drop policy if exists "formula versions readable" on public.formula_versions;
drop policy if exists "formula versions publicly readable" on public.formula_versions;
create policy "formula versions publicly readable"
on public.formula_versions
for select
to anon, authenticated
using (true);

drop policy if exists "screening templates readable" on public.screening_templates;
drop policy if exists "screening templates publicly readable" on public.screening_templates;
create policy "screening templates publicly readable"
on public.screening_templates
for select
to anon, authenticated
using (true);
