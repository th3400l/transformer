// Font Selector Component for Gear-1 handwriting system
// Requirements: 6.2, 6.5

import React, { useState, useEffect, useRef } from 'react';
import { HandwritingFont, IFontManager, FontLoadResult } from '../types/fonts';
import { RoseSpinner } from './Spinner';

interface FontSelectorProps {
  fontManager: IFontManager | null;
  selectedFontId: string;
  onFontChange: (fontId: string, fontFamily: string) => void;
  className?: string;
  disabled?: boolean;
}

interface FontSelectorState {
  isOpen: boolean;
  fonts: HandwritingFont[];
  loadingFonts: Set<string>;
  loadedFonts: Set<string>;
  failedFonts: Set<string>;
  isInitializing: boolean;
}

export const FontSelector: React.FC<FontSelectorProps> = ({
  fontManager,
  selectedFontId,
  onFontChange,
  className = '',
  disabled = false
}) => {
  const [state, setState] = useState<FontSelectorState>({
    isOpen: false,
    fonts: [],
    loadingFonts: new Set(),
    loadedFonts: new Set(),
    failedFonts: new Set(),
    isInitializing: true
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize fonts when font manager is available
  useEffect(() => {
    if (!fontManager) return;

    const initializeFonts = async () => {
      try {
        const availableFonts = fontManager.getAvailableFonts();
        setState(prev => ({
          ...prev,
          fonts: availableFonts,
          isInitializing: false
        }));

        // Start loading fonts in the background
        loadFontsInBackground(availableFonts);
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

  const selectedFont = state.fonts.find(f => f.id === selectedFontId);
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

  const getFontStatus = (font: HandwritingFont): 'loading' | 'loaded' | 'failed' | 'available' => {
    if (state.loadingFonts.has(font.id)) return 'loading';
    if (state.failedFonts.has(font.id)) return 'failed';
    if (state.loadedFonts.has(font.id)) return 'loaded';
    return 'available';
  };

  const renderFontOption = (font: HandwritingFont) => {
    const status = getFontStatus(font);
    const isSelected = font.id === selectedFontId;

    return (
      <li
        key={font.id}
        onClick={() => handleFontSelect(font)}
        className={`px-4 py-2 cursor-pointer text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-white flex items-center justify-between ${
          isSelected ? 'bg-[var(--accent-color)] text-white' : ''
        }`}
        style={{ 
          fontFamily: status === 'loaded' || status === 'available' ? font.family : 'inherit',
          fontSize: '18px'
        }}
        role="option"
        aria-selected={isSelected}
      >
        <span>{font.name}</span>
        {status === 'loading' && (
          <RoseSpinner size={20} className="ml-2" label={`Loading ${font.name}`} announce={false} />
        )}
        {status === 'failed' && (
          <span className="text-xs opacity-75" title="Font failed to load, using fallback">
            ⚠
          </span>
        )}
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
      <label htmlFor="font-select" className="block text-sm font-medium text-[var(--text-muted)] mb-2">
        Font Aesthetic
      </label>
      <button
        id="font-select"
        onClick={toggleMenu}
        disabled={disabled}
        className={`w-full bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none transition appearance-none text-left flex justify-between items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        aria-haspopup="listbox"
        aria-expanded={state.isOpen}
        aria-label="Select font"
      >
        <span 
          style={{ 
            fontFamily: selectedFont && getFontStatus(selectedFont) !== 'failed' ? selectedFont.family : 'inherit',
            fontSize: '18px' 
          }}
        >
          {displayName}
        </span>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${state.isOpen ? 'rotate-180' : ''}`} 
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
        <ul 
          className="custom-dropdown-menu absolute w-full mt-1 bg-[var(--control-bg)] border border-[var(--control-border)] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label="Font options"
        >
          {state.fonts.map(renderFontOption)}
        </ul>
      )}
      
      {/* Loading indicator for background font loading */}
      {state.loadingFonts.size > 0 && (
        <div className="absolute top-0 right-0 -mt-3 -mr-3">
          <RoseSpinner size={18} announce={false} label="Loading font assets" />
        </div>
      )}
    </div>
  );
};
