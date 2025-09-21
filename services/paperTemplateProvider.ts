/**
 * Paper Template Provider
 * Manages paper template discovery and retrieval for the Gear-1 handwriting feature
 */

import { TemplateLoadError, TemplateNotFoundError, TemplateNetworkError } from '../types/errors';
import { PaperTemplate, ITemplateProvider } from '../types/core';

export type { PaperTemplate, ITemplateProvider } from '../types/core';

export interface TemplateProviderOptions {
  enableFallback: boolean;
  fallbackTemplateId: string;
  enableValidation: boolean;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Paper template configuration based on template/ directory files
 * Requirements: 2.1, 2.2 - Display all available templates from template/ directory
 */
export const PAPER_TEMPLATES: PaperTemplate[] = [
  {
    id: 'blank-1',
    name: 'Classic Blank',
    filename: 'blank-1.jpeg',
    type: 'blank'
  },
  {
    id: 'blank-2',
    name: 'Vintage Blank',
    filename: 'blank-2.avif',
    type: 'blank'
  },
  {
    id: 'blank-3',
    name: 'Modern Blank',
    filename: 'blank-3.jpg',
    type: 'blank'
  },
  {
    id: 'lined-1',
    name: 'College Ruled',
    filename: 'lined-1.avif',
    type: 'lined'
  },
  {
    id: 'lined-2',
    name: 'Wide Ruled',
    filename: 'lined-2.avif',
    type: 'lined'
  },
  {
    id: 'lined-3',
    name: 'Narrow Ruled',
    filename: 'lined-3.jpg',
    type: 'lined'
  }
];

/**
 * Concrete implementation of ITemplateProvider with enhanced error handling
 * Provides access to paper templates with discovery, retrieval, and fallback capabilities
 * Requirements: 2.1, 2.2, 2.6 - Template discovery and retrieval
 * Requirements: 6.1, 6.5 - Error handling and fallback mechanisms
 */
export class TemplateProvider implements ITemplateProvider {
  private templates: PaperTemplate[];
  private options: TemplateProviderOptions;
  private validationCache: Map<string, boolean> = new Map();

  constructor(
    templates: PaperTemplate[] = PAPER_TEMPLATES,
    options: Partial<TemplateProviderOptions> = {}
  ) {
    this.templates = templates;
    this.options = {
      enableFallback: options.enableFallback ?? true,
      fallbackTemplateId: options.fallbackTemplateId ?? 'blank-1',
      enableValidation: options.enableValidation ?? true,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      ...options
    };
  }

  /**
   * Get all available paper templates
   * Requirements: 2.1 - Display all available templates from template/ directory
   */
  async getAvailableTemplates(): Promise<PaperTemplate[]> {
    // Return a copy to prevent external modification
    return [...this.templates];
  }

  /**
   * Get a specific template by ID with validation
   * Requirements: 2.2 - Template selection and retrieval
   * Requirements: 6.5 - Error handling for template issues
   */
  async getTemplate(id: string): Promise<PaperTemplate | null> {
    const template = this.templates.find(t => t.id === id);
    if (!template) {
      return null;
    }

    // Validate template if validation is enabled
    if (this.options.enableValidation) {
      try {
        const isValid = await this.validateTemplate(template);
        if (!isValid) {
          console.warn(`Template ${id} failed validation`);
          return null;
        }
      } catch (error) {
        console.warn(`Template ${id} validation error:`, error);
        return null;
      }
    }

    return { ...template };
  }

  /**
   * Get template with automatic fallback to default template
   * Requirements: 2.1, 2.2 - Template loading with fallback
   * Requirements: 6.1, 6.5 - Error handling and fallback mechanisms
   */
  async getTemplateWithFallback(id: string): Promise<PaperTemplate> {
    try {
      // Try to get the requested template
      const template = await this.getTemplate(id);
      if (template) {
        return template;
      }

      // Template not found, try fallback if enabled
      if (this.options.enableFallback && id !== this.options.fallbackTemplateId) {
        console.warn(`Template ${id} not found, falling back to ${this.options.fallbackTemplateId}`);
        const fallbackTemplate = await this.getTemplate(this.options.fallbackTemplateId);
        if (fallbackTemplate) {
          return fallbackTemplate;
        }
      }

      // If fallback also fails, throw error
      throw new TemplateNotFoundError(id);
    } catch (error) {
      if (error instanceof TemplateNotFoundError) {
        throw error;
      }
      throw new TemplateLoadError(id, error as Error);
    }
  }

  /**
   * Validate that a template's image file is accessible
   * Requirements: 2.2, 2.3 - Template validation
   * Requirements: 6.5 - Error handling for template issues
   */
  async validateTemplate(template: PaperTemplate): Promise<boolean> {
    // Check cache first
    const cacheKey = `${template.id}_${template.filename}`;
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    // Handle empty filename
    if (!template.filename || template.filename.trim() === '') {
      this.validationCache.set(cacheKey, false);
      return false;
    }

    try {
      const templateUrl = `/template/${template.filename}`;
      const isValid = await this.validateTemplateUrl(templateUrl);
      
      // Cache the result
      this.validationCache.set(cacheKey, isValid);
      return isValid;
    } catch (error) {
      console.warn(`Template validation failed for ${template.id}:`, error);
      this.validationCache.set(cacheKey, false);
      
      // Re-throw network errors for proper error handling in tests
      if (error instanceof TemplateNetworkError) {
        throw error;
      }
      
      return false;
    }
  }

  /**
   * Validate template URL accessibility with retry logic
   * Requirements: 6.5 - Network error handling and retry mechanisms
   */
  private async validateTemplateUrl(url: string): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.options.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
        
        // If it's a client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          return false;
        }
        
        lastError = new TemplateNetworkError(url, response.status);
      } catch (error) {
        lastError = error as Error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < this.options.retryAttempts - 1) {
        await this.delay(this.options.retryDelay * Math.pow(2, attempt));
      }
    }

    // All attempts failed
    throw new TemplateNetworkError(url, undefined, lastError || undefined);
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get templates by type (blank or lined)
   * Additional utility method for filtering templates
   */
  async getTemplatesByType(type: 'blank' | 'lined'): Promise<PaperTemplate[]> {
    return this.templates.filter(t => t.type === type);
  }

  /**
   * Check if a template exists
   * Utility method for validation
   */
  hasTemplate(id: string): boolean {
    return this.templates.some(t => t.id === id);
  }

  /**
   * Get default fallback template
   * Requirements: 6.1, 6.5 - Fallback mechanism
   */
  getDefaultTemplate(): PaperTemplate {
    const defaultTemplate = this.templates.find(t => t.id === this.options.fallbackTemplateId);
    if (!defaultTemplate) {
      // If even the fallback template is missing, return the first available template
      if (this.templates.length > 0) {
        return { ...this.templates[0] };
      }
      
      // Last resort: create a minimal template
      return {
        id: 'emergency-blank',
        name: 'Emergency Blank',
        filename: 'blank-1.jpeg',
        type: 'blank'
      };
    }
    return { ...defaultTemplate };
  }

  /**
   * Clear validation cache
   * Utility method for cache management
   */
  clearValidationCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get validation cache statistics
   */
  getValidationCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.validationCache.size,
      hitRate: 0 // Could be enhanced to track hit/miss ratio
    };
  }

  /**
   * Prevalidate all templates
   * Requirements: 2.1, 2.2 - Template validation
   */
  async prevalidateTemplates(): Promise<{ valid: PaperTemplate[]; invalid: PaperTemplate[] }> {
    const valid: PaperTemplate[] = [];
    const invalid: PaperTemplate[] = [];

    for (const template of this.templates) {
      try {
        const isValid = await this.validateTemplate(template);
        if (isValid) {
          valid.push(template);
        } else {
          invalid.push(template);
        }
      } catch (error) {
        console.warn(`Prevalidation failed for template ${template.id}:`, error);
        invalid.push(template);
      }
    }

    return { valid, invalid };
  }
}
