/**
 * Enhanced Paper Template Selector Component
 * Features dropdown menu and arrow navigation for template switching
 * Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3
 */

import React, { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { PaperTemplate, ITemplateProvider } from '../types/core';
import { getErrorNotificationService } from '../services/errorNotificationService';
import { TemplateNamingService, EnhancedPaperTemplate } from '../services/templateNamingService';
import { RoseSpinner } from './Spinner';
import './EnhancedPaperTemplateSelector.css';

export interface EnhancedPaperTemplateSelectorProps {
  templateProvider: ITemplateProvider;
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  className?: string;
  variant?: 'standard' | 'minimal';
}

/**
 * Enhanced PaperTemplateSelector Component with dropdown and arrow navigation
 */
export const EnhancedPaperTemplateSelector: React.FC<EnhancedPaperTemplateSelectorProps> = ({
  templateProvider,
  selectedTemplate,
  onTemplateChange,
  className = '',
  variant = 'standard'
}) => {
  const [templates, setTemplates] = useState<EnhancedPaperTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Map<string, string>>(new Map());
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);

  // Template naming service for simplified names
  const namingService = useRef(new TemplateNamingService()).current;

  // Refs for dropdown functionality
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  /**
   * Load available templates from the provider
   */
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let availableTemplates: PaperTemplate[] = [];

      if (!templateProvider) {
        throw new Error('Template provider not available');
      }
      const rawTemplates = await templateProvider.getAvailableTemplates();

      // Validate templates if provider supports it
      if ('prevalidateTemplates' in templateProvider) {
        try {
          const validation = await (templateProvider as any).prevalidateTemplates();
          if (validation.invalid.length > 0) {
            console.warn(`${validation.invalid.length} templates failed validation:`, validation.invalid);
          }
          availableTemplates = validation.valid;
        } catch (validationError) {
          console.warn('Template validation failed, using all templates:', validationError);
          availableTemplates = rawTemplates;
        }
      } else {
        availableTemplates = rawTemplates;
      }

      // Apply simplified naming to templates
      const enhancedTemplates = namingService.mapLegacyNames(availableTemplates);
      setTemplates(prev => {
        if (JSON.stringify(prev) === JSON.stringify(enhancedTemplates)) {
          return prev;
        }
        return enhancedTemplates;
      });

      // Preload template preview images
      await loadPreviewImages(enhancedTemplates);
    } catch (err) {
      console.error('Failed to load paper templates:', err);
      // Try to provide emergency fallback templates
      const emergencyTemplates: PaperTemplate[] = [
        {
          id: 'blank-1',
          name: 'Default Blank',
          filename: 'blank-1.jpeg',
          type: 'blank'
        }
      ];

      const enhancedEmergencyTemplates = namingService.mapLegacyNames(emergencyTemplates);
      setTemplates(enhancedEmergencyTemplates);
      setError('Using default templates.');
    } finally {
      setLoading(false);
    }
  }, [templateProvider, namingService]);

  /**
   * Load preview images for templates
   */
  const loadPreviewImages = async (templateList: EnhancedPaperTemplate[]) => {
    const imageMap = new Map<string, string>();

    for (const template of templateList) {
      try {
        const previewUrl = `/template/${template.filename}`;
        imageMap.set(template.id, previewUrl);
      } catch (err) {
        imageMap.set(template.id, '/template/blank-1.jpeg');
      }
    }

    setPreviewImages(imageMap);
  };

  /**
   * Handle image load error with fallback
   */
  const handleImageError = (templateId: string) => {
    setPreviewImages(prev => {
      const updated = new Map(prev);
      updated.set(templateId, '/template/blank-1.jpeg');
      return updated;
    });
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.type === 'blank') {
      onTemplateChange(templateId);
      setIsDropdownOpen(false);
    }
  };

  /**
   * Get current selected template
   */
  const getCurrentTemplate = () => {
    return templates.find(t => t.id === selectedTemplate);
  };

  /**
   * Navigate to next template (arrow functionality)
   */
  const navigateToNext = useCallback(() => {
    const availableTemplates = templates.filter(t => t.type === 'blank');
    if (availableTemplates.length === 0) return;

    const currentIndex = availableTemplates.findIndex(t => t.id === selectedTemplate);
    const nextIndex = (currentIndex + 1) % availableTemplates.length;
    handleTemplateSelect(availableTemplates[nextIndex].id);
  }, [templates, selectedTemplate]);

  /**
   * Navigate to previous template (arrow functionality)
   */
  const navigateToPrevious = useCallback(() => {
    const availableTemplates = templates.filter(t => t.type === 'blank');
    if (availableTemplates.length === 0) return;

    const currentIndex = availableTemplates.findIndex(t => t.id === selectedTemplate);
    const prevIndex = currentIndex <= 0 ? availableTemplates.length - 1 : currentIndex - 1;
    handleTemplateSelect(availableTemplates[prevIndex].id);
  }, [templates, selectedTemplate]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsDropdownOpen(!isDropdownOpen);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isDropdownOpen) {
          setIsDropdownOpen(true);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsDropdownOpen(false);
        break;
    }
  };

  /**
   * Detect high contrast mode preference
   */
  const detectHighContrastMode = useCallback(() => {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrastMode(highContrastQuery.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrastMode(e.matches);
    };

    highContrastQuery.addEventListener('change', handleContrastChange);
    return () => highContrastQuery.removeEventListener('change', handleContrastChange);
  }, []);

  /**
   * Handle touch gestures for template navigation
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDropdownOpen) return; // Don't handle swipes when dropdown is open
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDropdownOpen) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || isDropdownOpen) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const availableTemplates = templates.filter(t => t.type === 'blank');
    if (isLeftSwipe && availableTemplates.length > 1) {
      navigateToNext();
    }
    if (isRightSwipe && availableTemplates.length > 1) {
      navigateToPrevious();
    }
  }, [touchStart, touchEnd, isDropdownOpen, templates, navigateToNext, navigateToPrevious]);

  /**
   * Handle clicks outside dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleClose = () => setIsDropdownOpen(false);

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleClose, true);
      window.addEventListener('resize', handleClose);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleClose, true);
        window.removeEventListener('resize', handleClose);
      };
    }
  }, [isDropdownOpen]);

  // Load templates on component mount
  useEffect(() => {
    if (templateProvider) {
      loadTemplates();
    }
  }, [loadTemplates, templateProvider]);

  // Initialize accessibility features
  useEffect(() => {
    const cleanup = detectHighContrastMode();
    return cleanup;
  }, [detectHighContrastMode]);

  // Loading state
  if (loading) {
    return (
      <div className={`enhanced-paper-template-selector ${className}`} role="status" aria-live="polite">
        <div className="flex items-center justify-center p-2">
          <RoseSpinner size={16} className="mr-2" label="Loading templates" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`enhanced-paper-template-selector ${className}`} role="alert" aria-live="assertive">
        <div className="text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={loadTemplates} className="underline text-[var(--accent-color)]">Retry</button>
        </div>
      </div>
    );
  }

  const currentTemplate = getCurrentTemplate();
  const availableBlankTemplates = templates.filter(t => t.type === 'blank');

  // Styles based on variant
  const isMinimal = variant === 'minimal';

  const arrowButtonClass = isMinimal
    ? "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-color)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
    : "flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--control-bg)] text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-white hover:border-[var(--accent-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 active:scale-95";

  const dropdownButtonClass = isMinimal
    ? `w-full text-[var(--text-color)] rounded-lg px-3 py-1.5 text-center flex items-center justify-center relative focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition hover:bg-[var(--bg-secondary)] ${isDropdownOpen ? 'bg-[var(--bg-secondary)]' : 'bg-transparent'}`
    : `w-full bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg pl-2 pr-8 py-2 sm:py-1.5 text-center flex items-center justify-center relative focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition active:scale-98 ${isDropdownOpen ? 'shadow-lg border-[var(--accent-color)]' : 'shadow-sm'}`;

  return (
    <div
      ref={containerRef}
      className={`enhanced-paper-template-selector ${className} ${highContrastMode ? 'high-contrast' : ''}`}
      role="group"
      aria-labelledby="enhanced-template-selector-heading"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <h3 id="enhanced-template-selector-heading" className="sr-only">Paper Template Selection</h3>

      {/* Template Selection Controls */}
      <div className="flex items-center gap-1 justify-center">
        {/* Previous Arrow Button */}
        <button
          onClick={navigateToPrevious}
          disabled={availableBlankTemplates.length <= 1}
          className={arrowButtonClass}
          aria-label="Previous template"
          title="Previous template"
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <div ref={dropdownRef} className="relative flex-grow max-w-[240px]">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onKeyDown={handleKeyDown}
            className={dropdownButtonClass}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            aria-label={`Paper template selector. Current: ${currentTemplate?.displayName || 'None selected'}`}
          >
            <div className="flex items-center gap-2 min-w-0 justify-center">
              {/* Template Preview Thumbnail - Hide in minimal mode if space is tight? Let's keep small or hide */}
              {/* Actually, let's keep it but maybe smaller in minimal, or just same size */}
              {currentTemplate && previewImages.has(currentTemplate.id) && !isMinimal && (
                <div className="flex-shrink-0 w-5 h-7 rounded border border-[var(--control-border)] overflow-hidden bg-white">
                  <img
                    src={previewImages.get(currentTemplate.id)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(currentTemplate.id)}
                  />
                </div>
              )}

              {/* Template Name */}
              <div className="min-w-0 truncate">
                <span className={`block font-medium truncate ${isMinimal ? 'text-sm' : 'text-sm'}`}>
                  {currentTemplate?.displayName || 'Select Template'}
                </span>
              </div>

              {/* Dropdown Arrow for minimal mode (inline) */}
              {isMinimal && (
                <svg className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              )}
            </div>

            {/* Dropdown Arrow for standard mode (absolute right) */}
            {!isMinimal && (
              <svg
                className={`absolute right-3 w-4 h-4 text-[var(--text-muted)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            )}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              role="listbox"
              aria-label="Paper templates"
              className="absolute z-50 mt-1 left-1/2 -translate-x-1/2 w-64 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-2xl overflow-hidden max-h-80 overflow-y-auto ring-1 ring-black ring-opacity-5"
            >
              <div className="p-1">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    role="option"
                    aria-selected={selectedTemplate === template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    disabled={template.type === 'lined'}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${selectedTemplate === template.id
                      ? 'bg-[var(--accent-color)] text-white'
                      : template.type === 'lined'
                        ? 'text-[var(--text-muted)] cursor-not-allowed opacity-60'
                        : 'text-[var(--text-color)] hover:bg-[var(--control-bg)]'
                      }`}
                  >
                    {/* Template Preview Thumbnail */}
                    {previewImages.has(template.id) && (
                      <div className="flex-shrink-0 w-8 h-10 rounded-md border border-[var(--control-border)] overflow-hidden bg-white shadow-sm">
                        <img
                          src={previewImages.get(template.id)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(template.id)}
                        />
                      </div>
                    )}

                    {/* Template Info */}
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate block">
                          {template.displayName}
                        </span>
                        {template.type === 'lined' && (
                          <span className="flex-shrink-0 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                            Soon
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-muted)] opacity-80 capitalize">
                        {template.type}
                      </span>
                    </div>

                    {/* Selected checkmark */}
                    {selectedTemplate === template.id && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next Arrow Button */}
        <button
          onClick={navigateToNext}
          disabled={availableBlankTemplates.length <= 1}
          className={arrowButtonClass}
          aria-label="Next template"
          title="Next template"
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>


    </div>
  );
};

export default EnhancedPaperTemplateSelector;
