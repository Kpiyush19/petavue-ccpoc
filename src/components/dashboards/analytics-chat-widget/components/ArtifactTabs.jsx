import { Globe, Table2, Image, FileText, File, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { getFileIcon } from '../utils/fileTypes';

function TabIcon({ type }) {
  const icon = getFileIcon(type);
  const size = 11;
  switch (icon) {
    case 'globe':
      return <Globe size={size} />;
    case 'table':
      return <Table2 size={size} />;
    case 'image':
      return <Image size={size} />;
    case 'doc':
      return <FileText size={size} />;
    default:
      return <File size={size} />;
  }
}

export default function ArtifactTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}) {
  return (
    <div className="artifact-tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={cn('artifact-tab', isActive && 'artifact-tab--active')}
            onClick={() => onSelectTab(tab.id)}
          >
            <span className="artifact-tab__icon">
              <TabIcon type={tab.contentType} />
            </span>
            <span className="artifact-tab__title">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="artifact-tab__close"
            >
              <X size={8} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
