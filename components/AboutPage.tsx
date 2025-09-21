/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

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
        <div className="text-[var(--text-muted)] space-y-4 leading-relaxed">
          <p>
            This little corner of the internet was brought to you by a moment of "wouldn't it be cool if...?" and a whole lot of code. It's a simple tool for a simple purpose: to make your text look like it was written by a human, not a robot.
          </p>
          <p>
            Whether you're trying to make your study notes more aesthetic, design a cute digital sticker(unlikely ik, you probably using this site to complete your useless assignments), or just pretend you have good handwriting, we got you. No frills, no fees, just vibes.
          </p>
           <p className="text-center text-lg pt-4">
            <span className="font-mono text-[var(--accent-color)]">Made with $ by Th3-F00L</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;