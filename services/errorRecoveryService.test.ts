/**
 * Error Recovery Service Tests
 * Tests retry logic, fallback strategies, and user-friendly error messages
 * Requirements: 5.3, 5.4, 5.5, 10.1, 10.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorRecoveryService } from './errorRecoveryService';
import {
  TemplateNetworkError,
  TemplateFormatError,
  CanvasMemoryError,
  CanvasFontLoadError,
  CanvasContextError,
  BlendModeError
} from '../types/errors';

describe('ErrorRecoveryService', () => {
  let errorRecovery: ErrorRecoveryService;

  beforeEach(() => {
    errorRecovery = new ErrorRecoveryService({
      maxRetries: 3,
      initialDelay: 100,
      backoffMultiplier: 2
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await errorRecovery.withRetry(operation, 'test-op');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptCount).toBe(1);
      expect(result.recoveryStrategy).toBe('direct');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new TemplateNetworkError('test.jpg', 500))
        .mockRejectedValueOnce(new TemplateNetworkError('test.jpg', 500))
        .mockResolvedValue('success');
      
      const result = await errorRecovery.withRetry(operation, 'test-op');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptCount).toBe(3);
      expect(result.recoveryStrategy).toBe('retry');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const error = new TemplateNetworkError('test.jpg', 500);
      const operation = vi.fn().mockRejectedValue(error);
      
      const result = await errorRecovery.withRetry(operation, 'test-op');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attemptCount).toBe(4); // Initial + 3 retries
      expect(result.recoveryStrategy).toBe('failed');
      expect(operation).toHaveBeenCalledTimes(4);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new TemplateFormatError('test.jpg', 'invalid');
      const operation = vi.fn().mockRejectedValue(error);
      
      const result = await errorRecovery.withRetry(operation, 'test-op');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attemptCount).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new TemplateNetworkError('test.jpg'))
        .mockRejectedValueOnce(new TemplateNetworkError('test.jpg'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await errorRecovery.withRetry(operation, 'test-op');
      const duration = Date.now() - startTime;
      
      // Should have delays of 100ms and 200ms = 300ms minimum
      expect(duration).toBeGreaterThanOrEqual(250);
    });
  });

  describe('getUserErrorMessage', () => {
    it('should return user-friendly message for TemplateNetworkError', () => {
      const error = new TemplateNetworkError('test.jpg', 404);
      const message = errorRecovery.getUserErrorMessage(error);
      
      expect(message.title).toBe('Network Connection Issue');
      expect(message.severity).toBe('warning');
      expect(message.recoverable).toBe(true);
      expect(message.suggestion).toContain('internet connection');
    });

    it('should return user-friendly message for TemplateFormatError', () => {
      const error = new TemplateFormatError('test.jpg', 'bmp');
      const message = errorRecovery.getUserErrorMessage(error);
      
      expect(message.title).toBe('Unsupported Template Format');
      expect(message.severity).toBe('error');
      expect(message.recoverable).toBe(true);
      expect(message.message).toContain('bmp');
    });

    it('should return user-friendly message for CanvasMemoryError', () => {
      const error = new CanvasMemoryError(4000, 3000);
      const message = errorRecovery.getUserErrorMessage(error);
      
      expect(message.title).toBe('Memory Limit Reached');
      expect(message.severity).toBe('error');
      expect(message.recoverable).toBe(true);
      expect(message.suggestion).toContain('reducing');
    });

    it('should return user-friendly message for CanvasFontLoadError', () => {
      const error = new CanvasFontLoadError('CustomFont');
      const message = errorRecovery.getUserErrorMessage(error);
      
      expect(message.title).toBe('Font Loading Failed');
      expect(message.severity).toBe('warning');
      expect(message.recoverable).toBe(true);
      expect(message.message).toContain('CustomFont');
    });

    it('should return user-friendly message for CanvasContextError', () => {
      const error = new CanvasContextError();
      const message = errorRecovery.getUserErrorMessage(error);
      
      expect(message.title).toBe('Canvas Not Supported');
      expect(message.severity).toBe('critical');
      expect(message.recoverable).toBe(false);
      expect(message.suggestion).toContain('modern browser');
    });

    it('should return user-friendly message for BlendModeError', () => {
      const error = new BlendModeError('multiply');
      const message = errorRecovery.getUserErrorMessage(error);
      
      expect(message.title).toBe('Rendering Feature Unavailable');
      expect(message.severity).toBe('info');
      expect(message.recoverable).toBe(true);
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = errorRecovery.getUserErrorMessage(error);
      
      expect(message.title).toBe('Unexpected Error');
      expect(message.severity).toBe('error');
      expect(message.message).toContain('Unknown error');
    });
  });

  describe('renderWithRecovery', () => {
    it('should succeed with primary render', async () => {
      const canvas = document.createElement('canvas');
      const primaryRender = vi.fn().mockResolvedValue(canvas);
      const fallbackRender = vi.fn();
      
      const result = await errorRecovery.renderWithRecovery(
        primaryRender,
        fallbackRender
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(canvas);
      expect(result.recoveryStrategy).toBe('primary');
      expect(primaryRender).toHaveBeenCalledTimes(1);
      expect(fallbackRender).not.toHaveBeenCalled();
    });

    it('should use fallback render on primary failure', async () => {
      const canvas = document.createElement('canvas');
      const error = new Error('Primary failed');
      const primaryRender = vi.fn().mockRejectedValue(error);
      const fallbackRender = vi.fn().mockResolvedValue(canvas);
      
      const result = await errorRecovery.renderWithRecovery(
        primaryRender,
        fallbackRender
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(canvas);
      expect(result.recoveryStrategy).toBe('fallback');
      expect(primaryRender).toHaveBeenCalledTimes(1);
      expect(fallbackRender).toHaveBeenCalledTimes(1);
      expect(fallbackRender).toHaveBeenCalledWith(error);
    });

    it('should use emergency render on fallback failure', async () => {
      const canvas = document.createElement('canvas');
      const primaryError = new Error('Primary failed');
      const fallbackError = new Error('Fallback failed');
      const primaryRender = vi.fn().mockRejectedValue(primaryError);
      const fallbackRender = vi.fn().mockRejectedValue(fallbackError);
      const emergencyRender = vi.fn().mockResolvedValue(canvas);
      
      const result = await errorRecovery.renderWithRecovery(
        primaryRender,
        fallbackRender,
        emergencyRender
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(canvas);
      expect(result.recoveryStrategy).toBe('emergency');
      expect(emergencyRender).toHaveBeenCalledTimes(1);
    });

    it('should fail when all renders fail', async () => {
      const error = new Error('All failed');
      const primaryRender = vi.fn().mockRejectedValue(error);
      const fallbackRender = vi.fn().mockRejectedValue(error);
      const emergencyRender = vi.fn().mockRejectedValue(error);
      
      const result = await errorRecovery.renderWithRecovery(
        primaryRender,
        fallbackRender,
        emergencyRender
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.recoveryStrategy).toBe('all-failed');
    });
  });

  describe('getRecoveryStats', () => {
    it('should track recovery statistics', async () => {
      const operation1 = vi.fn()
        .mockRejectedValueOnce(new TemplateNetworkError('test1.jpg'))
        .mockResolvedValue('success');
      
      const operation2 = vi.fn()
        .mockRejectedValueOnce(new TemplateNetworkError('test2.jpg'))
        .mockRejectedValueOnce(new TemplateNetworkError('test2.jpg'))
        .mockResolvedValue('success');
      
      await errorRecovery.withRetry(operation1, 'op1');
      await errorRecovery.withRetry(operation2, 'op2');
      
      const stats = errorRecovery.getRecoveryStats();
      
      expect(stats.operationsWithRecovery).toBe(0); // Both succeeded
      expect(stats.totalRecoveryAttempts).toBe(0);
    });

    it('should track failed operations', async () => {
      const operation = vi.fn().mockRejectedValue(new TemplateNetworkError('test.jpg'));
      
      await errorRecovery.withRetry(operation, 'failed-op');
      
      const stats = errorRecovery.getRecoveryStats();
      
      expect(stats.operationsWithRecovery).toBe(1);
      expect(stats.totalRecoveryAttempts).toBe(4); // Initial + 3 retries
    });
  });

  describe('clearStats', () => {
    it('should clear recovery statistics', async () => {
      const operation = vi.fn().mockRejectedValue(new TemplateNetworkError('test.jpg'));
      
      await errorRecovery.withRetry(operation, 'op');
      
      let stats = errorRecovery.getRecoveryStats();
      expect(stats.operationsWithRecovery).toBeGreaterThan(0);
      
      errorRecovery.clearStats();
      
      stats = errorRecovery.getRecoveryStats();
      expect(stats.operationsWithRecovery).toBe(0);
      expect(stats.totalRecoveryAttempts).toBe(0);
    });
  });
});
