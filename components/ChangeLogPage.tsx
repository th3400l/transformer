import React from 'react';
import { useTranslation } from 'react-i18next';
import { CHANGELOG_ENTRIES } from '../app/constants';

const ChangeLogPage: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  const { t } = useTranslation();

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
          {t('pages.changelog.back', 'Back to the lab')}
        </button>
        <div>
          <p className="uppercase tracking-[0.28em] text-xs text-[var(--text-muted)]">{t('pages.changelog.productUpdates', 'Product updates')}</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{t('pages.changelog.title', 'Changelog')}</h1>
          <p className="mt-3 text-base md:text-lg text-[var(--text-muted)] max-w-2xl">
            {t('pages.changelog.description')}
          </p>
        </div>
      </header>

      <div className="space-y-10">
        {CHANGELOG_ENTRIES.map(entry => {
          const isNewYear = entry.changeType === 'new-year';
          const isLaunch2025 = entry.changeType === 'launch-2025';
          const entryKey = `v${entry.version.replace(/\./g, '-')}`;
          const translatedEntry = t(`pages.changelog.entries.${entryKey}`, { returnObjects: true }) as any;
          
          const tagline = translatedEntry?.tagline || entry.tagline;
          const highlights = translatedEntry?.highlights || entry.highlights;
          const mood = translatedEntry?.mood || entry.mood;

          return (
            <article
              key={entry.version}
              id={entryKey}
              className={`rounded-2xl border bg-[var(--panel-bg)]/80 shadow-lg backdrop-blur overflow-hidden transition-all duration-300 relative ${isNewYear
                ? 'border-yellow-500/50 shadow-yellow-500/10'
                : isLaunch2025
                ? 'border-indigo-500/50 shadow-indigo-500/10'
                : 'border-[var(--panel-border)]'
                }`}
              style={isNewYear ? {
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(var(--panel-bg), 0.8) 100%)'
              } : isLaunch2025 ? {
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(var(--panel-bg), 0.8) 100%)'
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
              {isLaunch2025 && (
                <>
                  <div className="absolute -top-6 -right-6 text-indigo-500/10 pointer-events-none select-none">
                    {/* Rocket Icon */}
                    <svg className="w-40 h-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-6 -left-4 text-indigo-500/10 transform -rotate-12 pointer-events-none select-none">
                    {/* Star Icon */}
                    <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500/10 pointer-events-none select-none whitespace-nowrap">
                    <span className="text-[8rem] font-black tracking-tighter leading-none select-none font-sans">2025</span>
                  </div>
                </>
              )}
              <div className={`relative px-6 py-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isNewYear ? 'border-yellow-500/30' : isLaunch2025 ? 'border-indigo-500/30' : 'border-[var(--panel-border)]'
                }`}>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-semibold ${isNewYear ? 'text-yellow-500' : isLaunch2025 ? 'text-indigo-500 dark:text-indigo-400' : 'text-[var(--text-color)]'}`}>
                      Version {entry.version}
                    </h2>
                    {isNewYear && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500 text-black uppercase tracking-wider">
                        2026
                      </span>
                    )}
                    {isLaunch2025 && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500 text-white uppercase tracking-wider">
                        2025
                      </span>
                    )}
                  </div>
                  <p className={`text-sm text-[var(--text-muted)] ${entry.version !== '1.4' && entry.version !== '1.0' ? 'hidden' : ''}`}>
                    {entry.date}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-2 text-sm font-medium ${isNewYear ? 'text-yellow-500' : isLaunch2025 ? 'text-indigo-500 dark:text-indigo-400' : 'text-[var(--accent-color)]'
                  }`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {tagline}
                </span>
              </div>
              <div className="px-6 py-6 space-y-4 text-sm md:text-base">
                <ul className="space-y-3">
                  {highlights.map((highlight: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 text-[var(--text-color)]">
                      <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${isNewYear ? 'bg-yellow-500' : isLaunch2025 ? 'bg-indigo-500' : 'bg-[var(--accent-color)]'
                        }`}></span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                {mood && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${isNewYear
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                    : isLaunch2025
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-[var(--control-bg)]/70 border-[var(--panel-border)] text-[var(--text-muted)]'
                    }`}>
                    <strong className={isNewYear ? 'text-yellow-600 dark:text-yellow-400' : isLaunch2025 ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-color)]'}>
                      {t('pages.changelog.mood', 'Mood')}:
                    </strong> {mood}
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
