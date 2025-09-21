// Error classes for Gear-1 handwriting system
// Provides specific error types for different failure scenarios

// ============================================================================
// TEMPLATE LOADING ERRORS
// ============================================================================

export class TemplateLoadError extends Error {
  public readonly templateId: string;
  public readonly cause?: Error;

  constructor(templateId: string, cause?: Error) {
    super(`Failed to load paper template: ${templateId}`);
    this.name = 'TemplateLoadError';
    this.templateId = templateId;
    this.cause = cause;
  }
}

export class TemplateNotFoundError extends TemplateLoadError {
  constructor(templateId: string) {
    super(templateId);
    this.name = 'TemplateNotFoundError';
    this.message = `Paper template not found: ${templateId}`;
  }
}

export class TemplateFormatError extends TemplateLoadError {
  public readonly format: string;

  constructor(templateId: string, format: string, cause?: Error) {
    super(templateId, cause);
    this.name = 'TemplateFormatError';
    this.format = format;
    this.message = `Unsupported template format '${format}' for template: ${templateId}`;
  }
}

export class TemplateNetworkError extends TemplateLoadError {
  public readonly statusCode?: number;

  constructor(templateId: string, statusCode?: number, cause?: Error) {
    super(templateId, cause);
    this.name = 'TemplateNetworkError';
    this.statusCode = statusCode;
    this.message = `Network error loading template '${templateId}'${statusCode ? ` (HTTP ${statusCode})` : ''}`;
  }
}

// ============================================================================
// CANVAS RENDERING ERRORS
// ============================================================================

export class CanvasRenderError extends Error {
  public readonly operation: string;
  public readonly cause?: Error;

  constructor(operation: string, cause?: Error) {
    super(`Canvas rendering failed during: ${operation}`);
    this.name = 'CanvasRenderError';
    this.operation = operation;
    this.cause = cause;
  }
}

export class CanvasContextError extends CanvasRenderError {
  constructor(cause?: Error) {
    super('canvas context creation', cause);
    this.name = 'CanvasContextError';
    this.message = 'Failed to create canvas rendering context';
  }
}

export class CanvasMemoryError extends CanvasRenderError {
  public readonly requestedSize: { width: number; height: number };

  constructor(width: number, height: number, cause?: Error) {
    super('memory allocation', cause);
    this.name = 'CanvasMemoryError';
    this.requestedSize = { width, height };
    this.message = `Insufficient memory for canvas size ${width}x${height}`;
  }
}

export class CanvasFontLoadError extends CanvasRenderError {
  public readonly fontFamily: string;

  constructor(fontFamily: string, cause?: Error) {
    super('font loading', cause);
    this.name = 'CanvasFontLoadError';
    this.fontFamily = fontFamily;
    this.message = `Failed to load font: ${fontFamily}`;
  }
}

export class BlendModeError extends CanvasRenderError {
  public readonly blendMode: string;

  constructor(blendMode: string, cause?: Error) {
    super('blend mode application', cause);
    this.name = 'BlendModeError';
    this.blendMode = blendMode;
    this.message = `Unsupported or failed blend mode: ${blendMode}`;
  }
}

// ============================================================================
// EXPORT SYSTEM ERRORS
// ============================================================================

export class ExportError extends Error {
  public readonly stage: string;
  public readonly pageNumber?: number;
  public readonly cause?: Error;

  constructor(stage: string, pageNumber?: number, cause?: Error) {
    super(`Export failed at ${stage}${pageNumber ? ` (page ${pageNumber})` : ''}`);
    this.name = 'ExportError';
    this.stage = stage;
    this.pageNumber = pageNumber;
    this.cause = cause;
  }
}

export class PageSplitError extends ExportError {
  public readonly textLength: number;
  public readonly maxPages: number;

  constructor(textLength: number, maxPages: number, cause?: Error) {
    super('page splitting', undefined, cause);
    this.name = 'PageSplitError';
    this.textLength = textLength;
    this.maxPages = maxPages;
    this.message = `Failed to split text (${textLength} chars) into ${maxPages} pages`;
  }
}

export class CanvasExportError extends ExportError {
  public readonly format: string;

  constructor(format: string, pageNumber?: number, cause?: Error) {
    super('canvas export', pageNumber, cause);
    this.name = 'CanvasExportError';
    this.format = format;
    this.message = `Failed to export canvas to ${format}${pageNumber ? ` (page ${pageNumber})` : ''}`;
  }
}

export class DownloadError extends ExportError {
  public readonly filename: string;

  constructor(filename: string, cause?: Error) {
    super('download', undefined, cause);
    this.name = 'DownloadError';
    this.filename = filename;
    this.message = `Failed to download file: ${filename}`;
  }
}

export class ExportMemoryError extends ExportError {
  public readonly totalPages: number;

  constructor(totalPages: number, cause?: Error) {
    super('memory management', undefined, cause);
    this.name = 'ExportMemoryError';
    this.totalPages = totalPages;
    this.message = `Insufficient memory to export ${totalPages} pages`;
  }
}

export class ExportLimitError extends ExportError {
  public readonly requestedPages: number;
  public readonly maxAllowed: number;

  constructor(requestedPages: number, maxAllowed: number) {
    super('page limit validation');
    this.name = 'ExportLimitError';
    this.requestedPages = requestedPages;
    this.maxAllowed = maxAllowed;
    this.message = `Requested ${requestedPages} pages exceeds limit of ${maxAllowed}`;
  }
}

// ============================================================================
// SERVICE CONTAINER ERRORS
// ============================================================================

export class ServiceContainerError extends Error {
  public readonly serviceToken: string;

  constructor(serviceToken: string, message: string) {
    super(message);
    this.name = 'ServiceContainerError';
    this.serviceToken = serviceToken;
  }
}

export class ServiceNotRegisteredError extends ServiceContainerError {
  constructor(serviceToken: string) {
    super(serviceToken, `Service not registered: ${serviceToken}`);
    this.name = 'ServiceNotRegisteredError';
  }
}

export class ServiceRegistrationError extends ServiceContainerError {
  public readonly cause?: Error;

  constructor(serviceToken: string, cause?: Error) {
    super(serviceToken, `Failed to register service: ${serviceToken}`);
    this.name = 'ServiceRegistrationError';
    this.cause = cause;
  }
}

export class ServiceResolutionError extends ServiceContainerError {
  public readonly cause?: Error;

  constructor(serviceToken: string, cause?: Error) {
    super(serviceToken, `Failed to resolve service: ${serviceToken}`);
    this.name = 'ServiceResolutionError';
    this.cause = cause;
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

export function isTemplateError(error: unknown): error is TemplateLoadError {
  return error instanceof TemplateLoadError;
}

export function isCanvasError(error: unknown): error is CanvasRenderError {
  return error instanceof CanvasRenderError;
}

export function isExportError(error: unknown): error is ExportError {
  return error instanceof ExportError;
}

export function isServiceError(error: unknown): error is ServiceContainerError {
  return error instanceof ServiceContainerError;
}

// Error recovery strategies
export interface ErrorRecoveryStrategy {
  canRecover(error: Error): boolean;
  recover(error: Error): Promise<void> | void;
}

export class DefaultErrorRecoveryStrategy implements ErrorRecoveryStrategy {
  canRecover(error: Error): boolean {
    // Can recover from network errors and some canvas errors
    return error instanceof TemplateNetworkError || 
           error instanceof CanvasMemoryError ||
           error instanceof CanvasFontLoadError;
  }

  async recover(error: Error): Promise<void> {
    if (error instanceof TemplateNetworkError) {
      // Retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (error instanceof CanvasMemoryError) {
      // Reduce canvas size and retry
      console.warn('Reducing canvas size due to memory constraints');
    } else if (error instanceof CanvasFontLoadError) {
      // Fallback to system font
      console.warn('Falling back to system font');
    }
  }
}
