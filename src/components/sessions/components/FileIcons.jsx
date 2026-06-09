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
} from '@phosphor-icons/react'
import { getFolderIcon } from '../utils/fileTypes'

const FILE_TYPE_COLORS = {
  html: 'var(--pv-primary-500)',
  csv: 'var(--pv-success-text)',
  jsonl: 'var(--pv-success-text)',
  json: 'var(--pv-warning-text)',
  xlsx: 'var(--pv-success-text)',
  image: 'var(--pv-accent-text)',
  markdown: 'var(--pv-neutral-grey-500)',
  text: 'var(--pv-neutral-grey-500)',
  code: 'var(--pv-primary-500)',
}

const EXT_BADGE_COLORS = {
  html: { bg: 'var(--pv-primary-50)', text: 'var(--pv-primary-500)' },
  csv: { bg: 'var(--pv-success-bg)', text: 'var(--pv-success-text)' },
  json: { bg: 'var(--pv-warning-bg)', text: 'var(--pv-warning-text)' },
  jsonl: { bg: 'var(--pv-success-bg)', text: 'var(--pv-success-text)' },
  xlsx: { bg: 'var(--pv-success-bg)', text: 'var(--pv-success-text)' },
  png: { bg: 'var(--pv-tags-purple)', text: 'var(--pv-accent-text)' },
  jpg: { bg: 'var(--pv-tags-purple)', text: 'var(--pv-accent-text)' },
  jpeg: { bg: 'var(--pv-tags-purple)', text: 'var(--pv-accent-text)' },
  gif: { bg: 'var(--pv-tags-purple)', text: 'var(--pv-accent-text)' },
  md: { bg: 'var(--pv-neutral-grey-100)', text: 'var(--pv-neutral-grey-500)' },
  py: { bg: 'var(--pv-primary-50)', text: 'var(--pv-primary-500)' },
  js: { bg: 'var(--pv-warning-bg)', text: 'var(--pv-warning-text)' },
  ts: { bg: 'var(--pv-primary-50)', text: 'var(--pv-primary-500)' },
  sql: { bg: 'var(--pv-error-bg)', text: 'var(--pv-error-text)' },
  txt: { bg: 'var(--pv-neutral-grey-100)', text: 'var(--pv-neutral-grey-500)' },
}

export function FolderIconSvg({ dirName, size = 14 }) {
  const icon = getFolderIcon(dirName)
  const props = { size, weight: 'duotone' }

  switch (icon) {
    case 'file-output':
      return <DownloadSimple {...props} className="text-[var(--pv-primary-500)]" />
    case 'upload':
      return <UploadSimple {...props} className="text-[var(--pv-accent-text)]" />
    case 'chart':
      return <ChartBar {...props} className="text-[var(--pv-warning-text)]" />
    case 'code':
      return <Code {...props} className="text-[var(--pv-primary-500)]" />
    case 'book':
      return <BookOpen {...props} className="text-[var(--pv-neutral-grey-500)]" />
    case 'database':
      return <Database {...props} className="text-[var(--pv-success-text)]" />
    default:
      return <FolderNotch {...props} className="text-[var(--pv-neutral-grey-500)]" />
  }
}

export function FileIconSvg({ contentType }) {
  const color = FILE_TYPE_COLORS[contentType] || 'var(--pv-neutral-grey-400)'
  const props = { size: 14, weight: 'duotone', style: { color } }

  switch (contentType) {
    case 'html':
      return <FileHtml {...props} />
    case 'csv':
      return <Table {...props} />
    case 'jsonl':
    case 'json':
      return <FileCsv {...props} />
    case 'xlsx':
      return <Table {...props} />
    case 'image':
      return <FileImage {...props} />
    case 'code':
      return <FileCode {...props} />
    case 'markdown':
      return <Notebook {...props} />
    case 'text':
      return <FileText {...props} />
    default:
      return <File {...props} style={{ color: 'var(--pv-neutral-grey-400)' }} />
  }
}

export function ExtBadge({ name }) {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return null
  const ext = name.slice(dot + 1).toLowerCase()
  const colors = EXT_BADGE_COLORS[ext]
  if (!colors) return null

  return (
    <span
      className="shrink-0 text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded tracking-wide"
      style={{ background: colors.bg, color: colors.text }}
    >
      {ext}
    </span>
  )
}
