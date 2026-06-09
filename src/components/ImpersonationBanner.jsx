export default function ImpersonationBanner() {
  if (typeof window === "undefined") return null;
  if (sessionStorage.getItem("support_impersonation") !== "1") return null;
  const email = sessionStorage.getItem("support_impersonation_email");
  return (
    <div className="bg-amber-500 text-white text-xs font-medium py-1.5 px-3 text-center">
      Support impersonation session{email ? ` — viewing as ${email}` : ""}
    </div>
  );
}
