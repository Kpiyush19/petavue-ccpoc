const EXT_TO_TYPE = {
  '.html': 'html',
  '.htm': 'html',
  '.csv': 'csv',
  '.json': 'json',
  '.jsonl': 'jsonl',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.gif': 'image',
  '.xlsx': 'xlsx',
  '.txt': 'text',
  '.py': 'text',
  '.sql': 'text',
  '.log': 'text',
};

export function inferContentType(path) {
  const dot = path.lastIndexOf('.');
  if (dot < 0) return 'unknown';
  const ext = path.slice(dot).toLowerCase();
  return EXT_TO_TYPE[ext] || 'unknown';
}

export function getFileIcon(type) {
  switch (type) {
    case 'html':
      return 'globe';
    case 'csv':
    case 'jsonl':
    case 'json':
    case 'xlsx':
      return 'table';
    case 'image':
      return 'image';
    case 'markdown':
    case 'text':
      return 'doc';
    default:
      return 'file';
  }
}

export function formatFileSize(bytes) {
  if (bytes === 0 || bytes == null) return '-';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
