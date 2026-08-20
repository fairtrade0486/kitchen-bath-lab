"use client";

import { FormEvent, useEffect, useState } from "react";

const services = [
  { no: "01", name: "욕실 청소", en: "BATHROOM", time: "약 2시간", price: "가격 미정", desc: "샤워 시 샴푸나 비누 거품에 피지와 단백질 오염이 섞여 쌓입니다. 이런 오염이 방치되면 꿉꿉한 냄새를 유발합니다.\n습하다고 곰팡이가 생기는 것이 아니라, 이런 오염 방치가 원인이 됩니다.", tags: ["욕실 천장 및 벽면 전체", "욕조", "샤워부스", "수전", "세면대 및 거울", "수납장", "변기", "하수구 및 덮개, 트랩"] },
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
  const [adminBookings, setAdminBookings] = useState<Array<{ id: number; booking_time: string; name: string; phone: string; service: string; address: string; completed: boolean }>>([]);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [reviewToken, setReviewToken] = useState<string | null>(null);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [reviews, setReviews] = useState<Array<{ id: number; name: string; region: string; service: string; content: string; created_at: string }>>([]);
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const years = Array.from({ length: 3 }, (_, i) => today.getFullYear() + i);
  const selectedDateKey = selectedDate ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}` : "";
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
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) setSelectedPlan(2);
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
      method: "POST", headers: supabaseHeaders, body: JSON.stringify({ p_date: selectedDateKey, p_password: "0486" }),
    });
    if (response.ok) setAdminBookings(await response.json());
  }

  useEffect(() => { refreshAdminBookings(); }, [selectedDateKey, adminMode]);

  async function completeBooking(id: number) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_complete_booking`, {
      method: "POST", headers: supabaseHeaders, body: JSON.stringify({ p_booking_id: id, p_password: "0486" }),
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
      body: JSON.stringify({ p_date: selectedDateKey, p_time: time, p_closed: !current.includes(time), p_password: "0486" }),
    });
    if (!response.ok) {
      window.alert("예약 마감 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    await refreshSlots();
  }

  function loginAdmin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (adminPassword === "0486") {
      setAdminMode(true); setAdminLoginOpen(false); setAdminPassword(""); setAdminError(false); setSelectedDate(null);
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
        body: JSON.stringify({ p_date: selectedDateKey, p_time: selectedTime, p_name: name, p_phone: phone, p_service: service, p_address: `영종자이아파트 ${address}` }),
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
    <main>
      <header className="top-brand shell">
        <a href="#top" aria-label="홈으로"><span>KITCHEN </span><em>&amp;</em><span> BATH_LAB</span></a>
      </header>

      <section className="hero-redesign" id="top">
        <figure className="hero-banner"><img src="/hero-bathroom-steam-cropped.png" alt="열린 배수구에 강한 스팀을 분사하는 욕실 청소 장면" /><figcaption><b>오직 욕실</b><span>BATHROOM CARE</span></figcaption></figure>
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
        <div className="hero-redesign-strip"><strong>“플랫폼 인력 파견이 아닙니다.</strong><span>이웃주민인 제가 항상 방문합니다.”</span></div>
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
          <div className="service-list service-areas">{serviceAreas.map((s, index) => { const [description, emphasis] = s.desc.split("\n"); return <article key={s.no} className="service-card"><div className="service-top"><small>{s.en}</small></div><h3>{s.name}</h3><p>{description}<br /><strong className="service-emphasis">{emphasis}</strong></p><div className="tags">{s.tags.map(t => <span key={t}>{t}</span>)}{s.en === "BATHROOM" && <span className="mobile-only-scope-tag">곰팡이 제거 및 예방 조치</span>}</div>{s.en === "KITCHEN" && <p className="service-note"><strong>※</strong> 상·하부장 내부 청소를 원하실 경우, 모든 집기를 미리 꺼내 주셔야 합니다. (별도 요금 없습니다)</p>}{s.en === "BATHROOM" && <p className="service-highlight"><strong>독일 키엘(kiehl's)의 친환경 약품 + 100℃ 고화력 스팀청소</strong><br />오염 제거 후 욕실 전체를 멸균·소독 처리합니다.<br />서두르지 않고 충분한 시간을 들여, 만족스러운 결과를 보여드리겠습니다.</p>}</article>})}</div>

        </div>
      </section>

            <section className="booking section" id="booking"><div className="shell booking-grid">

                    <form onSubmit={submit} noValidate className="booking-form">
                        <div className="booking-plan-stack"><p className="booking-frequency-note">한 달 2번이면 충분합니다. 다음 관리 전까지는 물만 뿌리세요.</p>
            <div className="price-group monthly-plan booking-plan selected" aria-label="딥케어 욕실 2개 월 2회 100,000원"><span className="price-label">딥케어 욕실(2개)</span><span className="monthly-freq">월2회</span><b className="monthly-price">100,000원</b></div></div><div className="booking-intro-group"><h2 className="booking-intro">첫 방문일을 선택해 주세요.</h2><p>첫 방문일을 선택한 뒤, 다음 일정은 생활
패턴에 맞춰 조율합니다.</p></div>
            <div className="calendar-head"><strong>예약 날짜 선택</strong><div><select aria-label="연도 선택" value={calendarYear} onChange={e => { setCalendarYear(Number(e.target.value)); setSelectedDate(null); setSelectedTimeValue(""); }}>{years.map(y => <option key={y} value={y}>{y}년</option>)}</select><select aria-label="월 선택" value={calendarMonth} onChange={e => { setCalendarMonth(Number(e.target.value)); setSelectedDate(null); setSelectedTimeValue(""); }}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i + 1}월</option>)}</select></div></div>
            <div className="calendar-week">{["일","월","화","수","목","금","토"].map(d => <span key={d}>{d}</span>)}</div>
            <div className="calendar-days">{calendarCells.map((day, i) => day ? <button type="button" key={i} className={`${selectedDate === day ? "selected " : ""}fully-booked`} aria-label={`${day}일 예약 마감`} onClick={() => { setSelectedDate(day); setSelectedTimeValue(""); setSent(false); }}><span>{day}</span></button> : <i key={i} />)}</div>
            <div className="selected-booking always-visible">
              {selectedDate && <><button type="button" className="calendar-back" onClick={() => { setSelectedDate(null); setSelectedTimeValue(""); setSent(false); }}>← 날짜 다시 선택</button><div className="price-group monthly-plan booking-plan selected selected-date-card" aria-label={`선택한 날짜 ${calendarYear}년 ${calendarMonth + 1}월 ${selectedDate}일`}><span className="price-label">선택한 날짜</span><span className="monthly-freq">방문일</span><b className="monthly-price">{calendarYear}년 {calendarMonth + 1}월 {selectedDate}일</b></div></>}
              {adminMode ? <div className="admin-slot-control"><h3>예약 시간 관리</h3><p>버튼을 눌러 예약 가능 여부를 변경하세요.</p>{[["09:00","오전 9시"],["15:00","오후 3시"],["17:00","오후 5시"]].map(([time,label]) => { const booked = (bookedSlots[selectedDateKey] ?? []).includes(time); const closed = (closedSlots[selectedDateKey] ?? []).includes(time); const booking = adminBookings.find(item => item.booking_time.slice(0, 5) === time); return <div className="admin-time-row" key={time}><button type="button" disabled={booked} className={booked || closed ? "closed" : "open"} onClick={() => toggleSlot(time)}><span>{label}</span><b>{booked || closed ? "예약 마감" : "예약 가능"}</b></button>{booking && <div className="admin-booking-info"><span><b>{booking.name}</b> · {booking.phone}<small>{booking.service}</small><small>{booking.address}</small></span><button type="button" disabled={booking.completed} onClick={() => completeBooking(booking.id)}>{booking.completed ? "서비스 완료 ✓" : "서비스 완료"}</button></div>}</div>; })}</div> : <>
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
