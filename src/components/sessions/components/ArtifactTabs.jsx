import { useRef, useEffect, useCallback } from "react";
import { Globe, Table2, Image, FileText, File, X } from "lucide-react";
import { Button, Tooltip } from "@/common-components";
import { getFileIcon } from "../utils/fileTypes";

function TabIcon({ type }) {
  const icon = getFileIcon(type);
  const size = 11;
  switch (icon) {
    case "globe":
      return <Globe size={size} />;
    case "table":
      return <Table2 size={size} />;
    case "image":
      return <Image size={size} />;
    case "doc":
      return <FileText size={size} />;
    default:
      return <File size={size} />;
  }
}

export default function ArtifactTabs({ tabs, activeTabId, onSelectTab, onCloseTab, inline = false }) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const tabRefs = useRef({});

  const updateScrollIndicators = useCallback(() => {
    const el = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    const canScrollLeft = el.scrollLeft > 0;
    const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;

    wrapper.classList.toggle("can-scroll-left", canScrollLeft);
    wrapper.classList.toggle("can-scroll-right", canScrollRight);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollIndicators();
    el.addEventListener("scroll", updateScrollIndicators);
    window.addEventListener("resize", updateScrollIndicators);

    return () => {
      el.removeEventListener("scroll", updateScrollIndicators);
      window.removeEventListener("resize", updateScrollIndicators);
    };
  }, [updateScrollIndicators]);

  useEffect(() => {
    updateScrollIndicators();
  }, [tabs, updateScrollIndicators]);

  useEffect(() => {
    if (!activeTabId) return;
    const tabEl = tabRefs.current[activeTabId];
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: "instant", block: "nearest", inline: "nearest" });
    }
  }, [activeTabId, tabs.length]);

  if (!tabs || tabs.length === 0) return null;

  const tabsContent = (
    <div ref={containerRef} className="s-artifact-tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            className={`s-artifact-tab${isActive ? " s-artifact-tab--active" : ""}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <Tooltip title={tab.title} placement="top">
              <span className="s-artifact-tab__content">
                <span className="s-artifact-tab__icon">
                  <TabIcon type={tab.contentType} />
                </span>
                <span className="s-artifact-tab__title">{tab.title}</span>
              </span>
            </Tooltip>
            {tabs.length > 1 && (
              <Button
                btnColor="transparent"
                btnSize="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                mainBtnClassName="p-1"
              >
                <X size={12} />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );

  if (inline) {
    return (
      <div ref={wrapperRef} className="s-artifact-panel__tabs-inline">
        {tabsContent}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="s-artifact-panel__tabs-bar">
      {tabsContent}
    </div>
  );
}
