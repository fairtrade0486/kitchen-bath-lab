-- Kitchen & Bath Lab 모바일 관리자 회원정보 누적 집계
create or replace function public.admin_customer_history(p_password text)
returns table(
  name text,
  phone text,
  visit_count bigint,
  service_dates text[]
)
language sql
security definer
set search_path = public
as $$
  select
    b.name,
    b.phone,
    count(*)::bigint as visit_count,
    array_agg(to_char(b.booking_date, 'YYYY-MM-DD') order by b.booking_date) as service_dates
  from public.bookings b
  where p_password = '0486'
    and b.completed = true
  group by b.name, b.phone
  order by max(b.booking_date) desc, b.name asc;
$$;

grant execute on function public.admin_customer_history(text) to anon, authenticated;
