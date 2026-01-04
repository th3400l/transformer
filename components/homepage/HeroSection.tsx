/**
 * HeroSection Component
 * 
 * Displays the hero section with headline, subheadline, and CTA button.
 * Implements scroll-to-tool functionality and responsive styling.
 * 
 * Requirements: 1.1, 2.4
 */

import React from 'react';
import { heroContent } from '@/content/homepage';

interface HeroSectionProps {
  onScrollToTool: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToTool }) => {
  return (
    <section
      className="relative w-full min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
      role="banner"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-color)] via-[var(--panel-bg)] to-[var(--control-bg)] opacity-95" aria-hidden="true" />

      {/* Decorative pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <h1 id="hero-heading" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
          {heroContent.headline}
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
          {heroContent.subheadline}
        </p>

        {/* CTA Button */}
        <button
          onClick={onScrollToTool}
          className="inline-flex items-center justify-center 
                     min-h-[44px] min-w-[44px] px-8 py-4 
                     text-base sm:text-lg font-semibold text-white 
                     bg-gradient-to-r from-blue-600 to-purple-600 
                     rounded-lg shadow-lg hover:shadow-xl 
                     hover:from-blue-700 hover:to-purple-700 
                     transition-all duration-200 
                     focus:outline-none focus:ring-4 focus:ring-blue-300 
                     dark:focus:ring-blue-800
                     touch-manipulation"
          aria-label={`${heroContent.cta} - Scroll to handwriting generator tool`}
          type="button"
        >
          <span>{heroContent.cta}</span>
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
            role="img"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>

        {/* Keywords for SEO (visually hidden) */}
        <div className="sr-only" aria-hidden="true">
          {heroContent.keywords.join(', ')}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
