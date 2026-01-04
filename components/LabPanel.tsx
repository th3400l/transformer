import React from 'react';
import FontSelector from './FontSelector';
import { IFontManager } from '../types/fonts';
import { DistortionLevel, InkColorOption } from '../app/constants';
import { ICustomFontUploadManager } from '../types/customFontUpload';
import { RoseSpinner } from './Spinner';

interface LabPanelProps {
  text: string;
  onTextChange: (value: string) => void;
  fontManager: IFontManager | null;
  selectedFontId: string;
  onFontChange: (fontId: string, fontFamily: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  inkColors: InkColorOption[];
  inkColor: string;
  setInkColor: (color: string) => void;
  inkBoldness: number;
  setInkBoldness: (boldness: number) => void;
  isInkMenuOpen: boolean;
  setIsInkMenuOpen: (open: boolean) => void;
  inkMenuRef: React.RefObject<HTMLDivElement>;
  paperDistortionLevel: DistortionLevel;
  onPaperDistortionChange: (level: DistortionLevel) => void;
  customFontUploadManager: ICustomFontUploadManager | null;
  currentCustomFontsCount: number;
  onOpenCustomFontDialog: () => void;
  onGenerateImages: () => Promise<void> | void;
  isGenerating: boolean;
  exportProgress: string;
  showPageLimitWarning: boolean;
  textCutoffSnippet: string | null;
  isDisabled?: boolean;
}

const LabPanel: React.FC<LabPanelProps> = ({
  text,
  onTextChange,
  fontManager,
  selectedFontId,
  onFontChange,
  fontSize,
  onFontSizeChange,
  inkColors,
  inkColor,
  setInkColor,
  inkBoldness,
  setInkBoldness,
  isInkMenuOpen,
  setIsInkMenuOpen,
  inkMenuRef,
  paperDistortionLevel,
  onPaperDistortionChange,
  customFontUploadManager,
  currentCustomFontsCount,
  onOpenCustomFontDialog,
  onGenerateImages,
  isGenerating,
  exportProgress,
  showPageLimitWarning,
  textCutoffSnippet,
  isDisabled = false,
}) => {
  return (
    <section
      className="w-full bg-panel-bg border border-panel-border rounded-xl shadow-lg p-4 flex flex-col gap-4 max-h-[calc(100vh-8rem)] relative transition-opacity duration-300"
      role="form"
      aria-labelledby="controls-heading"
    >
      {/* Overlay removed to allow continuous typing */}

      <div className="flex justify-between items-center border-b border-panel-border pb-2 flex-shrink-0">
        <h2 id="controls-heading" className="text-lg font-bold text-text">The Lab</h2>
        <div className="flex items-center gap-2" role="status" aria-label="Application status">
          <span className="text-xs font-medium text-text-muted">v1.4</span>
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-grow flex flex-col gap-4">
        {/* Text Input Section */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex justify-between items-center">
            <label htmlFor="text-input" className="block text-xs font-semibold text-text uppercase tracking-wider">
              Content
            </label>
            {textCutoffSnippet && (
              <span className="text-[10px] text-red-500 font-medium animate-pulse">
                Over 2 pages
              </span>
            )}
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onTextChange(e.target.value)}
            // Do not disable input during preview updates to maintain focus
            placeholder="Type your text here..."
            className={`w-full h-32 bg-control-bg border ${textCutoffSnippet ? 'border-red-300 focus:ring-red-400' : 'border-control-border focus:ring-accent'} text-text rounded-lg p-3 focus:ring-2 focus:outline-none transition resize-none text-sm leading-relaxed disabled:opacity-50 disabled:cursor-wait`}
            aria-label="Text input for handwriting conversion"
          />
          {textCutoffSnippet && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 dark:bg-red-900/10 dark:text-red-300 dark:border-red-900/30">
              <span className="font-semibold">Cut from:</span> {textCutoffSnippet}
            </div>
          )}
        </div>

        <div className="h-px bg-panel-border flex-shrink-0" />

        {/* Styling Section */}
        <div className="space-y-2 flex-shrink-0">
          <h3 className="text-xs font-semibold text-text uppercase tracking-wider">Style</h3>

          {/* Font Selector */}
          <div data-tour-id="font-selector">
            <FontSelector
              fontManager={fontManager}
              selectedFontId={selectedFontId}
              onFontChange={onFontChange}
            />
          </div>

          <div className="flex flex-col gap-2">
            {/* Font Size */}
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="font-size" className="text-xs font-medium text-text-muted">Size</label>
                <span className="text-[10px] text-text-muted">{fontSize}px</span>
              </div>
              <input
                id="font-size"
                type="range"
                min="12"
                max="48"
                step="1"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-panel-border rounded-lg appearance-none cursor-pointer accent-accent"
                aria-label="Adjust font size"
              />
            </div>

            {/* Ink Color Selector */}
            <div ref={inkMenuRef} className="relative">
              <label htmlFor="ink-menu-trigger" className="block text-xs font-medium text-text-muted mb-1">Ink Color</label>
              <button
                id="ink-menu-trigger"
                data-tour-id="ink-selector"
                type="button"
                onClick={() => setIsInkMenuOpen(!isInkMenuOpen)}
                className={`relative w-full bg-panel-bg border border-panel-border/80 text-text rounded-lg px-3 py-2 pr-10 text-left flex items-center focus:outline-none focus:ring-2 focus:ring-accent transition ${isInkMenuOpen ? 'shadow-lg' : 'shadow-sm'}`}
                aria-haspopup="listbox"
                aria-expanded={isInkMenuOpen}
              >
                <span className="truncate pr-4 text-sm">{inkColors.find(color => color.value === inkColor)?.name || 'Select ink'}</span>
                <svg
                  className={`pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted transition-transform ${isInkMenuOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {isInkMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Ink colours"
                  className="absolute z-20 mt-1 w-full rounded-lg border border-panel-border/80 bg-panel-bg shadow-xl overflow-hidden"
                >
                  {inkColors.map(color => (
                    <button
                      key={color.name}
                      type="button"
                      role="option"
                      aria-selected={inkColor === color.value}
                      onClick={() => {
                        setInkColor(color.value);
                        setIsInkMenuOpen(false);
                      }}
                      className={`w-full flex justify-between items-center px-3 py-2 text-xs transition-colors ${inkColor === color.value
                        ? 'bg-accent/90 text-white'
                        : 'text-text hover:bg-control-bg/70'
                        }`}
                    >
                      <span>{color.name}</span>
                      <span
                        className="ml-2 h-3 w-3 rounded-full border border-panel-border"
                        style={{ background: color.value }}
                        aria-hidden="true"
                      ></span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ink Boldness */}
            {setInkBoldness && (
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="ink-boldness" className="text-xs font-medium text-text-muted">Ink Boldness</label>
                  <span className="text-[10px] text-text-muted">{inkBoldness.toFixed(1)}x</span>
                </div>
                <input
                  id="ink-boldness"
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={inkBoldness}
                  onChange={(e) => setInkBoldness(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-panel-border rounded-lg appearance-none cursor-pointer accent-accent"
                  aria-label="Adjust ink boldness"
                />
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-panel-border flex-shrink-0" />

        {/* Paper Section */}
        <div className="space-y-2 flex-shrink-0" data-tour-id="template-selector">
          <label className="block text-xs font-semibold text-text uppercase tracking-wider">
            Paper
          </label>


          {/* Paper Distortion */}
          <div className="mt-2">
            <div className="flex justify-between mb-1">
              <label htmlFor="paper-distortion" className="text-xs font-medium text-text-muted">Paper Realism</label>
              <span className="text-[10px] text-text-muted">Lv. {paperDistortionLevel}</span>
            </div>
            <input
              id="paper-distortion"
              type="range"
              min="1"
              max="5"
              step="1"
              value={paperDistortionLevel}
              onChange={(e) => onPaperDistortionChange(Number(e.target.value) as DistortionLevel)}
              className="w-full h-1.5 bg-panel-border rounded-lg appearance-none cursor-pointer accent-accent"
              aria-label="Adjust paper realism level"
            />
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-[9px] text-text-muted">Ultra</span>
              <span className="text-[9px] text-text-muted">High</span>
              <span className="text-[9px] text-text-muted">Low</span>
            </div>
          </div>
        </div>

        <div className="border-t border-panel-border pt-4 flex flex-col gap-2 mt-auto flex-shrink-0">
          <button
            onClick={onOpenCustomFontDialog}
            disabled={!customFontUploadManager}
            className={`w-full text-center bg-transparent border border-accent text-accent font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-300 hover:bg-accent hover:text-white hover:shadow-md ${!customFontUploadManager ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            aria-label={`Manage custom fonts. ${currentCustomFontsCount} of 2 fonts uploaded.`}
          >
            {currentCustomFontsCount === 0
              ? 'Upload Custom Font'
              : 'Manage Custom Fonts'}
          </button>
          <button
            data-tour-id="generate-button"
            onClick={onGenerateImages}
            disabled={isGenerating}
            className={`w-full text-center font-bold py-2.5 px-3 rounded-lg text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${isGenerating
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-accent to-pink-600 text-white'
              }`}
          >
            {isGenerating ? 'Generating...' : 'Generate Images'}
          </button>

          {/* Export Progress */}
          {exportProgress && (
            <div className={`text-xs text-center p-1.5 rounded-lg animate-pulse ${showPageLimitWarning
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
              {exportProgress}
            </div>
          )}
        </div>
      </div> {/* Closes scrollable wrapper div (from line 17) */}
    </section>
  );
};

export default LabPanel;
