/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import SupportCTA from './SupportCTA';

interface PageProps {
  onGoBack: () => void;
}

const FaqPage: React.FC<PageProps> = ({ onGoBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[var(--accent-color)]">The 411 (FAQ)</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; Back to the lab
          </button>
        </div>
        <div className="space-y-4">
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              Is this actually free?
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              Fr fr, it's free. No cap. We're not about that subscription life. Go wild(Don't break anything).
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              Can I use this for my side hustle?
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              Totally. Make your memes, brand your Depop, whatever. Go get that bread. No credit needed, but a shoutout would be iconic.
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              Are you reading my unhinged thoughts?
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              Nah, we can't see a thing. We are not like that alien Mar..kek... ahem.. nvm, to be frank we don't need your data. Our servers are like stones anyway. Your secrets are safe with us, bestie.
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              What's the deal with downloads?
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              Right now it's just PNGs. It's giving... high quality. We might add more formats later if the vibes are right.
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              Why does the font look kinda off?
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              It's probably your browser. Try updating it. If it's still looking sus, it might just be your OS doing its thing. It's a vibe, not an exact science.
            </p>
          </details>
          <details className="p-4 border border-[var(--panel-border)] rounded-lg group">
            <summary className="font-semibold text-[var(--text-color)] cursor-pointer list-none flex justify-between items-center">
              My faculty asks for hardcopies, what should I do?
              <span className="text-[var(--text-muted)] transform transition-transform duration-300 group-open:rotate-180">&darr;</span>
            </summary>
            <p className="mt-4 text-[var(--text-muted)]">
              I got ya girl/boy!. I have a perfect solution fo you{' '}
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-color)] hover:underline font-medium"
              >
                visit here
              </a>
              (watch fully)
            </p>
          </details>
        </div>
        <SupportCTA
          headline="Still confused or want to roast a bug?"
          description="Drop the team a note and we'll get back faster than you can say cursive."
        />
      </div>
    </div>
  );
};

export default FaqPage;
