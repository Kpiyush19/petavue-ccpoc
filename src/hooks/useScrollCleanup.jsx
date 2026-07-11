import { useCallback, useEffect, useState } from "react";

export const useScrollCleanup = ({ containerRef, enabled = true }) => {
  const [tooltipShow, setTooltipShow] = useState(true);

  const handler = useCallback(() => {
    setTooltipShow(false);
  }, []);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el || !enabled) return;

    el.addEventListener("scroll", handler, { once: true });

    return () => {
      el.removeEventListener("scroll", handler);
    };
  }, [tooltipShow, enabled, handler]);

  return { tooltipShow, setTooltipShow };
};
