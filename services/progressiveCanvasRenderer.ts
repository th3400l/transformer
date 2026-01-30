// Progressive canvas rendering system for large text
// Requirements: 1.2, 5.1, 5.2, 5.3, 5.4, 5.5

import { 
  RenderingConfig,
  ITextVariationEngine,
  IPaperTextureManager
} from '../types';
import { CanvasRenderer } from './canvasRenderer';
import { CanvasRenderError } from '../types/errors';

/**
 * Configuration for progressive rendering
 */
export interface ProgressiveRenderConfig {
  /** Number of characters to render per chunk */
  chunkSize: number;
  /** Delay between chunks in milliseconds */
  chunkDelay: number;
  /** Render immediately if text length is below this threshold */
  priorityThreshold: number;
  /** Enable progressive rendering (can be disabled for testing) */
  enabled: boolean;
}

/**
 * Default progressive rendering configuration
 */
export const DEFAULT_PROGRESSIVE_CONFIG: ProgressiveRenderConfig = {
  chunkSize: 500,           // 500 characters per chunk
  chunkDelay: 16,           // ~60fps (one frame)
  priorityThreshold: 1000,  // Render immediately if < 1000 characters
  enabled: true
};

/**
 * Progress callback for progressive rendering
 */
export type ProgressCallback = (progress: {
  currentChunk: number;
  totalChunks: number;
  charactersRendered: number;
  totalCharacters: number;
  percentComplete: number;
}) => void;

/**
 * Progressive canvas renderer that renders large text in chunks
 * to prevent UI blocking and improve perceived performance
 * Requirements: 1.2, 5.1, 5.2, 5.3, 5.4, 5.5
 */
export class ProgressiveCanvasRenderer extends CanvasRenderer {
  private progressiveConfig: ProgressiveRenderConfig;
  private isCancelled: boolean = false;

  /**
   * Constructor with progressive rendering configuration
   * @param textEngine - Text variation engine
   * @param textureManager - Paper texture manager
   * @param progressiveConfig - Progressive rendering configuration
   */
  constructor(
    textEngine: ITextVariationEngine,
    textureManager: IPaperTextureManager,
    progressiveConfig: Partial<ProgressiveRenderConfig> = {}
  ) {
    super(textEngine, textureManager);
    this.progressiveConfig = {
      ...DEFAULT_PROGRESSIVE_CONFIG,
      ...progressiveConfig
    };
  }

  /**
   * Update progressive rendering configuration
   * @param config - Partial configuration to update
   */
  setProgressiveConfig(config: Partial<ProgressiveRenderConfig>): void {
    this.progressiveConfig = {
      ...this.progressiveConfig,
      ...config
    };
  }

  /**
   * Get current progressive rendering configuration
   */
  getProgressiveConfig(): ProgressiveRenderConfig {
    return { ...this.progressiveConfig };
  }

  /**
   * Cancel ongoing progressive rendering
   */
  cancelRendering(): void {
    this.isCancelled = true;
  }

  /**
   * Render with progressive rendering support
   * Requirements: 1.2, 5.1, 5.2, 5.3, 5.4, 5.5
   * @param config - Rendering configuration
   * @param onProgress - Optional progress callback
   * @returns Promise resolving to rendered canvas
   */
  async renderProgressive(
    config: RenderingConfig,
    onProgress?: ProgressCallback
  ): Promise<HTMLCanvasElement> {
    // Reset cancellation flag
    this.isCancelled = false;

    // If progressive rendering is disabled, use standard rendering
    if (!this.progressiveConfig.enabled) {
      return this.render(config);
    }

    const text = config.text || '';
    const textLength = text.length;

    // If text is small enough, render immediately
    if (textLength < this.progressiveConfig.priorityThreshold) {
      return this.renderImmediate(config);
    }

    // Render progressively for large text
    return this.renderInChunks(config, onProgress);
  }

  /**
   * Render text immediately without chunking
   * Requirements: 1.2 - Fast rendering for small text
   * @param config - Rendering configuration
   * @returns Promise resolving to rendered canvas
   */
  private async renderImmediate(config: RenderingConfig): Promise<HTMLCanvasElement> {
    return this.render(config);
  }

  /**
   * Render text in chunks for progressive display
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Chunk-based rendering
   * @param config - Rendering configuration
   * @param onProgress - Optional progress callback
   * @returns Promise resolving to rendered canvas
   */
  private async renderInChunks(
    config: RenderingConfig,
    onProgress?: ProgressCallback
  ): Promise<HTMLCanvasElement> {
    const text = config.text || '';
    const chunks = this.splitIntoChunks(text);
    const totalChunks = chunks.length;
    const totalCharacters = text.length;

    // Validate configuration
    this.validateConfig(config);

    // Render first chunk immediately to show something quickly
    let canvas: HTMLCanvasElement;
    try {
      const firstChunkConfig = {
        ...config,
        text: chunks[0]
      };
      canvas = await this.render(firstChunkConfig);

      // Report progress for first chunk
      if (onProgress) {
        onProgress({
          currentChunk: 1,
          totalChunks,
          charactersRendered: chunks[0].length,
          totalCharacters,
          percentComplete: (chunks[0].length / totalCharacters) * 100
        });
      }

      // Check for cancellation
      if (this.isCancelled) {
        throw new CanvasRenderError('Progressive rendering cancelled');
      }

    } catch (error) {
      throw new CanvasRenderError('Failed to render first chunk', error as Error);
    }

    // Render remaining chunks progressively
    let charactersRendered = chunks[0].length;

    for (let i = 1; i < totalChunks; i++) {
      // Check for cancellation before each chunk
      if (this.isCancelled) {
        throw new CanvasRenderError('Progressive rendering cancelled');
      }

      // Wait for specified delay between chunks
      await this.delay(this.progressiveConfig.chunkDelay);

      try {
        // Accumulate text up to current chunk
        const accumulatedText = chunks.slice(0, i + 1).join('');
        const chunkConfig = {
          ...config,
          text: accumulatedText
        };

        // Re-render with accumulated text
        canvas = await this.render(chunkConfig);

        charactersRendered += chunks[i].length;

        // Report progress
        if (onProgress) {
          onProgress({
            currentChunk: i + 1,
            totalChunks,
            charactersRendered,
            totalCharacters,
            percentComplete: (charactersRendered / totalCharacters) * 100
          });
        }

      } catch (error) {
        console.warn(`Failed to render chunk ${i + 1}/${totalChunks}:`, error);
        // Continue with previous canvas state on error
      }
    }

    return canvas;
  }

  /**
   * Split text into chunks for progressive rendering
   * Requirements: 5.3 - Text chunking strategy
   * @param text - Text to split
   * @returns Array of text chunks
   */
  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    const chunkSize = this.progressiveConfig.chunkSize;

    // Split by paragraphs first to maintain structure
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed chunk size, save current chunk
      if (currentChunk.length > 0 && currentChunk.length + paragraph.length > chunkSize) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
      }

      // If current chunk is too large, split it further
      while (currentChunk.length > chunkSize) {
        // Try to split at sentence boundaries
        const splitPoint = this.findSplitPoint(currentChunk, chunkSize);
        chunks.push(currentChunk.substring(0, splitPoint));
        currentChunk = currentChunk.substring(splitPoint).trim();
      }
    }

    // Add remaining text as final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Find optimal split point in text near target position
   * Prefers sentence boundaries, then word boundaries
   * Requirements: 5.3 - Smart text splitting
   * @param text - Text to split
   * @param targetPosition - Target split position
   * @returns Optimal split position
   */
  private findSplitPoint(text: string, targetPosition: number): number {
    // Don't split beyond text length
    if (targetPosition >= text.length) {
      return text.length;
    }

    // Look for sentence boundary within 100 characters of target
    const searchStart = Math.max(0, targetPosition - 100);
    const searchEnd = Math.min(text.length, targetPosition + 100);
    const searchText = text.substring(searchStart, searchEnd);

    // Try to find sentence ending (. ! ?)
    const sentenceMatch = searchText.match(/[.!?]\s+/g);
    if (sentenceMatch) {
      const lastSentenceEnd = searchText.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
      if (lastSentenceEnd !== -1) {
        return searchStart + lastSentenceEnd + sentenceMatch[sentenceMatch.length - 1].length;
      }
    }

    // Fall back to word boundary
    const wordBoundary = text.lastIndexOf(' ', targetPosition);
    if (wordBoundary !== -1 && wordBoundary > targetPosition - 100) {
      return wordBoundary + 1;
    }

    // Last resort: split at target position
    return targetPosition;
  }

  /**
   * Delay helper for progressive rendering
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      // Use requestAnimationFrame for smoother rendering
      if (ms <= 16) {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(resolve, ms);
      }
    });
  }

  /**
   * Estimate rendering time for given text length
   * @param textLength - Length of text to render
   * @returns Estimated time in milliseconds
   */
  estimateRenderTime(textLength: number): number {
    if (textLength < this.progressiveConfig.priorityThreshold) {
      // Small text renders immediately
      return 500; // ~500ms for small text
    }

    // Calculate number of chunks
    const numChunks = Math.ceil(textLength / this.progressiveConfig.chunkSize);
    
    // Estimate time per chunk (base render time + delay)
    const timePerChunk = 300 + this.progressiveConfig.chunkDelay;
    
    return numChunks * timePerChunk;
  }
}

/**
 * Create a progressive canvas renderer with default configuration
 * @param textEngine - Text variation engine
 * @param textureManager - Paper texture manager
 * @param config - Optional progressive rendering configuration
 * @returns Progressive canvas renderer instance
 */
export function createProgressiveCanvasRenderer(
  textEngine: ITextVariationEngine,
  textureManager: IPaperTextureManager,
  config?: Partial<ProgressiveRenderConfig>
): ProgressiveCanvasRenderer {
  return new ProgressiveCanvasRenderer(textEngine, textureManager, config);
}
