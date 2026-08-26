"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, TouchEvent, useEffect, useState } from "react";

const services = [
  { no: "01", name: "욕실 청소", en: "BATHROOM", time: "약 2시간", price: "가격 미정", desc: "", tags: ["욕실 천장 및 벽면 전체", "욕조", "샤워부스", "수전", "세면대 및 거울", "수납장", "변기", "하수구 및 덮개, 트랩"] },
  { no: "02", name: "주방 청소", en: "KITCHEN", time: "약 2–3시간", price: "가격 미정", desc: "주방에는 눈에 잘 보이지 않는 기름때가 공간 전체에 넓게 쌓입니다. 친환경 약품으로 오염 제거 후, 고화력 스팀청소기로 주방 전체를 멸균·소독 처리합니다.\n깨끗하고 위생적인 주방을 만들어 드리겠습니다.", tags: ["후드및 필터", "가스레인지, 인덕션", "싱크대", "주방 조리 상판", "상·하부장 겉면", "수전", "아일랜드 식탁"] },
  { no: "03", name: "욕실 + 주방", en: "BATH + KITCHEN", time: "약 4시간", price: "패키지 가격 미정", desc: "가장 부담스러운 두 공간을 하루에. 따로 예약하는 번거로움 없이 한 번에 집중합니다.", tags: ["욕실 전체", "주방 전체", "묶음 구성", "한 번에 방문"] },
];

const serviceAreas = [services[0]];

const SUPABASE_URL = "https://jhwfdfgzofksbttvfpwk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hpIQt4JFbBuRz9w8UaJ66g_m9bjYuOK";
const supabaseHeaders = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  "Content-Type": "application/json",
};

const steps = [
  ["01", "예약 전 상담", "현장 사진으로 오염 상태와 요청사항을 먼저 확인합니다."],
  ["02", "가격 안내", "작업 전 예상 금액과 포함 범위를 분명하게 안내합니다."],
  ["03", "직접 방문", "상담한 담당자가 약속한 시간에 직접 방문합니다."],
  ["04", "작업 확인", "완료 후 전후 상태를 함께 확인하고 관리법을 알려드립니다."],
];

export default function Home() {
  const [sent, setSent] = useState(false);
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [selectedTimeValue, setSelectedTimeValue] = useState("");
  const [addressDong, setAddressDong] = useState("");
  const [addressHo, setAddressHo] = useState("");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [closedSlots, setClosedSlots] = useState<Record<string, string[]>>({});
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [adminBookings, setAdminBookings] = useState<Array<{ id: number; booking_time: string; name: string; phone: string; service: string; address: string; completed: boolean; booking_status: "예약접수" | "통화필요" | "예약확정" | "예약취소" }>>([]);
  const [bookingStatuses, setBookingStatuses] = useState<Record<number, "예약접수" | "통화필요" | "예약확정" | "예약취소">>({});
  const [adminSection, setAdminSection] = useState<"customers" | "calendar" | "adjust" | null>(null);
  const [adminCalendarView, setAdminCalendarView] = useState<"month" | "day">("month");
  const [calendarTouchStart, setCalendarTouchStart] = useState<number | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Array<{ name: string; phone: string; address: string; visit_count: number; service_dates: string[]; note: string }>>([]);
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [reviews, setReviews] = useState<Array<{ id: number; name: string; region: string; service: string; content: string; created_at: string }>>([]);
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [contamOpen, setContamOpen] = useState(false);
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const years = Array.from({ length: 3 }, (_, i) => today.getFullYear() + i);
  const selectedDateKey = selectedDate ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}` : "";
  const monthDateKey = (day: number) => `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const selectedPlanService = selectedPlan === 2 ? "월 2회 · 욕실 2개" : selectedPlan === 3 ? "월 3회 · 욕실 2개" : selectedPlan === 4 ? "월 4회 · 욕실 2개" : "";

  async function refreshSlots() {
    const monthStart = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;
    const monthEnd = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/booking_slots?select=booking_date,booking_time,source&booking_date=gte.${monthStart}&booking_date=lte.${monthEnd}`, {
      headers: supabaseHeaders,
      cache: "no-store",
    });
    if (!response.ok) return;
    const rows = await response.json() as Array<{ booking_date: string; booking_time: string; source: "booked" | "admin" }>;
    const nextBooked: Record<string, string[]> = {};
    const nextClosed: Record<string, string[]> = {};
    rows.forEach(row => {
      const time = row.booking_time.slice(0, 5);
      const target = row.source === "admin" ? nextClosed : nextBooked;
      target[row.booking_date] = [...(target[row.booking_date] ?? []), time];
    });
    setBookedSlots(nextBooked);
    setClosedSlots(nextClosed);
  }

  useEffect(() => {
    refreshSlots();
    const refreshOnFocus = () => { refreshSlots(); };
    window.addEventListener("focus", refreshOnFocus);
    const interval = window.setInterval(refreshOnFocus, 10000);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.clearInterval(interval);
    };
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    setSelectedPlan(2); // 데스크탑·모바일 공통 적용 (2026-08-22 복구)
  }, []);

  async function refreshReviews() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews?select=id,name,region,service,content,created_at&order=created_at.desc`, {
      headers: supabaseHeaders,
      cache: "no-store",
    });
    if (!response.ok) return;
    setReviews(await response.json());
  }

  useEffect(() => {
    refreshReviews();
    const savedToken = window.localStorage.getItem("review-booking-token");
    if (savedToken) {
      setReviewToken(savedToken);
      checkReviewPermission(savedToken);
    }
  }, []);

  async function checkReviewPermission(token: string) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/can_write_review`, {
      method: "POST", headers: supabaseHeaders, body: JSON.stringify({ p_token: token }),
    });
    if (response.ok) setCanWriteReview(Boolean(await response.json()));
  }

  async function refreshAdminBookings() {
    if (!selectedDateKey || !adminMode) return;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_bookings_for_date`, {
      method: "POST", headers: supabaseHeaders, body: JSON.stringify({ p_date: selectedDateKey, p_password: "930707" }),
    });
    if (response.ok) {
      const rows = await response.json() as Array<{ id: number; booking_time: string; name: string; phone: string; service: string; address: string; completed: boolean; booking_status: "예약접수" | "통화필요" | "예약확정" | "예약취소" }>;
      const activeRows = rows.filter(row => row.booking_status !== "예약취소");
      setAdminBookings(activeRows);
      setBookingStatuses(Object.fromEntries(activeRows.map(row => [row.id, row.booking_status || "예약접수"])));
    }
  }

  useEffect(() => { refreshAdminBookings(); }, [selectedDateKey, adminMode]);

  async function refreshCustomerHistory() {
    if (!adminMode) return;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_customer_history_kitchen`, {
      method: "POST", headers: supabaseHeaders, body: JSON.stringify({ p_password: "930707" }),
    });
    if (response.ok) setCustomerHistory(await response.json());
  }

  useEffect(() => { refreshCustomerHistory(); }, [adminMode]);

  async function completeBooking(id: number) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_complete_booking`, {
      method: "POST", headers: supabaseHeaders, body: JSON.stringify({ p_booking_id: id, p_password: "930707" }),
    });
    if (!response.ok || !(await response.json())) {
      window.alert("서비스 완료 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    await refreshAdminBookings();
  }

  async function toggleSlot(time: string) {
    if (!selectedDateKey) return;
    const current = closedSlots[selectedDateKey] ?? [];
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_set_slot`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ p_date: selectedDateKey, p_time: time, p_closed: !current.includes(time), p_password: "930707" }),
    });
    if (!response.ok) {
      window.alert("예약 마감 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const changed = await response.json() as boolean;
    if (!changed) {
      window.alert("해당 시간은 이미 예약되어 있거나 마감 변경이 처리되지 않았습니다.");
      await refreshSlots();
      return;
    }
    await refreshSlots();
  }

  async function setBookingStatus(id: number, status: "예약접수" | "통화필요" | "예약확정" | "예약취소") {
    setBookingStatuses(current => ({ ...current, [id]: status }));
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_set_booking_status`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ p_booking_id: id, p_status: status, p_password: "930707" }),
    });
    if (!response.ok || !(await response.json())) {
      window.alert("예약 상태 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      await refreshAdminBookings();
      return;
    }
    if (status === "예약취소") {
      setAdminBookings(current => current.filter(booking => booking.id !== id));
      await refreshSlots();
    }
  }

  function showSelectedDateDetails() {
    if (selectedDate) setAdminCalendarView("day");
  }

  function handleCalendarTouchStart(event: TouchEvent<HTMLDivElement>) {
    setCalendarTouchStart(event.touches[0]?.clientY ?? null);
  }

  function handleCalendarTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (calendarTouchStart === null) return;
    const endY = event.changedTouches[0]?.clientY ?? calendarTouchStart;
    const delta = calendarTouchStart - endY;
    if (delta > 35) showSelectedDateDetails();
    if (delta < -35) setAdminCalendarView("month");
    setCalendarTouchStart(null);
  }

  function handleCalendarPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    setCalendarTouchStart(event.clientY);
  }

  function handleCalendarPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (calendarTouchStart === null) return;
    const delta = calendarTouchStart - event.clientY;
    if (delta > 35) showSelectedDateDetails();
    if (delta < -35) setAdminCalendarView("month");
    setCalendarTouchStart(null);
  }

  function loginAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (adminPassword === "930707") {
      setAdminMode(true); setAdminLoginOpen(false); setAdminPassword(""); setAdminError(false); setSelectedDate(null); setAdminSection(null);
    } else setAdminError(true);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const selectedTime = data.get("booking-time")?.toString() ?? "";
    const name = data.get("booking-name")?.toString().trim() ?? "";
    const phone = data.get("booking-phone")?.toString().trim() ?? "";
    const service = data.get("booking-service")?.toString().trim() ?? "";
    const address = `${addressDong} ${addressHo.trim()}`.trim();
    const errors: Record<string, string> = {};
    if (!selectedDateKey || !selectedTime) errors.datetime = "날짜·시간을 입력해 주세요.";
    if (!name) errors.name = "이름을 입력해 주세요.";
    if (!phone) errors.phone = "연락처를 입력해 주세요.";
    if (!service) errors.service = "원하는 서비스를 입력해 주세요.";
    if (!addressDong || !addressHo.trim()) errors.address = "동·호수를 입력해 주세요.";
    setBookingErrors(errors);
    if (Object.keys(errors).length) return;
    if (selectedDateKey && selectedTime) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reserve_booking`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify({ p_date: selectedDateKey, p_time: selectedTime, p_name: name, p_phone: phone, p_service: service, p_address: address }),
      });
      if (!response.ok) {
        window.alert("예약 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const token = await response.json() as string | null;
      if (!token) {
        window.alert("방금 다른 예약이 접수된 시간입니다. 다른 시간을 선택하세요.");
        await refreshSlots();
        return;
      }
      window.localStorage.setItem("review-booking-token", token);
      setReviewToken(token);
      setCanWriteReview(false);
      form.reset();
      setAddressDong("");
      setAddressHo("");
      fetch(`${SUPABASE_URL}/functions/v1/send-booking-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
      window.alert("예약이 접수되었습니다!\n빠른 시간 내에 확인 전화드리겠습니다.");
      await refreshSlots();
    }
    setSent(true);
  }

  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const rawName = data.get("review-name")?.toString().trim() ?? "";
    const region = data.get("review-region")?.toString().trim() ?? "";
    const service = data.get("review-service")?.toString().trim() ?? "";
    const content = data.get("review-content")?.toString().trim() ?? "";
    if (!rawName || !region || !service || !content) return;
    if (!reviewToken || !canWriteReview) return;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_completed_review`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({ p_token: reviewToken, p_name: rawName, p_region: region, p_service: service, p_content: content }),
    });
    const submitted = response.ok ? Boolean(await response.json()) : false;
    if (!submitted) {
      window.alert("후기 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    form.reset();
    setReviewSent(true);
    setCanWriteReview(false);
    await refreshReviews();
  }

  return (
    <main className={adminMode ? "admin-active" : ""}>
      <header className="top-brand shell">
        <a href="#top" aria-label="홈으로"><span>KITCHEN </span><em>&amp;</em><span> BATH_LAB</span></a>
      </header>

      <section className="hero-redesign" id="top">
        <figure className="hero-banner"><img src="/hero-bathroom-steam-cropped.png" alt="열린 배수구에 강한 스팀을 분사하는 욕실 청소 장면" /></figure>
        <div className="hero-overlay-tag"><p className="ov-tag">부분청소 관리 서비스</p></div>
        <div className="hero-overlay-text">
          <div className="ov-row"><h2 className="ov-line">집 전체를 청소하지 않습니다.</h2><strong className="ov-line">필요한 곳만, <em>제대로.</em></strong></div>
          <p className="ov-line ov-lead"><span className="hero-lead-accent">단순청소, 깨끗함을 넘어,</span><br /><span className="hero-lead-accent">아파트의 가치를 지키는 욕실 관리.</span></p>
        </div>
        <div className="shell hero-stage">
          <div className="hero-opening">
            <p>부분청소 관리 서비스</p>
            <h1>집 전체를 청소하지 않습니다.</h1>
          </div>
          <figure className="hero-picture">
<img src="/hero-bathroom-steam-final.png" alt="열린 배수구에 강한 스팀을 분사하는 욕실 청소 장면" />
          </figure>
          <div className="hero-message">
            <h2>욕실, 한 곳에 집중합니다.</h2>
            <strong className="hero-opening-sub">필요한 곳만, <em>제대로.</em></strong>
            <div><p><span className="hero-lead">단순청소, 깨끗함을 넘어,</span><span className="hero-lead hero-lead-accent"><b className="apt-value-strong">“아파트의 가치”</b>를 지키는 욕실 관리.</span></p></div>
          </div>
        </div>
        <button type="button" className="hero-contam-toggle-row" aria-expanded={contamOpen} aria-controls="hero-contam-panel" onClick={() => setContamOpen(v => !v)}>
          <span className={`hero-contam-arrow${contamOpen ? " is-open" : ""}`} aria-hidden="true">▾</span>
          <svg className="hero-contam-taegeuk" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M28 18 H62 a12 12 0 0 1 12 12 v6" fill="none" stroke="#34483D" strokeWidth="7" strokeLinecap="round" />
            <circle cx="74" cy="42" r="11" fill="#34483D" />
            <g stroke="#4E8FBF" strokeWidth="4.5" strokeLinecap="round">
              <line x1="64" y1="56" x2="60" y2="65" />
              <line x1="74" y1="58" x2="74" y2="68" />
              <line x1="84" y1="56" x2="88" y2="65" />
            </g>
            <path d="M10 76 H90 a4 4 0 0 1 -4 10 H14 a4 4 0 0 1 -4 -10 Z" fill="none" stroke="#34483D" strokeWidth="7" />
            <line x1="16" y1="76" x2="16" y2="66" stroke="#34483D" strokeWidth="7" strokeLinecap="round" />
          </svg>
          <span className="hero-contam-toggle-title">욕실 부위별 오염</span>
        </button>
        {contamOpen && (
          <div className="hero-contam-panel" id="hero-contam-panel">
            <ol className="hero-contam-list">
              <li>
                <h4>1. 욕실 천장 (오염의 발원지)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 샤워 시 발생하는 고온 다습한 수증기가 상부로 올라가 맺히는 결로 현상이 주원인입니다. 환기가 미흡할 경우 미세먼지와 결합하여 자재에 고착됩니다.</li>
                  <li><strong>오염 결과</strong>: 거뭇한 곰팡이 군락이 형성되며, 여기서 발생한 <strong>곰팡이 포자가 욕실 전체로 낙하</strong>하여 타일과 집기류의 2차 오염을 끊임없이 유발합니다.</li>
                </ul>
              </li>
              <li>
                <h4>2. 욕실 벽면 (석회와 비누의 결합)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 수돗물의 미네랄(칼슘 등) 성분이 증발하며 남는 석회질과 샤워 중 사방으로 튄 샴푸, 바디워시의 유지분이 층층이 쌓입니다.</li>
                  <li><strong>오염 결과</strong>: 타일 광택이 사라지고 누런 &apos;비누 때 막&apos;이 형성됩니다. 이는 박테리아가 번식하기 좋은 영양분이 되어 욕실 특유의 미끌거림과 변색을 초래합니다.</li>
                </ul>
              </li>
              <li>
                <h4>3. 욕실 바닥 (오염의 집결지)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 천장과 벽면에서 흘러내린 오물, 사람의 발에서 나온 유분, 머리카락, 배수구에서 역류한 미생물이 뒤섞이는 공간입니다.</li>
                  <li><strong>오염 결과</strong>: 타일 표면이 미끄러워져 안전사고의 위험이 커지며, 타일 틈새에 고인 오염물이 부패하면서 욕실 하부의 불쾌한 악취를 유발합니다.</li>
                </ul>
              </li>
              <li>
                <h4>4. 욕조 (피부 각질의 퇴적)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 입욕 시 몸에서 떨어진 각질과 유분, 입욕제 성분이 물때와 결합하여 욕조 내부 표면에 미세한 막을 형성합니다.</li>
                  <li><strong>오염 결과</strong>: 육안으로는 깨끗해 보일 수 있으나 만졌을 때 거칠거나 끈적한 느낌이 들며, 이는 피부 가려움증이나 알레르기를 유발하는 세균의 서식지가 됩니다.</li>
                </ul>
              </li>
              <li>
                <h4>5. 젠다이 (선반 부식의 시작)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 세안제, 치약, 양치컵 등에서 떨어진 잔여물이 고여 있는 상태로 방치되어 인조대리석 자재와 화학 반응을 일으킵니다.</li>
                  <li><strong>오염 결과</strong>: 자재 표면이 하얗게 타들어 가는 백화 현상이 발생하여 광택이 영구적으로 손실되고, 거칠어진 표면 사이로 오염이 깊숙이 침투합니다.</li>
                </ul>
              </li>
              <li>
                <h4>6. 샤워부스 (시각적 노후화의 주범)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 수돗물 속 규소(Silica) 성분이 유리 표면에 고착되는 시리카 스케일이 발생합니다. 이는 일반 세제로 지워지지 않는 화학적 결합입니다.</li>
                  <li><strong>오염 결과</strong>: 유리가 불투명해지는 &apos;화이트아웃&apos; 현상으로 욕실이 좁고 답답해 보이며, 장기 방치 시 유리의 미세 구멍 속으로 오염이 박혀 영구적인 얼룩으로 남습니다.</li>
                </ul>
              </li>
              <li>
                <h4>7. 세면대 (위생 사각지대)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 손을 씻고 양치하며 배출되는 타액, 비누 잔여물이 도기 표면에 들러붙어 끈적한 바이오필름(미생물막)을 형성합니다.</li>
                  <li><strong>오염 결과</strong>: 수전과 도기 경계면에 붉은 곰팡이가 번식하며, 배수구 팝업 내부의 오물 부패로 인해 세안 시 코끝을 찌르는 악취가 발생합니다.</li>
                </ul>
              </li>
              <li>
                <h4>8. 변기 (요석과 세균의 온상)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 소변의 칼슘 성분이 굳어진 딱딱한 요석(Urine Stone)과 변기 테두리 안쪽(림)의 상시 습기가 원인입니다.</li>
                  <li><strong>오염 결과</strong>: 요석은 지독한 찌린내의 근원이 되며, 변기 안쪽 보이지 않는 곳에 대장균 등 수백만 마리의 유해 세균이 증식하여 위생을 위협합니다.</li>
                </ul>
              </li>
              <li>
                <h4>9. 수납장 (먼지와 습기의 저장소)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 외부에서 유입된 먼지와 수건에서 발생하는 보풀이 내부 습기와 만나 구석진 모서리에 뭉쳐집니다.</li>
                  <li><strong>오염 결과</strong>: 밀폐된 공간 내부에 곰팡이 균이 서식하여 수납된 수건과 위생용품에 퀴퀴한 냄새가 배고, 자재(목재 등)가 습기를 먹어 뒤틀리거나 부풀어 오릅니다.</li>
                </ul>
              </li>
              <li>
                <h4>10. 수전 및 각종 액세서리 (부식의 위험)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 수돗물의 석회 성분과 젖은 손으로 만지는 과정에서 남는 지문, 유분이 금속 도금 표면을 덮습니다.</li>
                  <li><strong>오염 결과</strong>: 금속 고유의 광택이 사라지고 하얀 얼룩이 고착되며, 잘못된 청소(강산 사용 등) 시 표면이 검게 변색되는 산화 현상이 발생합니다.</li>
                </ul>
              </li>
              <li>
                <h4>11. 실리콘 곰팡이 (침투형 오염)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 다공성 자재인 실리콘 내부로 수분이 스며들어 곰팡이 포자가 조직 깊숙이 뿌리를 내리는 현상입니다.</li>
                  <li><strong>오염 결과</strong>: 단순한 표면 세척으로는 지워지지 않는 검은 반점이 형성되며, 실리콘이 삭아 틈이 벌어지면 그 사이로 물이 들어가 내부 누수의 원인이 됩니다.</li>
                </ul>
              </li>
              <li>
                <h4>12. 벽면 및 바닥 줄눈 (오염의 요새)</h4>
                <ul>
                  <li><strong>오염 원인</strong>: 시멘트 재질인 줄눈(메지)이 수분을 지속적으로 흡수하며 오염된 물과 함께 곰팡이 포자를 내부로 끌어들입니다.</li>
                  <li><strong>오염 결과</strong>: 줄눈이 누렇게 변하거나 거뭇하게 변색되어 욕실 전체가 지저분해 보이며, 습기 조절 능력을 상실하여 곰팡이가 끊임없이 재발하는 환경을 만듭니다.</li>
                </ul>
              </li>
            </ol>
          </div>
        )}
        <div className="hero-redesign-strip">
          <strong>“플랫폼 인력 파견이 아닙니다.</strong><span>이웃주민인 제가 항상 방문합니다.”</span>
        </div>
      </section>

      <section className="about shell section" id="about">
    <div className="about-left"><div className="portrait"><img className="profile-photo" src="/profile-navy.png" alt="직접 방문하는 담당자" /><div className="nameplate"><small>YOUR CLEANER</small><b>홈크린마스터</b></div></div><div className="about-copy"><h2 className="visitor-title"><span>누가 방문하는지,</span><em>미리 확인하세요.</em></h2><blockquote>“낯선 작업자가 오는 불안 없이,<br /><span className="quote-indent">사진 속 제가 항상 방문합니다.”</span></blockquote></div></div>
        <div className="about-greeting" aria-label="인사말 영역">
          <p className="greeting-kicker">HOME CLEAN MASTER’S STORY</p>
          <p>안녕하세요.<br />귀댁에 방문 서비스를 제공할 홈크린마스터입니다.</p>
          <p><strong className="company-name">㈜통인</strong>의 협력 업무를 통해 삼성화재 보험 가입자에게 제공되는 홈클린서비스 중 주방·욕실 청소를 서울·경기 지역에서 6년, <strong className="company-name">㈜영구크린</strong>의 협력 업무를 통해 ㈜대림비앤코 비데 렌탈 고객에게 제공되는 욕실 클리닝 서비스를 서울·경기 지역에서 3년, 정기 구독형 욕실 및 주방 청소 전문 서비스 <strong className="company-name">㈜호텔리브</strong>에서 서울 파크리오 1·2·3단지 전담 매니저로 3년간 활동한 경력이 있습니다.</p>
          <p>이후 은퇴하여 영종도로 이사 와서 한가한 생활을 하던 중, 그동안 쌓아온 경험과 노하우를 그냥 묻어두기 아깝다는 생각이 들었습니다. 그래서 이곳에서 다시 인생 4막을 시작하려 합니다.</p>
          <p className="greeting-principle">오랜 현장 경험과 축적된 노하우를 바탕으로, 지금까지 경험하지 못한 새로운 청소의 기준을 제시하겠습니다. 섬세함과 전문성을 더해, 공간이 달라지는 진정한 변화를 경험하게 해드리겠습니다.</p>

        </div>
      </section>

      <section className="service section" id="service">
        <div className="shell">
          <div className="service-list service-areas">{serviceAreas.map((s, index) => { const [description, emphasis] = s.desc.split("\n"); return <article key={s.no} className="service-card"><div className="service-top"><small>{s.en}</small></div><h3>{s.name}</h3>{s.desc && <p>{description}<br /><strong className="service-emphasis">{emphasis}</strong></p>}<div className="tags">{s.tags.map(t => <span key={t}>{t}</span>)}{s.en === "BATHROOM" && <span className="mobile-only-scope-tag">곰팡이 제거 및 예방 조치</span>}</div>{s.en === "KITCHEN" && <p className="service-note"><strong>※</strong> 상·하부장 내부 청소를 원하실 경우, 모든 집기를 미리 꺼내 주셔야 합니다. (별도 요금 없습니다)</p>}{s.en === "BATHROOM" && <p className="service-highlight"><strong>독일 키엘(kiehl's)의 친환경 약품 + 100℃ 고화력 스팀청소</strong><br />오염 제거 후 욕실 전체를 멸균·소독 처리합니다.<br />서두르지 않고 충분한 시간을 들여, 만족스러운 결과를 보여드리겠습니다.</p>}</article>})}</div>

        </div>
      </section>

            <section className="booking section" id="booking"><div className="shell booking-grid">

                    <form onSubmit={submit} noValidate className={`booking-form${adminMode ? " admin-mode" : ""}`}>
                        <div className="booking-plan-stack"><p className="booking-frequency-note">한 달 2번이면 충분합니다. 다음 관리 전까지는 물만 뿌리세요.</p>
            <div className="price-group monthly-plan booking-plan selected" aria-label="딥케어 욕실 2개 월 2회 100,000원"><span className="price-label">딥케어 욕실(2개)</span><span className="monthly-freq">월2회</span><b className="monthly-price">100,000원</b></div></div><div className="booking-intro-group"><h2 className="booking-intro">첫 방문일을 선택해 주세요.</h2><p>첫 방문일을 선택한 뒤, 다음 일정은 생활
패턴에 맞춰 조율합니다.</p></div>
            <div className="desktop-calendar-box">
              <div className="calendar-head"><strong>예약 날짜 선택</strong><div><select aria-label="연도 선택" value={calendarYear} onChange={e => { setCalendarYear(Number(e.target.value)); setSelectedDate(null); setSelectedTimeValue(""); }}>{years.map(y => <option key={y} value={y}>{y}년</option>)}</select><select aria-label="월 선택" value={calendarMonth} onChange={e => { setCalendarMonth(Number(e.target.value)); setSelectedDate(null); setSelectedTimeValue(""); }}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i + 1}월</option>)}</select></div></div>
              <div className="calendar-week">{["일","월","화","수","목","금","토"].map(d => <span key={d}>{d}</span>)}</div>
              <div className="calendar-days">{calendarCells.map((day, i) => day ? <button type="button" key={i} className={`${selectedDate === day ? "selected " : ""}fully-booked`} aria-label={`${day}일 예약 마감`} onClick={() => { setSelectedDate(day); setSelectedTimeValue(""); setSent(false); }}><span>{day}</span></button> : <i key={i} />)}</div>
            </div>
            <div className="selected-booking always-visible">
              {selectedDate && <><button type="button" className="calendar-back" onClick={() => { setSelectedDate(null); setSelectedTimeValue(""); setSent(false); }}>← 날짜 다시 선택</button><div className="price-group monthly-plan booking-plan selected selected-date-card" aria-label={`선택한 날짜 ${calendarYear}년 ${calendarMonth + 1}월 ${selectedDate}일`}><span className="price-label">선택한 날짜</span><span className="monthly-freq">방문일</span><b className="monthly-price">{calendarYear}년 {calendarMonth + 1}월 {selectedDate}일</b></div></>}
              {adminMode ? <>
                <div className={`admin-container${adminSection === "calendar" ? " calendar-open" : ""}`}>
                  <button type="button" className="admin-exit-button" onClick={() => { setAdminMode(false); setAdminSection(null); setSelectedDate(null); setSelectedTimeValue(""); }}>고객 화면으로 가기</button>
                  <div className={`admin-section-card${adminSection === "customers" ? " expanded" : ""}`}>

                    <button type="button" className="admin-section-trigger" onClick={() => setAdminSection(current => current === "customers" ? null : "customers")}>
                      <strong>회원정보</strong>
                      <span>{adminSection === "customers" ? "▲" : "▼"}</span>
                    </button>
                    {adminSection === "customers" && (
                      <div className="admin-section-content">
                        <p className="admin-section-desc">서비스 완료 기준 누적 이용 내역입니다.</p>
                        {customerHistory.length === 0 ? (
                          <div className="admin-empty">아직 완료된 서비스가 없습니다.</div>
                        ) : (
                          customerHistory.map(customer => {
                            const key = `${customer.name}-${customer.phone}`;
                            const open = Boolean(expandedCustomers[key]);
                            return (
                              <div className="admin-customer-history-card" key={key}>
                                <div className="admin-customer-history-head">
                                  <span><b>{customer.name}</b><small>{customer.phone}</small><small>{customer.address}</small></span>
                                  <button type="button" onClick={() => setExpandedCustomers(current => ({ ...current, [key]: !open }))}>
                                    누적 {customer.visit_count}회 <em>{open ? "▲" : "▼"}</em>
                                  </button>
                                </div>
                                {open && (
                                  <div className="admin-service-dates">
                                    <strong>서비스 받은 날짜</strong>
                                    {customer.service_dates.map(date => <span key={date}>{date}</span>)}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`admin-section-card${adminSection === "calendar" ? " expanded" : ""}`}>
                    <div className="admin-calendar-menu-row">
                      <button type="button" className="admin-section-trigger" onClick={() => { if (adminSection === "calendar") { setAdminSection(null); return; } setCalendarYear(today.getFullYear()); setCalendarMonth(today.getMonth()); setSelectedDate(today.getDate()); setSelectedTimeValue(""); setAdminCalendarView("month"); setAdminSection("calendar"); }}>
                        <strong>예약관리</strong>
                        <span>{adminSection === "calendar" ? "▲" : "▼"}</span>
                      </button>
                      <div className="admin-calendar-menu-selects"><select aria-label="연도 선택" value={calendarYear} onChange={e => { setCalendarYear(Number(e.target.value)); setSelectedDate(null); }}>{years.map(y => <option key={y} value={y}>{y}년</option>)}</select><select aria-label="월 선택" value={calendarMonth} onChange={e => { setCalendarMonth(Number(e.target.value)); setSelectedDate(null); }}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i + 1}월</option>)}</select></div>
                    </div>
                    {adminSection === "calendar" && (
                      <div className="admin-section-content admin-new-calendar" onTouchStart={handleCalendarTouchStart} onTouchEnd={handleCalendarTouchEnd} onPointerDown={handleCalendarPointerDown} onPointerUp={handleCalendarPointerUp}>
                        <div className="admin-calendar-panel">
                          <div className="calendar-week">{["일","월","화","수","목","금","토"].map(d => <span key={d}>{d}</span>)}</div>
                          <div className="calendar-days">{calendarCells.map((day, i) => day ? <button type="button" key={i} className={`${selectedDate === day ? "selected " : ""}${(bookedSlots[monthDateKey(day)] ?? []).length ? "has-booking" : ""}`} onClick={() => { setSelectedDate(day); setSelectedTimeValue(""); }}><span>{day}</span>{(bookedSlots[monthDateKey(day)] ?? []).map(time => <small key={time}>{time}</small>)}</button> : <i key={i} />)}</div>
                        </div>
                        <div className={`admin-day-view${adminCalendarView === "day" ? " visible" : ""}`}>
                          <button type="button" className="admin-month-return" onClick={() => setAdminCalendarView("month")}>‹ 캘린더로 돌아가기</button>
                          <div className="admin-day-heading">{selectedDate ? `${calendarMonth + 1}월 ${selectedDate}일` : "날짜를 선택해 주세요"}</div>
                          {selectedDate && (
                            <div className="admin-slot-control">
                              <h3>예약 시간 관리</h3>
                              <p className="admin-section-desc">시간 버튼을 눌러 예약을 마감하거나 다시 열 수 있습니다.</p>
                              {[["09:00","오전 9시"],["15:00","오후 3시"],["17:00","오후 5시"]].map(([time,label]) => {
                                const booked = (bookedSlots[selectedDateKey] ?? []).includes(time);
                                const closed = (closedSlots[selectedDateKey] ?? []).includes(time);
                                return (
                                  <div className="admin-time-row" key={time}>
                                    <button type="button" disabled={booked} className={booked || closed ? "closed" : "open"} onClick={() => toggleSlot(time)}>
                                      <span>{label}</span>
                                      <b>{booked || closed ? "예약 마감" : "예약 가능"}</b>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {selectedDate && adminBookings.length === 0 ? <div className="admin-empty">아직 예약이 없습니다.</div> : selectedDate && adminBookings.map(booking => { const status = bookingStatuses[booking.id] ?? booking.booking_status ?? "예약접수"; return <article className="admin-day-booking-card" key={booking.id}><div className="admin-day-booking-info"><strong>{booking.name}</strong><span>{booking.phone}</span><span>{(booking.address || "주소 미입력").replace(/^영종자이아파트\s*/, "")}</span><span>{booking.booking_time.slice(0, 5)}</span></div><div className="admin-status-buttons" aria-label={`${booking.name} 예약 상태`}>{(["예약접수", "통화필요", "예약확정", "예약취소"] as const).map(item => <button type="button" className={status === item ? "selected" : ""} key={item} onClick={async () => { if (item === "예약취소" && !window.confirm("정말 이 고객의 예약을 취소하시겠습니까?")) return; await setBookingStatus(booking.id, item); if (item === "통화필요") window.open(`tel:${booking.phone.replace(/\D/g, "")}`, "_blank"); }}>{item === "통화필요" ? "통화" : item}</button>)}<button type="button" disabled={booking.completed} onClick={() => completeBooking(booking.id)}>{booking.completed ? "서비스 완료 ✓" : "서비스 완료"}</button></div></article>; })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </> : <>
                {selectedDate && <fieldset className="time-select"><legend><small>TIME SELECT</small><strong>{calendarMonth + 1}월 {selectedDate}일 ({new Date(calendarYear, calendarMonth, selectedDate).toLocaleDateString("ko-KR", { weekday: "short" })})에 방문 가능한 시간</strong></legend><label><input checked={selectedTimeValue === "09:00"} disabled={(closedSlots[selectedDateKey] ?? []).includes("09:00") || (bookedSlots[selectedDateKey] ?? []).includes("09:00")} type="radio" name="booking-time" value="09:00" onChange={() => { setSelectedTimeValue("09:00"); setBookingErrors(current => ({ ...current, datetime: "" })); }} /><span>◷ {(bookedSlots[selectedDateKey] ?? []).includes("09:00") || (closedSlots[selectedDateKey] ?? []).includes("09:00") ? "오전 9시 · 예약 마감" : "오전 9시"}</span><span className="time-select-action">{selectedTimeValue === "09:00" ? "선택됨" : "선택"}</span></label><label><input checked={selectedTimeValue === "15:00"} disabled={(closedSlots[selectedDateKey] ?? []).includes("15:00") || (bookedSlots[selectedDateKey] ?? []).includes("15:00")} type="radio" name="booking-time" value="15:00" onChange={() => { setSelectedTimeValue("15:00"); setBookingErrors(current => ({ ...current, datetime: "" })); }} /><span>◷ {(bookedSlots[selectedDateKey] ?? []).includes("15:00") || (closedSlots[selectedDateKey] ?? []).includes("15:00") ? "오후 3시 · 예약 마감" : "오후 3시"}</span><span className="time-select-action">{selectedTimeValue === "15:00" ? "선택됨" : "선택"}</span></label><label><input checked={selectedTimeValue === "17:00"} disabled={(closedSlots[selectedDateKey] ?? []).includes("17:00") || (bookedSlots[selectedDateKey] ?? []).includes("17:00")} type="radio" name="booking-time" value="17:00" onChange={() => { setSelectedTimeValue("17:00"); setBookingErrors(current => ({ ...current, datetime: "" })); }} /><span>◷ {(bookedSlots[selectedDateKey] ?? []).includes("17:00") || (closedSlots[selectedDateKey] ?? []).includes("17:00") ? "오후 5시 · 예약 마감" : "오후 5시"}</span><span className="time-select-action">{selectedTimeValue === "17:00" ? "선택됨" : "선택"}</span></label>{bookingErrors.datetime && <small className="field-error">{bookingErrors.datetime}</small>}</fieldset>}
                {selectedPlan && selectedDate && selectedTimeValue && <div className="contact-step"><div className="contact-step-head"><small>STEP 3 · CONTACT</small><h3>연락 가능한 정보를 알려 주세요.</h3></div><input type="hidden" name="booking-service" value={selectedPlanService} /><div className="form-row"><label>이름<input name="booking-name" placeholder="성함을 입력해 주세요" onChange={() => setBookingErrors(current => ({ ...current, name: "" }))} />{bookingErrors.name && <small className="field-error">{bookingErrors.name}</small>}</label><label>연락처<input name="booking-phone" inputMode="tel" maxLength={19} placeholder="010 - 0000 - 0000" onChange={event => { const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 11); event.currentTarget.value = digits.length <= 3 ? digits : digits.length <= 7 ? `${digits.slice(0, 3)} - ${digits.slice(3)}` : `${digits.slice(0, 3)} - ${digits.slice(3, 7)} - ${digits.slice(7)}`; setBookingErrors(current => ({ ...current, phone: "" })); }} />{bookingErrors.phone && <small className="field-error">{bookingErrors.phone}</small>}</label></div>
                <div className="address-field">
                  <span>방문 주소</span>
                  <div className="address-fixed">영종 베르힐 스카이시티 아파트</div>
                  <div className="address-dong-ho">
                    <select required value={addressDong} onChange={event => { setAddressDong(event.currentTarget.value); setBookingErrors(current => ({ ...current, address: "" })); }} aria-label="동">
                      <option value="">동 선택</option>
                      {Array.from({ length: 13 }, (_, i) => `${521 + i}동`).map(dong => <option key={dong} value={dong}>{dong}</option>)}
                    </select>
                    <input required value={addressHo} onChange={event => { setAddressHo(event.currentTarget.value); setBookingErrors(current => ({ ...current, address: "" })); }} aria-label="호수" placeholder="호수 (예: 1204호)" />
                  </div>
                  {bookingErrors.address && <small className="field-error">{bookingErrors.address}</small>}
                </div>
                <button className="submit" type="submit">{sent ? "예약이 접수되었습니다 ✓" : "예약 신청"}</button><p className="booking-confirm-note">빠른 시간 내에 확인 전화드리겠습니다.</p>
                </div>}
              </>}
            </div>
          </form>
        </div></section>

      <footer><div className="shell footer-grid"><div><div className="business-title"><a className="footer-brand" href="#top">키친<span className="footer-amp">앤</span> 바스 랩</a><span className="business-number">(784-61-00851)</span></div><p>욕실 한 곳에 집중하는<br />부분청소 정기관리 서비스</p></div><div><span>CONTACT</span><a className="phone-link phone-button" href="tel:01068227771"><small className="phone-caption">클릭 연결</small><strong>010-6822-7771</strong></a></div><div><span>AREA</span><b>영종 베르힐 스카이시티 아파트</b><button className="secret-admin-trigger" type="button" onClick={() => adminMode ? (setAdminMode(false), setSelectedDate(null)) : setAdminLoginOpen(true)}>[지역 외 서비스 불가]</button></div></div><div className="shell copyright"><span>© KITCHEN &amp; BATH_LAB. ALL RIGHTS RESERVED.</span></div></footer>
      {adminLoginOpen && <div className="admin-modal" role="dialog" aria-modal="true" aria-label="관리자 로그인"><form onSubmit={loginAdmin}><button type="button" className="modal-close" onClick={() => { setAdminLoginOpen(false); setAdminError(false); setAdminPassword(""); }}>×</button><strong>관리자 모드</strong><p>비밀번호를 입력해 주세요.</p><input autoFocus type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setAdminError(false); }} placeholder="비밀번호" />{adminError && <small>비밀번호가 올바르지 않습니다.</small>}<button type="submit">관리자 모드 시작</button></form></div>}
    </main>
  );
}
