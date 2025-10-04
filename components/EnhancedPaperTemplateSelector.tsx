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
}

/**
 * Enhanced PaperTemplateSelector Component with dropdown and arrow navigation
 * 
 * Features:
 * - Dropdown menu for template selection
 * - Arrow buttons for cycling through templates
 * - "Coming Soon" tag for lined templates
 * - Responsive design for all devices
 * - Accessibility support
 */
export const EnhancedPaperTemplateSelector: React.FC<EnhancedPaperTemplateSelectorProps> = ({
  templateProvider,
  selectedTemplate,
  onTemplateChange,
  className = ''
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
            const errorService = getErrorNotificationService();
            errorService.showNotification({
              id: 'template-validation-warning',
              type: 'warning',
              title: 'Some Templates Unavailable',
              message: `${validation.invalid.length} paper templates couldn't be loaded. Using available templates.`,
              dismissible: true,
              autoHide: true,
              duration: 5000
            });
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
      setTemplates(enhancedTemplates);
      
      // Preload template preview images
      await loadPreviewImages(enhancedTemplates);
    } catch (err) {
      console.error('Failed to load paper templates:', err);
      const errorService = getErrorNotificationService();
      errorService.showError(err as Error, 'loading paper templates');
      
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
      setError('Some templates may be unavailable. Using default templates.');
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
        console.warn(`Failed to load preview for template ${template.id}:`, err);
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
    
    // Announce template change for screen readers
    const nextTemplate = availableTemplates[nextIndex];
    if (nextTemplate) {
      const announcement = `Selected ${nextTemplate.displayName || nextTemplate.name}`;
      // Create a temporary element for screen reader announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = announcement;
      document.body.appendChild(announcer);
      setTimeout(() => document.body.removeChild(announcer), 1000);
    }
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
    
    // Announce template change for screen readers
    const prevTemplate = availableTemplates[prevIndex];
    if (prevTemplate) {
      const announcement = `Selected ${prevTemplate.displayName || prevTemplate.name}`;
      // Create a temporary element for screen reader announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = announcement;
      document.body.appendChild(announcer);
      setTimeout(() => document.body.removeChild(announcer), 1000);
    }
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
        <div className="flex items-center justify-center p-4">
          <RoseSpinner size={24} className="mr-2" label="Loading templates" />
          <span className="text-[var(--text-muted)] text-sm">Loading templates...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`enhanced-paper-template-selector ${className}`} role="alert" aria-live="assertive">
        <div className="text-center p-4">
          <div className="text-red-500 mb-2" role="img" aria-label="Error icon">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-[var(--text-color)] text-sm mb-3">{error}</p>
          <button
            onClick={loadTemplates}
            className="px-3 py-1 bg-[var(--accent-color)] text-white rounded text-sm hover:bg-[var(--accent-color-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2"
            aria-label="Retry loading paper templates"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentTemplate = getCurrentTemplate();
  const availableBlankTemplates = templates.filter(t => t.type === 'blank');

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
      <div className="flex items-center gap-2">
        {/* Previous Arrow Button */}
        <button
          onClick={navigateToPrevious}
          disabled={availableBlankTemplates.length <= 1}
          className="flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--control-bg)] text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-white hover:border-[var(--accent-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 active:scale-95"
          aria-label="Previous template"
          title="Previous template"
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <div ref={dropdownRef} className="relative flex-grow">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onKeyDown={handleKeyDown}
            className={`w-full bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-color)] rounded-lg px-3 py-3 sm:py-2 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition active:scale-98 ${isDropdownOpen ? 'shadow-lg border-[var(--accent-color)]' : 'shadow-sm'}`}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            aria-label={`Paper template selector. Current: ${currentTemplate?.displayName || 'None selected'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {/* Template Preview Thumbnail */}
              {currentTemplate && previewImages.has(currentTemplate.id) && (
                <div className="flex-shrink-0 w-6 h-8 rounded border border-[var(--control-border)] overflow-hidden bg-white">
                  <img
                    src={previewImages.get(currentTemplate.id)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(currentTemplate.id)}
                  />
                </div>
              )}
              
              {/* Template Name */}
              <div className="min-w-0 flex-grow">
                <span className="block text-sm font-medium truncate">
                  {currentTemplate?.displayName || 'Select Template'}
                </span>
                <span className="block text-xs text-[var(--text-muted)] truncate">
                  {currentTemplate?.type === 'blank' ? 'Blank' : 'Lined'}
                  {currentTemplate?.type === 'lined' && (
                    <span className="ml-1 px-1 py-0.5 bg-[var(--accent-color)] text-white text-xs rounded">
                      Coming Soon
                    </span>
                  )}
                </span>
              </div>
            </div>
            
            {/* Dropdown Arrow */}
            <svg
              className={`flex-shrink-0 w-4 h-4 text-[var(--text-muted)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
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

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              role="listbox"
              aria-label="Paper templates"
              className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
            >
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  role="option"
                  aria-selected={selectedTemplate === template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  disabled={template.type === 'lined'}
                  className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2 text-left transition-colors active:scale-98 ${
                    selectedTemplate === template.id
                      ? 'bg-[var(--accent-color)] text-white'
                      : template.type === 'lined'
                      ? 'text-[var(--text-muted)] cursor-not-allowed opacity-60'
                      : 'text-[var(--text-color)] hover:bg-[var(--control-bg)] active:bg-[var(--control-bg)]'
                  }`}
                >
                  {/* Template Preview Thumbnail */}
                  {previewImages.has(template.id) && (
                    <div className="flex-shrink-0 w-8 h-10 rounded border border-[var(--control-border)] overflow-hidden bg-white">
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
                      <span className="text-sm font-medium truncate">
                        {template.displayName}
                      </span>
                      {template.type === 'lined' && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-[var(--accent-color)] text-white text-xs rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)] capitalize">
                      {template.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Next Arrow Button */}
        <button
          onClick={navigateToNext}
          disabled={availableBlankTemplates.length <= 1}
          className="flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-[var(--control-border)] bg-[var(--control-bg)] text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-white hover:border-[var(--accent-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 active:scale-95"
          aria-label="Next template"
          title="Next template"
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Template count and position indicator */}
      <div className="mt-2 text-center" role="status" aria-live="polite">
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <span>
            {availableBlankTemplates.length > 1 && (
              <>
                {availableBlankTemplates.findIndex(t => t.id === selectedTemplate) + 1} of {availableBlankTemplates.length}
                <span className="mx-1">•</span>
              </>
            )}
            {availableBlankTemplates.length} template{availableBlankTemplates.length !== 1 ? 's' : ''} available
          </span>
          {templates.some(t => t.type === 'lined') && (
            <span className="hidden sm:inline">• Lined templates coming soon</span>
          )}
        </div>
        
        {/* Visual dots indicator for template position */}
        {availableBlankTemplates.length > 1 && availableBlankTemplates.length <= 5 && (
          <div className="flex items-center justify-center gap-1 mt-1" aria-hidden="true">
            {availableBlankTemplates.map((template, index) => (
              <div
                key={template.id}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  template.id === selectedTemplate
                    ? 'bg-[var(--accent-color)]'
                    : 'bg-[var(--text-muted)] opacity-30'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Swipe hint for mobile */}
        {availableBlankTemplates.length > 1 && (
          <div className="sm:hidden mt-1 text-xs text-[var(--text-muted)] opacity-60">
            Swipe left/right to change templates
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPaperTemplateSelector;
