// ServiceContainer implementation for Gear-1 handwriting system
// Provides dependency injection following the Dependency Inversion Principle
// Requirements: 6.1, 6.2, 6.3

import { IServiceContainer } from '../types/core';
import { 
  ServiceNotRegisteredError,
  ServiceRegistrationError,
  ServiceResolutionError
} from '../types/errors';

/**
 * Concrete implementation of IServiceContainer
 * Manages service registration and resolution for dependency injection
 * 
 * Features:
 * - Type-safe service registration and resolution
 * - Singleton pattern for service instances
 * - Circular dependency detection
 * - Comprehensive error handling
 * - Service lifecycle management
 */
export class ServiceContainer implements IServiceContainer {
  private services = new Map<string, () => any>();
  private instances = new Map<string, any>();
  private resolving = new Set<string>();

  /**
   * Register a service factory function with the container
   * @param token - Unique identifier for the service
   * @param factory - Function that creates the service instance
   */
  register<T>(token: string, factory: () => T): void {
    try {
      if (this.services.has(token)) {
        console.warn(`Service '${token}' is being re-registered`);
      }
      
      if (!factory) {
        throw new Error('Factory function cannot be null or undefined');
      }
      
      this.services.set(token, factory);
      // Clear any existing instance to force recreation
      this.instances.delete(token);
    } catch (error) {
      throw new ServiceRegistrationError(token, error as Error);
    }
  }

  /**
   * Resolve a service instance from the container
   * Uses singleton pattern - same instance returned for multiple calls
   * @param token - Unique identifier for the service
   * @returns The service instance
   */
  resolve<T>(token: string): T {
    try {
      // Check for circular dependencies
      if (this.resolving.has(token)) {
        throw new Error(`Circular dependency detected for service: ${token}`);
      }

      // Return existing instance if available (singleton pattern)
      if (this.instances.has(token)) {
        return this.instances.get(token) as T;
      }

      // Get factory function
      const factory = this.services.get(token);
      if (!factory) {
        throw new ServiceNotRegisteredError(token);
      }

      // Mark as resolving to detect circular dependencies
      this.resolving.add(token);

      try {
        // Create new instance
        const instance = factory();
        
        // Cache the instance (singleton pattern)
        this.instances.set(token, instance);
        
        return instance as T;
      } finally {
        // Always remove from resolving set
        this.resolving.delete(token);
      }
    } catch (error) {
      if (error instanceof ServiceNotRegisteredError) {
        throw error;
      }
      throw new ServiceResolutionError(token, error as Error);
    }
  }

  /**
   * Check if a service is registered
   * @param token - Service identifier to check
   * @returns True if service is registered
   */
  isRegistered(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Get all registered service tokens
   * @returns Array of registered service tokens
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services and instances
   * Useful for testing and cleanup
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
    this.resolving.clear();
  }

  /**
   * Remove a specific service registration
   * @param token - Service identifier to remove
   */
  unregister(token: string): void {
    this.services.delete(token);
    this.instances.delete(token);
  }

  /**
   * Get the number of registered services
   * @returns Count of registered services
   */
  getServiceCount(): number {
    return this.services.size;
  }

  /**
   * Check if a service instance has been created
   * @param token - Service identifier to check
   * @returns True if instance exists
   */
  hasInstance(token: string): boolean {
    return this.instances.has(token);
  }
}

/**
 * Global service container instance
 * Provides application-wide dependency injection
 */
export const serviceContainer = new ServiceContainer();