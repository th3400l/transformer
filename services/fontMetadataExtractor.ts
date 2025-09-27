// Font Metadata Extractor for safe font metadata extraction
// Requirements: 2.4, 2.5, 2.6

import { FontMetadata, FontFormat } from '../types/fontStorage';

/**
 * FontMetadataExtractor provides safe extraction of font metadata
 * with security validation and sanitization
 */
export class FontMetadataExtractor {
  
  /**
   * Safely extracts metadata from font file with security validation
   * @param file - Font file to extract metadata from
   * @param fontData - Font data as ArrayBuffer
   * @returns Sanitized font metadata
   */
  async extractMetadata(file: File, fontData: ArrayBuffer): Promise<FontMetadata> {
    try {
      // Primary method: Use FontFace API for safe metadata extraction
      const metadata = await this.extractUsingFontFace(file, fontData);
      
      // Validate and sanitize all extracted data
      return this.sanitizeMetadata(metadata, file);
      
    } catch (error) {
      // Fallback to basic metadata extraction
      return this.createFallbackMetadata(file);
    }
  }

  /**
   * Extracts metadata using FontFace API (safest method)
   */
  private async extractUsingFontFace(file: File, fontData: ArrayBuffer): Promise<Partial<FontMetadata>> {
    const fontUrl = URL.createObjectURL(new Blob([fontData]));
    
    try {
      // Create temporary FontFace for metadata extraction
      const testFontFace = new FontFace('MetadataTest', `url(${fontUrl})`);
      await testFontFace.load();
      
      // Extract available metadata from FontFace
      return {
        fontFamily: testFontFace.family,
        fontWeight: testFontFace.weight,
        fontStyle: testFontFace.style,
        format: this.detectFormat(file.name, fontData)
      };
      
    } finally {
      URL.revokeObjectURL(fontUrl);
    }
  }

  /**
   * Detects font format from filename and magic numbers
   */
  private detectFormat(filename: string, fontData: ArrayBuffer): FontFormat {
    // Check magic numbers first
    const view = new DataView(fontData);
    
    try {
      const magic = view.getUint32(0);
      
      // WOFF2 magic: 'wOF2'
      if (magic === 0x774F4632) return 'woff2';
      
      // WOFF magic: 'wOFF'  
      if (magic === 0x774F4646) return 'woff';
      
      // OpenType magic: 'OTTO'
      if (magic === 0x4F54544F) return 'otf';
      
      // TrueType magic: 0x00010000
      if (magic === 0x00010000) return 'ttf';
      
    } catch (error) {
      // Fall back to filename extension
    }
    
    // Fallback to file extension
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'woff2': return 'woff2';
      case 'woff': return 'woff';
      case 'otf': return 'otf';
      case 'ttf':
      default: return 'ttf';
    }
  }

  /**
   * Sanitizes and validates extracted metadata
   */
  private sanitizeMetadata(metadata: Partial<FontMetadata>, file: File): FontMetadata {
    const baseName = this.extractBaseName(file.name);
    const rawFamily = metadata.fontFamily && metadata.fontFamily.trim() ? metadata.fontFamily : baseName;
    const normalizedFamily = this.sanitizeFontFamily(
      this.normalizeFamilyFallback(rawFamily, baseName)
    );

    return {
      originalFilename: this.sanitizeFilename(file.name),
      fontFamily: normalizedFamily,
      fontWeight: this.sanitizeFontWeight(metadata.fontWeight || 'normal'),
      fontStyle: this.sanitizeFontStyle(metadata.fontStyle || 'normal'),
      format: metadata.format || this.detectFormat(file.name, new ArrayBuffer(0)),
      characterSets: this.detectCharacterSets(metadata),
      version: this.sanitizeVersion(metadata.version)
    };
  }

  /**
   * Creates fallback metadata when extraction fails
   */
  private createFallbackMetadata(file: File): FontMetadata {
    const baseName = this.extractBaseName(file.name);
    
    return {
      originalFilename: this.sanitizeFilename(file.name),
      fontFamily: this.sanitizeFontFamily(baseName || 'Custom Font'),
      fontWeight: 'normal',
      fontStyle: 'normal',
      format: this.detectFormat(file.name, new ArrayBuffer(0)),
      characterSets: ['unknown'],
      version: undefined
    };
  }

  private normalizeFamilyFallback(fontFamily: string, fallback: string): string {
    const family = fontFamily.trim();
    const lower = family.toLowerCase();

    if (!family) {
      return fallback || 'Custom Font';
    }

    if (lower === 'metadatatest' || lower === 'custom font' || lower === 'metadata') {
      return fallback || 'Custom Font';
    }

    return family;
  }

  private extractBaseName(filename: string): string {
    return this.sanitizeFilename(filename)
      .replace(/\.[^/.]+$/, '')
      .trim();
  }

  /**
   * Security validation and sanitization methods
   */
  
  private sanitizeFilename(filename: string): string {
    // Remove dangerous characters and limit length
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/\.\./g, '_')
      .substring(0, 100)
      .trim();
  }

  private sanitizeFontFamily(fontFamily: string): string {
    // Remove quotes and dangerous characters
    return fontFamily
      .replace(/['"]/g, '')
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .substring(0, 50)
      .trim() || 'Custom Font';
  }

  private sanitizeFontWeight(fontWeight: string): string {
    // Validate against known font weights
    const validWeights = [
      'normal', 'bold', 'lighter', 'bolder',
      '100', '200', '300', '400', '500', '600', '700', '800', '900'
    ];
    
    const cleaned = fontWeight.toLowerCase().trim();
    return validWeights.includes(cleaned) ? cleaned : 'normal';
  }

  private sanitizeFontStyle(fontStyle: string): string {
    // Validate against known font styles
    const validStyles = ['normal', 'italic', 'oblique'];
    const cleaned = fontStyle.toLowerCase().trim();
    return validStyles.includes(cleaned) ? cleaned : 'normal';
  }

  private sanitizeVersion(version?: string): string | undefined {
    if (!version) return undefined;
    
    // Remove dangerous characters and limit length
    return version
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .substring(0, 20)
      .trim() || undefined;
  }

  private detectCharacterSets(metadata: Partial<FontMetadata>): string[] {
    // Basic character set detection (can be enhanced)
    const sets = ['basic-latin'];
    
    // Add more character sets based on font family hints
    const family = (metadata.fontFamily || '').toLowerCase();
    
    if (family.includes('cjk') || family.includes('chinese') || family.includes('japanese') || family.includes('korean')) {
      sets.push('cjk');
    }
    
    if (family.includes('arabic') || family.includes('persian')) {
      sets.push('arabic');
    }
    
    if (family.includes('cyrillic') || family.includes('russian')) {
      sets.push('cyrillic');
    }
    
    return sets;
  }

  /**
   * Validates that extracted metadata is safe and doesn't contain malicious content
   */
  validateMetadataSecurity(metadata: FontMetadata): boolean {
    // Check for suspicious patterns that might indicate malicious content
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i
    ];

    const textToCheck = [
      metadata.originalFilename,
      metadata.fontFamily,
      metadata.version || ''
    ].join(' ');

    return !suspiciousPatterns.some(pattern => pattern.test(textToCheck));
  }
}
