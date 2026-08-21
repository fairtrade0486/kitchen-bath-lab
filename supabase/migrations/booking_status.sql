alter table public.bookings
  add column if not exists booking_status text not null default '예약접수';

update public.bookings
set booking_status = case when completed then '예약확정' else '예약접수' end
where booking_status is null or booking_status = '';

alter table public.bookings
  drop constraint if exists bookings_booking_status_check;
alter table public.bookings
  add constraint bookings_booking_status_check
  check (booking_status in ('예약접수', '통화필요', '예약확정'));

drop function if exists public.admin_bookings_for_date(date, text);

create function public.admin_bookings_for_date(p_date date, p_password text)
returns table(id bigint, booking_time time, name text, phone text, service text, address text, completed boolean, booking_status text)
language sql security definer set search_path = public as $$
  select b.id, b.booking_time, b.name, b.phone, b.service, b.address, b.completed, b.booking_status
  from public.bookings b
  where p_password = '930707' and b.booking_date = p_date
  order by b.booking_time;
$$;
grant execute on function public.admin_bookings_for_date(date, text) to anon, authenticated;

create or replace function public.admin_set_booking_status(p_booking_id bigint, p_status text, p_password text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_password <> '930707' then return false; end if;
  if p_status not in ('예약접수', '통화필요', '예약확정') then return false; end if;
  update public.bookings set booking_status = p_status where id = p_booking_id;
  return found;
end;
$$;
grant execute on function public.admin_set_booking_status(bigint, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
