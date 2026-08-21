create or replace function public.admin_set_slot(
  p_date date,
  p_time text,
  p_closed boolean,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_password <> '930707' then
    raise exception '비밀번호가 올바르지 않습니다.';
  end if;
  if p_time not in ('09:00', '15:00', '17:00') then
    raise exception '허용되지 않은 시간입니다.';
  end if;
  if p_closed then
    if not exists (select 1 from public.booking_slots where booking_date = p_date and booking_time = p_time::time and source = 'admin' limit 1) then
      insert into public.booking_slots (booking_date, booking_time, customer_name, phone, service_type, source)
      values (p_date, p_time::time, '__admin__', '__admin__', '__admin__', 'admin');
    end if;
  else
    delete from public.booking_slots where booking_date = p_date and booking_time = p_time::time and source = 'admin';
  end if;
end;
$$;
grant execute on function public.admin_set_slot(date, text, boolean, text) to anon, authenticated;
drop function if exists public.admin_set_slot(date, time, boolean, text);

create or replace function public.admin_bookings_for_date(p_date date, p_password text)
returns table(id bigint, booking_time time, name text, phone text, service text, completed boolean)
language sql security definer set search_path = public as $$
  select b.id, b.booking_time, b.name, b.phone, b.service, b.completed
  from public.bookings b
  where p_password = '930707' and b.booking_date = p_date
  order by b.booking_time;
$$;
grant execute on function public.admin_bookings_for_date(date, text) to anon, authenticated;

create or replace function public.admin_complete_booking(p_booking_id bigint, p_password text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_password <> '930707' then return false; end if;
  update public.bookings set completed = true where id = p_booking_id;
  return found;
end;
$$;
grant execute on function public.admin_complete_booking(bigint, text) to anon, authenticated;

drop function if exists public.admin_customer_history_kitchen(text);
create function public.admin_customer_history_kitchen(p_password text)
returns table(name text, phone text, address text, visit_count bigint, service_dates date[], note text)
language sql security definer set search_path = public as $$
  with completed_customers as (
    select b.name, (array_agg(b.phone order by b.booking_date desc))[1] as phone, b.address,
      count(*)::bigint as visit_count, array_agg(b.booking_date order by b.booking_date desc) as service_dates
    from public.bookings b
    where p_password = '930707' and b.completed = true and btrim(coalesce(b.address, '')) <> ''
    group by b.name, b.address
  )
  select c.name, c.phone, c.address, c.visit_count, c.service_dates, coalesce(n.note, '') as note
  from completed_customers c
  left join public.customer_notes n on n.name = c.name and n.address = c.address
  order by c.name, c.address;
$$;
grant execute on function public.admin_customer_history_kitchen(text) to anon, authenticated;

notify pgrst, 'reload schema';

-- 관리자 비밀번호 930707 마이그레이션
-- 완료

