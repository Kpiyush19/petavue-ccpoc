import { useRef } from "react";
import { FileHtml, Table, Image, FileText, File, DownloadSimple, Article } from "@phosphor-icons/react";
import { Button, Tooltip } from "@/common-components";
import { inferContentType } from "../utils/fileTypes";
import { getApiBase, getAuthToken } from "../../../api";

function getIcon(contentType) {
  switch (contentType) {
    case "html":
      return FileHtml;
    case "csv":
    case "jsonl":
    case "json":
    case "xlsx":
      return Table;
    case "image":
      return Image;
    case "markdown":
      return Article;
    case "text":
      return FileText;
    default:
      return File;
  }
}

function getTypeLabel(contentType) {
  switch (contentType) {
    case "html":
      return "HTML Report";
    case "csv":
      return "CSV Data";
    case "jsonl":
    case "json":
      return "JSON Data";
    case "xlsx":
      return "Excel File";
    case "image":
      return "Image";
    case "markdown":
      return "Markdown";
    case "text":
      return "Text File";
    default:
      return "File";
  }
}

export default function OutputCard({ path, title, sessionId, isSelected, isLoading, onOpenArtifact }) {
  const downloadRef = useRef(null);
  const contentType = inferContentType(path);
  const Icon = getIcon(contentType);
  const typeLabel = getTypeLabel(contentType);
  const isHtml = contentType === "html";
  const apiBase = getApiBase();
  const downloadUrl = `${apiBase}/api/sessions/${sessionId}/outputs/${path}?token=${encodeURIComponent(getAuthToken() || "")}`;

  const displayTitle = title || path.split("/").pop();

  const handleDownload = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isHtml) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow.print();
        } catch {
          window.open(downloadUrl, "_blank");
        }
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    } else if (downloadRef.current) {
      downloadRef.current.href = downloadUrl;
      downloadRef.current.download = displayTitle;
      downloadRef.current.click();
    }
  };

  const handleClick = () => {
    if (onOpenArtifact) {
      onOpenArtifact({
        path,
        title: displayTitle,
        contentType,
        source: "output"
      });
    }
  };

  return (
    <div className="s-output-card-wrapper">
      <a ref={downloadRef} style={{ display: "none" }} aria-hidden="true" />
      <button className={`s-output-card${isSelected ? " s-output-card--selected" : ""}`} onClick={handleClick}>
        <div className="s-output-card__icon">
          <div className="s-output-card__icon-inner">
            {isLoading ? (
              <img src="/assets/spin-loader.gif" alt="loading" className="w-6 h-6 shrink-0" />
            ) : (
              <Icon size={24} />
            )}
          </div>
        </div>
        <div className="s-output-card__content">
          <div className="s-output-card__title-row">
            <Tooltip placement="top" displayTooltipOnOverflow title={displayTitle}>
              <span className="s-output-card__title">{displayTitle}</span>
            </Tooltip>
          </div>
          <span className="s-output-card__subtitle">
            {isLoading ? "Generating..." : `Click to open ${typeLabel.toLowerCase()}`}
          </span>
        </div>
      </button>

      {/* {!isLoading && (
        <>
          <span className="flex h-full w-[1px] bg-pv-neutral-grey-300 shrink-0" />
          <Button
            btnColor="secondary ghost"
            btnSize="sm"
            mainBtnClassName="h-[67px] w-[46px] border-none rounded-r-lg rounded-l-none"
            onClick={handleDownload}
          >
            <DownloadSimple size={16} weight="bold" />
          </Button>
        </>
      )} */}
    </div>
  );
}
