/**
 * Paper Template Selector Component
 * Provides UI for selecting paper templates with dependency injection
 * Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3
 */

import React, { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { PaperTemplate, ITemplateProvider } from '../services/paperTemplateProvider';
import { getErrorNotificationService } from '../services/errorNotificationService';
import { TemplateNamingService, EnhancedPaperTemplate } from '../services/templateNamingService';
import { RoseSpinner } from './Spinner';

export interface PaperTemplateSelectorProps {
  templateProvider: ITemplateProvider;
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  className?: string;
}

/**
 * PaperTemplateSelector Component
 * 
 * Responsibilities (Single Responsibility Principle):
 * - Display available paper templates only
 * - Handle template selection UI only  
 * - Delegate template loading to ITemplateProvider
 * 
 * Requirements:
 * - 2.1: Display all available templates from template/ directory
 * - 2.2: Show both lined and blank paper templates
 * - 2.3: Handle template selection
 * - 5.1, 5.2, 5.3: Responsive design for PC, mobile, and tablet
 */
export const PaperTemplateSelector: React.FC<PaperTemplateSelectorProps> = ({
  templateProvider,
  selectedTemplate,
  onTemplateChange,
  className = ''
}) => {
  const [templates, setTemplates] = useState<EnhancedPaperTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<Map<string, string>>(new Map());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);
  const lastAnnouncedTemplate = useRef<string | null>(null);
  
  // Template naming service for simplified names
  const namingService = useRef(new TemplateNamingService()).current;
  
  // Refs for keyboard navigation
  const templateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Load available templates from the provider
   * Requirements: 2.1 - Display all available templates from template/ directory
   * Requirements: 3.2, 3.4 - Apply simplified naming to templates
   */
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let availableTemplates: PaperTemplate[] = [];
      
      // Get templates from provider
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
      
      // Try to provide emergency fallback templates with simplified naming
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
   * Load preview images for templates with lazy loading support
   * Creates preview URLs for template thumbnails
   */
  const loadPreviewImages = async (templateList: EnhancedPaperTemplate[]) => {
    const imageMap = new Map<string, string>();
    
    for (const template of templateList) {
      try {
        // Create preview URL from template filename
        const previewUrl = `/template/${template.filename}`;
        imageMap.set(template.id, previewUrl);
      } catch (err) {
        console.warn(`Failed to load preview for template ${template.id}:`, err);
        // Use a fallback or placeholder image
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
   * Requirements: 2.3 - Handle template selection
   */
  const handleTemplateSelect = (templateId: string) => {
    lastAnnouncedTemplate.current = templateId;
    onTemplateChange(templateId);
  };

  /**
   * Handle keyboard navigation for template selection
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Accessibility features
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, templateId: string, index: number) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTemplateSelect(templateId);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        navigateToTemplate(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        navigateToTemplate(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        navigateToTemplate(0);
        break;
      case 'End':
        event.preventDefault();
        navigateToTemplate(templates.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        // Remove focus from template selector
        if (containerRef.current) {
          containerRef.current.blur();
        }
        break;
    }
  };

  /**
   * Navigate to specific template index with keyboard
   */
  const navigateToTemplate = (index: number) => {
    if (index < 0 || index >= templates.length) return;
    
    setFocusedIndex(index);
    const templateElement = templateRefs.current[index];
    if (templateElement) {
      templateElement.focus();
    }
  };

  /**
   * Detect high contrast mode preference
   */
  const detectHighContrastMode = useCallback(() => {
    // Check for high contrast media query
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrastMode(highContrastQuery.matches);
    
    // Listen for changes
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrastMode(e.matches);
    };
    
    highContrastQuery.addEventListener('change', handleContrastChange);
    return () => highContrastQuery.removeEventListener('change', handleContrastChange);
  }, []);

  /**
   * Get template type display name
   */
  const getTypeDisplayName = (type: 'blank' | 'lined'): string => {
    return type === 'blank' ? 'Blank' : 'Lined';
  };

  /**
   * Get template type icon
   */
  const getTypeIcon = (type: 'blank' | 'lined'): React.ReactNode => {
    if (type === 'lined') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

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

  // Update template refs when templates change
  useEffect(() => {
    templateRefs.current = templateRefs.current.slice(0, templates.length);
  }, [templates]);

  useEffect(() => {
    if (loading || templates.length === 0) {
      return;
    }

    if (selectedTemplate && lastAnnouncedTemplate.current !== selectedTemplate) {
      const existingTemplate = templates.find(template => template.id === selectedTemplate && template.type === 'blank');
      if (existingTemplate) {
        lastAnnouncedTemplate.current = selectedTemplate;
        onTemplateChange(selectedTemplate);
      }
    }
  }, [loading, templates, selectedTemplate, onTemplateChange]);

  // Loading state
  if (loading) {
    return (
      <div className={`paper-template-selector ${className}`} role="status" aria-live="polite">
        <div className="flex items-center justify-center p-8">
          <RoseSpinner size={48} className="mr-3" label="Loading templates" />
          <span className="text-[var(--text-muted)]">Loading templates...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`paper-template-selector ${className}`} role="alert" aria-live="assertive">
        <div className="text-center p-6">
          <div className="text-red-500 mb-2" role="img" aria-label="Error icon">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-[var(--text-color)] mb-4">{error}</p>
          <button
            onClick={loadTemplates}
            className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-color-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2"
            aria-label="Retry loading paper templates"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`paper-template-selector ${className} ${highContrastMode ? 'high-contrast' : ''}`}
      role="group"
      aria-labelledby="template-selector-heading"
    >
      <h3 id="template-selector-heading" className="sr-only">Paper Template Selection</h3>
      
      {/* Desktop Grid Layout (Requirements: 5.1 - PC functionality) */}
      <div 
        className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="radiogroup"
        aria-labelledby="template-selector-heading"
        aria-describedby="template-instructions"
      >
        <div id="template-instructions" className="sr-only">
          Use arrow keys to navigate between templates. Press Enter or Space to select a template. Press Escape to exit template selection.
        </div>
        
        {templates.map((template, index) => (
          <div
            key={template.id}
            ref={el => {
              templateRefs.current[index] = el;
            }}
            className={`template-card ${template.type === 'lined' ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id
                ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                : 'border-[var(--control-border)] hover:border-[var(--accent-color)]/50'
            } ${highContrastMode ? 'border-4' : ''} ${template.type === 'lined' ? 'relative' : ''}`}
            onClick={() => template.type === 'blank' ? handleTemplateSelect(template.id) : null}
            role="radio"
            tabIndex={template.type === 'blank' ? (selectedTemplate === template.id ? 0 : -1) : -1}
            onKeyDown={(e) => template.type === 'blank' ? handleKeyDown(e, template.id, index) : null}
            onFocus={() => setFocusedIndex(index)}
            aria-checked={selectedTemplate === template.id}
            aria-label={template.tooltipText}
            aria-describedby={`template-${template.id}-description`}
            aria-disabled={template.type === 'lined'}
          >
            {/* Template Preview */}
            <div className="aspect-[3/4] rounded-t-lg overflow-hidden bg-[var(--control-bg)]">
              {previewImages.has(template.id) ? (
                <img
                  src={previewImages.get(template.id)}
                  alt={`${template.displayName} paper template preview - ${getTypeDisplayName(template.type)} paper style`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={() => handleImageError(template.id)}
                  onLoad={(e) => {
                    // Add fade-in effect when image loads
                    e.currentTarget.style.opacity = '1';
                  }}
                  style={{ opacity: '0', transition: 'opacity 0.3s ease-in-out' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]" role="img" aria-label={`${template.displayName} template placeholder`}>
                  {getTypeIcon(template.type)}
                </div>
              )}
            </div>
            
            {/* Template Info */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <h4 
                  className="font-medium text-[var(--text-color)] text-sm truncate"
                  title={template.tooltipText}
                >
                  {template.displayName}
                </h4>
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1" aria-hidden="true">
                  {getTypeIcon(template.type)}
                  {getTypeDisplayName(template.type)}
                </span>
              </div>
              <div id={`template-${template.id}-description`} className="sr-only">
                {template.tooltipText}
              </div>
            </div>

            {/* Gear-2 Overlay for Lined Templates */}
            {template.type === 'lined' && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <div className="text-xs opacity-80">Coming Soon</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Carousel Layout (Requirements: 5.2 - Mobile functionality) */}
      <div className="md:hidden">
        <div 
          className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory"
          role="radiogroup"
          aria-labelledby="template-selector-heading"
          aria-describedby="mobile-template-instructions"
        >
          <div id="mobile-template-instructions" className="sr-only">
            Swipe horizontally or use arrow keys to browse templates. Tap or press Enter to select a template.
          </div>
          
          {templates.map((template, index) => (
            <div
              key={template.id}
              ref={el => {
                templateRefs.current[index] = el;
              }}
              className={`template-card-mobile flex-shrink-0 w-32 ${template.type === 'lined' ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-lg border-2 transition-all duration-200 snap-start ${
                selectedTemplate === template.id
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                  : 'border-[var(--control-border)]'
              } ${highContrastMode ? 'border-4' : ''} ${template.type === 'lined' ? 'relative' : ''}`}
              onClick={() => template.type === 'blank' ? handleTemplateSelect(template.id) : null}
              role="radio"
              tabIndex={template.type === 'blank' ? (selectedTemplate === template.id ? 0 : -1) : -1}
              onKeyDown={(e) => template.type === 'blank' ? handleKeyDown(e, template.id, index) : null}
              onFocus={() => setFocusedIndex(index)}
              aria-checked={selectedTemplate === template.id}
              aria-label={template.tooltipText}
              aria-describedby={`mobile-template-${template.id}-description`}
              aria-disabled={template.type === 'lined'}
            >
              {/* Mobile Template Preview */}
              <div className="aspect-[3/4] rounded-t-lg overflow-hidden bg-[var(--control-bg)]">
                {previewImages.has(template.id) ? (
                  <img
                    src={previewImages.get(template.id)}
                    alt={`${template.displayName} paper template preview - ${getTypeDisplayName(template.type)} paper style`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(template.id)}
                    onLoad={(e) => {
                      // Add fade-in effect when image loads
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{ opacity: '0', transition: 'opacity 0.3s ease-in-out' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]" role="img" aria-label={`${template.displayName} template placeholder`}>
                    {getTypeIcon(template.type)}
                  </div>
                )}
              </div>
              
              {/* Mobile Template Info */}
              <div className="p-2">
                <h4 
                  className="font-medium text-[var(--text-color)] text-xs truncate"
                  title={template.tooltipText}
                >
                  {template.displayName}
                </h4>
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1" aria-hidden="true">
                  {getTypeIcon(template.type)}
                  {getTypeDisplayName(template.type)}
                </span>
                <div id={`mobile-template-${template.id}-description`} className="sr-only">
                  {template.tooltipText}
                </div>
              </div>

              {/* Gear-2 Overlay for Lined Templates (Mobile) */}
              {template.type === 'lined' && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                  <div className="text-center text-white">
                    <div className="text-sm font-bold mb-1">Gear-2</div>
                    <div className="text-xs opacity-80">Soon</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Mobile scroll indicator */}
        <div className="flex justify-center mt-2" role="status" aria-live="polite">
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Swipe to browse</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Template count indicator */}
      <div className="mt-4 text-center" role="status" aria-live="polite">
        <span className="text-xs text-[var(--text-muted)]">
          {templates.length} template{templates.length !== 1 ? 's' : ''} available
        </span>
      </div>
    </div>
  );
};

export default PaperTemplateSelector;
