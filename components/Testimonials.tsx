
import React, { useState, useEffect, useMemo, useRef } from 'react';

const testimonials = [
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
}




];

const Testimonials: React.FC = () => {
  const [itemsPerView, setItemsPerView] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0); // This will be adjusted after cloning
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener(handleChange);
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

  const clonesNeeded = itemsPerView; // Number of items to clone from each end
  const displayTestimonials = useMemo(() => {
    if (testimonials.length === 0) return [];
    const clonedStart = testimonials.slice(testimonials.length - clonesNeeded);
    const clonedEnd = testimonials.slice(0, clonesNeeded);
    return [...clonedStart, ...testimonials, ...clonedEnd];
  }, [testimonials, clonesNeeded]);

  // Adjust initial currentIndex after cloning
  useEffect(() => {
    setCurrentIndex(clonesNeeded);
  }, [clonesNeeded]);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || isTransitioning || displayTestimonials.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, 8000);

    return () => {
      window.clearInterval(interval);
    };
  }, [prefersReducedMotion, isPaused, isTransitioning, displayTestimonials.length]);

  useEffect(() => {
    const trackElement = trackRef.current;
    if (!trackElement) {
      return;
    }

    const handleTransitionEnd = () => {
      if (isTransitioning) {
        return;
      }

      if (currentIndex >= testimonials.length + clonesNeeded) {
        setIsTransitioning(true);
        setCurrentIndex(clonesNeeded);
      } else if (currentIndex < clonesNeeded) {
        setIsTransitioning(true);
        setCurrentIndex(testimonials.length + clonesNeeded - itemsPerView);
      }
    };

    trackElement.addEventListener('transitionend', handleTransitionEnd);
    return () => {
      trackElement.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [currentIndex, clonesNeeded, itemsPerView, isTransitioning]);

  // Disable transition during snap back
  useEffect(() => {
    if (!isTransitioning) {
      return;
    }

    let secondFrame: number | null = null;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      if (secondFrame !== null) {
        cancelAnimationFrame(secondFrame);
      }
    };
  }, [isTransitioning]);

  const cardWidth = useMemo(() => `${100 / itemsPerView}%`, [itemsPerView]);
  const trackStyle = useMemo(
    () => ({
      transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`,
      transition: isTransitioning ? 'none' : 'transform 0.5s ease-out', // Control transition
    }),
    [currentIndex, itemsPerView, isTransitioning]
  );
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
                const noteTone = isPrimary ? 'var(--testimonial-note-primary)' : 'var(--testimonial-note-secondary)';

                const wrapperStyle: React.CSSProperties = {
                  width: cardWidth,
                  opacity: isVisible ? (isPrimary ? 1 : 0.75) : 0,
                  transform: `scale(${scale})`,
                  transition: 'transform 0.45s ease, opacity 0.45s ease',
                  boxSizing: 'border-box'
                };

                const noteStyle: React.CSSProperties = {
                  background: `linear-gradient(150deg, ${noteTone}, var(--testimonial-note-base, var(--paper-bg)))`,
                  boxShadow: isPrimary ? 'var(--testimonial-shadow-primary, 0 26px 36px rgba(0,0,0,0.24))' : 'var(--testimonial-shadow-secondary, 0 16px 26px rgba(0,0,0,0.16))',
                  transform: `rotate(${rotation})`
                };

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
                    >
                      <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-2 bg-[var(--accent-color)] rounded-full opacity-70 shadow-md"></span>
                      <div className="mb-4 relative">
                        <img src={testimonial.avatar} alt={testimonial.name} className="w-20 h-20 rounded-full border-2 border-[var(--panel-border)] shadow-lg" />
                      </div>
                    <p
                      className="mb-4 leading-relaxed"
                      style={{ color: 'var(--testimonial-text-muted, var(--text-muted))' }}
                    >
                      “{testimonial.message}”
                    </p>
                    <h3
                      className="font-semibold tracking-wide text-sm uppercase"
                      style={{ color: 'var(--testimonial-text-color, var(--text-color))' }}
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
