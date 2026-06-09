import { forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { useWorkspaceTray } from './hooks/useWorkspaceTray';
import { WorkspaceTray as TrayComponent } from './components/WorkspaceTray';

const WorkspaceTray = forwardRef(function WorkspaceTray(
  {
    fetchFiles: fetchFilesProp,
    autoFetch = false,
    files: externalFiles,
    loading: externalLoading,
    onRefresh: externalRefresh,
    onFileClick,
    showHeader = true,
    title = 'Files',
    className = '',
    ButtonComponent,
    loaderSrc,
  },
  ref
) {
  const tray = useWorkspaceTray(externalFiles);

  const isLoading =
    externalLoading !== undefined ? externalLoading : tray.loading;

  const doFetch = useCallback(() => {
    if (fetchFilesProp) {
      tray.fetchFiles(fetchFilesProp);
    }
  }, [fetchFilesProp, tray.fetchFiles]);

  const handleRefresh = externalRefresh || doFetch;

  useEffect(() => {
    if (autoFetch && fetchFilesProp && !externalFiles) {
      doFetch();
    }
  }, [autoFetch]); // eslint-disable-line

  useImperativeHandle(
    ref,
    () => ({
      refresh: handleRefresh,
      reset: tray.reset,
    }),
    [handleRefresh, tray.reset]
  );

  return (
    <div className={`workspace-tray-widget ${className}`}>
      <TrayComponent
        title={title}
        showHeader={showHeader}
        fileTree={tray.fileTree}
        expandedDirs={tray.expandedDirs}
        loading={isLoading}
        searchQuery={tray.searchQuery}
        onToggleDir={tray.toggleDir}
        onFileClick={onFileClick}
        onSearchChange={tray.setSearchQuery}
        onRefresh={handleRefresh}
        ButtonComponent={ButtonComponent}
        loaderSrc={loaderSrc}
      />
    </div>
  );
});

export default WorkspaceTray;

export { useWorkspaceTray } from './hooks/useWorkspaceTray';
export { useGetWorkspaceFiles } from './api';
export { WorkspaceTray as WorkspaceTrayComponent } from './components/WorkspaceTray';
export { TreeNode } from './components/TreeNode';
export { FolderIconSvg, FileIconSvg, ExtBadge } from './components/FileIcons';
export { cn } from './utils/cn';
export {
  formatFileSize,
  getFolderIcon,
  inferContentType,
} from './utils/fileTypes';
