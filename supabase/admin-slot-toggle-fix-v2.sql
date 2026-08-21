-- Kitchen & Bath Lab 모바일: PostgREST가 선택하는 text 인자 overload 수정
-- 모바일 화면의 실제 시간: 09:00, 15:00, 17:00

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
    if not exists (
      select 1
      from public.booking_slots
      where booking_date = p_date
        and booking_time = p_time::time
        and source = 'admin'
      limit 1
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
end;
$$;

grant execute on function public.admin_set_slot(date, text, boolean, text) to anon, authenticated;

-- 현재 앱이 time 타입 overload를 직접 사용하지 않도록 중복 overload를 제거합니다.
drop function if exists public.admin_set_slot(date, time, boolean, text);
