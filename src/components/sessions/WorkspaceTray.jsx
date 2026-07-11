import { useState, useEffect } from 'react'
import { ArrowsClockwise, MagnifyingGlass, X } from '@phosphor-icons/react'
import { Button, Input, Tooltip } from '@/ui'
import spinner from '@/ui/assets/spinner.gif'
import TreeNode from './components/TreeNode'

function DefaultLoader({ src = spinner, alt = 'loading', className }) {
  return <img src={src} alt={alt} className={className} />
}

export default function WorkspaceTray({
  fileTree,
  expandedDirs,
  loading,
  searchQuery,
  activeFilePath,
  onToggleDir,
  onFileClick,
  onSearchChange,
  onRefresh,
  onClose,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [localQuery, setLocalQuery] = useState(searchQuery)

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    if (!onSearchChange) return
    const timer = setTimeout(() => {
      onSearchChange(localQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [localQuery, onSearchChange])

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const totalFiles = fileTree.reduce((acc, n) => {
    if (n.type === 'file') return acc + 1
    return acc + (n.children ? n.children.filter((c) => c.type === 'file').length : 0)
  }, 0)

  const renderLoader = (size = 'w-3.5 h-3.5') => (
    <DefaultLoader src={spinner} alt="loading" className={size} />
  )

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.12em]">
            Files
          </span>
          {totalFiles > 0 && (
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-hover)] rounded-full px-1.5 py-px font-mono">
              {totalFiles}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {onRefresh && (
            <Tooltip title="Refresh files" placement="bottom">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className="!p-1 !min-w-0 w-6 h-6"
                aria-label="Refresh files"
              >
                {loading || isRefreshing ? (
                  renderLoader()
                ) : (
                  <ArrowsClockwise
                    size={14}
                    weight="bold"
                    className="text-[var(--color-text-secondary)]"
                  />
                )}
              </Button>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip title="Close panel" placement="bottom">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="!p-1 !min-w-0 w-6 h-6"
                aria-label="Close panel"
              >
                <X size={14} weight="bold" className="text-[var(--color-text-secondary)]" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {onSearchChange && (
        <div className="px-2.5 py-2">
          <Input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search files..."
            showClearInput
            leftElem={<MagnifyingGlass size={14} className="text-grey-400" />}
            className={{
              input: {
                wrapper: 'py-2 px-3',
                root: 'text-xs',
              },
            }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {loading && fileTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            {renderLoader('w-5 h-5')}
            <span className="text-[10px] text-[var(--text-muted)]">Loading...</span>
          </div>
        ) : fileTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-3 px-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.5"
              >
                <path d="M2 3a1 1 0 011-1h4l2 2h4a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
              </svg>
            </div>
            <div>
              <div className="text-[12px] text-[var(--text-secondary)] font-medium">
                No files yet
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Files will appear as the agent works
              </div>
            </div>
          </div>
        ) : (
          fileTree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              expandedDirs={expandedDirs}
              activeFilePath={activeFilePath}
              onToggleDir={onToggleDir}
              onFileClick={onFileClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
