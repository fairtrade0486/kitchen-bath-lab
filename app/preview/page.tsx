export default function MobilePreviewPage() {
  return (
    <main style={{ minHeight: "100vh", margin: 0, padding: 0, background: "#F7F5F0", boxSizing: "border-box" }}>
      <section style={{ width: "100%" }}>
        <iframe
          src="/?preview=updated"
          title="Galaxy S25 FE 홈페이지 미리보기"
          style={{ display: "block", width: "100%", height: "100vh", border: 0, background: "#F7F5F0" }}
        />
      </section>
    </main>
  );
}
