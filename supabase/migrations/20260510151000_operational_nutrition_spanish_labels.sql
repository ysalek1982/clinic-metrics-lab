-- Ensure operational nutrition seed labels are displayed in correct Spanish.

update public.food_groups
set name = 'Lácteos'
where slug = 'lacteos';

update public.food_items
set name = 'Atún en agua'
where id = 'f1000000-0000-4000-8000-000000000008';

update public.food_items
set name = 'Brócoli cocido'
where id = 'f1000000-0000-4000-8000-000000000004';

update public.food_items
set source = 'Seed Nutri QA - valores aproximados por 100 g; validar contra tabla institucional antes de uso clínico.'
where source_scope = 'global_seed';
