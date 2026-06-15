import { forwardRef, useState, useEffect } from "react"
import { getApiBase, getAuthToken } from "../../../api"
import { MOCK_ENABLED } from "../../../mocks"

const HtmlViewer = forwardRef(function HtmlViewer({ sessionId, path, onLoadComplete }, ref) {
  const [status, setStatus] = useState("loading")
  const [errorMsg, setErrorMsg] = useState("")
  // In mock mode the iframe can't load over the network, so we fetch the file
  // content and render it via `srcdoc` instead of `src`.
  const [docContent, setDocContent] = useState(null)

  const isJsx = path.endsWith('.jsx')
  const src = `${getApiBase()}/api/sessions/${sessionId}/files/${path}?token=${encodeURIComponent(getAuthToken() || "")}${isJsx ? '&preview=1' : ''}`

  useEffect(() => {
    const controller = new AbortController()
    async function checkFile() {
      try {
        const res = await fetch(src, { signal: controller.signal })
        if (controller.signal.aborted) return

        const contentType = res.headers.get("content-type") || ""
        if (!res.ok || contentType.includes("application/json")) {
          const text = await res.text()
          try {
            const json = JSON.parse(text)
            const detail = json.detail
            const msg = typeof detail === "string"
              ? detail
              : detail ? JSON.stringify(detail) : `Error ${res.status}`
            setErrorMsg(msg)
          } catch {
            setErrorMsg(`File not found (${res.status})`)
          }
          setStatus("error")
          onLoadComplete?.()
        } else {
          if (MOCK_ENABLED) {
            const text = await res.text()
            if (controller.signal.aborted) return
            // Rendered HTML (e.g. a widget preview) is shown as-is; raw source
            // (jsx/text) is escaped into a readable code view.
            const isHtml = contentType.includes("text/html")
            setDocContent(
              isHtml
                ? text
                : `<!DOCTYPE html><html><body style="font-family:ui-monospace,monospace;padding:16px;font-size:12px;white-space:pre-wrap;color:#1a2233">${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</body></html>`
            )
          }
          setStatus("ready")
          onLoadComplete?.()
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setErrorMsg(e.message || "Failed to load file")
          setStatus("error")
          onLoadComplete?.()
        }
      }
    }
    setStatus("loading")
    checkFile()
    return () => { controller.abort() }
  }, [src, onLoadComplete, isJsx])

  if (status === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--text-muted)] animate-thinking">Loading...</span>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--error)]">{errorMsg}</span>
      </div>
    )
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
        {...(MOCK_ENABLED ? { srcDoc: docContent || "" } : { src })}
        sandbox="allow-scripts allow-same-origin allow-modals"
        className="w-full h-full border-0 bg-white block"
        style={{ minHeight: "100%" }}
        title={path}
      />
    </div>
  )
})

export default HtmlViewer
