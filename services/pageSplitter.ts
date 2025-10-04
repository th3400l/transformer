import { IPageSplitter, PageSplitOptions, PageSplitResult } from '../types/core';

/**
 * Implementation of IPageSplitter for text pagination with configurable limits
 * Handles splitting text into pages while respecting word boundaries and page limits
 */
export class PageSplitter implements IPageSplitter {
  private readonly defaultWordsPerPage = 250;
  private readonly maxPages = 10;

  /**
   * Splits text into pages based on word count and page limits
   * @param text - The text to split into pages
   * @param options - Configuration options for page splitting
   * @returns PageSplitResult with pages and metadata
   */
  splitTextIntoPages(text: string, options?: PageSplitOptions): PageSplitResult {
    const wordsPerPage = options?.wordsPerPage || this.defaultWordsPerPage;
    const maxPages = options?.maxPages || this.maxPages;
    const shouldTruncate = options?.shouldTruncate !== false; // Default to true

    if (!text || text.trim().length === 0) {
      return {
        pages: [],
        totalPages: 0,
        wordsPerPage,
        maxPagesReached: false,
        truncated: false
      };
    }

    // Split text into words while preserving whitespace structure
    const words = this.splitIntoWords(text);
    const pages: string[] = [];
    let currentPage: string[] = [];
    let wordCount = 0;
    let totalWordsProcessed = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check if adding this word would exceed words per page
      if (wordCount >= wordsPerPage && currentPage.length > 0) {
        // Complete current page
        pages.push(this.reconstructText(currentPage));
        currentPage = [];
        wordCount = 0;

        // Check if we've reached max pages
        if (shouldTruncate && pages.length >= maxPages) {
          // Count remaining actual words
          const remainingTokens = words.slice(i);
          const remainingWords = remainingTokens.filter(token => this.isWord(token)).length;
          
          return {
            pages,
            totalPages: pages.length,
            wordsPerPage,
            maxPagesReached: true,
            truncated: true,
            remainingWords
          };
        }
      }

      currentPage.push(word);
      // Only count actual words, not whitespace
      if (this.isWord(word)) {
        wordCount++;
        totalWordsProcessed++;
      }
    }

    // Add final page if it has content
    if (currentPage.length > 0) {
      pages.push(this.reconstructText(currentPage));
    }

    return {
      pages,
      totalPages: pages.length,
      wordsPerPage,
      maxPagesReached: shouldTruncate && pages.length >= maxPages,
      truncated: false
    };
  }

  /**
   * Estimates the number of pages needed for given text
   * @param text - Text to analyze
   * @param wordsPerPage - Words per page limit
   * @returns Estimated page count
   */
  estimatePageCount(text: string, wordsPerPage?: number): number {
    const limit = wordsPerPage || this.defaultWordsPerPage;
    const words = this.splitIntoWords(text);
    const actualWords = words.filter(word => this.isWord(word));
    return Math.ceil(actualWords.length / limit);
  }

  /**
   * Splits text into words while preserving whitespace and punctuation
   * @param text - Text to split
   * @returns Array of word tokens including whitespace
   */
  private splitIntoWords(text: string): string[] {
    // Split on whitespace but preserve the whitespace
    const tokens: string[] = [];
    let currentToken = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (/\s/.test(char)) {
        // Whitespace character
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        // Collect consecutive whitespace
        let whitespace = char;
        while (i + 1 < text.length && /\s/.test(text[i + 1])) {
          i++;
          whitespace += text[i];
        }
        tokens.push(whitespace);
      } else {
        currentToken += char;
      }
    }
    
    // Add final token if exists
    if (currentToken) {
      tokens.push(currentToken);
    }
    
    return tokens;
  }

  /**
   * Reconstructs text from word tokens
   * @param tokens - Array of word tokens
   * @returns Reconstructed text
   */
  private reconstructText(tokens: string[]): string {
    return tokens.join('');
  }

  /**
   * Determines if a token is an actual word (not whitespace)
   * @param token - Token to check
   * @returns True if token is a word
   */
  private isWord(token: string): boolean {
    return /\S/.test(token);
  }
}
