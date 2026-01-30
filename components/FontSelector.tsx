// Font Selector Component for Gear-1 handwriting system
// Requirements: 6.2, 6.5, 3.1, 3.2, 3.3, 3.4, 6.1, 6.3

import React, { useState, useEffect, useRef } from 'react';
import { HandwritingFont, IFontManager, FontLoadResult, CustomFont } from '../types/fonts';
import { CustomFontUploadResult, FontUploadError, FontErrorType } from '../types/customFontUpload';
import { RoseSpinner } from './Spinner';
import { BrowserCompatibilityLayer } from '../services/browserCompatibilityLayer';

interface FontSelectorProps {
  fontManager: IFontManager | null;
  selectedFontId: string;
  onFontChange: (fontId: string, fontFamily: string) => void;
  className?: string;
  disabled?: boolean;
  maxCustomFonts?: number;
  showCustomTags?: boolean; // New prop for custom font identification
}

interface FontSelectorState {
  isOpen: boolean;
  fonts: HandwritingFont[];
  customFonts: CustomFont[];
  loadingFonts: Set<string>;
  loadedFonts: Set<string>;
  failedFonts: Set<string>;
  isInitializing: boolean;
  browserCapabilities: any;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  fontManager,
  selectedFontId,
  onFontChange,
  className = '',
  disabled = false,
  maxCustomFonts = 2,
  showCustomTags = true // Default to showing custom tags
}) => {
  const [state, setState] = useState<FontSelectorState>({
    isOpen: false,
    fonts: [],
    customFonts: [],
    loadingFonts: new Set(),
    loadedFonts: new Set(),
    failedFonts: new Set(),
    isInitializing: true,
    browserCapabilities: null
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const browserCompatibility = useRef(new BrowserCompatibilityLayer());

  // Detect browser capabilities and mobile optimizations on mount
  useEffect(() => {
    const capabilities = browserCompatibility.current.detectCapabilities();
    const optimizations = browserCompatibility.current.getBrowserOptimizations();
    setState(prev => ({
      ...prev,
      browserCapabilities: { ...capabilities, ...optimizations }
    }));
  }, []);

  // Initialize fonts when font manager is available
  useEffect(() => {
    if (!fontManager) return;

    const initializeFonts = async () => {
      try {
        const availableFonts = fontManager.getAvailableFonts();
        const customFonts = fontManager.getCustomFonts();
        const defaultFonts = availableFonts.filter(font => !fontManager.isCustomFont(font.id));

        setState(prev => {
          const fontsChanged = JSON.stringify(prev.fonts) !== JSON.stringify(defaultFonts);
          const customFontsChanged = JSON.stringify(prev.customFonts) !== JSON.stringify(customFonts);

          if (!fontsChanged && !customFontsChanged && !prev.isInitializing) {
            return prev;
          }

          return {
            ...prev,
            fonts: defaultFonts,
            customFonts: customFonts,
            isInitializing: false
          };
        });

        // Start loading fonts in the background
        loadFontsInBackground([...defaultFonts, ...customFonts]);
      } catch (error) {
        console.error('Failed to initialize fonts:', error);
        setState(prev => ({
          ...prev,
          isInitializing: false
        }));
      }
    };

    initializeFonts();
  }, [fontManager]);

  // Load fonts in background for better performance
  const loadFontsInBackground = async (fonts: HandwritingFont[]) => {
    if (!fontManager) return;

    // Load fonts with file paths first (custom fonts)
    const customFonts = fonts.filter(f => f.file);
    const webFonts = fonts.filter(f => !f.file);

    // Load custom fonts first
    for (const font of customFonts) {
      if (state.loadedFonts.has(font.id) || state.loadingFonts.has(font.id)) continue;

      setState(prev => ({
        ...prev,
        loadingFonts: new Set([...prev.loadingFonts, font.id])
      }));

      try {
        const result = await loadSingleFont(font);
        setState(prev => ({
          ...prev,
          loadingFonts: new Set([...prev.loadingFonts].filter(id => id !== font.id)),
          loadedFonts: result.success
            ? new Set([...prev.loadedFonts, font.id])
            : prev.loadedFonts,
          failedFonts: result.success
            ? prev.failedFonts
            : new Set([...prev.failedFonts, font.id])
        }));
      } catch (error) {
        console.error(`Failed to load font ${font.name}:`, error);
        setState(prev => ({
          ...prev,
          loadingFonts: new Set([...prev.loadingFonts].filter(id => id !== font.id)),
          failedFonts: new Set([...prev.failedFonts, font.id])
        }));
      }
    }

    // Mark web fonts as loaded (they should be available via CSS)
    setState(prev => ({
      ...prev,
      loadedFonts: new Set([...prev.loadedFonts, ...webFonts.map(f => f.id)])
    }));
  };

  const loadSingleFont = async (font: HandwritingFont): Promise<FontLoadResult> => {
    if (!fontManager) {
      throw new Error('Font manager not available');
    }

    // Create a promise that resolves when the font is loaded
    return new Promise(async (resolve) => {
      try {
        if (font.file) {
          const primaryFamily = font.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
          const fontFace = new FontFace(primaryFamily, `url(${font.file})`);
          await fontFace.load();
          document.fonts.add(fontFace);
        }

        // Validate the font is available
        const validation = await fontManager.validateFontAvailability(font);

        resolve({
          font: { ...font, loaded: validation.isAvailable },
          success: validation.isAvailable,
          error: validation.error,
          loadTime: 0
        });
      } catch (error) {
        resolve({
          font: { ...font, loaded: false },
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          loadTime: 0
        });
      }
    });
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedFont = state.fonts.find(f => f.id === selectedFontId) ||
    state.customFonts.find(f => f.id === selectedFontId);
  const displayName = selectedFont?.name || 'Select Font';

  const handleFontSelect = (font: HandwritingFont) => {
    onFontChange(font.id, font.family);
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const toggleMenu = () => {
    if (!disabled) {
      setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
    }
  };

  // Enhanced keyboard navigation with arrow key support
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    const allFonts = [...state.fonts, ...state.customFonts];
    const currentIndex = allFonts.findIndex(font => font.id === selectedFontId);

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        toggleMenu();
        break;
      case 'Escape':
        if (state.isOpen) {
          event.preventDefault();
          setState(prev => ({ ...prev, isOpen: false }));
        }
        break;
      case 'ArrowDown':
        if (state.isOpen) {
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, allFonts.length - 1);
          if (nextIndex !== currentIndex && allFonts[nextIndex]) {
            handleFontSelect(allFonts[nextIndex]);
          }
        } else {
          event.preventDefault();
          toggleMenu();
        }
        break;
      case 'ArrowUp':
        if (state.isOpen) {
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (prevIndex !== currentIndex && allFonts[prevIndex]) {
            handleFontSelect(allFonts[prevIndex]);
          }
        } else {
          event.preventDefault();
          toggleMenu();
        }
        break;
      case 'Home':
        if (state.isOpen && allFonts.length > 0) {
          event.preventDefault();
          handleFontSelect(allFonts[0]);
        }
        break;
      case 'End':
        if (state.isOpen && allFonts.length > 0) {
          event.preventDefault();
          handleFontSelect(allFonts[allFonts.length - 1]);
        }
        break;
    }
  };



  // Refresh custom fonts when fontManager changes or when custom fonts are uploaded
  useEffect(() => {
    refreshCustomFonts();
  }, [fontManager]);

  // Periodically refresh custom fonts to catch external changes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshCustomFonts();
    }, 2000); // Check every 2 seconds for new custom fonts (reduced frequency)

    return () => clearInterval(interval);
  }, [fontManager]);

  // Listen for custom font upload events
  useEffect(() => {
    const handleCustomFontUpload = () => {
      // Force refresh when a custom font is uploaded
      setTimeout(() => {
        refreshCustomFonts();
      }, 100); // Small delay to ensure upload is complete
    };

    // Listen for custom font events
    window.addEventListener('customFontUploaded', handleCustomFontUpload);
    window.addEventListener('customFontRemoved', handleCustomFontUpload);

    return () => {
      window.removeEventListener('customFontUploaded', handleCustomFontUpload);
      window.removeEventListener('customFontRemoved', handleCustomFontUpload);
    };
  }, []);

  // Refresh custom fonts when they change externally
  const refreshCustomFonts = () => {
    if (!fontManager) return;

    const customFonts = fontManager.getCustomFonts();
    setState(prev => {
      // Only update if the custom fonts have actually changed
      const currentIds = prev.customFonts.map(f => f.id).sort();
      const newIds = customFonts.map(f => f.id).sort();

      if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
        return {
          ...prev,
          customFonts: customFonts
        };
      }

      return prev;
    });
  };

  const getFontStatus = (font: HandwritingFont): 'loading' | 'loaded' | 'failed' | 'available' => {
    if (state.loadingFonts.has(font.id)) return 'loading';
    if (state.failedFonts.has(font.id)) return 'failed';
    if (state.loadedFonts.has(font.id)) return 'loaded';
    return 'available';
  };

  const renderFontOption = (font: HandwritingFont, isCustom: boolean = false) => {
    const status = getFontStatus(font);
    const isSelected = font.id === selectedFontId;
    const isMobile = state.browserCapabilities?.mobile?.isMobile;
    const isTablet = state.browserCapabilities?.mobile?.useTouch && !isMobile;

    // Mobile-optimized styling
    const mobileClasses = isMobile
      ? 'px-4 py-4 min-h-[56px]' // Larger touch targets for mobile
      : isTablet
        ? 'px-4 py-3 min-h-[48px]' // Medium touch targets for tablet
        : 'px-3 py-2 sm:px-4'; // Default desktop

    const fontSize = isMobile ? '20px' : isTablet ? '19px' : '18px';
    const displayName = (() => {
      const trimmed = typeof font.name === 'string' ? font.name.trim() : font.name;
      if (trimmed) return trimmed;
      if (isCustom) {
        const customFont = font as CustomFont;
        if (customFont.originalFilename) {
          return customFont.originalFilename.replace(/\.[^/.]+$/, '');
        }
      }
      return font.name;
    })();

    const customBadgeStyle: React.CSSProperties = {
      fontFamily: 'var(--font-sans, "Inter", system-ui, sans-serif)',
      backgroundColor: isSelected ? 'var(--panel-bg)' : 'var(--bg-color)',
      color: 'var(--accent-color)',
      borderColor: 'var(--accent-color)',
      fontWeight: 600
    };

    return (
      <li
        key={font.id}
        onClick={() => handleFontSelect(font)}
        className={`${mobileClasses} cursor-pointer text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-white flex items-center justify-between ${isSelected ? 'bg-[var(--accent-color)] text-white' : ''
          }`}
        style={{
          fontFamily: status === 'loaded' || status === 'available' ? font.family : 'inherit',
          fontSize: fontSize
        }}
        role="option"
        aria-selected={isSelected}
      >
        <div className="flex items-center flex-1 min-w-0">
          <span className="truncate">{displayName}</span>
          {isCustom && showCustomTags && (
            <span
              className={`ml-2 px-2 py-0.5 ${isMobile ? 'text-sm' : 'text-xs'} rounded-full border flex-shrink-0`}
              style={customBadgeStyle}
            >
              Custom
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'loading' && (
            <RoseSpinner
              size={isMobile ? 24 : 20}
              className="ml-2"
              label={`Loading ${displayName}`}
              announce={false}
            />
          )}
          {status === 'failed' && (
            <span className={`${isMobile ? 'text-sm' : 'text-xs'} opacity-75 font-semibold tracking-wide`} title="Font failed to load, using fallback">
              !
            </span>
          )}
        </div>
      </li>
    );
  };



  if (state.isInitializing) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          Font Aesthetic
        </label>
        <div className="w-full bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg p-3 flex items-center justify-center">
          <RoseSpinner size={28} className="mr-2" label="Loading fonts" announce={false} />
          <span className="ml-2">Loading fonts...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <label htmlFor="font-select" className="block text-sm font-medium text-[var(--text-muted)] mb-1">
        Font Aesthetic
      </label>
      <button
        id="font-select"
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg ${state.browserCapabilities?.mobile?.isMobile
          ? 'p-4 min-h-[56px]' // Larger touch target for mobile
          : state.browserCapabilities?.mobile?.useTouch
            ? 'p-3.5 min-h-[48px]' // Medium touch target for tablet
            : 'p-3' // Default desktop
          } focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition appearance-none text-left flex justify-between items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        aria-haspopup="listbox"
        aria-expanded={state.isOpen}
        aria-label={`Select font. Current selection: ${displayName}. ${state.fonts.length + state.customFonts.length} fonts available.`}
        aria-describedby="font-selector-help"
      >
        <span
          style={{
            fontFamily: selectedFont && getFontStatus(selectedFont) !== 'failed' ? selectedFont.family : 'inherit',
            fontSize: state.browserCapabilities?.mobile?.isMobile ? '20px' : '18px'
          }}
        >
          {displayName}
        </span>
        <svg
          className={`${state.browserCapabilities?.mobile?.isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-gray-500 ${state.browserCapabilities?.mobile?.reducedAnimations ? '' : 'transition-transform'
            } ${state.isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M6 8l4 4 4-4"
          />
        </svg>
      </button>

      {state.isOpen && (
        <div className={`custom-dropdown-menu absolute w-full mt-1 bg-[var(--control-bg)] border border-[var(--control-border)] rounded-lg shadow-lg z-10 overflow-y-auto ${state.browserCapabilities?.mobile?.isMobile
          ? 'max-h-[60vh]' // Mobile: use viewport height for better mobile experience
          : state.browserCapabilities?.mobile?.useTouch
            ? 'max-h-60' // Tablet: allow roughly four options in view
            : 'max-h-56 sm:max-h-60' // Desktop: limit to four visible fonts with scroll for the rest
          }`}>
          {/* Default Fonts Section */}
          <div className="border-b border-[var(--control-border)]">
            <div className={`${state.browserCapabilities?.mobile?.isMobile
              ? 'px-4 py-3 text-base'
              : 'px-3 py-2 sm:px-4 text-sm'
              } font-medium text-[var(--text-muted)] bg-[var(--control-bg)] sticky top-0`}>
              Default Fonts
            </div>
            <ul
              role="listbox"
              aria-label={`Default font options. ${state.fonts.length} fonts available.`}
              aria-activedescendant={selectedFontId}
            >
              {state.fonts.map(font => renderFontOption(font, false))}
            </ul>
          </div>

          {/* Custom Fonts Section */}
          {state.customFonts.length > 0 && (
            <div>
              <div className={`${state.browserCapabilities?.mobile?.isMobile
                ? 'px-4 py-3 text-base'
                : 'px-3 py-2 sm:px-4 text-sm'
                } font-medium text-[var(--text-muted)] bg-[var(--control-bg)] sticky top-0`}>
                <span className="truncate">Custom Fonts ({state.customFonts.length})</span>
              </div>

              <ul
                role="listbox"
                aria-label={`Custom font options. ${state.customFonts.length} custom fonts available.`}
                aria-activedescendant={selectedFontId}
              >
                {state.customFonts.map(font => renderFontOption(font, true))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Loading indicator for background font loading */}
      {state.loadingFonts.size > 0 && (
        <div className="absolute top-0 right-0 -mt-3 -mr-3">
          <RoseSpinner size={18} announce={false} label="Loading font assets" />
        </div>
      )}

      {/* Enhanced accessibility help text with comprehensive instructions */}
      <div id="font-selector-help" className="sr-only">
        <h3>Font Selector Instructions</h3>
        <p>Use arrow keys to navigate fonts when dropdown is open. Press Enter or Space to select a font. Press Escape to close dropdown.</p>
        <p>Home key jumps to first font, End key jumps to last font.</p>
        {state.customFonts.length > 0 && (
          <p>Custom fonts are marked with a "Custom" badge.</p>
        )}
        <p>Font preview updates automatically when you select different fonts.</p>
      </div>

      {/* Enhanced screen reader announcements for font changes */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
        aria-label="Font selector status updates"
      >
        {state.isOpen && `Font selector opened. ${state.fonts.length + state.customFonts.length} fonts available.`}
        {!state.isOpen && selectedFont && `Font changed to ${selectedFont.name}`}
        {state.loadingFonts.size > 0 && `Loading ${state.loadingFonts.size} font${state.loadingFonts.size > 1 ? 's' : ''}`}
      </div>

      {/* SEO-friendly structured data for font features */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Font Selector",
            "description": "Advanced font selection interface with custom font upload capabilities",
            "featureList": [
              "Multiple handwriting font options",
              "Custom font upload (TTF, OTF, WOFF, WOFF2)",
              "Real-time font preview",
              "Cross-platform compatibility",
              "Accessibility compliant interface"
            ],
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "accessibilityFeature": [
              "fullKeyboardControl",
              "screenReaderSupport",
              "highContrastDisplay",
              "alternativeText"
            ],
            "accessibilityControl": [
              "fullKeyboardControl",
              "fullMouseControl",
              "fullTouchControl"
            ]
          })
        }}
      />
    </div>
  );
};

export default FontSelector;
