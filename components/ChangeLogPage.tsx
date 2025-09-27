import React from 'react';
import { CHANGELOG_ENTRIES } from '../app/constants';

const ChangeLogPage: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  return (
    <section className="max-w-5xl mx-auto px-4 md:px-10 lg:px-16 py-8 md:py-12 text-[var(--text-color)]">
      <header className="mb-10 flex flex-col gap-3">
        <button
          onClick={onGoBack}
          className="self-start flex items-center gap-2 text-sm font-medium text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to the lab
        </button>
        <div>
          <p className="uppercase tracking-[0.28em] text-xs text-[var(--text-muted)]">Product updates</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">Changelog</h1>
          <p className="mt-3 text-base md:text-lg text-[var(--text-muted)] max-w-2xl">
            Every glow-up, tweak, and big reveal we have shipped since launch. We keep things human—no jargon, just what changed and why it matters for your notes.
          </p>
        </div>
      </header>

      <div className="space-y-10">
        {CHANGELOG_ENTRIES.map(entry => (
          <article
            key={entry.version}
            id={`v${entry.version.replace(/\./g, '-')}`}
            className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)]/80 shadow-lg backdrop-blur"
          >
            <div className="px-6 py-5 border-b border-[var(--panel-border)] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--text-color)]">Version {entry.version}</h2>
                <p className="text-sm text-[var(--text-muted)]">{entry.date}</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-color)]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {entry.tagline}
              </span>
            </div>
            <div className="px-6 py-6 space-y-4 text-sm md:text-base">
              <ul className="space-y-3">
                {entry.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3 text-[var(--text-color)]">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[var(--accent-color)]"></span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              {entry.mood && (
                <div className="rounded-xl bg-[var(--control-bg)]/70 border border-[var(--panel-border)] px-4 py-3 text-[var(--text-muted)] text-sm">
                  <strong className="text-[var(--text-color)]">Mood:</strong> {entry.mood}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ChangeLogPage;
