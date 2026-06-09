import { useRef } from 'react';
import {
  FileHtml,
  Table,
  Image,
  FileText,
  File,
  DownloadSimple,
  CheckCircle,
  Article,
} from '@phosphor-icons/react';
import { Button, Tooltip } from '@/common-components';
import { twMerge } from 'tailwind-merge';
import { inferContentType } from '../utils/fileTypes';
import { getApiBaseUrl, getAuthToken } from '../api';

function getIcon(contentType) {
  switch (contentType) {
    case 'html':
      return FileHtml;
    case 'csv':
    case 'jsonl':
    case 'json':
    case 'xlsx':
      return Table;
    case 'image':
      return Image;
    case 'markdown':
      return Article;
    case 'text':
      return FileText;
    default:
      return File;
  }
}

function getTypeLabel(contentType) {
  switch (contentType) {
    case 'html':
      return 'HTML Report';
    case 'csv':
      return 'CSV Data';
    case 'jsonl':
    case 'json':
      return 'JSON Data';
    case 'xlsx':
      return 'Excel File';
    case 'image':
      return 'Image';
    case 'markdown':
      return 'Markdown';
    case 'text':
      return 'Text File';
    default:
      return 'File';
  }
}

export default function OutputCard({
  path,
  title,
  sessionId,
  isSelected,
  isLoading,
  onOpen,
}) {
  const downloadRef = useRef(null);
  const contentType = inferContentType(path);
  const Icon = getIcon(contentType);
  const typeLabel = getTypeLabel(contentType);
  const isHtml = contentType === 'html';
  const apiBase = getApiBaseUrl();
  const downloadUrl = `${apiBase}/api/sessions/${sessionId}/outputs/${path}?token=${encodeURIComponent(getAuthToken() || '')}`;

  const displayTitle = title || path.split('/').pop();

  const handleDownload = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isHtml) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow.print();
        } catch {
          window.open(downloadUrl, '_blank');
        }
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    } else if (downloadRef.current) {
      downloadRef.current.href = downloadUrl;
      downloadRef.current.download = displayTitle;
      downloadRef.current.click();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a ref={downloadRef} style={{ display: 'none' }} aria-hidden="true" />
      <button
        className={twMerge(
          'flex h-[69px] w-[407px] items-center border hover:bg-[var(--pv-primary-50)] bg-white rounded-lg my-[4px] relative',
          isSelected
            ? 'border-[var(--pv-neutral-grey-300)]'
            : 'border-[var(--pv-neutral-grey-200)]'
        )}
        onClick={() =>
          onOpen({
            path,
            title: displayTitle,
            contentType,
            source: 'output',
          })
        }
      >
        <div className="flex justify-center items-center w-[69px] h-full shrink-0">
          <div className="flex h-[52px] w-[52px] m-auto bg-[var(--pv-neutral-grey-50)] border border-[var(--pv-neutral-grey-200)] rounded-lg justify-center items-center">
            {isLoading ? (
              <img
                src="/assets/spin-loader.gif"
                alt="loading"
                className="w-6 h-6 shrink-0"
              />
            ) : (
              <Icon size={24} className="text-[var(--pv-neutral-grey-600)]" />
            )}
          </div>
        </div>

        <div className="flex flex-col w-full h-full justify-center items-start overflow-x-hidden rounded-lg gap-1.5">
          <div className="flex w-full overflow-auto">
            <Tooltip
              placement="top"
              displayTooltipOnOverflow
              title={displayTitle}
            >
              <span className="text-[var(--pv-text-primary-text)] mx-2 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {displayTitle}
              </span>
            </Tooltip>
          </div>
          <span className="text-[var(--pv-neutral-grey-400)] text-xs mx-2">
            {isLoading
              ? 'Generating...'
              : `Click to open ${typeLabel.toLowerCase()}`}
          </span>
        </div>

        {isSelected && (
          <>
            <span className="absolute top-[-9px] right-[-9px] bg-[var(--pv-neutral-grey-50)] w-[13px] h-[13px]" />
            <span className="absolute top-[-7px] right-[-7px]">
              <CheckCircle weight="fill" size={18} />
            </span>
          </>
        )}
      </button>

      {!isLoading && (
        <Button
          btnColor="ghost"
          btnSize="sm"
          mainBtnClassName="p-2"
          className="h-fit"
          onClick={handleDownload}
        >
          <DownloadSimple size={16} weight="bold" />
        </Button>
      )}
    </div>
  );
}
