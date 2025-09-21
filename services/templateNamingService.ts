/**
 * Template Naming Service
 * Provides simplified naming for paper templates with backward compatibility
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { PaperTemplate } from './paperTemplateProvider';

export interface ITemplateNamingService {
  getSimplifiedName(template: PaperTemplate): string;
  getDisplayName(template: PaperTemplate): string;
  getTooltipText(template: PaperTemplate): string;
  mapLegacyNames(templates: PaperTemplate[]): EnhancedPaperTemplate[];
}

export interface EnhancedPaperTemplate extends PaperTemplate {
  simplifiedName: string;
  displayName: string;
  tooltipText: string;
}

export interface SimplifiedNaming {
  lined: (index: number) => string;
  blank: (index: number) => string;
}

/**
 * Template Naming Service Implementation
 * Handles simplified naming (l-1, l-2, b-1, b-2) while maintaining backward compatibility
 * Requirements: 3.1 - Lined templates named as "l-1", "l-2", "l-3", etc.
 * Requirements: 3.2 - Blank templates named as "b-1", "b-2", "b-3", etc.
 * Requirements: 3.3 - Display simplified names as tooltips on hover
 * Requirements: 3.4 - Maintain mapping between simplified names and template files
 */
export class TemplateNamingService implements ITemplateNamingService {
  private namingStrategy: SimplifiedNaming;
  private templateTypeOrder: Map<string, number> = new Map();

  constructor() {
    this.namingStrategy = {
      lined: (index: number) => `Lined-${index}`,
      blank: (index: number) => `Blank-${index}`
    };
  }

  /**
   * Get simplified name for a template (l-1, l-2, b-1, b-2, etc.)
   * Requirements: 3.1, 3.2 - Generate simplified names based on template type
   */
  getSimplifiedName(template: PaperTemplate): string {
    const typeIndex = this.getTemplateTypeIndex(template);
    
    if (template.type === 'lined') {
      return this.namingStrategy.lined(typeIndex);
    } else if (template.type === 'blank') {
      return this.namingStrategy.blank(typeIndex);
    }
    
    // Fallback for unknown types
    return template.id;
  }

  /**
   * Get display name for template (uses simplified name)
   * Requirements: 3.2 - Display simplified names in template selector
   */
  getDisplayName(template: PaperTemplate): string {
    return this.getSimplifiedName(template);
  }

  /**
   * Get tooltip text showing simplified name
   * Requirements: 3.3 - Show simplified names as tooltips on hover
   */
  getTooltipText(template: PaperTemplate): string {
    const typeLabel = template.type === 'lined' ? 'Lined' : 'Blank';
    
    return `${typeLabel} Paper Template`;
  }

  /**
   * Map legacy template names to enhanced templates with simplified naming
   * Requirements: 3.4 - Maintain mapping between simplified names and template files
   */
  mapLegacyNames(templates: PaperTemplate[]): EnhancedPaperTemplate[] {
    // Reset type order tracking for consistent numbering
    this.resetTypeOrder();
    
    // Sort templates by type and then by ID for consistent ordering
    const sortedTemplates = [...templates].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.id.localeCompare(b.id);
    });

    return sortedTemplates.map(template => {
      const simplifiedName = this.getSimplifiedName(template);
      const displayName = this.getDisplayName(template);
      const tooltipText = this.getTooltipText(template);

      return {
        ...template,
        simplifiedName,
        displayName,
        tooltipText
      };
    });
  }

  /**
   * Get the index for a template within its type (1-based)
   * Used for generating consistent simplified names
   */
  private getTemplateTypeIndex(template: PaperTemplate): number {
    const key = `${template.type}_${template.id}`;
    
    if (!this.templateTypeOrder.has(key)) {
      // Count existing templates of the same type
      const existingCount = Array.from(this.templateTypeOrder.keys())
        .filter(k => k.startsWith(`${template.type}_`))
        .length;
      
      this.templateTypeOrder.set(key, existingCount + 1);
    }
    
    return this.templateTypeOrder.get(key)!;
  }

  /**
   * Reset type order tracking for consistent numbering
   */
  private resetTypeOrder(): void {
    this.templateTypeOrder.clear();
  }

  /**
   * Get all simplified names for a given template type
   * Utility method for validation and testing
   */
  getSimplifiedNamesForType(type: 'blank' | 'lined', count: number): string[] {
    const names: string[] = [];
    for (let i = 1; i <= count; i++) {
      names.push(this.namingStrategy[type](i));
    }
    return names;
  }

  /**
   * Validate simplified name format
   * Utility method for testing and validation
   */
  isValidSimplifiedName(name: string): boolean {
    const pattern = /^[bl]-\d+$/;
    return pattern.test(name);
  }

  /**
   * Parse simplified name to get type and index
   * Utility method for reverse mapping
   */
  parseSimplifiedName(simplifiedName: string): { type: 'blank' | 'lined'; index: number } | null {
    const match = simplifiedName.match(/^([bl])-(\d+)$/);
    if (!match) {
      return null;
    }

    const typeChar = match[1];
    const index = parseInt(match[2], 10);

    const type = typeChar === 'l' ? 'lined' : 'blank';
    
    return { type, index };
  }

  /**
   * Get template type display label
   * Utility method for consistent type labeling
   */
  getTypeDisplayLabel(type: 'blank' | 'lined'): string {
    return type === 'lined' ? 'Lined' : 'Blank';
  }

  /**
   * Check if template has simplified naming applied
   * Utility method for validation
   */
  hasSimplifiedNaming(template: any): template is EnhancedPaperTemplate {
    return 'simplifiedName' in template && 
           'displayName' in template && 
           'tooltipText' in template;
  }

  /**
   * Get naming statistics for debugging and monitoring
   */
  getNamingStats(templates: PaperTemplate[]): {
    totalTemplates: number;
    linedCount: number;
    blankCount: number;
    simplifiedNames: string[];
  } {
    const linedCount = templates.filter(t => t.type === 'lined').length;
    const blankCount = templates.filter(t => t.type === 'blank').length;
    
    const enhancedTemplates = this.mapLegacyNames(templates);
    const simplifiedNames = enhancedTemplates.map(t => t.simplifiedName);

    return {
      totalTemplates: templates.length,
      linedCount,
      blankCount,
      simplifiedNames
    };
  }
}

/**
 * Default instance for dependency injection
 */
export const templateNamingService = new TemplateNamingService();