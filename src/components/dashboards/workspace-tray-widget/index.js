export { default as WorkspaceTray } from './index.jsx';
export { default } from './index.jsx';

export { WorkspaceTray as WorkspaceTrayComponent } from './components/WorkspaceTray';
export { TreeNode } from './components/TreeNode';
export { FolderIconSvg, FileIconSvg, ExtBadge } from './components/FileIcons';

export { useWorkspaceTray } from './hooks/useWorkspaceTray';
export { useGetWorkspaceFiles } from './api';

export { cn } from './utils/cn';
export {
  formatFileSize,
  getFolderIcon,
  inferContentType,
} from './utils/fileTypes';
