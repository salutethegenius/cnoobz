-- Pin search_path and keep this RPC service-role only.
create or replace function public.increment_event_sold_count(p_link_id uuid)
returns void
language sql
set search_path = public
as $$
  update payment_links
  set sold_count = (
    select count(*)::int
    from checkout_sessions
    where link_id = p_link_id and status = 'completed'
  )
  where id = p_link_id and kind = 'event';
$$;

revoke all on function public.increment_event_sold_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_event_sold_count(uuid) to service_role;

-- Present on some hosted projects as an event-trigger helper; not callable from the app.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
