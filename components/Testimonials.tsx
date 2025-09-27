
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePerformanceMonitoring, useRenderPerformance } from '../hooks/usePerformanceMonitoring';

type TestimonialVariant = 'fool';

interface ThemeState {
  isMidnightMode: boolean;
  isRoseTheme: boolean;
  currentTheme: 'nightlight' | 'dark' | 'feminine';
}

interface Testimonial {
  name: string;
  message: string;
  avatar: string;
  variant?: TestimonialVariant;
}

interface TestimonialConfig {
  name: string;
  message: string;
  avatar: string;
  variant: TestimonialVariant;
  visibilityCondition: (theme: ThemeState) => boolean;
}

const testimonials: Testimonial[] = [
  {
    name: 'Baddie Brown',
    message: 'Whenever I had to write stuff down, it looked like a total mess. This site seriously changed the game — now my notes look super cute, and the font styles? Absolute slay.',
    avatar: '/avatars/millie.png'
  },
  {
    name: 'Heisenberg',
    message: 'Back in the day, I had to scribble notes by hand just so Jesse could keep up. Sloppy, messy — a real pain. This site cleaned it all up. The font variations? Let’s just say, they’re pure grade A.',
    avatar: '/avatars/heisenberg.png'
  },
  {
    name: 'Plant Peter',
    message: 'My handwriting was so shaky the dealer couldn’t even read my notes. This site fixed that — now my shopping lists look clean, and the font style? Let’s just say it hits harder than what I smoke.',
    avatar: '/avatars/peter.png'
  },
  {
    name: 'Aggressive Armas',
    message: 'Handwriting should be more than just words — it should feel seductive. With this site, even my notes look irresistible, like a love letter on screen. Smooth, stylish, and impossible to ignore.',
    avatar: '/avatars/anadearmas.png'
  },
  {
    name: 'Drunk David',
    message: "Listen… I tried writing a note after a few drinks, and let’s just say it looked like modern art. This site? Total lifesaver. Now my handwriting looks classy even when I can’t walk straight. Cheers to that!",
    avatar: '/avatars/david.png'
  },
  {
    name: 'Swirl Swift',
    message: "My lyrics don’t always look pretty on paper. This site makes every note feel like a love song — simple, stylish, unforgettable.",
    avatar: '/avatars/taylor.png'
  },
  {
  name: 'Captain Price',
  message: "Out in the field, I’ve scribbled notes in the dark, rain pouring down — damn near unreadable. This site? Makes my writing sharp and clear every time. That’s a bloody good tool.",
  avatar: '/avatars/price.png'
},
{
  name: 'Jacked Jenner',
  message: "I’m always on the move, and my quick notes never look runway-ready. This site makes everything chic and flawless — like handwriting, but make it fashion.",
  avatar: '/avatars/kendall.png'
},
{
  name: 'L',
  message: "I used to write assignments and get low grades — that’s why everyone calls me L. But I tasted a W using this site. My notes have never looked this precise.",
  avatar: '/avatars/L.png'
},





];

const Testimonials: React.FC = () => {
  const [itemsPerView, setItemsPerView] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0); // This will be adjusted after cloning
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [themeState, setThemeState] = useState<ThemeState>({
    isMidnightMode: false,
    isRoseTheme: false,
    currentTheme: 'nightlight'
  });
  const trackRef = useRef<HTMLDivElement | null>(null);

  // Performance monitoring
  const { trackRender, checkPerformance } = usePerformanceMonitoring({
    enableAutoReporting: true,
    reportInterval: 30000,
    memoryThreshold: 75,
    onHighMemoryUsage: (usage) => {
      console.warn(`High memory usage detected in Testimonials: ${usage.toFixed(1)}%`);
      // Force cleanup of unused resources
      if (trackRef.current) {
        const unusedElements = trackRef.current.querySelectorAll('[data-cleanup="true"]');
        unusedElements.forEach(el => el.remove());
      }
    },
    onPerformanceIssue: (suggestions) => {
      console.warn('Performance issues detected in Testimonials:', suggestions);
    }
  });

  const { endRenderTracking } = useRenderPerformance('Testimonials');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let mediaQuery: MediaQueryList | null = null;
    let cleanup: (() => void) | null = null;

    try {
      mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      setPrefersReducedMotion(mediaQuery.matches);

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
        cleanup = () => {
          if (mediaQuery) {
            mediaQuery.removeEventListener('change', handleChange);
          }
        };
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        cleanup = () => {
          if (mediaQuery) {
            mediaQuery.removeListener(handleChange);
          }
        };
      }
    } catch (error) {
      console.warn('Failed to setup reduced motion detection:', error);
      // Fallback to assuming no reduced motion preference
      setPrefersReducedMotion(false);
    }

    return cleanup || (() => {});
  }, []);

  useEffect(() => {
    const updateThemeState = () => {
      try {
        const classList = Array.from(document.documentElement.classList);
        const isMidnightMode = classList.includes('dark');
        const isRoseTheme = classList.includes('feminine');

        
        let currentTheme: 'nightlight' | 'dark' | 'feminine' = 'nightlight';
        if (isMidnightMode) {
          currentTheme = 'dark';
        } else if (isRoseTheme) {
          currentTheme = 'feminine';
        }

        setThemeState(prevState => {
          // Only update if theme actually changed to prevent unnecessary re-renders
          if (prevState.currentTheme !== currentTheme || 
              prevState.isMidnightMode !== isMidnightMode || 
              prevState.isRoseTheme !== isRoseTheme) {
            return {
              isMidnightMode,
              isRoseTheme,
              currentTheme
            };
          }
          return prevState;
        });
      } catch (error) {
        console.warn('Theme detection failed:', error);
        // Fallback to default theme
        setThemeState({
          isMidnightMode: false,
          isRoseTheme: false,
          currentTheme: 'nightlight'
        });
      }
    };

    let observer: MutationObserver | null = null;
    
    try {
      observer = new MutationObserver((mutations) => {
        // Debounce theme updates to prevent excessive re-renders
        const hasClassChange = mutations.some(mutation => 
          mutation.type === 'attributes' && mutation.attributeName === 'class'
        );
        
        if (hasClassChange) {
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(updateThemeState);
        }
      });
      
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'],
        attributeOldValue: true
      });

      // Initial theme detection with slight delay to ensure DOM is ready
      requestAnimationFrame(updateThemeState);
    } catch (error) {
      console.warn('Failed to setup theme observer:', error);
      // Fallback to polling for theme changes
      const pollInterval = setInterval(updateThemeState, 1000);
      return () => clearInterval(pollInterval);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1280) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1680) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const filteredTestimonials = useMemo(() => {
    // Show all testimonials in all themes
    return testimonials;
  }, []);

  const clonesNeeded = itemsPerView; // Number of items to clone from each end
  const displayTestimonials = useMemo(() => {
    if (filteredTestimonials.length === 0) return [];
    const clonedStart = filteredTestimonials.slice(filteredTestimonials.length - clonesNeeded);
    const clonedEnd = filteredTestimonials.slice(0, clonesNeeded);
    return [...clonedStart, ...filteredTestimonials, ...clonedEnd];
  }, [filteredTestimonials, clonesNeeded]);

  // Adjust initial currentIndex after cloning
  useEffect(() => {
    setCurrentIndex(clonesNeeded);
  }, [clonesNeeded]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || isTransitioning || displayTestimonials.length === 0) {
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    
    try {
      const scheduleNext = () => {
        const delay = 8000; // 8s for all testimonials
        
        interval = setTimeout(() => {
          setCurrentIndex((prevIndex) => prevIndex + 1);
          scheduleNext(); // Schedule the next transition
        }, delay);
      };
      
      scheduleNext();
    } catch (error) {
      console.warn('Failed to setup testimonial carousel interval:', error);
    }

    return () => {
      if (interval) {
        clearTimeout(interval);
        interval = null;
      }
    };
  }, [prefersReducedMotion, isPaused, isTransitioning, displayTestimonials.length]);

  useEffect(() => {
    const trackElement = trackRef.current;
    if (!trackElement) {
      return;
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      // Only handle transitions on the track element itself
      if (event.target !== trackElement || isTransitioning) {
        return;
      }

      try {
        if (currentIndex >= filteredTestimonials.length + clonesNeeded) {
          setIsTransitioning(true);
          setCurrentIndex(clonesNeeded);
        } else if (currentIndex < clonesNeeded) {
          setIsTransitioning(true);
          setCurrentIndex(filteredTestimonials.length + clonesNeeded - itemsPerView);
        }
      } catch (error) {
        console.warn('Testimonial transition handling failed:', error);
        // Reset to safe state
        setIsTransitioning(false);
        setCurrentIndex(clonesNeeded);
      }
    };

    let cleanup: (() => void) | null = null;
    
    try {
      trackElement.addEventListener('transitionend', handleTransitionEnd, { passive: true });
      cleanup = () => {
        trackElement.removeEventListener('transitionend', handleTransitionEnd);
      };
    } catch (error) {
      console.warn('Failed to setup transition event listener:', error);
    }

    return cleanup || (() => {});
  }, [currentIndex, clonesNeeded, itemsPerView, isTransitioning, filteredTestimonials]);

  // Disable transition during snap back with proper cleanup
  useEffect(() => {
    if (!isTransitioning) {
      return;
    }

    let firstFrame: number | null = null;
    let secondFrame: number | null = null;
    let cleanup: (() => void) | null = null;

    try {
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          try {
            setIsTransitioning(false);
          } catch (error) {
            console.warn('Failed to reset transition state:', error);
          }
        });
      });

      cleanup = () => {
        if (firstFrame !== null) {
          cancelAnimationFrame(firstFrame);
          firstFrame = null;
        }
        if (secondFrame !== null) {
          cancelAnimationFrame(secondFrame);
          secondFrame = null;
        }
      };
    } catch (error) {
      console.warn('Failed to setup animation frames:', error);
      // Fallback to immediate state reset
      setIsTransitioning(false);
    }

    return cleanup || (() => {});
  }, [isTransitioning]);

  const cardWidth = useMemo(() => `${100 / itemsPerView}%`, [itemsPerView]);
  
  const trackStyle = useMemo(
    () => ({
      transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
      transition: isTransitioning ? 'none' : 'transform 0.5s ease-out',
    }),
    [currentIndex, itemsPerView, isTransitioning]
  );

  // Performance monitoring and cleanup effect
  useEffect(() => {
    const renderTime = endRenderTracking();
    trackRender('testimonials-render', renderTime);

    // Periodic performance check and cleanup
    const performanceCheckInterval = setInterval(() => {
      const report = checkPerformance();
      
      // If memory usage is high, trigger cleanup
      if (report.memoryUsage.percentage > 70) {
        // Clean up any detached DOM nodes
        const detachedNodes = document.querySelectorAll('[data-testimonial-cleanup]');
        detachedNodes.forEach(node => {
          if (!document.body.contains(node)) {
            node.remove();
          }
        });
      }
    }, 15000); // Check every 15 seconds

    return () => {
      clearInterval(performanceCheckInterval);
    };
  }, [endRenderTracking, trackRender, checkPerformance]);
  return (
    <section className="w-full max-w-4xl mx-auto mt-12">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-8 md:p-12 text-center">
        <div className="mb-6">
          <span className="px-6 py-2 border border-[var(--accent-color)] text-[var(--accent-color)] rounded-full text-sm font-semibold tracking-wide hover:bg-[var(--accent-color)] hover:text-white transition-colors duration-300">
            Love Notes
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-color)] mb-6 leading-tight">
          What Our Users Say
        </h2>
        <div
          className="relative overflow-hidden"
          aria-live="polite"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          onTouchCancel={() => setIsPaused(false)}
        >
          <div
            ref={trackRef}
            className="flex transition-transform duration-500 ease-out"
            style={trackStyle}
            role="list"
          >
              {displayTestimonials.map((testimonial, index) => {
                const relativePosition = (index - currentIndex + displayTestimonials.length) % displayTestimonials.length;
                const isVisible = relativePosition < itemsPerView;
                const isPrimary = (itemsPerView === 1 && relativePosition === 0)
                  || (itemsPerView === 2 && relativePosition === 0)
                  || (itemsPerView >= 3 && relativePosition === 1);
                const scale = isPrimary ? 1.08 : 0.9;
                const rotation = itemsPerView === 1
                  ? '0deg'
                  : relativePosition === 0
                    ? '-2deg'
                    : relativePosition === 1
                      ? '-0.4deg'
                      : '1.8deg';
                const isFool = testimonial.variant === 'fool';
                

                const noteTone = isPrimary ? 'var(--testimonial-note-primary)' : 'var(--testimonial-note-secondary)';

                const wrapperStyle: React.CSSProperties = {
                  width: cardWidth,
                  opacity: isVisible ? (isPrimary ? 1 : 0.75) : 0,
                  transform: `scale(${scale})`,
                  transition: 'transform 0.45s ease, opacity 0.45s ease',
                  boxSizing: 'border-box'
                };

                const noteStyle: React.CSSProperties = isFool
                  ? {
                    background: 'linear-gradient(160deg, rgba(255,126,184,0.9), rgba(255,186,212,0.95))',
                    border: '2px solid rgba(255,126,184,0.85)',
                    boxShadow: '0 26px 42px rgba(255,126,184,0.45)',
                    transform: `rotate(${rotation})`
                  }
                  : {
                    background: `linear-gradient(150deg, ${noteTone}, var(--testimonial-note-base, var(--paper-bg)))`,
                    boxShadow: isPrimary ? 'var(--testimonial-shadow-primary, 0 26px 36px rgba(0,0,0,0.24))' : 'var(--testimonial-shadow-secondary, 0 16px 26px rgba(0,0,0,0.16))',
                    transform: `rotate(${rotation})`
                  };

                const haloStyle: React.CSSProperties | undefined = isFool
                  ? {
                    backgroundColor: '#ff7eb8',
                    boxShadow: '0 0 18px rgba(255,126,184,0.6)',
                    opacity: 0.95
                  }
                  : undefined;

                return (
                  <div
                    key={testimonial.name + index}
                    className="px-3 flex-shrink-0"
                    style={wrapperStyle}
                  >
                    <article
                      className="relative h-full flex flex-col items-center text-center p-6 border border-[var(--panel-border)] rounded-xl shadow-lg transition-transform duration-500"
                      role="listitem"
                      style={noteStyle}
                      data-testimonial-cleanup="true"
                    >
                      <span
                        className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-2 bg-[var(--accent-color)] rounded-full opacity-70 shadow-md"
                        style={haloStyle}
                      ></span>
                      <div className="mb-4 relative">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className={isFool
                            ? 'w-28 h-40 rounded-2xl border-[3px] border-white/80 shadow-[0_18px_32px_rgba(13,26,45,0.45)] object-cover'
                            : 'w-20 h-20 rounded-full border-2 border-[var(--panel-border)] shadow-lg object-cover'}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <p
                        className="mb-4 leading-relaxed"
                        style={isFool
                          ? { color: '#4d1533', fontWeight: 500 }
                          : { color: 'var(--testimonial-text-muted, var(--text-muted))' }}
                      >
                        “{testimonial.message}”
                      </p>
                      <h3
                        className={`font-semibold tracking-wide text-sm uppercase ${isFool ? 'text-fool-pink' : ''}`}
                        style={isFool 
                          ? { letterSpacing: '0.28em' } 
                          : { color: 'var(--testimonial-text-color, var(--text-color))' }}
                      >
                        {testimonial.name}
                      </h3>
                    </article>
                  </div>
                );
              })}
            </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
