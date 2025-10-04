import React, { useEffect, useMemo, useState } from 'react';

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TourStep {
  selector: string; // CSS selector or [data-tour-id="..."]
  title?: string;
  content: string;
  placement?: Placement;
}

interface TourProps {
  steps: TourStep[];
  current: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export const Tour: React.FC<TourProps> = ({ steps, current, onNext, onPrev, onSkip, onFinish }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[current];

  const target = useMemo(() => {
    if (!step) return null;
    try {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      return el || null;
    } catch {
      return null;
    }
  }, [step]);

  const updateRect = () => {
    if (!target) {
      setRect(null);
      return;
    }
    const r = target.getBoundingClientRect();
    setRect(r);
  };

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [target]);

  if (!step) return null;

  const position: Placement = step.placement || 'auto';
  const viewportPadding = 12;
  const style: React.CSSProperties = { position: 'fixed' };

  if (rect) {
    // Decide placement
    let place: Placement = position;
    if (place === 'auto') {
      // Prefer bottom, else top, else right, else left
      if (rect.bottom + 160 < window.innerHeight) place = 'bottom';
      else if (rect.top - 160 > 0) place = 'top';
      else if (rect.right + 280 < window.innerWidth) place = 'right';
      else place = 'left';
    }
    const preferredWidth = Math.min(320, Math.max(260, window.innerWidth - 2 * viewportPadding));
    style.width = preferredWidth;
    switch (place) {
      case 'bottom':
        style.top = Math.min(rect.bottom + 8, window.innerHeight - viewportPadding);
        style.left = Math.min(Math.max(rect.left + rect.width / 2 - preferredWidth / 2, viewportPadding), window.innerWidth - preferredWidth - viewportPadding);
        break;
      case 'top':
        style.top = Math.max(rect.top - 8 - 140, viewportPadding);
        style.left = Math.min(Math.max(rect.left + rect.width / 2 - preferredWidth / 2, viewportPadding), window.innerWidth - preferredWidth - viewportPadding);
        break;
      case 'right':
        style.top = Math.min(Math.max(rect.top, viewportPadding), window.innerHeight - 140);
        style.left = Math.min(rect.right + 8, window.innerWidth - preferredWidth - viewportPadding);
        break;
      case 'left':
      default:
        style.top = Math.min(Math.max(rect.top, viewportPadding), window.innerHeight - 140);
        style.left = Math.max(rect.left - preferredWidth - 8, viewportPadding);
        break;
    }
  } else {
    // Center if target missing
    style.top = window.innerHeight / 2 - 80;
    style.left = window.innerWidth / 2 - 160;
    style.width = 320;
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop (no click-to-dismiss) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Highlight ring */}
      {rect && (
        <div
          className="pointer-events-none fixed border-2 border-[var(--accent-color)] rounded-lg"
          style={{
            top: Math.max(rect.top - 6, 0),
            left: Math.max(rect.left - 6, 0),
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
          }}
        />
      )}

      {/* Popover */}
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-2xl p-4 text-[var(--text-color)]" style={style} role="dialog" aria-live="polite">
        {step.title && <div className="text-sm font-semibold mb-1">{step.title}</div>}
        <div className="text-sm leading-relaxed">{step.content}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <button onClick={onSkip} className="px-3 py-1 rounded border border-[var(--panel-border)] text-[var(--text-muted)] hover:bg-[var(--control-bg)]">Skip</button>
          <div className="flex items-center gap-2">
            <button onClick={onPrev} disabled={current === 0} className={`px-3 py-1 rounded border border-[var(--panel-border)] ${current === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--control-bg)]'}`}>Back</button>
            {current < steps.length - 1 ? (
              <button onClick={onNext} className="px-3 py-1 rounded bg-[var(--accent-color)] text-white">Next</button>
            ) : (
              <button onClick={onFinish} className="px-3 py-1 rounded bg-[var(--accent-color)] text-white">Done</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tour;
