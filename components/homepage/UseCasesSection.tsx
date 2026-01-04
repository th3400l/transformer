/**
 * UseCasesSection Component
 * 
 * Displays 3 use case cards demonstrating practical applications for different audiences.
 * Implements responsive layout (3-column on desktop, stack on mobile) with use case cards.
 * Each use case includes title, description (~60-80 words), and example list.
 * 
 * Requirements: 1.6, 2.1, 2.4
 */

import React from 'react';
import { useCases } from '@/content/homepage';

// Icon components for each use case
const StudentIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
    />
  </svg>
);

const CreatorIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
    />
  </svg>
);

const ProfessionalIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
    />
  </svg>
);

// Map use case titles to icon components
const getIconForUseCase = (title: string): React.FC<{ className?: string }> => {
  if (title.toLowerCase().includes('student') || title.toLowerCase().includes('educator')) {
    return StudentIcon;
  }
  if (title.toLowerCase().includes('creator') || title.toLowerCase().includes('designer')) {
    return CreatorIcon;
  }
  if (title.toLowerCase().includes('professional') || title.toLowerCase().includes('business')) {
    return ProfessionalIcon;
  }
  return StudentIcon; // Default fallback
};

// UseCaseCard sub-component
interface UseCaseCardProps {
  title: string;
  description: string;
  examples: string[];
  className?: string;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({ title, description, examples, className = '' }) => {
  const IconComponent = getIconForUseCase(title);

  return (
    <article className={`flex flex-col p-6 md:p-8 bg-panel-bg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-panel-border ${className}`} role="listitem">
      {/* Icon */}
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-[var(--rose-primary)] to-[var(--rose-secondary)] flex items-center justify-center mb-6 shadow-md" aria-hidden="true">
        <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-xl md:text-2xl font-bold text-text mb-4">
        {title}
      </h3>

      {/* Description */}
      <p className="text-base md:text-lg text-text-muted leading-relaxed mb-6 flex-grow">
        {description}
      </p>

      {/* Examples List */}
      <div className="mt-auto">
        <h4 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wide">
          Perfect For:
        </h4>
        <ul className="space-y-2" role="list" aria-label={`Examples for ${title}`}>
          {examples.map((example, index) => (
            <li
              key={index}
              className="flex items-start text-sm md:text-base text-text-muted"
            >
              <svg
                className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0"
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

export const UseCasesSection: React.FC = () => {
  return (
    <section
      className="w-full py-16 md:py-24 bg-bg transition-colors duration-300"
      aria-labelledby="use-cases-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <header className="text-center mb-12 md:mb-16">
          <h2 id="use-cases-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-4">
            Who Uses Our Handwriting Generator?
          </h2>
          <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto">
            From students to professionals, discover how people use our tool to create authentic handwritten content
          </p>
        </header>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" role="list" aria-label="List of use cases">
          {useCases.map((useCase, index) => (
            <UseCaseCard
              key={index}
              title={useCase.title}
              description={useCase.description}
              examples={useCase.examples}
              className={useCase.title.includes('Professionals') ? 'md:col-span-full lg:col-span-2' : ''}
            />
          ))}
        </div>

        {/* Additional Context */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-base md:text-lg text-text-muted max-w-3xl mx-auto">
            No matter your use case, our handwriting generator provides the flexibility and quality you need.
            Whether you're a student working on assignments, a content creator building your brand, or a
            professional adding personal touches to communications, our tool adapts to your needs. Join thousands
            of users who trust our free handwriting generator for their projects.
          </p>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
