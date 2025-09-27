import React, { useState } from 'react';

type DistortionLevel = 1 | 2 | 3;

interface DockDistortionProfile {
  description: string;
}

interface BottomControlDockProps {
  isOpen: boolean;
  onToggle: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  paperDistortionLevel: DistortionLevel;
  onPaperDistortionChange: (level: DistortionLevel) => void;
  distortionProfile: DockDistortionProfile;
}

const BottomControlDock: React.FC<BottomControlDockProps> = ({
  isOpen,
  onToggle,
  fontSize,
  onFontSizeChange,
  paperDistortionLevel,
  onPaperDistortionChange,
  distortionProfile
}) => {
  const [expandedSection, setExpandedSection] = useState<'font' | 'paper' | null>('font');

  const toggleSection = (section: 'font' | 'paper') => {
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

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-[90] pointer-events-none px-4 flex flex-col items-center">
      <div
        id="control-dock-panel"
        className={`pointer-events-auto mb-3 w-full max-w-md transition-all duration-300 ease-out origin-bottom ${
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl shadow-2xl p-4 space-y-3 text-[var(--text-color)]">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <span>Advanced Controls</span>
            <span>Tap to expand</span>
          </div>

          <div className="space-y-2">
            <div className="border border-[var(--panel-border)]/70 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('font')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--text-color)] bg-[var(--control-bg)]/60 hover:bg-[var(--control-bg)]/80 transition"
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
                <label htmlFor="dock-font-size-slider" className="block text-xs text-[var(--text-muted)] mb-3 uppercase tracking-wide">
                  Active Size: <span className="text-[var(--accent-color)] font-semibold">{fontSize}px</span>
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
                <div className="mt-3 flex justify-between text-xs text-[var(--text-muted)]">
                  <span>12 px</span>
                  <span>48 px</span>
                </div>
              </div>
            </div>

            <div className="border border-[var(--panel-border)]/70 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('paper')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--text-color)] bg-[var(--control-bg)]/60 hover:bg-[var(--control-bg)]/80 transition"
                aria-expanded={expandedSection === 'paper'}
                aria-controls="dock-paper-distortion"
              >
                <span>Paper Texture</span>
                {renderCaret(expandedSection === 'paper')}
              </button>
              <div
                id="dock-paper-distortion"
                className={`px-4 transition-all duration-300 ease-out overflow-hidden ${expandedSection === 'paper' ? 'max-h-72 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
              >
                <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  <span>Distortion Level</span>
                  <span>Lv. {paperDistortionLevel}</span>
                </div>
                <input
                  id="dock-paper-distortion-slider"
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={paperDistortionLevel}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => onPaperDistortionChange(Number(event.target.value) as DistortionLevel)}
                  className="w-full cursor-pointer"
                  aria-label="Adjust paper distortion level"
                />
                <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-muted)] gap-1">
                  {[1, 2, 3].map(level => (
                    <span
                      key={level}
                      className={`flex-1 text-center px-2 py-1 rounded-full border transition-colors ${
                        paperDistortionLevel === level
                          ? 'border-[var(--accent-color)] text-[var(--accent-color)] bg-[var(--control-bg)]/80'
                          : 'border-transparent text-[var(--text-muted)] opacity-70'
                      }`}
                    >
                      {level === 1 ? 'High realism' : level === 2 ? 'Medium' : 'Low'}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-[var(--text-muted)] leading-relaxed">
                  {distortionProfile.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="pointer-events-auto bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text-color)] shadow-lg rounded-full px-4 py-2 flex items-center gap-2 transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
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
      </button>
    </div>
  );
};

export default BottomControlDock;


