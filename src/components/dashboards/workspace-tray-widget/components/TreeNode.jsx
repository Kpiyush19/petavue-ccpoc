import { ChevronRight } from 'lucide-react';
import { Tooltip } from '@/ui';
import { cn } from '../utils/cn';
import { formatFileSize } from '../utils/fileTypes';
import { FolderIconSvg, FileIconSvg, ExtBadge } from './FileIcons';

export function TreeNode({
  node,
  depth,
  expandedDirs,
  onToggleDir,
  onFileClick,
}) {
  const isDir = node.type === 'directory';
  const isExpanded = expandedDirs.has(node.path);
  const indent = depth * 16;

  if (isDir) {
    const fileCount = node.children
      ? node.children.filter((c) => c.type === 'file').length
      : 0;

    return (
      <div className="relative">
        {depth > 0 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-[var(--border-primary)]"
            style={{ left: `${11 + (depth - 1) * 16}px` }}
          />
        )}

        <button
          type="button"
          onClick={() => onToggleDir(node.path)}
          className="w-full flex items-center gap-1.5 pr-2 py-1.5 text-left bg-transparent border-none cursor-pointer rounded-lg hover:bg-[var(--color-grey-50)] transition-all duration-150 group outline-none"
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          <ChevronRight
            size={8}
            className={cn(
              'shrink-0 text-[var(--text-muted)] transition-transform duration-150 group-hover:text-[var(--text-secondary)]',
              isExpanded && 'rotate-90'
            )}
          />
          <span className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <FolderIconSvg dirName={node.name} />
          </span>
          <Tooltip title={node.name} placement="top" displayTooltipOnOverflow>
            <span className="text-[12px] text-[var(--text-primary)] font-semibold truncate flex-1 min-w-0 tracking-tight">
              {node.name}
            </span>
          </Tooltip>
          {fileCount > 0 && (
            <span className="shrink-0 text-[10px] text-[var(--text-muted)] bg-[var(--bg-hover)] rounded-full px-1.5 py-px font-mono">
              {fileCount}
            </span>
          )}
        </button>

        {isExpanded && node.children && (
          <div className="relative">
            <div
              className="absolute top-0 bottom-2 w-px bg-[var(--border-primary)]"
              style={{ left: `${11 + depth * 16}px` }}
            />
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedDirs={expandedDirs}
                onToggleDir={onToggleDir}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const fileSize = formatFileSize(node.size);

  return (
    <div className="relative">
      {depth > 0 && (
        <div
          className="absolute top-1/2 h-px bg-[var(--border-primary)]"
          style={{ left: `${11 + (depth - 1) * 16}px`, width: '8px' }}
        />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFileClick(node);
        }}
        className="w-full flex items-center gap-1.5 pr-2 py-[5px] text-left border-none cursor-pointer rounded-lg transition-all duration-150 group outline-none bg-transparent hover:bg-grey-50"
        style={{ paddingLeft: `${22 + indent}px` }}
      >
        <span className="shrink-0">
          <FileIconSvg contentType={node.content_type} />
        </span>
        <Tooltip title={`${node.path}${fileSize ? ` • ${fileSize}` : ''}`} placement="top" displayTooltipOnOverflow>
          <span className="text-[12px] truncate flex-1 min-w-0 text-[var(--text-primary)]">
            {node.name}
          </span>
        </Tooltip>
        <ExtBadge name={node.name} />
      </button>
    </div>
  );
}
