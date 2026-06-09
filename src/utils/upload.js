// Upload constants — single source of truth for all upload components
export const MAX_FILES = 10
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024)
export const ALLOWED_EXTENSIONS = '.csv,.xlsx,.png,.jpg,.jpeg,.json,.jsonl,.txt,.pdf,.md,.markdown'
export const ALLOWED_SET = new Set(ALLOWED_EXTENSIONS.split(','))
