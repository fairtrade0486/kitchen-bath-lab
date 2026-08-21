alter table public.bookings
  drop constraint if exists bookings_booking_status_check;

alter table public.bookings
  add constraint bookings_booking_status_check
  check (booking_status in ('예약접수', '통화필요', '예약확정', '예약취소'));

create or replace function public.admin_set_booking_status(p_booking_id bigint, p_status text, p_password text)
returns boolean
language plpgsql
security definer set search_path = public as $$
begin
  if p_password <> '930707' then return false; end if;
  if p_status not in ('예약접수', '통화필요', '예약확정', '예약취소') then return false; end if;

  update public.bookings
  set booking_status = p_status
  where id = p_booking_id;

  if not found then return false; end if;

  if p_status = '예약취소' then
    delete from public.booking_slots s
    using public.bookings b
    where b.id = p_booking_id
      and s.booking_date = b.booking_date
      and s.booking_time = b.booking_time
      and s.source = 'booked';
  end if;

  return true;
end;
$$;

grant execute on function public.admin_set_booking_status(bigint, text, text) to anon, authenticated;
notify pgrst, 'reload schema';
