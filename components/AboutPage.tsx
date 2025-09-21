/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import SupportCTA, { SUPPORT_EMAIL } from './SupportCTA';

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/th3f00l';

interface PageProps {
  onGoBack: () => void;
}

const AboutPage: React.FC<PageProps> = ({ onGoBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[var(--accent-color)]">About The Vibe</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; Back to the lab
          </button>
        </div>
        <div className="text-[var(--text-muted)] space-y-6 leading-relaxed">
          <p>
            txttohandwriting.org started as a late-night dare to make digital notes feel less robotic and more like the doodled pages we grew up with. What was supposed to be a tiny script spiralled into Blend Modes, texture managers, and way too many cups of coffee.
          </p>
          <p>
            Today the generator powers students, designers, and serial procrastinators who still want their submissions to look handcrafted. We obsess over believable ink jitter, responsive canvases, and keeping the whole experience fast enough to finish that assignment thirty minutes before the deadline.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg border border-[var(--panel-border)] bg-[var(--control-bg)]/50 sm:col-span-2">
              <h2 className="text-base font-semibold text-[var(--text-color)] mb-1">Open to the community</h2>
              <p className="text-sm">
                Feature ideas, bug reports, and meme-worthy suggestions all land in the same inbox. We genuinely read everything that comes through.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-semibold shadow-sm transition-opacity text-white hover:opacity-90"
              style={{ backgroundColor: '#ff6fa3' }}
            >
              Present a Rose
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Bitcoin%20Donation&body=Hey%20team,%20drop%20me%20the%20current%20BTC%20wallet%20so%20I%20can%20support%20the%20project.`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-semibold text-[#201c17] shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#f3c77d' }}
            >
              Donate a Bitcoin
            </a>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Wallet address coming soon—until then, shoot us a message and we’ll send the latest details personally.
          </p>

          <p className="text-center text-lg pt-2">
            <span className="font-mono text-[var(--accent-color)]">Made with $ by Th3-F00L</span>
          </p>
        </div>
        <SupportCTA
          headline="Need help, feedback, or just want to say hi?"
          description="We answer every email ourselves. Your screenshots, feature ideas, and wins keep this project alive."
        />
      </div>
    </div>
  );
};

export default AboutPage;
