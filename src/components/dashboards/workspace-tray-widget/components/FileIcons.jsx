import {
  FolderNotch,
  Database,
  BookOpen,
  Code,
  ChartBar,
  DownloadSimple,
  UploadSimple,
  File,
  FileHtml,
  FileCsv,
  FileText,
  FileCode,
  FileImage,
  Table,
  Notebook,
} from '@phosphor-icons/react';
import { getFolderIcon } from '../utils/fileTypes';

const FILE_TYPE_COLORS = {
  html: 'var(--color-primary-500)',
  csv: 'var(--color-green)',
  jsonl: 'var(--color-green)',
  json: 'var(--color-orange)',
  xlsx: 'var(--color-green)',
  image: 'var(--color-purple-400)',
  markdown: 'var(--color-grey-500)',
  text: 'var(--color-grey-500)',
  code: 'var(--color-primary-500)',
};

const EXT_BADGE_COLORS = {
  html: { bg: 'var(--color-primary-50)', text: 'var(--color-primary-500)' },
  csv: { bg: 'var(--color-green-bg)', text: 'var(--color-green)' },
  json: { bg: 'var(--color-orange-bg)', text: 'var(--color-orange)' },
  jsonl: { bg: 'var(--color-green-bg)', text: 'var(--color-green)' },
  xlsx: { bg: 'var(--color-green-bg)', text: 'var(--color-green)' },
  png: { bg: 'var(--color-tag-purple)', text: 'var(--color-purple-400)' },
  jpg: { bg: 'var(--color-tag-purple)', text: 'var(--color-purple-400)' },
  jpeg: { bg: 'var(--color-tag-purple)', text: 'var(--color-purple-400)' },
  gif: { bg: 'var(--color-tag-purple)', text: 'var(--color-purple-400)' },
  md: { bg: 'var(--color-grey-100)', text: 'var(--color-grey-500)' },
  py: { bg: 'var(--color-primary-50)', text: 'var(--color-primary-500)' },
  js: { bg: 'var(--color-orange-bg)', text: 'var(--color-orange)' },
  ts: { bg: 'var(--color-primary-50)', text: 'var(--color-primary-500)' },
  sql: { bg: 'var(--color-red-bg)', text: 'var(--color-red)' },
  txt: { bg: 'var(--color-grey-100)', text: 'var(--color-grey-500)' },
};

export function FolderIconSvg({ dirName, size = 14 }) {
  const icon = getFolderIcon(dirName);
  const props = { size, weight: 'duotone' };

  switch (icon) {
    case 'file-output':
      return <DownloadSimple {...props} className="text-[var(--color-primary-500)]" />;
    case 'upload':
      return <UploadSimple {...props} className="text-[var(--color-purple-400)]" />;
    case 'chart':
      return <ChartBar {...props} className="text-[var(--color-orange)]" />;
    case 'code':
      return <Code {...props} className="text-[var(--color-primary-500)]" />;
    case 'book':
      return <BookOpen {...props} className="text-[var(--color-grey-500)]" />;
    case 'database':
      return <Database {...props} className="text-[var(--color-green)]" />;
    default:
      return <FolderNotch {...props} className="text-[var(--color-grey-500)]" />;
  }
}

export function FileIconSvg({ contentType }) {
  const color = FILE_TYPE_COLORS[contentType] || 'var(--color-grey-400)';
  const props = { size: 14, weight: 'duotone', style: { color } };

  switch (contentType) {
    case 'html':
      return <FileHtml {...props} />;
    case 'csv':
      return <Table {...props} />;
    case 'jsonl':
    case 'json':
      return <FileCsv {...props} />;
    case 'xlsx':
      return <Table {...props} />;
    case 'image':
      return <FileImage {...props} />;
    case 'code':
      return <FileCode {...props} />;
    case 'markdown':
      return <Notebook {...props} />;
    case 'text':
      return <FileText {...props} />;
    default:
      return <File {...props} style={{ color: 'var(--color-grey-400)' }} />;
  }
}

export function ExtBadge({ name }) {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = name.slice(dot + 1).toLowerCase();
  const colors = EXT_BADGE_COLORS[ext];
  if (!colors) return null;

  return (
    <span
      className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded tracking-wide"
      style={{ background: colors.bg, color: colors.text }}
    >
      {ext}
    </span>
  );
}
