import React, { useEffect, useRef, useState } from 'react';
import { useMobileTouchOptimization } from '../hooks/useMobileTouchOptimization';
import { Button } from './Button';

type DistortionLevel = 1 | 2 | 3 | 4 | 5;

interface DockDistortionProfile {
  description: string;
}

interface BottomControlDockProps {
  isOpen: boolean;
  onToggle: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  inkBoldness: number;
  onInkBoldnessChange: (value: number) => void;
  paperDistortionLevel: DistortionLevel;
  onPaperDistortionChange: (level: DistortionLevel) => void;
  distortionProfile: DockDistortionProfile;
}

const BottomControlDock: React.FC<BottomControlDockProps> = ({
  isOpen,
  onToggle,
  fontSize,
  onFontSizeChange,
  inkBoldness,
  onInkBoldnessChange,
  paperDistortionLevel,
  onPaperDistortionChange,
  distortionProfile
}) => {
  const [expandedSection, setExpandedSection] = useState<'font' | 'ink' | 'paper' | null>('font');
  const dockButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Apply mobile touch optimizations
  useMobileTouchOptimization(dockButtonRef, {
    enableFeedback: true,
    feedbackOptions: { ripple: true, scale: 0.95 }
  });

  useMobileTouchOptimization(panelRef, {
    enableFeedback: false,
    optimizeChildren: true
  });

  const toggleSection = (section: 'font' | 'ink' | 'paper') => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const renderCaret = (isExpanded: boolean) => (
    <svg
      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );

  // Horizontal drag position for the dock trigger (in pixels from left)
  const [dockX, setDockX] = useState<number>(() => (typeof window !== 'undefined' ? window.innerWidth / 2 : 240));
  const draggingRef = useRef<{ startX: number; startDockX: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Initialize to center on mount
    setDockX(window.innerWidth / 2);
    const onResize = () => setDockX((prev) => Math.max(40, Math.min(window.innerWidth - 40, prev)));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const beginDrag = (clientX: number) => {
    draggingRef.current = { startX: clientX, startDockX: dockX, moved: false };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endDrag, { once: true });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    beginDrag(e.clientX);
  };

  const onPointerMove = (e: PointerEvent) => {
    const s = draggingRef.current;
    if (!s) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 6) s.moved = true;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 480;
    const next = Math.max(40, Math.min(vw - 40, s.startDockX + dx));
    setDockX(next);
  };

  const endDrag = (e: PointerEvent) => {
    const s = draggingRef.current;
    draggingRef.current = null;
    document.removeEventListener('pointermove', onPointerMove);
    // If not moved significantly, treat as a click to toggle
    if (!s || !s.moved) onToggle();
  };

  const containerStyle: React.CSSProperties = {
    left: dockX,
    transform: 'translateX(-50%)',
  };

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] z-[90] pointer-events-none flex flex-col items-center" style={containerStyle}>
      <div
        id="control-dock-panel"
        ref={panelRef}
        className={`pointer-events-auto mb-3 w-full max-w-md transition-all duration-300 ease-out origin-bottom ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
        aria-hidden={!isOpen}
      >
        <div className="bg-panel-bg border border-panel-border rounded-xl shadow-2xl p-4 space-y-3 text-text">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-text-muted">
            <span>Advanced Controls</span>
            <span>Tap to expand</span>
          </div>

          <div className="space-y-2">
            <div className="border border-panel-border/70 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('font')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text bg-control-bg/60 hover:bg-control-bg/80 transition"
                aria-expanded={expandedSection === 'font'}
                aria-controls="dock-font-size"
              >
                <span>Font Size</span>
                {renderCaret(expandedSection === 'font')}
              </button>
              <div
                id="dock-font-size"
                className={`px-4 transition-all duration-300 ease-out overflow-hidden ${expandedSection === 'font' ? 'max-h-60 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
              >
                <label htmlFor="dock-font-size-slider" className="block text-xs text-text-muted mb-3 uppercase tracking-wide">
                  Active Size: <span className="text-accent font-semibold">{fontSize}px</span>
                </label>
                <input
                  id="dock-font-size-slider"
                  type="range"
                  min={12}
                  max={48}
                  step={1}
                  value={fontSize}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => onFontSizeChange(Number(event.target.value))}
                  className="w-full cursor-pointer"
                  aria-label="Adjust handwriting font size"
                />
                <div className="mt-3 flex justify-between text-xs text-text-muted">
                  <span>12 px</span>
                  <span>48 px</span>
                </div>
              </div>
            </div>

            <div className="border border-panel-border/70 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('ink')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text bg-control-bg/60 hover:bg-control-bg/80 transition"
                aria-expanded={expandedSection === 'ink'}
                aria-controls="dock-ink-weight"
              >
                <div className="flex items-center">
                  <span>Ink Weight</span>
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-accent text-white">
                    Beta
                  </span>
                </div>
                {renderCaret(expandedSection === 'ink')}
              </button>
              <div
                id="dock-ink-weight"
                className={`px-4 transition-all duration-300 ease-out overflow-hidden ${expandedSection === 'ink' ? 'max-h-60 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
              >
                <label htmlFor="dock-ink-weight-slider" className="block text-xs text-text-muted mb-3 uppercase tracking-wide">
                  {Math.round(inkBoldness * 100)}% • {inkBoldness < 0.5 ? 'Lighter' : inkBoldness > 0.5 ? 'Bolder' : 'Baseline'}
                </label>
                <input
                  id="dock-ink-weight-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(inkBoldness * 100)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => onInkBoldnessChange((Number(event.target.value) || 0) / 100)}
                  className="w-full cursor-pointer"
                  aria-label="Adjust ink weight (light ↔ bold)"
                />
                <div className="mt-3 flex justify-between text-xs text-text-muted">
                  <span>Lighter</span>
                  <span>Baseline</span>
                  <span>Bolder</span>
                </div>
              </div>
            </div>

            <div className="border border-panel-border/70 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('paper')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text bg-control-bg/60 hover:bg-control-bg/80 transition"
                aria-expanded={expandedSection === 'paper'}
                aria-controls="dock-paper-distortion"
              >
                <span>Paper Realism</span>
                {renderCaret(expandedSection === 'paper')}
              </button>
              <div
                id="dock-paper-distortion"
                className={`px-4 transition-all duration-300 ease-out overflow-hidden ${expandedSection === 'paper' ? 'max-h-72 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
              >
                <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wide text-text-muted">
                  <span>Distortion Level</span>
                  <span>Lv. {paperDistortionLevel}</span>
                </div>
                <input
                  id="dock-paper-distortion-slider"
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={paperDistortionLevel}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => onPaperDistortionChange(Number(event.target.value) as DistortionLevel)}
                  className="w-full cursor-pointer"
                  aria-label="Adjust paper distortion level"
                />
                <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <span
                      key={level}
                      className={`flex-1 text-center px-1 py-1 rounded-full border transition-colors ${paperDistortionLevel === level
                          ? 'border-accent text-accent bg-control-bg/80'
                          : 'border-transparent text-text-muted opacity-70'
                        }`}
                    >
                      {level === 1 ? 'Ultra' : level === 2 ? 'Extreme' : level === 3 ? 'High' : level === 4 ? 'Med' : 'Low'}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-text-muted leading-relaxed">
                  {distortionProfile.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="secondary"
        data-tour-id="controls-button"
        type="button"
        ref={(el) => {
          // Handle both refs
          (dockButtonRef as any).current = el;
        }}
        onPointerDown={onPointerDown}
        className="pointer-events-auto shadow-lg hover:shadow-xl rounded-full px-4 py-2 gap-2 active:scale-95 min-h-[44px]"
        aria-expanded={isOpen}
        aria-controls="control-dock-panel"
      >
        <span className="text-sm font-medium">Controls</span>
        <svg
          className="w-4 h-4 transition-transform"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 15.75l-7.5-7.5-7.5 7.5" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 8.25l7.5 7.5 7.5-7.5" />
          )}
        </svg>
      </Button>
    </div>
  );
};

export default BottomControlDock;
