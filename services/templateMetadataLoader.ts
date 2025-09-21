/**
 * Template Metadata Loader Service
 * Loads and validates template metadata for line alignment
 * Requirements: 4.1, 4.2, 4.5
 */

import { 
  TemplateMetadata, 
  ITemplateMetadataLoader, 
  TemplateMetadataError 
} from '../types/lineAlignment';

export class TemplateMetadataLoader implements ITemplateMetadataLoader {
  private metadataCache: Map<string, TemplateMetadata> = new Map();
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/template/') {
    this.baseUrl = baseUrl;
  }

  /**
   * Load metadata for a specific template
   * Requirements: 4.1, 4.2 - Load template metadata with line spacing and margins
   */
  async loadMetadata(templateId: string): Promise<TemplateMetadata> {
    // Check cache first
    if (this.metadataCache.has(templateId)) {
      return this.metadataCache.get(templateId)!;
    }

    try {
      const metadataUrl = `${this.baseUrl}${templateId}.json`;
      const response = await fetch(metadataUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new TemplateMetadataError(
            templateId,
            'not_found',
            `Metadata file not found for template: ${templateId}`
          );
        }
        throw new TemplateMetadataError(
          templateId,
          'load_error',
          `Failed to load metadata: HTTP ${response.status}`
        );
      }

      const metadata: TemplateMetadata = await response.json();
      
      // Validate the loaded metadata
      if (!this.validateMetadata(metadata)) {
        throw new TemplateMetadataError(
          templateId,
          'invalid',
          `Invalid metadata structure for template: ${templateId}`
        );
      }

      // Ensure the ID matches
      if (metadata.id !== templateId) {
        throw new TemplateMetadataError(
          templateId,
          'invalid',
          `Metadata ID mismatch: expected ${templateId}, got ${metadata.id}`
        );
      }

      // Cache the validated metadata
      this.metadataCache.set(templateId, metadata);
      return metadata;

    } catch (error) {
      if (error instanceof TemplateMetadataError) {
        throw error;
      }
      
      // Handle JSON parsing errors specifically
      if (error instanceof SyntaxError) {
        throw new TemplateMetadataError(
          templateId,
          'invalid',
          `Invalid JSON in metadata file: ${error.message}`,
          error
        );
      }
      
      throw new TemplateMetadataError(
        templateId,
        'load_error',
        `Failed to load template metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load metadata for all available lined templates
   * Requirements: 4.1, 4.2 - Load all template metadata
   */
  async loadAllMetadata(): Promise<TemplateMetadata[]> {
    const templateIds = ['lined-1', 'lined-2', 'lined-3'];
    const metadataPromises = templateIds.map(id => 
      this.loadMetadata(id).catch(error => {
        console.warn(`Failed to load metadata for ${id}:`, error);
        return null;
      })
    );

    const results = await Promise.all(metadataPromises);
    return results.filter((metadata): metadata is TemplateMetadata => metadata !== null);
  }

  /**
   * Validate metadata structure and required fields
   * Requirements: 4.2, 4.5 - Validate template configuration
   */
  validateMetadata(metadata: any): metadata is TemplateMetadata {
    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    const requiredFields = [
      'id', 'name', 'type', 'lineHeight', 'marginTop', 'marginLeft',
      'marginRight', 'marginBottom', 'lineSpacing', 'lineColor',
      'hasMarginLine', 'marginLinePosition', 'marginLineColor',
      'baselineOffset', 'description'
    ];

    // Check all required fields exist
    for (const field of requiredFields) {
      if (!(field in metadata)) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate field types and values
    if (typeof metadata.id !== 'string' || metadata.id.trim() === '') {
      console.warn('Invalid id field');
      return false;
    }

    if (typeof metadata.name !== 'string' || metadata.name.trim() === '') {
      console.warn('Invalid name field');
      return false;
    }

    if (metadata.type !== 'lined' && metadata.type !== 'blank') {
      console.warn('Invalid type field');
      return false;
    }

    // Validate numeric fields
    const numericFields = [
      'lineHeight', 'marginTop', 'marginLeft', 'marginRight', 
      'marginBottom', 'lineSpacing', 'marginLinePosition', 'baselineOffset'
    ];

    for (const field of numericFields) {
      if (typeof metadata[field] !== 'number' || metadata[field] < 0) {
        console.warn(`Invalid numeric field: ${field}`);
        return false;
      }
    }

    // Validate color fields (basic hex color validation)
    const colorFields = ['lineColor', 'marginLineColor'];
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    for (const field of colorFields) {
      if (typeof metadata[field] !== 'string' || !hexColorRegex.test(metadata[field])) {
        console.warn(`Invalid color field: ${field}`);
        return false;
      }
    }

    // Validate boolean fields
    if (typeof metadata.hasMarginLine !== 'boolean') {
      console.warn('Invalid hasMarginLine field');
      return false;
    }

    if (typeof metadata.description !== 'string') {
      console.warn('Invalid description field');
      return false;
    }

    // Validate logical constraints
    if (metadata.lineHeight <= 0 || metadata.lineSpacing <= 0) {
      console.warn('Line height and spacing must be positive');
      return false;
    }

    if (metadata.baselineOffset >= metadata.lineHeight) {
      console.warn('Baseline offset should be less than line height');
      return false;
    }

    return true;
  }

  /**
   * Check if metadata exists for a template
   * Requirements: 4.5 - Error handling for missing metadata
   */
  async hasMetadata(templateId: string): Promise<boolean> {
    try {
      await this.loadMetadata(templateId);
      return true;
    } catch (error) {
      if (error instanceof TemplateMetadataError && error.type === 'not_found') {
        return false;
      }
      // For other errors, we can't be sure, so return false
      return false;
    }
  }

  /**
   * Clear the metadata cache
   */
  clearCache(): void {
    this.metadataCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.metadataCache.size,
      keys: Array.from(this.metadataCache.keys())
    };
  }

  /**
   * Preload metadata for all templates
   * Requirements: 4.1, 4.2 - Preload template metadata for performance
   */
  async preloadMetadata(): Promise<{ loaded: string[]; failed: string[] }> {
    const templateIds = ['lined-1', 'lined-2', 'lined-3'];
    const loaded: string[] = [];
    const failed: string[] = [];

    for (const templateId of templateIds) {
      try {
        await this.loadMetadata(templateId);
        loaded.push(templateId);
      } catch (error) {
        console.warn(`Failed to preload metadata for ${templateId}:`, error);
        failed.push(templateId);
      }
    }

    return { loaded, failed };
  }
}
