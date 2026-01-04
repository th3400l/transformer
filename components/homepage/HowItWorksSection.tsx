/**
 * HowItWorksSection Component
 * 
 * Displays a 3-step process section explaining how to use the handwriting generator.
 * Implements responsive layout (horizontal on desktop, vertical on mobile) with
 * visual indicators (numbers, icons, connecting lines).
 * 
 * Requirements: 1.4, 2.1, 2.4
 */

import React from 'react';
import { howItWorksSteps } from '@/content/homepage';

// Icon components for each step
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
);

const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
    />
  </svg>
);

const DownloadIconLocal: React.FC<{ className?: string }> = ({ className }) => (
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
  edit: EditIcon,
  palette: PaletteIcon,
  download: DownloadIconLocal,
};

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      className="w-full py-16 md:py-24 bg-bg transition-colors duration-300"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <header className="text-center mb-12 md:mb-16">
          <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-4">
            How It Works
          </h2>
          <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto">
            Transform your text into authentic handwriting in three simple steps
          </p>
        </header>

        {/* Steps Container */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--rose-highlight)] via-[var(--rose-primary)] to-[var(--rose-highlight)] opacity-50"
            style={{ top: '6rem' }}
            aria-hidden="true"
          />

          {/* Steps Grid */}
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12" role="list" aria-label="Steps to use the handwriting generator">
            {howItWorksSteps.map((step) => {
              const IconComponent = iconMap[step.icon] || EditIcon;

              return (
                <li
                  key={step.number}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Icon Circle */}
                  <div className="relative z-10 w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[var(--rose-primary)] to-[var(--rose-secondary)] flex items-center justify-center shadow-lg mb-6" aria-hidden="true">
                    <IconComponent className="w-12 h-12 md:w-14 md:h-14 text-white" />

                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-panel-bg border-4 border-[var(--rose-primary)] flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-accent" aria-label={`Step ${step.number}`}>
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Step Content */}
                  <h3 className="text-xl md:text-2xl font-bold text-text mb-3">
                    {step.title}
                  </h3>

                  <p className="text-base md:text-lg text-text-muted leading-relaxed max-w-sm">
                    {step.description}
                  </p>

                  {/* Connecting arrow (mobile only) */}
                  {step.number < howItWorksSteps.length && (
                    <div
                      className="md:hidden mt-6 mb-2"
                      aria-hidden="true"
                    >
                      <svg
                        className="w-6 h-6 text-text-muted opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Additional Context */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-base md:text-lg text-text-muted max-w-2xl mx-auto">
            Our handwriting generator makes it easy to create realistic handwritten text for any purpose.
            Whether you're a student working on assignments, a content creator designing aesthetic posts,
            or a professional adding personal touches to documents, our tool delivers authentic results every time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
