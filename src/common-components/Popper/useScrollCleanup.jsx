import { useCallback, useEffect, useState } from "react";

export const useScrollCleanup = ({ containerRef, enabled = true }) => {
  const [popperShow, setPopperShow] = useState(true);

  const handler = useCallback(() => {
    setPopperShow(false);
  }, []);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el || !enabled) return;

    el.addEventListener("scroll", handler, { once: true });

    return () => {
      el.removeEventListener("scroll", handler);
    };
  }, [popperShow, enabled, handler]);

  return { popperShow, setPopperShow };
};
