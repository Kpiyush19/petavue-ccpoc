export default function PetavueSplash() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <img src="/petavue-logo.svg" alt="Petavue" style={{ width: "48px", height: "auto" }} />
        <span style={{ fontSize: "48px", letterSpacing: "-0.025em", color: "#3661ED" }}>
          <span style={{ fontWeight: 600 }}>Peta</span>
          <span style={{ fontWeight: 400 }}>vue</span>
        </span>
      </div>
      <svg
        style={{ width: "40px", height: "40px" }}
        className="animate-spin"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2C6.48 2 2 6.48 2 12"
          stroke="#3661ED"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
