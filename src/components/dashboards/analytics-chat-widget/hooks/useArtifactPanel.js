import { useState, useCallback } from 'react';

const DEFAULT_PERCENT = 50;
const MIN_PERCENT = 30;
const MAX_PERCENT = 70;

export function useArtifactPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [panelPercent, setPanelPercentState] = useState(DEFAULT_PERCENT);

  const openArtifact = useCallback(
    ({ path, title, contentType, source = 'output' }) => {
      setTabs((prev) => {
        const existing = prev.find((t) => t.path === path);
        if (existing) {
          setActiveTabId(existing.id);
          return prev;
        }
        const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newTab = {
          id,
          title: title || path.split('/').pop(),
          path,
          contentType,
          source,
        };
        setActiveTabId(id);
        return [...prev, newTab];
      });
      setIsOpen(true);
    },
    []
  );

  const closeTab = useCallback((tabId) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (next.length === 0) {
        setIsOpen(false);
        setActiveTabId(null);
      } else {
        setActiveTabId((current) => {
          if (current === tabId) {
            const idx = prev.findIndex((t) => t.id === tabId);
            return next[Math.min(idx, next.length - 1)]?.id || null;
          }
          return current;
        });
      }
      return next;
    });
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && tabs.length === 0) return false;
      return !prev;
    });
  }, [tabs]);

  const setPanelPercent = useCallback((percent) => {
    const clamped = Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, percent));
    setPanelPercentState(clamped);
  }, []);

  const reset = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
    setIsOpen(false);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  return {
    isOpen,
    tabs,
    activeTabId,
    activeTab,
    panelPercent,
    openArtifact,
    closeTab,
    setActiveTab: setActiveTabId,
    closePanel,
    togglePanel,
    setPanelPercent,
    reset,
  };
}
