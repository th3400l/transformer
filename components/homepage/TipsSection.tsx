/**
 * TipsSection Component
 * 
 * Displays 5 actionable tips with icons and descriptions to help users
 * get better results from the handwriting generator. Implements responsive
 * grid (5-column on desktop, 2-column on mobile) with tip cards.
 * Includes internal links to FAQ and blog posts.
 * 
 * Requirements: 3.1, 3.2, 3.4, 4.5
 */

import React from 'react';
import { tips } from '@/content/homepage';

// Icon components for each tip
const FontIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
    />
  </svg>
);

const BoldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3.744h-.753v8.25h7.125a4.125 4.125 0 0 0 0-8.25H6.75Zm0 0v.38m0 16.122h6.747a4.5 4.5 0 0 0 0-9.001h-7.5v9h.753Zm0 0v-.37m0-15.751h6a3.75 3.75 0 1 1 0 7.5h-6m0-7.5v7.5m0 0v8.25m0-8.25h6.375a4.125 4.125 0 0 1 0 8.25H6.75m0-8.25v8.25"
    />
  </svg>
);

const TemplateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

// Map icon names to components
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  font: FontIcon,
  bold: BoldIcon,
  template: TemplateIcon,
  eye: EyeIcon,
  download: DownloadIcon,
};

// TipCard sub-component
interface TipCardProps {
  title: string;
  description: string;
  icon: string;
  className?: string;
}

const TipCard: React.FC<TipCardProps> = ({ title, description, icon, className = '' }) => {
  const IconComponent = iconMap[icon] || FontIcon;

  return (
    <article className={`flex flex-col p-6 bg-panel-bg rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-panel-border ${className}`} role="listitem">
      {/* Icon */}
      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--rose-primary)] to-[var(--rose-secondary)] flex items-center justify-center mb-4 shadow-sm" aria-hidden="true">
        <IconComponent className="w-7 h-7 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-bold text-text mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm md:text-base text-text-muted leading-relaxed">
        {description}
      </p>
    </article>
  );
};

export const TipsSection: React.FC = () => {
  return (
    <section
      className="w-full py-16 md:py-24 bg-bg transition-colors duration-300"
      aria-labelledby="tips-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <header className="text-center mb-12 md:mb-16">
          <h2 id="tips-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-4">
            Tips & Best Practices
          </h2>
          <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto">
            Get the most out of your handwriting generator with these expert tips
          </p>
        </header>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-8" role="list" aria-label="List of tips and best practices">
          {tips.map((tip, index) => (
            <TipCard
              key={index}
              title={tip.title}
              description={tip.description}
              icon={tip.icon}
              className={tip.title.includes('Bulk Download') ? 'md:col-span-full lg:col-span-2' : ''}
            />
          ))}
        </div>

        {/* Additional Context with Internal Links */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-base md:text-lg text-text-muted max-w-3xl mx-auto mb-6">
            These tips will help you create more realistic and professional-looking handwritten text.
            Whether you're working on school assignments, creative projects, or business documents,
            following these best practices ensures optimal results every time. Experiment with different
            combinations of fonts, templates, and settings to discover what works best for your specific needs.
          </p>

          {/* Internal Links */}
          <nav className="flex flex-wrap justify-center gap-4 mt-8" aria-label="Related pages">
            <a
              href="/faq"
              className="inline-flex items-center 
                         min-h-[44px] min-w-[44px] px-6 py-3 
                         bg-control-bg hover:bg-panel-bg text-text 
                         border border-panel-border hover:border-accent
                         font-semibold rounded-lg 
                         transition-all duration-200 
                         shadow-md hover:shadow-lg 
                         focus:outline-none focus:ring-4 focus:ring-[var(--accent-color)] 
                         touch-manipulation
                         text-base"
              aria-label="View frequently asked questions"
            >
              <svg
                className="w-5 h-5 mr-2"
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>View FAQ</span>
            </a>

            <a
              href="/blog"
              className="inline-flex items-center 
                         min-h-[44px] min-w-[44px] px-6 py-3 
                         bg-control-bg hover:bg-panel-bg text-text 
                         border border-panel-border hover:border-accent
                         font-semibold rounded-lg 
                         transition-all duration-200 
                         shadow-md hover:shadow-lg 
                         focus:outline-none focus:ring-4 focus:ring-[var(--accent-color)] 
                         touch-manipulation
                         text-base"
              aria-label="Read blog posts about handwriting generation"
            >
              <svg
                className="w-5 h-5 mr-2"
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span>Read Blog Posts</span>
            </a>

            <a
              href="/about"
              className="inline-flex items-center 
                         min-h-[44px] min-w-[44px] px-6 py-3 
                         bg-control-bg hover:bg-panel-bg text-text 
                         border border-panel-border hover:border-accent
                         font-semibold rounded-lg 
                         transition-all duration-200 
                         shadow-md hover:shadow-lg 
                         focus:outline-none focus:ring-4 focus:ring-[var(--accent-color)] 
                         touch-manipulation
                         text-base"
              aria-label="Learn more about the handwriting generator"
            >
              <svg
                className="w-5 h-5 mr-2"
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Learn More</span>
            </a>
          </nav>
        </div>
      </div>
    </section>
  );
};

export default TipsSection;
