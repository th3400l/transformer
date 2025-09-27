/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface NotFoundPageProps {
  requestedPath?: string;
  onGoHome: () => void;
  donationHref?: string;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({
  requestedPath,
  onGoHome,
  donationHref
}) => {
  return (
    <main
      className="flex-1 flex items-center justify-center px-4 py-12"
      aria-labelledby="not-found-heading"
    >
      <section className="w-full max-w-3xl bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-2xl shadow-2xl shadow-[var(--shadow-color)] backdrop-blur-xl px-6 sm:px-10 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--control-bg)] border border-[var(--panel-border)] text-[var(--accent-color)] mb-6">
          <span className="text-2xl font-semibold">404</span>
        </div>
        <h1 id="not-found-heading" className="text-3xl sm:text-4xl font-bold text-[var(--text-color)] mb-4">
          This page drifted off the notebook
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed mb-6">
          {requestedPath
            ? `We couldn't find "${requestedPath}".`
            : 'The page you were looking for is missing.'}{' '}
          Keep exploring the handwriting lab—{' '}
          {donationHref
            ? 'or maybe you were hunting for the donation page, here you go.'
            : 'we saved you a fresh sheet back at the lab.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onGoHome}
            className="rounded-lg bg-[var(--accent-color)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--accent-color-hover)]"
          >
            Return to the Lab
          </button>
          {donationHref && (
            <a
              href={donationHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-transparent bg-[#ff7eb8] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.03]"
            >
              Present a Rose
            </a>
          )}
        </div>
      </section>
    </main>
  );
};

export default NotFoundPage;
