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
        {CHANGELOG_ENTRIES.map(entry => {
          const isNewYear = entry.changeType === 'new-year';
          return (
            <article
              key={entry.version}
              id={`v${entry.version.replace(/\./g, '-')}`}
              className={`rounded-2xl border bg-[var(--panel-bg)]/80 shadow-lg backdrop-blur overflow-hidden transition-all duration-300 relative ${isNewYear
                ? 'border-yellow-500/50 shadow-yellow-500/10'
                : 'border-[var(--panel-border)]'
                }`}
              style={isNewYear ? {
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(var(--panel-bg), 0.8) 100%)'
              } : undefined}
            >
              {isNewYear && (
                <>
                  <div className="absolute -top-6 -right-6 text-yellow-500/10 pointer-events-none select-none">
                    {/* Fireworks Icon */}
                    <svg className="w-40 h-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" className="opacity-50" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" fill="currentColor" className="opacity-20" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-6 -left-4 text-yellow-500/10 transform -rotate-12 pointer-events-none select-none">
                    {/* Bell Icon */}
                    <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500/5 pointer-events-none select-none whitespace-nowrap">
                    <span className="text-[8rem] font-black tracking-tighter leading-none select-none font-sans">2026</span>
                  </div>
                </>
              )}
              <div className={`relative px-6 py-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isNewYear ? 'border-yellow-500/30' : 'border-[var(--panel-border)]'
                }`}>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-semibold ${isNewYear ? 'text-yellow-500' : 'text-[var(--text-color)]'}`}>
                      Version {entry.version}
                    </h2>
                    {isNewYear && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500 text-black uppercase tracking-wider">
                        2026
                      </span>
                    )}
                  </div>
                  <p className={`text-sm text-[var(--text-muted)] ${entry.version !== '1.4' ? 'hidden' : ''}`}>
                    {entry.date}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-2 text-sm font-medium ${isNewYear ? 'text-yellow-500' : 'text-[var(--accent-color)]'
                  }`}>
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
                      <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${isNewYear ? 'bg-yellow-500' : 'bg-[var(--accent-color)]'
                        }`}></span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                {entry.mood && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${isNewYear
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-[var(--control-bg)]/70 border-[var(--panel-border)] text-[var(--text-muted)]'
                    }`}>
                    <strong className={isNewYear ? 'text-yellow-600 dark:text-yellow-400' : 'text-[var(--text-color)]'}>
                      Mood:
                    </strong> {entry.mood}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default ChangeLogPage;
