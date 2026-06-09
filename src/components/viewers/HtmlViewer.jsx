import { forwardRef, useState, useEffect } from "react";
import { getApiBase, getAuthToken } from "../../api";

const HtmlViewer = forwardRef(function HtmlViewer({ sessionId, path }, ref) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMsg, setErrorMsg] = useState("");

  const isJsx = path.endsWith('.jsx');
  const src = `${getApiBase()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || "")}${isJsx ? '&preview=1' : ''}`;

  // Pre-flight check to verify the file exists (use GET and abort early)
  useEffect(() => {
    const controller = new AbortController();
    async function checkFile() {
      try {
        const res = await fetch(src, { signal: controller.signal });
        if (controller.signal.aborted) return;

        // Check content-type to see if it's an error JSON response
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || contentType.includes("application/json")) {
          // Likely an error response - read it to show the message
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            const detail = json.detail;
            // Ensure detail is a string
            const msg = typeof detail === "string"
              ? detail
              : detail ? JSON.stringify(detail) : `Error ${res.status}`;
            setErrorMsg(msg);
          } catch {
            setErrorMsg(`File not found (${res.status})`);
          }
          setStatus("error");
        } else {
          setStatus("ready");
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setErrorMsg(e.message || "Failed to load file");
          setStatus("error");
        }
      }
    }
    setStatus("loading");
    checkFile();
    return () => { controller.abort(); };
  }, [src]);

  if (status === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--text-muted)] animate-thinking">Loading...</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--error)]">{errorMsg}</span>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full overflow-auto rounded-b-lg bg-white"
      style={{
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch"
      }}
    >
      <iframe
        ref={ref}
        src={src}
        sandbox="allow-scripts allow-same-origin allow-modals"
        className="w-full h-full border-0 bg-white block"
        style={{ minHeight: "100%" }}
        title={path}
      />
    </div>
  );
});

export default HtmlViewer;
