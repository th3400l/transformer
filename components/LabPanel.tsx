import React, { useEffect } from 'react';
import FontSelector from './FontSelector';
import EnhancedPaperTemplateSelector from './EnhancedPaperTemplateSelector';

interface LabPanelProps {
  text: string;
  onTextChange: (value: string) => void;

  // Font
  fontManager: any;
  selectedFontId: string | null;
  onFontChange: (fontId: string, fontFamily: string) => void;

  // Ink menu
  inkColors: { name: string; value: string }[];
  inkColor: string;
  setInkColor: (val: string) => void;
  isInkMenuOpen: boolean;
  setIsInkMenuOpen: (val: boolean) => void;
  inkMenuRef: React.RefObject<HTMLDivElement>;

  // Paper/template
  templateProvider: any;
  selectedTemplate: string | null;
  onTemplateChange: (templateId: string) => void;

  // Custom fonts & actions
  customFontUploadManager: any;
  currentCustomFontsCount: number;
  onOpenCustomFontDialog: () => void;

  // Generate
  onGenerateImages: () => void;
  isGenerating: boolean;

  // Export status
  exportProgress: string | null;
  showPageLimitWarning: boolean;
}

const LabPanel: React.FC<LabPanelProps> = ({
  text,
  onTextChange,
  fontManager,
  selectedFontId,
  onFontChange,
  inkColors,
  inkColor,
  setInkColor,
  isInkMenuOpen,
  setIsInkMenuOpen,
  inkMenuRef,
  templateProvider,
  selectedTemplate,
  onTemplateChange,
  customFontUploadManager,
  currentCustomFontsCount,
  onOpenCustomFontDialog,
  onGenerateImages,
  isGenerating,
  exportProgress,
  showPageLimitWarning
}) => {
  // Close the ink color dropdown on outside click/scroll to prevent invisible overlays blocking clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isInkMenuOpen) return;
      if (inkMenuRef.current && !inkMenuRef.current.contains(e.target as Node)) {
        setIsInkMenuOpen(false);
      }
    };
    const handleClose = () => {
      if (isInkMenuOpen) setIsInkMenuOpen(false);
    };
    if (isInkMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('scroll', handleClose, true);
      window.addEventListener('resize', handleClose);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [isInkMenuOpen, inkMenuRef, setIsInkMenuOpen]);

  return (
    <section className="lg:col-span-1 md:col-span-1 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl shadow-lg p-4 md:p-6 flex flex-col gap-4 md:gap-6" role="form" aria-labelledby="controls-heading">
      <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-3">
        <h2 id="controls-heading" className="text-2xl font-bold text-[var(--text-color)]">The Lab</h2>
        <div className="flex items-center gap-2" role="status" aria-label="Application status">
          <div className="blinking-dot" aria-hidden="true"></div>
          <span className="text-sm font-medium text-[var(--text-muted)]">Version 1.3</span>
        </div>
      </div>

      {/* Text Input */}
      <div>
        <label htmlFor="text-input" className="block text-sm font-medium text-[var(--text-muted)] mb-2">Spill the tea here...</label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onTextChange(e.target.value)}
          placeholder="Type your text here..."
          className="w-full h-48 bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition resize-none"
          aria-label="Text input for handwriting conversion"
        />
      </div>

      {/* Font Selector */}
      <div data-tour-id="font-selector">
      <FontSelector
        fontManager={fontManager}
        selectedFontId={selectedFontId}
        onFontChange={onFontChange}
      />
      </div>

      {/* Ink Color Selector */}
      <div ref={inkMenuRef} className="relative">
        <label htmlFor="ink-menu-trigger" className="block text-sm font-medium text-[var(--text-muted)] mb-2">Ink Color</label>
        <button
          id="ink-menu-trigger"
          data-tour-id="ink-selector"
          type="button"
          onClick={() => setIsInkMenuOpen(!isInkMenuOpen)}
          className={`relative w-full bg-[var(--panel-bg)] border border-[var(--panel-border)]/80 text-[var(--text-color)] rounded-lg px-3 py-3 pr-12 text-left flex items-center focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition ${isInkMenuOpen ? 'shadow-lg' : 'shadow-sm'}`}
          aria-haspopup="listbox"
          aria-expanded={isInkMenuOpen}
        >
          <span className="truncate pr-6">{inkColors.find(color => color.value === inkColor)?.name || 'Select ink'}</span>
          <svg
            className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] transition-transform ${isInkMenuOpen ? 'rotate-180' : ''}`}
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
            className="absolute z-20 mt-2 w-full rounded-lg border border-[var(--panel-border)]/80 bg-[var(--panel-bg)] shadow-2xl overflow-hidden"
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
                className={`w-full flex justify-between items-center px-4 py-2 text-sm transition-colors ${
                  inkColor === color.value
                    ? 'bg-[var(--accent-color)]/90 text-white'
                    : 'text-[var(--text-color)] hover:bg-[var(--control-bg)]/70'
                }`}
              >
                <span>{color.name}</span>
                <span
                  className="ml-3 h-4 w-4 rounded-full border border-[var(--panel-border)]"
                  style={{ background: color.value }}
                  aria-hidden="true"
                ></span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ink Boldness is now in the Controls dock */}

      {/* Paper Template Selector */}
      <div data-tour-id="template-selector">
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          Paper Vibe
        </label>
        <EnhancedPaperTemplateSelector
          templateProvider={templateProvider}
          selectedTemplate={selectedTemplate}
          onTemplateChange={onTemplateChange}
        />
      </div>

      <div className="border-t border-[var(--panel-border)] pt-6 flex flex-col gap-3">
        <button 
          onClick={onOpenCustomFontDialog}
          disabled={!customFontUploadManager}
          className={`w-full text-center bg-transparent border-2 border-[var(--accent-color)] text-[var(--accent-color)] font-semibold py-2 px-4 rounded-lg transition-colors duration-300 hover:bg-[var(--accent-color)] hover:text-white ${
            !customFontUploadManager ? 'opacity-50 cursor-not-allowed' : ''
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
          className={`w-full text-center font-semibold py-2 px-4 rounded-lg transition-colors duration-300 ${isGenerating
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)]'
            }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Images'}
        </button>

        {/* Export Progress */}
        {exportProgress && (
          <div className={`text-sm text-center p-2 rounded-lg ${showPageLimitWarning
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
            {exportProgress}
          </div>
        )}
      </div>
    </section>
  );
};

export default LabPanel;
