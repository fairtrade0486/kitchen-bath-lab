-- Kitchen & Bath Lab 모바일 관리자 회원정보 누적 집계
-- 기존 함수와 반환 컬럼 충돌을 피하기 위해 별도 함수명을 사용합니다.

drop function if exists public.admin_customer_history_kitchen(text);

create function public.admin_customer_history_kitchen(p_password text)
returns table(
  name text,
  phone text,
  address text,
  visit_count bigint,
  service_dates date[],
  note text
)
language sql
security definer
set search_path = public
as $$
  with completed_customers as (
    select
      b.name,
      (array_agg(b.phone order by b.booking_date desc))[1] as phone,
      b.address,
      count(*)::bigint as visit_count,
      array_agg(b.booking_date order by b.booking_date desc) as service_dates
    from public.bookings b
    where p_password = '0486'
      and b.completed = true
      and btrim(coalesce(b.address, '')) <> ''
    group by b.name, b.address
  )
  select
    c.name,
    c.phone,
    c.address,
    c.visit_count,
    c.service_dates,
    coalesce(n.note, '') as note
  from completed_customers c
  left join public.customer_notes n
    on n.name = c.name and n.address = c.address
  order by c.name, c.address;
$$;

grant execute on function public.admin_customer_history_kitchen(text) to anon, authenticated;
