"use client";

import { FormEvent, useEffect, useState } from "react";

declare global {
  interface Window {
    daum?: { Postcode: new (options: { oncomplete: (data: { roadAddress: string; jibunAddress: string }) => void }) => { open: () => void } };
  }
}

const services = [
  { no: "01", name: "욕실 청소", en: "BATHROOM", time: "약 2시간", price: "가격 미정", desc: "욕실 역시 샤워 시 샴푸나 비누 거품에 피지와 단백질 오염이 섞여 쌓입니다. 이런 오염이 방치되면 꿉꿉한 냄새를 유발합니다.\n습하다고 곰팡이가 생기는 것이 아니라, 이런 오염 방치가 원인이 됩니다.", tags: ["욕실 벽면 전체", "욕조", "샤워부스", "수전", "세면대 및 거울", "수납장", "변기", "하수구 덮개 및 트랩"] },
  { no: "02", name: "주방 청소", en: "KITCHEN", time: "약 2–3시간", price: "가격 미정", desc: "주방에는 눈에 잘 보이지 않는 기름때가 공간 전체에 넓게 쌓입니다. 친환경 약품으로 오염 제거 후, 고화력 스팀청소기로 주방 전체를 멸균·소독 처리합니다.\n깨끗하고 위생적인 주방을 만들어 드리겠습니다.", tags: ["후드및 필터", "가스레인지, 인덕션", "싱크대", "주방 조리 상판", "상·하부장 겉면", "수전", "아일랜드 식탁"] },
  { no: "03", name: "욕실 + 주방", en: "BATH + KITCHEN", time: "약 4시간", price: "패키지 가격 미정", desc: "가장 부담스러운 두 공간을 하루에. 따로 예약하는 번거로움 없이 한 번에 집중합니다.", tags: ["욕실 전체", "주방 전체", "묶음 구성", "한 번에 방문"] },
];

const serviceAreas = [services[1], services[0]];

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
  const [roadAddress, setRoadAddress] = useState("");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [closedSlots, setClosedSlots] = useState<Record<string, string[]>>({});
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});
  const [adminBookings, setAdminBookings] = useState<Array<{ id: number; booking_time: string; name: string; phone: string; service: string; completed: boolean }>>([]);
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
      const target = row.source === "admin" ? nextClosed : nextBooked;
      target[row.booking_date] = [...(target[row.booking_date] ?? []), row.booking_time];
    });
    setBookedSlots(nextBooked);
    setClosedSlots(nextClosed);
  }

  useEffect(() => {
    if (!document.querySelector('script[data-postcode="daum"]')) {
      const script = document.createElement("script");
      script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      script.dataset.postcode = "daum";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    refreshSlots();
  }, [calendarYear, calendarMonth]);

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

  function openAddressSearch() {
    if (!window.daum?.Postcode) {
      window.alert("주소 검색을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: data => setRoadAddress(data.roadAddress || data.jibunAddress),
    }).open();
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
    const errors: Record<string, string> = {};
    if (!selectedDateKey || !selectedTime) errors.datetime = "날짜·시간을 입력해 주세요.";
    if (!name) errors.name = "이름을 입력해 주세요.";
    if (!phone) errors.phone = "연락처를 입력해 주세요.";
    if (!service) errors.service = "원하는 서비스를 입력해 주세요.";
    setBookingErrors(errors);
    if (Object.keys(errors).length) return;
    if (selectedDateKey && selectedTime) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reserve_booking`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify({ p_date: selectedDateKey, p_time: selectedTime, p_name: name, p_phone: phone, p_service: service }),
      });
      if (!response.ok) {
        window.alert("예약 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      const token = await response.json() as string | null;
      if (!token) {
        window.alert("방금 다른 예약이 접수된 시간입니다. 다른 시간을 선택해 주세요.");
        await refreshSlots();
        return;
      }
      window.localStorage.setItem("review-booking-token", token);
      setReviewToken(token);
      setCanWriteReview(false);
      form.reset();
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
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="홈으로"><span>KITCHEN &amp; </span><b>BATH_LAB</b></a>
      </header>

      <section className="hero" id="top">
        <div className="shell hero-subtitle">부분청소 정기구독 서비스</div>
        <div className="shell hero-grid">
          <div className="hero-copy">
            <h1 className="hero-one-line">주방과 욕실만 맡겨주세요.</h1>
            <p className="lead">집에서 가장 신경 쓰이는 두 곳에 집중합니다.</p>
            <div className="hero-need"><p>집 전체 청소가 필요한 건 아닌데,<br />주방 기름때는 엄두가 안 나고<br />욕실 물때는 손대기 싫을 때.</p><strong>필요한 곳만, <em>제대로.</em></strong></div>
          </div>
          <div className="hero-visual animated-art" aria-label="욕실과 주방을 담은 애니메이션 스타일 일러스트">
            <img src="/hero-high-gloss.png" alt="하이글로시 3D 스타일의 깨끗한 욕실과 주방" />
            <div className="proof-card"><b>오직 두 공간</b><span>BATH · KITCHEN</span></div>
          </div>
        </div>
        <div className="hero-strip"><strong>“플랫폼 인력 소개가 아닙니다</strong><span>상담부터 방문서비스까지 제가 직접 합니다.”</span></div>
      </section>

      <section className="about shell section" id="about">
    <div className="about-left"><div className="portrait"><img className="profile-photo" src="/profile-navy.png" alt="직접 방문하는 담당자" /><div className="nameplate"><small>YOUR CLEANER</small><b>홈크린마스터</b></div></div><div className="about-copy"><h2 className="visitor-title"><span>누가 방문하는지,</span><em>미리 확인하세요.</em></h2><blockquote>“낯선 작업자가 오는 불안 없이,<br />사진 속 제가 직접 방문합니다.”</blockquote></div></div>
        <div className="about-greeting" aria-label="인사말 영역">
          <p className="greeting-kicker">HOME CLEAN MASTER’S STORY</p>
          <h3>65세,<br /><em>인생 4막을 시작합니다.</em></h3>
          <p>안녕하세요.<br />귀댁에 방문 서비스를 제공할 홈크린마스터입니다.</p>
          <p>저는 55세에 직장에서 퇴직한 뒤 청소업에 뛰어들었습니다.</p>
          <p><strong className="company-name">㈜통인</strong>의 협력 업무를 통해 삼성화재 보험 가입자에게 제공되는 홈클린서비스 중 주방·욕실 청소를 서울·경기 지역에서 6년, <strong className="company-name">㈜영구크린</strong>의 협력 업무를 통해 ㈜대림비앤코 비데 렌탈 고객에게 제공되는 욕실 클리닝 서비스를 서울·경기 지역에서 3년, 정기 구독형 욕실 및 주방 청소 전문 서비스 <strong className="company-name">㈜호텔리브</strong>에서 서울 파크리오 1·2·3단지 전담 매니저로 3년간 활동한 경력이 있습니다.</p>
          <p>이후 은퇴하여 영종도로 이사 와서 한가한 생활을 하던 중, 그동안 쌓아온 경험과 노하우를 그냥 묻어두기 아깝다는 생각이 들었습니다. 그래서 이곳에서 다시 인생 4막을 시작하려 합니다.</p>
          <p className="greeting-principle">돈을 벌기 위한 수단이 아닌 만큼, 하루 최대 두 가정만 방문하려 합니다. 예약이 많아지면 마음이 조급해지고, 그 조급함은 서비스의 부족과 고객의 불편으로 이어질 수 있기 때문입니다.</p>
          <p className="greeting-sign">서두르지 않고 충분한 시간을 들여,<br />만족스러운 결과를 보여드리겠습니다.</p>
        </div>
      </section>

      <section className="service section" id="service">
        <div className="shell"><div className="section-head"><div><h2>서비스 범위</h2></div></div>
          <div className="service-list service-areas">{serviceAreas.map((s, index) => { const [description, emphasis] = s.desc.split("\n"); return <article key={s.no} className="service-card"><div className="service-top"><span>0{index + 1}</span><small>{s.en}</small></div><h3>{s.name}</h3><p>{description}<br /><strong className="service-emphasis">{emphasis}</strong></p><div className="tags">{s.tags.map(t => <span key={t}>{t}</span>)}</div>{s.en === "KITCHEN" && <p className="service-note"><strong>※</strong> 상·하부장 내부 청소를 원하실 경우, 모든 집기를 미리 꺼내 주셔야 합니다. (별도 요금 없습니다)</p>}{s.en === "BATHROOM" && <p className="service-note"><strong>※</strong> 욕실 역시 친환경 약품으로 오염 제거 후, 고화력 스팀청소기로 욕실 전체를 멸균·소독 처리합니다.</p>}</article>})}</div>
          <aside className="service-guide"><strong>방문 전 안내</strong><p>단순한 가사도움이 아닌, 전문 클린마스터의 방문 서비스입니다.<br />설거지와 집기·비품 세척은 서비스 범위에 포함되지 않습니다. 청소할 공간의 물건을 미리 정리해 주시면, 더 넓은 부분을 꼼꼼하게 관리해 드릴 수 있습니다.</p></aside>
        </div>
      </section>

      <section className="pricing section" id="price">
        <div className="shell"><div className="section-head"><div><p className="section-no">02 / PRICE</p><h2>정기구독 가격 안내</h2></div></div>
          <div className="pricing-grid monthly-pricing">
            <div className="price-group monthly-plan"><span className="price-label">월 2회 패키지</span><strong className="monthly-service">주방 + 욕실 2개</strong><b className="monthly-price">100,000원</b></div>
            <div className="price-group monthly-plan"><span className="price-label">월 3회 패키지</span><strong className="monthly-service">주방 + 욕실 2개</strong><b className="monthly-price">150,000원</b></div>
            <div className="price-group monthly-plan"><span className="price-label">월 4회 패키지</span><strong className="monthly-service">주방 + 욕실 2개</strong><b className="monthly-price">200,000원</b></div>
          </div>
        </div>
      </section>

      <section className="booking section" id="booking"><div className="shell booking-grid">
          <form onSubmit={submit} noValidate className="booking-form">
            <div className="calendar-head"><strong>예약 날짜 선택</strong><div><select aria-label="연도 선택" value={calendarYear} onChange={e => { setCalendarYear(Number(e.target.value)); setSelectedDate(null); }}>{years.map(y => <option key={y} value={y}>{y}년</option>)}</select><select aria-label="월 선택" value={calendarMonth} onChange={e => { setCalendarMonth(Number(e.target.value)); setSelectedDate(null); }}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i + 1}월</option>)}</select></div></div>
            <div className="calendar-week">{["일","월","화","수","목","금","토"].map(d => <span key={d}>{d}</span>)}</div>
            <div className="calendar-days">{calendarCells.map((day, i) => day ? <button type="button" key={i} className={selectedDate === day ? "selected" : ""} onClick={() => { setSelectedDate(day); setSent(false); }}><span>{day}</span></button> : <i key={i} />)}</div>
            {selectedDate && <div className="selected-booking">
              <button type="button" className="calendar-back" onClick={() => { setSelectedDate(null); setSent(false); }}>← 날짜 다시 선택</button>
              <p className="selected-date">선택한 날짜 <strong>{calendarYear}년 {calendarMonth + 1}월 {selectedDate}일</strong></p>
              {adminMode ? <div className="admin-slot-control"><h3>예약 시간 관리</h3><p>버튼을 눌러 예약 가능 여부를 변경하세요.</p>{[["14:30","오후 2시 30분"],["17:00","오후 5시"]].map(([time,label]) => { const booked = (bookedSlots[selectedDateKey] ?? []).includes(time); const closed = (closedSlots[selectedDateKey] ?? []).includes(time); const booking = adminBookings.find(item => item.booking_time.slice(0, 5) === time); return <div className="admin-time-row" key={time}><button type="button" disabled={booked} className={booked || closed ? "closed" : "open"} onClick={() => toggleSlot(time)}><span>{label}</span><b>{booked || closed ? "예약 마감" : "예약 가능"}</b></button>{booking && <div className="admin-booking-info"><span><b>{booking.name}</b> · {booking.phone}<small>{booking.service}</small></span><button type="button" disabled={booking.completed} onClick={() => completeBooking(booking.id)}>{booking.completed ? "서비스 완료 ✓" : "서비스 완료"}</button></div>}</div>; })}</div> : <>
                <fieldset className="time-select"><legend>시간대 선택</legend><label><input disabled={(closedSlots[selectedDateKey] ?? []).includes("14:30") || (bookedSlots[selectedDateKey] ?? []).includes("14:30")} type="radio" name="booking-time" value="14:30" onChange={() => setBookingErrors(current => ({ ...current, datetime: "" }))} /><span>{(bookedSlots[selectedDateKey] ?? []).includes("14:30") || (closedSlots[selectedDateKey] ?? []).includes("14:30") ? "오후 2시 30분 · 예약 마감" : "오후 2시 30분"}</span></label><label><input disabled={(closedSlots[selectedDateKey] ?? []).includes("17:00") || (bookedSlots[selectedDateKey] ?? []).includes("17:00")} type="radio" name="booking-time" value="17:00" onChange={() => setBookingErrors(current => ({ ...current, datetime: "" }))} /><span>{(bookedSlots[selectedDateKey] ?? []).includes("17:00") || (closedSlots[selectedDateKey] ?? []).includes("17:00") ? "오후 5시 · 예약 마감" : "오후 5시"}</span></label>{bookingErrors.datetime && <small className="field-error">{bookingErrors.datetime}</small>}</fieldset>
                <div className="form-row"><label>이름<input name="booking-name" placeholder="성함을 입력해 주세요" onChange={() => setBookingErrors(current => ({ ...current, name: "" }))} />{bookingErrors.name && <small className="field-error">{bookingErrors.name}</small>}</label><label>연락처<input name="booking-phone" inputMode="tel" placeholder="010-0000-0000" onChange={() => setBookingErrors(current => ({ ...current, phone: "" }))} />{bookingErrors.phone && <small className="field-error">{bookingErrors.phone}</small>}</label></div>
                <div className="address-field">
                  <span>방문 주소</span>
                  <div className="address-search-row"><input required readOnly value={roadAddress} onClick={openAddressSearch} placeholder="도로명 주소를 검색해 주세요" /><button type="button" onClick={openAddressSearch}>주소 검색</button></div>
                  <input required disabled={!roadAddress} aria-label="상세 주소" placeholder="아파트명·동·호수 등 상세 주소" />
                </div>
                <label>원하는 서비스<select name="booking-service" defaultValue="" onChange={() => setBookingErrors(current => ({ ...current, service: "" }))}><option value="" disabled>서비스를 선택해 주세요</option><option>월 2회 · 주방 + 욕실 2개 (100,000원)</option><option>월 3회 · 주방 + 욕실 2개 (150,000원)</option><option>월 4회 · 주방 + 욕실 2개 (200,000원)</option></select>{bookingErrors.service && <small className="field-error">{bookingErrors.service}</small>}</label>
                <label>전달 내용<textarea rows={4} placeholder="요청사항 등을 작성해 주세요." /></label><button className="submit" type="submit">{sent ? "예약이 접수되었습니다 ✓" : "예약 신청"}</button>
              </>}
            </div>}
          </form>
        </div></section>

      <section className="reviews" id="reviews"><div className="shell reviews-shell">
        <button className="reviews-toggle" type="button" aria-expanded={reviewsOpen} onClick={() => setReviewsOpen(open => !open)}><span>이용후기</span><b>{reviewsOpen ? "닫기 −" : "보기 +"}</b></button>
        {reviewsOpen && <div className="reviews-panel"><p className="reviews-intro">서비스를 이용하신 고객님의 이야기를 전합니다.<br />후기는 작성 즉시 공개되며, 성함은 성만 표시됩니다.</p><div className="reviews-grid">
          {canWriteReview ? <form className="review-form" onSubmit={submitReview}>
            <strong>이용후기</strong><div className="review-meta-row"><label><input aria-label="성명" name="review-name" required maxLength={5} placeholder="성명" /></label><label><input aria-label="지역명" name="review-region" required maxLength={5} placeholder="지역명" /></label><label><select aria-label="서비스 종류" name="review-service" required defaultValue=""><option value="" disabled>서비스 종류</option><option>월 2회 · 주방 + 욕실 2개</option><option>월 3회 · 주방 + 욕실 2개</option><option>월 4회 · 주방 + 욕실 2개</option></select></label></div>
            <div className="review-compose"><textarea aria-label="후기 내용" name="review-content" required maxLength={200} rows={3} placeholder="이용 후기를 작성해 주세요." /><button className="review-submit" type="submit">등록</button></div>{reviewSent && <p className="review-success">후기가 등록되었습니다.</p>}
          </form> : <div className="review-locked"><strong>이용후기</strong><p>일반 방문자는 후기를 볼 수 있습니다.<br />서비스 완료 처리된 예약자만 후기를 작성할 수 있습니다.</p></div>}
          <div className="review-list" aria-live="polite">{reviews.map(review => <article className="review-card" key={review.id}><div><strong>{review.region} · {review.name} 고객님</strong><time>{new Date(review.created_at).toLocaleDateString("ko-KR")}</time></div><small>{review.service}</small><p>{review.content}</p></article>)}</div>
        </div></div>}
      </div></section>

      <footer><div className="shell footer-grid"><div><div className="business-title"><a className="footer-brand" href="#top">키친앤 바스 랩</a><span className="business-number">(784-61-00851)</span></div><p>욕실과 주방, 두 곳만 집중하는<br />영종도 부분청소 정기 구독서비스</p></div><div><span>CONTACT</span><a className="phone-link phone-button" href="tel:01068227771"><small className="phone-caption">클릭 연결</small><strong>010-6822-7771</strong></a></div><div><span>AREA</span><b>인천 영종도 전 지역</b><button className="secret-admin-trigger" type="button" onClick={() => adminMode ? (setAdminMode(false), setSelectedDate(null)) : setAdminLoginOpen(true)}>[지역 외 서비스 불가]</button></div></div><div className="shell copyright"><span>© KITCHEN &amp; BATH_LAB. ALL RIGHTS RESERVED.</span></div></footer>
      {adminLoginOpen && <div className="admin-modal" role="dialog" aria-modal="true" aria-label="관리자 로그인"><form onSubmit={loginAdmin}><button type="button" className="modal-close" onClick={() => { setAdminLoginOpen(false); setAdminError(false); setAdminPassword(""); }}>×</button><strong>관리자 모드</strong><p>비밀번호를 입력해 주세요.</p><input autoFocus type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setAdminError(false); }} placeholder="비밀번호" />{adminError && <small>비밀번호가 올바르지 않습니다.</small>}<button type="submit">관리자 모드 시작</button></form></div>}
    </main>
  );
}
