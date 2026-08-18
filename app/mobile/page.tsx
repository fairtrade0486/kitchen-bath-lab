export const metadata = {
  title: "KITCHEN & BATH_LAB 모바일 미리보기",
  description: "KITCHEN & BATH_LAB 홈페이지 모바일 화면",
};

export default function MobilePreviewPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#dfe3df", display: "grid", placeItems: "center", padding: "24px 12px" }}>
      <div style={{ width: "min(100%, 375px)", height: "812px", background: "#fff", border: "8px solid #18221d", borderRadius: "30px", overflow: "hidden", boxShadow: "0 18px 45px rgba(21,37,29,.33)", position: "relative" }}>
        <div aria-hidden="true" style={{ position: "absolute", zIndex: 2, top: 0, left: "50%", transform: "translateX(-50%)", width: "116px", height: "22px", background: "#18221d", borderRadius: "0 0 16px 16px" }} />
        <iframe title="KITCHEN & BATH_LAB 모바일 홈페이지" src="/" style={{ width: "100%", height: "100%", border: 0, display: "block", background: "#f8f7f2" }} />
      </div>
    </main>
  );
}
