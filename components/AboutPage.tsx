/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SupportCTA, { SUPPORT_EMAIL } from './SupportCTA';
import { usePerformanceMonitoring, useRenderPerformance } from '../hooks/usePerformanceMonitoring';

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/th3f00l';

interface PageProps {
  onGoBack: () => void;
}

interface RosePetal {
  id: number;
  shape: 'shape-1' | 'shape-2' | 'shape-3';
  color: 'color-pink' | 'color-rose' | 'color-magenta';
  timing: 'timing-1' | 'timing-2' | 'timing-3';
  left: number;
  delay: number;
}

const AboutPage: React.FC<PageProps> = ({ onGoBack }) => {
  const [isRoseTheme, setIsRoseTheme] = useState(false);

  // Performance monitoring for rose petal animations
  const { trackRender, checkPerformance } = usePerformanceMonitoring({
    enableAutoReporting: true,
    reportInterval: 20000,
    memoryThreshold: 70,
    onHighMemoryUsage: (usage) => {
      console.warn(`High memory usage detected in AboutPage: ${usage.toFixed(1)}%`);
      // Reduce rose petal count or disable animation
      if (usage > 85) {
        const petalContainer = document.querySelector('.rose-petal-container');
        if (petalContainer) {
          const petals = petalContainer.querySelectorAll('.rose-petal');
          // Remove half of the petals to reduce memory usage
          petals.forEach((petal, index) => {
            if (index % 2 === 0) {
              petal.remove();
            }
          });
        }
      }
    },
    onPerformanceIssue: (suggestions) => {
      console.warn('Performance issues detected in AboutPage:', suggestions);
    }
  });

  const { endRenderTracking } = useRenderPerformance('AboutPage');

  // Theme detection with proper cleanup and error handling
  useEffect(() => {
    const checkTheme = () => {
      try {
        const hasRoseTheme = document.documentElement.classList.contains('feminine');
        setIsRoseTheme(prevTheme => {
          // Only update if theme actually changed
          return prevTheme !== hasRoseTheme ? hasRoseTheme : prevTheme;
        });
      } catch (error) {
        console.warn('Rose theme detection failed:', error);
        setIsRoseTheme(false);
      }
    };

    let observer: MutationObserver | null = null;
    
    try {
      observer = new MutationObserver((mutations) => {
        const hasClassChange = mutations.some(mutation => 
          mutation.type === 'attributes' && 
          mutation.attributeName === 'class' &&
          mutation.oldValue !== document.documentElement.className
        );
        
        if (hasClassChange) {
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(checkTheme);
        }
      });
      
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'],
        attributeOldValue: true
      });

      // Initial check with slight delay
      requestAnimationFrame(checkTheme);
    } catch (error) {
      console.warn('Failed to setup rose theme observer:', error);
      // Fallback to polling
      const pollInterval = setInterval(checkTheme, 1000);
      return () => clearInterval(pollInterval);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Generate rose petals with randomized properties and performance considerations
  const rosePetals = useMemo((): RosePetal[] => {
    if (!isRoseTheme) return [];

    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return [];

    // Reduce number of petals on mobile devices for better performance
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const petalCount = isMobile ? 15 : 25;

    const shapes: RosePetal['shape'][] = ['shape-1', 'shape-2', 'shape-3'];
    const colors: RosePetal['color'][] = ['color-pink', 'color-rose', 'color-magenta'];
    const timings: RosePetal['timing'][] = ['timing-1', 'timing-2', 'timing-3'];

    try {
      return Array.from({ length: petalCount }, (_, i) => ({
        id: i,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        timing: timings[Math.floor(Math.random() * timings.length)],
        left: Math.random() * 100,
        delay: Math.random() * 8, // Stagger the start times
      }));
    } catch (error) {
      console.warn('Failed to generate rose petals:', error);
      return [];
    }
  }, [isRoseTheme]);

  // Cleanup function for performance with better error handling
  const cleanupAnimation = useCallback(() => {
    try {
      // Remove any lingering animation elements
      const containers = document.querySelectorAll('.rose-petal-container');
      containers.forEach(container => {
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
      
      // Also clean up any orphaned petals
      const orphanedPetals = document.querySelectorAll('.rose-petal');
      orphanedPetals.forEach(petal => {
        if (petal && petal.parentNode && !petal.closest('.rose-petal-container')) {
          petal.parentNode.removeChild(petal);
        }
      });
    } catch (error) {
      console.warn('Rose petal cleanup failed:', error);
    }
  }, []);

  // Cleanup on unmount or theme change with proper lifecycle management
  useEffect(() => {
    // Cleanup when theme changes away from rose
    if (!isRoseTheme) {
      const timeoutId = setTimeout(cleanupAnimation, 100);
      return () => clearTimeout(timeoutId);
    }
    
    // Cleanup on component unmount
    return () => {
      cleanupAnimation();
    };
  }, [isRoseTheme, cleanupAnimation]);

  // Performance monitoring and animation optimization
  useEffect(() => {
    const renderTime = endRenderTracking();
    trackRender('about-page-render', renderTime);

    // Monitor animation performance when rose theme is active
    if (isRoseTheme) {
      const animationMonitorInterval = setInterval(() => {
        const report = checkPerformance();
        
        // If performance is degrading, reduce animation complexity
        if (report.memoryUsage.percentage > 75) {
          const petalContainer = document.querySelector('.rose-petal-container');
          if (petalContainer) {
            // Add performance optimization class
            petalContainer.classList.add('performance-optimized');
            
            // Reduce animation frequency
            const petals = petalContainer.querySelectorAll('.rose-petal');
            petals.forEach((petal, index) => {
              if (index > 10) { // Keep only first 10 petals
                (petal as HTMLElement).style.display = 'none';
              }
            });
          }
        }
      }, 10000); // Check every 10 seconds

      return () => {
        clearInterval(animationMonitorInterval);
      };
    }
  }, [isRoseTheme, endRenderTracking, trackRender, checkPerformance]);
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      {isRoseTheme && (
        <div 
          className="rose-petal-container" 
          role="presentation" 
          aria-hidden="true"
        >
          {rosePetals.map((petal) => (
            <div
              key={petal.id}
              className={`rose-petal ${petal.shape} ${petal.color} ${petal.timing}`}
              style={{
                left: `${petal.left}%`,
                animationDelay: `${petal.delay}s`,
              }}
              onAnimationStart={() => {
                // Optimize for animation start
                const element = document.getElementById(`petal-${petal.id}`);
                if (element) {
                  element.style.willChange = 'transform, opacity';
                }
              }}
              onAnimationEnd={() => {
                // Clean up after animation completes
                const element = document.getElementById(`petal-${petal.id}`);
                if (element) {
                  element.style.willChange = 'auto';
                  element.setAttribute('data-cleanup', 'true');
                }
              }}
              id={`petal-${petal.id}`}
            />
          ))}
        </div>
      )}
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[var(--accent-color)]">About The Vibe</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; Back to the lab
          </button>
        </div>
        <div className="text-[var(--text-muted)] space-y-6 leading-relaxed">
          <p>
            txttohandwriting.org started as a late-night dare to make digital notes feel less robotic and more like the doodled pages we grew up with. What was supposed to be a tiny script spiralled into Blend Modes, texture managers, and way too many cups of coffee.
          </p>
          <p>
            Today the generator powers students, designers, and serial procrastinators who still want their submissions to look handcrafted. We obsess over believable ink jitter, responsive canvases, and keeping the whole experience fast enough to finish that assignment thirty minutes before the deadline.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg border border-[var(--panel-border)] bg-[var(--control-bg)]/50 sm:col-span-2">
              <h2 className="text-base font-semibold text-[var(--text-color)] mb-1">Open to the community</h2>
              <p className="text-sm">
                Feature ideas, bug reports, and meme-worthy suggestions all land in the same inbox. We genuinely read everything that comes through.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-semibold shadow-sm transition-opacity text-white hover:opacity-90"
              style={{ backgroundColor: '#ff6fa3' }}
            >
              Present a Rose
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Bitcoin%20Donation&body=Hey%20team,%20drop%20me%20the%20current%20BTC%20wallet%20so%20I%20can%20support%20the%20project.`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-semibold text-[#201c17] shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#f3c77d' }}
            >
              Donate a Bitcoin
            </a>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Wallet address coming soon—until then, shoot us a message and we’ll send the latest details personally.
          </p>

          <p className="text-center text-lg pt-2">
            <span className="font-mono text-fool-pink">Made with $ by Th3-F00L</span>
          </p>
        </div>
        <SupportCTA
          headline="Need help, feedback, or just want to say hi?"
          description="We answer every email ourselves. Your screenshots, feature ideas, and wins keep this project alive."
        />
      </div>
    </div>
  );
};

export default AboutPage;
