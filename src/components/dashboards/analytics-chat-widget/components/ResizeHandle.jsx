import { useCallback, useRef, useState } from 'react';

function rafThrottle(fn) {
  let rafId = null;
  let lastArgs = null;

  const throttled = (...args) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs);
        rafId = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
}

export default function ResizeHandle({ onResize }) {
  const handleRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const updateSize = rafThrottle((clientX) => {
      if (!handleRef.current) return;
      const container = handleRef.current.closest('.analytics-chat');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = 100 - (x / rect.width) * 100;
      onResize(percent);
    });

    const onPointerMove = (e) => {
      updateSize(e.clientX);
    };

    const cleanup = (e) => {
      updateSize.cancel();
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {}
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', cleanup);
      target.removeEventListener('pointercancel', cleanup);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', cleanup);
    target.addEventListener('pointercancel', cleanup);
  }, [onResize]);

  return (
    <div
      ref={handleRef}
      className={`resize-handle ${isDragging ? 'resize-handle--active' : ''}`}
      onPointerDown={onPointerDown}
    />
  );
}
