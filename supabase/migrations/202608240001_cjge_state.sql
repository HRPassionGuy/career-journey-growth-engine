create table if not exists public.cjge_operating_state (
  singleton boolean primary key default true check (singleton),
  revision bigint not null default 0,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cjge_operating_state enable row level security;
revoke all on public.cjge_operating_state from anon, authenticated;

insert into public.cjge_operating_state(singleton, state)
values (true, jsonb_build_object(
  'version', 4,
  'initializedAt', now(),
  'lastDailyRun', null,
  'work', '[]'::jsonb,
  'assignments', '[]'::jsonb,
  'executions', '[]'::jsonb,
  'handoffs', '[]'::jsonb,
  'results', '[]'::jsonb,
  'decisions', '[]'::jsonb,
  'risks', '[]'::jsonb,
  'metrics', '{}'::jsonb,
  'reports', '[]'::jsonb,
  'heartbeats', '{}'::jsonb,
  'integrationStatus', '{}'::jsonb,
  'dispatchLog', '[]'::jsonb,
  'escalations', '[]'::jsonb,
  'notifications', '[]'::jsonb,
  'idempotencyKeys', '{}'::jsonb,
  'engagementLedger', '[]'::jsonb
))
on conflict (singleton) do nothing;

create or replace function public.cjge_state_snapshot(
  p_operation text,
  p_expected_revision bigint default null,
  p_state jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.cjge_operating_state%rowtype;
begin
  if p_operation = 'read' then
    select * into current_row from public.cjge_operating_state where singleton = true;
    return jsonb_build_object('revision', current_row.revision, 'state', current_row.state);
  elsif p_operation = 'compare_and_swap' then
    update public.cjge_operating_state
      set state = p_state, revision = revision + 1, updated_at = now()
      where singleton = true and revision = p_expected_revision
      returning * into current_row;
    return jsonb_build_object('updated', found, 'revision', coalesce(current_row.revision, p_expected_revision));
  end if;
  raise exception 'unsupported operation';
end;
$$;

revoke all on function public.cjge_state_snapshot(text, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.cjge_state_snapshot(text, bigint, jsonb) to service_role;
