insert into public.permissions (id, resource, action, scope, description)
values
  ('foods.read', 'foods', 'read', 'tenant', 'Leer biblioteca de alimentos global y del tenant'),
  ('foods.manage', 'foods', 'manage', 'tenant', 'Administrar alimentos propios del tenant'),
  ('recipes.read', 'recipes', 'read', 'tenant', 'Leer recetas del tenant'),
  ('recipes.create', 'recipes', 'create', 'tenant', 'Crear recetas del tenant'),
  ('recipes.update', 'recipes', 'update', 'tenant', 'Actualizar o archivar recetas del tenant'),
  ('weekly_menus.read', 'weekly_menus', 'read', 'tenant', 'Leer menus semanales del tenant'),
  ('weekly_menus.create', 'weekly_menus', 'create', 'tenant', 'Crear menus semanales del tenant'),
  ('weekly_menus.update', 'weekly_menus', 'update', 'tenant', 'Actualizar menus semanales del tenant'),
  ('weekly_menus.close', 'weekly_menus', 'close', 'tenant', 'Activar o cerrar menus semanales del tenant')
on conflict (id) do update set
  resource = excluded.resource,
  action = excluded.action,
  scope = excluded.scope,
  description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.permission_id
from public.roles r
join (
  values
    ('platform_superadmin', 'foods.read'),
    ('platform_superadmin', 'foods.manage'),
    ('platform_superadmin', 'recipes.read'),
    ('platform_superadmin', 'recipes.create'),
    ('platform_superadmin', 'recipes.update'),
    ('platform_superadmin', 'weekly_menus.read'),
    ('platform_superadmin', 'weekly_menus.create'),
    ('platform_superadmin', 'weekly_menus.update'),
    ('platform_superadmin', 'weekly_menus.close'),
    ('tenant_owner', 'foods.read'),
    ('tenant_owner', 'foods.manage'),
    ('tenant_owner', 'recipes.read'),
    ('tenant_owner', 'recipes.create'),
    ('tenant_owner', 'recipes.update'),
    ('tenant_owner', 'weekly_menus.read'),
    ('tenant_owner', 'weekly_menus.create'),
    ('tenant_owner', 'weekly_menus.update'),
    ('tenant_owner', 'weekly_menus.close'),
    ('nutrition_director', 'foods.read'),
    ('nutrition_director', 'foods.manage'),
    ('nutrition_director', 'recipes.read'),
    ('nutrition_director', 'recipes.create'),
    ('nutrition_director', 'recipes.update'),
    ('nutrition_director', 'weekly_menus.read'),
    ('nutrition_director', 'weekly_menus.create'),
    ('nutrition_director', 'weekly_menus.update'),
    ('nutrition_director', 'weekly_menus.close'),
    ('clinical_nutritionist', 'foods.read'),
    ('clinical_nutritionist', 'foods.manage'),
    ('clinical_nutritionist', 'recipes.read'),
    ('clinical_nutritionist', 'recipes.create'),
    ('clinical_nutritionist', 'recipes.update'),
    ('clinical_nutritionist', 'weekly_menus.read'),
    ('clinical_nutritionist', 'weekly_menus.create'),
    ('clinical_nutritionist', 'weekly_menus.update'),
    ('clinical_nutritionist', 'weekly_menus.close'),
    ('sports_nutritionist', 'foods.read'),
    ('sports_nutritionist', 'foods.manage'),
    ('sports_nutritionist', 'recipes.read'),
    ('sports_nutritionist', 'recipes.create'),
    ('sports_nutritionist', 'recipes.update'),
    ('sports_nutritionist', 'weekly_menus.read'),
    ('sports_nutritionist', 'weekly_menus.create'),
    ('sports_nutritionist', 'weekly_menus.update'),
    ('sports_nutritionist', 'weekly_menus.close')
) as p(role_code, permission_id) on p.role_code = r.code
on conflict do nothing;

create table if not exists public.food_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  sort_order integer,
  created_at timestamptz not null default now()
);

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  food_group_id uuid references public.food_groups(id) on delete set null,
  name text not null,
  source text,
  source_scope text not null default 'global',
  serving_size_g numeric not null default 100,
  kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  saturated_fat_g numeric,
  glycemic_index numeric,
  sodium_mg numeric,
  potassium_mg numeric,
  calcium_mg numeric,
  iron_mg numeric,
  vitamin_c_mg numeric,
  vitamin_d_mcg numeric,
  tags text[],
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text,
  description text,
  portions numeric not null default 1,
  preparation_notes text,
  tags text[],
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  food_item_id uuid not null references public.food_items(id) on delete restrict,
  quantity_g numeric not null check (quantity_g > 0),
  display_unit text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_menus (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  week_start date not null,
  kcal_target numeric,
  protein_target_g numeric,
  carbs_target_g numeric,
  fat_target_g numeric,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.weekly_menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  weekly_menu_id uuid not null references public.weekly_menus(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 7),
  meal_type text not null check (meal_type in ('desayuno', 'media_manana', 'almuerzo', 'merienda', 'cena', 'colacion')),
  recipe_id uuid references public.recipes(id) on delete set null,
  food_item_id uuid references public.food_items(id) on delete set null,
  quantity_g numeric check (quantity_g is null or quantity_g > 0),
  portions numeric not null default 1 check (portions > 0),
  notes text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recipe_id is not null or food_item_id is not null)
);

create index if not exists idx_food_items_tenant_group on public.food_items(tenant_id, food_group_id) where is_active;
create index if not exists idx_food_items_name on public.food_items(lower(name)) where is_active;
create index if not exists idx_recipes_tenant_status on public.recipes(tenant_id, status) where deleted_at is null;
create index if not exists idx_recipe_ingredients_recipe on public.recipe_ingredients(tenant_id, recipe_id);
create index if not exists idx_weekly_menus_tenant_patient on public.weekly_menus(tenant_id, patient_id, week_start desc) where deleted_at is null;
create index if not exists idx_weekly_menu_items_menu on public.weekly_menu_items(tenant_id, weekly_menu_id, day_of_week, meal_type);

alter table public.food_groups enable row level security;
alter table public.food_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.weekly_menus enable row level security;
alter table public.weekly_menu_items enable row level security;

drop policy if exists "food groups read authenticated" on public.food_groups;
drop policy if exists "food items read permitted" on public.food_items;
drop policy if exists "food items insert tenant permitted" on public.food_items;
drop policy if exists "food items update tenant permitted" on public.food_items;
drop policy if exists "recipes read permitted" on public.recipes;
drop policy if exists "recipes insert permitted" on public.recipes;
drop policy if exists "recipes update permitted" on public.recipes;
drop policy if exists "recipe ingredients read permitted" on public.recipe_ingredients;
drop policy if exists "recipe ingredients insert permitted" on public.recipe_ingredients;
drop policy if exists "recipe ingredients update permitted" on public.recipe_ingredients;
drop policy if exists "recipe ingredients delete permitted" on public.recipe_ingredients;
drop policy if exists "weekly menus read permitted" on public.weekly_menus;
drop policy if exists "weekly menus insert permitted" on public.weekly_menus;
drop policy if exists "weekly menus update permitted" on public.weekly_menus;
drop policy if exists "weekly menu items read permitted" on public.weekly_menu_items;
drop policy if exists "weekly menu items insert permitted" on public.weekly_menu_items;
drop policy if exists "weekly menu items update permitted" on public.weekly_menu_items;
drop policy if exists "weekly menu items delete permitted" on public.weekly_menu_items;

create policy "food groups read authenticated" on public.food_groups
for select to authenticated
using (true);

create policy "food items read permitted" on public.food_items
for select to authenticated
using (
  is_active
  and (
    tenant_id is null
    or public.has_tenant_permission(tenant_id, 'foods.read')
    or public.has_tenant_permission(tenant_id, 'foods.manage')
  )
);

create policy "food items insert tenant permitted" on public.food_items
for insert to authenticated
with check (tenant_id is not null and public.has_tenant_permission(tenant_id, 'foods.manage'));

create policy "food items update tenant permitted" on public.food_items
for update to authenticated
using (tenant_id is not null and public.has_tenant_permission(tenant_id, 'foods.manage'))
with check (tenant_id is not null and public.has_tenant_permission(tenant_id, 'foods.manage'));

create policy "recipes read permitted" on public.recipes
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'recipes.read'));

create policy "recipes insert permitted" on public.recipes
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'recipes.create'));

create policy "recipes update permitted" on public.recipes
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'recipes.update'))
with check (public.has_tenant_permission(tenant_id, 'recipes.update'));

create policy "recipe ingredients read permitted" on public.recipe_ingredients
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'recipes.read'));

create policy "recipe ingredients insert permitted" on public.recipe_ingredients
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'recipes.create') or public.has_tenant_permission(tenant_id, 'recipes.update'));

create policy "recipe ingredients update permitted" on public.recipe_ingredients
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'recipes.update'))
with check (public.has_tenant_permission(tenant_id, 'recipes.update'));

create policy "recipe ingredients delete permitted" on public.recipe_ingredients
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'recipes.update'));

create policy "weekly menus read permitted" on public.weekly_menus
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'weekly_menus.read'));

create policy "weekly menus insert permitted" on public.weekly_menus
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'weekly_menus.create'));

create policy "weekly menus update permitted" on public.weekly_menus
for update to authenticated
using (
  public.has_tenant_permission(tenant_id, 'weekly_menus.update')
  or public.has_tenant_permission(tenant_id, 'weekly_menus.close')
)
with check (
  public.has_tenant_permission(tenant_id, 'weekly_menus.update')
  or public.has_tenant_permission(tenant_id, 'weekly_menus.close')
);

create policy "weekly menu items read permitted" on public.weekly_menu_items
for select to authenticated
using (public.has_tenant_permission(tenant_id, 'weekly_menus.read'));

create policy "weekly menu items insert permitted" on public.weekly_menu_items
for insert to authenticated
with check (public.has_tenant_permission(tenant_id, 'weekly_menus.create') or public.has_tenant_permission(tenant_id, 'weekly_menus.update'));

create policy "weekly menu items update permitted" on public.weekly_menu_items
for update to authenticated
using (public.has_tenant_permission(tenant_id, 'weekly_menus.update'))
with check (public.has_tenant_permission(tenant_id, 'weekly_menus.update'));

create policy "weekly menu items delete permitted" on public.weekly_menu_items
for delete to authenticated
using (public.has_tenant_permission(tenant_id, 'weekly_menus.update'));

insert into public.food_groups (id, name, slug, description, sort_order)
values
  ('f0000000-0000-4000-8000-000000000001', 'Cereales y derivados', 'cereales-derivados', 'Cereales, granos y derivados cocidos o secos.', 10),
  ('f0000000-0000-4000-8000-000000000002', 'Leguminosas', 'leguminosas', 'Legumbres cocidas y derivados.', 20),
  ('f0000000-0000-4000-8000-000000000003', 'Verduras', 'verduras', 'Verduras y hortalizas.', 30),
  ('f0000000-0000-4000-8000-000000000004', 'Frutas', 'frutas', 'Frutas frescas comunes.', 40),
  ('f0000000-0000-4000-8000-000000000005', 'Lacteos', 'lacteos', 'Leches, yogures y derivados lacteos.', 50),
  ('f0000000-0000-4000-8000-000000000006', 'Carnes', 'carnes', 'Carnes magras y preparaciones base.', 60),
  ('f0000000-0000-4000-8000-000000000007', 'Pescados y mariscos', 'pescados-mariscos', 'Pescados y mariscos.', 70),
  ('f0000000-0000-4000-8000-000000000008', 'Huevos', 'huevos', 'Huevos y preparaciones simples.', 80),
  ('f0000000-0000-4000-8000-000000000009', 'Frutos secos', 'frutos-secos', 'Frutos secos y semillas.', 90),
  ('f0000000-0000-4000-8000-000000000010', 'Grasas y aceites', 'grasas-aceites', 'Aceites y grasas culinarias.', 100)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.food_items (
  id,
  tenant_id,
  food_group_id,
  name,
  source,
  source_scope,
  serving_size_g,
  kcal,
  protein_g,
  carbs_g,
  fat_g,
  fiber_g,
  sugar_g,
  saturated_fat_g,
  glycemic_index,
  sodium_mg,
  potassium_mg,
  calcium_mg,
  iron_mg,
  vitamin_c_mg,
  vitamin_d_mcg,
  tags,
  is_active
)
values
  ('f1000000-0000-4000-8000-000000000001', null, 'f0000000-0000-4000-8000-000000000001', 'Arroz blanco cocido', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 130, 2.4, 28.2, 0.3, 0.4, 0.1, 0.1, 73, 1, 35, 10, 0.2, 0, 0, array['cereal','basico'], true),
  ('f1000000-0000-4000-8000-000000000002', null, 'f0000000-0000-4000-8000-000000000001', 'Avena en hojuelas', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 389, 16.9, 66.3, 6.9, 10.6, 0.9, 1.2, 55, 2, 429, 54, 4.7, 0, 0, array['cereal','fibra'], true),
  ('f1000000-0000-4000-8000-000000000003', null, 'f0000000-0000-4000-8000-000000000002', 'Lenteja cocida', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 116, 9.0, 20.1, 0.4, 7.9, 1.8, 0.1, 32, 2, 369, 19, 3.3, 1.5, 0, array['leguminosa','proteina vegetal'], true),
  ('f1000000-0000-4000-8000-000000000004', null, 'f0000000-0000-4000-8000-000000000003', 'Brocoli cocido', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 35, 2.4, 7.2, 0.4, 3.3, 1.4, 0.1, 10, 41, 293, 40, 0.7, 64.9, 0, array['verdura','fibra'], true),
  ('f1000000-0000-4000-8000-000000000005', null, 'f0000000-0000-4000-8000-000000000004', 'Banana', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 89, 1.1, 22.8, 0.3, 2.6, 12.2, 0.1, 51, 1, 358, 5, 0.3, 8.7, 0, array['fruta','potasio'], true),
  ('f1000000-0000-4000-8000-000000000006', null, 'f0000000-0000-4000-8000-000000000005', 'Yogur natural', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 61, 3.5, 4.7, 3.3, 0, 4.7, 2.1, 35, 46, 155, 121, 0.1, 0.5, 0.1, array['lacteo','calcio'], true),
  ('f1000000-0000-4000-8000-000000000007', null, 'f0000000-0000-4000-8000-000000000006', 'Pechuga de pollo cocida', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 165, 31.0, 0, 3.6, 0, 0, 1.0, null, 74, 256, 15, 1.0, 0, 0, array['carnes','proteina'], true),
  ('f1000000-0000-4000-8000-000000000008', null, 'f0000000-0000-4000-8000-000000000007', 'Atun en agua', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 116, 25.5, 0, 0.8, 0, 0, 0.2, null, 338, 237, 4, 1.0, 0, 1.7, array['pescado','proteina'], true),
  ('f1000000-0000-4000-8000-000000000009', null, 'f0000000-0000-4000-8000-000000000008', 'Huevo entero', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 143, 12.6, 0.7, 9.5, 0, 0.4, 3.1, 0, 142, 138, 56, 1.8, 0, 2.0, array['huevo','proteina'], true),
  ('f1000000-0000-4000-8000-000000000010', null, 'f0000000-0000-4000-8000-000000000009', 'Almendra', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 579, 21.2, 21.6, 49.9, 12.5, 4.4, 3.8, 15, 1, 733, 269, 3.7, 0, 0, array['fruto seco','grasa saludable'], true),
  ('f1000000-0000-4000-8000-000000000011', null, 'f0000000-0000-4000-8000-000000000010', 'Aceite de oliva', 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clinico.', 'global_seed', 100, 884, 0, 0, 100, 0, 0, 13.8, 0, 2, 1, 1, 0.6, 0, 0, array['aceite','grasa'], true)
on conflict (id) do update set
  food_group_id = excluded.food_group_id,
  name = excluded.name,
  source = excluded.source,
  source_scope = excluded.source_scope,
  serving_size_g = excluded.serving_size_g,
  kcal = excluded.kcal,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  fiber_g = excluded.fiber_g,
  sugar_g = excluded.sugar_g,
  saturated_fat_g = excluded.saturated_fat_g,
  glycemic_index = excluded.glycemic_index,
  sodium_mg = excluded.sodium_mg,
  potassium_mg = excluded.potassium_mg,
  calcium_mg = excluded.calcium_mg,
  iron_mg = excluded.iron_mg,
  vitamin_c_mg = excluded.vitamin_c_mg,
  vitamin_d_mcg = excluded.vitamin_d_mcg,
  tags = excluded.tags,
  is_active = excluded.is_active,
  updated_at = now();
