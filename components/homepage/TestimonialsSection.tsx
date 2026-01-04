/**
 * TestimonialsSection Component
 * 
 * Displays 3 testimonial cards with quotes, authors, roles, and avatars.
 * Implements responsive layout (3-column on desktop, stack on mobile).
 * Includes fallback for missing avatars.
 * 
 * Requirements: 3.3, 3.5
 */

import React from 'react';
import { testimonials } from '@/content/homepage';

// QuoteIcon component for visual decoration
const QuoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
  </svg>
);

// TestimonialCard sub-component
interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  className?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, author, role, avatar, className = '' }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Generate initials from author name for fallback
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(author);

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Determine if we should show the avatar image or fallback
  const showFallback = !avatar || imageError;

  return (
    <article className={`flex flex-col p-6 md:p-8 bg-panel-bg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-panel-border ${className}`} role="listitem">
      {/* Quote Icon */}
      <div className="mb-4" aria-hidden="true">
        <QuoteIcon className="w-8 h-8 md:w-10 md:h-10 text-[var(--accent-color)] opacity-50" />
      </div>

      {/* Quote Text */}
      <blockquote className="flex-grow mb-6">
        <p className="text-base md:text-lg text-[var(--text-muted)] leading-relaxed italic">
          "{quote}"
        </p>
      </blockquote>

      {/* Author Info */}
      <footer className="flex items-center mt-auto pt-4 border-t border-[var(--panel-border)]">
        {/* Avatar or Fallback */}
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden flex-shrink-0 mr-4 bg-gradient-to-br from-[var(--rose-primary)] to-[var(--rose-secondary)] flex items-center justify-center" role="img" aria-label={`${author}'s profile picture`}>
          {showFallback ? (
            <span className="text-white font-bold text-lg md:text-xl">
              {initials}
            </span>
          ) : (
            <img
              src={avatar}
              alt=""
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              width="56"
              height="56"
              decoding="async"
            />
          )}
        </div>

        {/* Author Name and Role */}
        <div>
          <cite className="not-italic font-semibold text-[var(--text-color)] text-base md:text-lg block">
            {author}
          </cite>
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            {role}
          </p>
        </div>
      </footer>
    </article>
  );
};

export const TestimonialsSection: React.FC = () => {
  return (
    <section
      className="w-full py-16 md:py-24 bg-[var(--bg-color)] transition-colors duration-300"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <header className="text-center mb-12 md:mb-16">
          <h2 id="testimonials-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-color)] mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
            Join thousands of satisfied users who trust our handwriting generator for their projects
          </p>
        </header>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" role="list" aria-label="User testimonials">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              avatar={testimonial.avatar}
              className={testimonial.author === 'L' ? 'md:col-span-full lg:col-span-2' : ''}
            />
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-3xl mx-auto mb-6">
            Ready to create your own handwritten content? Join our community of students, creators,
            and professionals who use our free handwriting generator every day. No signup required,
            completely private, and always free.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
