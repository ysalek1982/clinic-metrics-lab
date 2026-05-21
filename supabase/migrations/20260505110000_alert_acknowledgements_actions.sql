insert into public.permissions (id, resource, action, scope, description)
values
  ('alerts.read', 'alerts', 'read', 'tenant', 'Leer estados de alertas'),
  ('alerts.manage', 'alerts', 'manage', 'tenant', 'Revisar, resolver, silenciar y atender alertas')
on conflict (id) do update
set description = excluded.description;

alter table public.alert_acknowledgements
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists priority text,
  add column if not exists attended_by uuid references auth.users(id),
  add column if not exists attended_at timestamptz,
  add column if not exists silenced_until timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
declare
  constraint_name text;
begin
  select conname
    into constraint_name
  from pg_constraint
  where conrelid = 'public.alert_acknowledgements'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%reviewed%resolved%';

  if constraint_name is not null then
    execute format('alter table public.alert_acknowledgements drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.alert_acknowledgements
  add constraint alert_acknowledgements_status_check
  check (status in ('reviewed', 'resolved', 'silenced', 'attended'));

create index if not exists idx_alert_ack_source on public.alert_acknowledgements(tenant_id, source_type, source_id);
create index if not exists idx_alert_ack_silenced_until on public.alert_acknowledgements(tenant_id, silenced_until);
