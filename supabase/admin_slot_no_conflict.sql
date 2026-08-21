-- booking_slots에 unique 제약이 없는 운영 DB에서도 예약조정이 동작하도록 보완

drop function if exists public.admin_set_slot(date, text, boolean, text);
drop function if exists public.admin_set_slot(date, time, boolean, text);

create function public.admin_set_slot(
  p_date date,
  p_time text,
  p_closed boolean,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_password <> '930707' then
    return false;
  end if;

  if p_time not in ('11:00', '13:00', '15:00') then
    return false;
  end if;

  if p_closed then
    if exists (
      select 1 from public.booking_slots
      where booking_date = p_date
        and booking_time = p_time::time
        and source = 'booked'
    ) then
      return false;
    end if;

    if not exists (
      select 1 from public.booking_slots
      where booking_date = p_date
        and booking_time = p_time::time
        and source = 'admin'
    ) then
      insert into public.booking_slots
        (booking_date, booking_time, customer_name, phone, service_type, source)
      values
        (p_date, p_time::time, '__admin__', '__admin__', '__admin__', 'admin');
    end if;
  else
    delete from public.booking_slots
    where booking_date = p_date
      and booking_time = p_time::time
      and source = 'admin';
  end if;

  return true;
end;
$$;

grant execute on function public.admin_set_slot(date, text, boolean, text) to anon, authenticated;
notify pgrst, 'reload schema';
