/**
 * FeaturesSection Component
 * 
 * Displays a 4-feature grid layout highlighting key capabilities and benefits.
 * Implements responsive grid (2x2 on desktop, stack on mobile) with feature cards.
 * Each feature includes icon, title, description, and benefit list.
 * 
 * Requirements: 1.5, 2.1, 2.2, 2.4
 */

import React from 'react';
import { features } from '@/content/homepage';

// Icon components for each feature
const PenIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13L2.25 21.75l.8-2.685a4.5 4.5 0 011.13-1.897l12.682-12.681zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
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

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

// Map icon names to components
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  pen: PenIcon,
  template: TemplateIcon,
  upload: UploadIcon,
  lock: LockIcon,
};

// FeatureCard sub-component
interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, benefits }) => {
  const IconComponent = iconMap[icon] || PenIcon;

  return (
    <article className="flex flex-col p-6 md:p-8 bg-panel-bg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-panel-border" role="listitem">
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

      {/* Benefits List */}
      <ul className="space-y-2" role="list" aria-label={`Benefits of ${title}`}>
        {benefits.map((benefit, index) => (
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </article>
  );
};

export const FeaturesSection: React.FC = () => {
  return (
    <section
      className="w-full py-16 md:py-24 bg-bg transition-colors duration-300"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <header className="text-center mb-12 md:mb-16">
          <h2 id="features-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-4">
            Powerful Features
          </h2>
          <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto">
            Everything you need to create authentic, realistic handwriting for any purpose
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10" role="list" aria-label="List of features">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              benefits={feature.benefits}
            />
          ))}
        </div>

        {/* Additional Context */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-base md:text-lg text-text-muted max-w-3xl mx-auto">
            Our handwriting generator combines advanced rendering technology with user-friendly design
            to deliver professional results. Whether you need realistic handwriting for school assignments,
            creative projects, or business communications, our comprehensive feature set ensures you can
            create exactly what you envision. All features are completely free and work entirely in your
            browser for maximum privacy and convenience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
