/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface PageProps {
  onGoBack: () => void;
}

const TermsPage: React.FC<PageProps> = ({ onGoBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-6">
          <h1 className="text-3xl font-bold text-[var(--accent-color)]">Terms and Conditions</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; Back to Generator
          </button>
        </div>
        <div className="text-[var(--text-muted)] space-y-4 leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>
            Welcome to txttohandwriting.org! These terms and conditions outline the rules and regulations for the use of our website. By accessing this website, we assume you accept these terms and conditions. Do not continue to use txttohandwriting.org if you do not agree to all of the terms and conditions stated on this page.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">1. Acceptance of Terms</h2>
          <p>
            The service is provided "as is" and "as available" without any warranties. We do not guarantee that the service will be uninterrupted or error-free.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">2. Use of the Service</h2>
          <p>
            You agree to use our service for lawful purposes only. You are solely responsible for the content you create and convert. You agree not to use the service to create any content that is defamatory, obscene, or otherwise objectionable.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">3. Intellectual Property</h2>
          <p>
            The text you input is your own. The generated images from your text can be used for personal and commercial purposes. However, the fonts, design, and branding of txttohandwriting.org are the property of the website owners and may not be used without permission.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">4. Disclaimer of Warranties</h2>
          <p>
            Our website is provided on an "as is" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">5. Limitation of Liability</h2>
          <p>
            In no event shall txttohandwriting.org or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we have been notified orally or in writing of the possibility of such damage.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text-color)] pt-4">6. Changes to Terms</h2>
          <p>
            We reserve the right to revise these terms and conditions at any time. By using this website, you are expected to review these terms on a regular basis to ensure you understand all terms and conditions governing the use of this website.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
