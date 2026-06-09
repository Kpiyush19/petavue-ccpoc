export function formatFileSize(bytes) {
  if (bytes == null || bytes === 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFolderIcon(dirName) {
  const name = dirName?.toLowerCase() || ''
  switch (name) {
    case 'output':
    case 'outputs':
    case 'dist':
    case 'build':
      return 'file-output'
    case 'uploads':
    case 'upload':
      return 'upload'
    case 'widgets':
    case 'components':
      return 'chart'
    case 'scripts':
    case 'src':
    case 'lib':
    case 'code':
      return 'code'
    case 'catalog':
    case 'docs':
    case 'context':
    case 'documentation':
      return 'book'
    case 'data':
    case 'db':
    case 'database':
      return 'database'
    default:
      return 'folder'
  }
}

export function getFileIcon(contentType) {
  switch (contentType) {
    case 'html':
      return 'globe'
    case 'csv':
    case 'jsonl':
    case 'json':
    case 'xlsx':
      return 'table'
    case 'image':
      return 'image'
    case 'markdown':
    case 'text':
      return 'doc'
    default:
      return 'file'
  }
}

export function inferContentType(fileName) {
  if (!fileName) return 'text'
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html'
    case 'csv':
      return 'csv'
    case 'json':
      return 'json'
    case 'jsonl':
      return 'jsonl'
    case 'xlsx':
    case 'xls':
      return 'xlsx'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return 'image'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'py':
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
      return 'code'
    default:
      return 'text'
  }
}
