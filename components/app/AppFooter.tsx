import React from 'react';
import { Page } from '../../app/constants';

interface AppFooterProps {
  onNavigate: (page: Page) => void;
  onPresentRose: () => void;
}

const AboutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const BlogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
  </svg>
);

const TermsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const FaqIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
  </svg>
);

const ChangelogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 1.5M4.5 12a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0Z" />
  </svg>
);

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate, onPresentRose }) => (
  <footer className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-8 text-center text-sm">
    <div className="flex justify-center items-center flex-col sm:flex-row gap-2 sm:gap-6 border-t border-[var(--panel-border)] pt-6">
      <button onClick={() => onNavigate('about')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
        <AboutIcon className="w-4 h-4" />
        About
      </button>
      <button onClick={() => onNavigate('blog')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
        <BlogIcon className="w-4 h-4" />
        The Tea
      </button>
      <button onClick={() => onNavigate('changelog')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
        <ChangelogIcon className="w-4 h-4" />
        Changelog
      </button>
      <button onClick={() => onNavigate('terms')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
        <TermsIcon className="w-4 h-4" />
        Terms and Conditions
      </button>
      <button onClick={() => onNavigate('faq')} className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors flex items-center gap-2">
        <FaqIcon className="w-4 h-4" />
        Frequently Asked Questions
      </button>
    </div>
    <div className="mt-4 pt-4 border-t border-[var(--panel-border)] text-[var(--text-muted)]">
      <p>&copy; {new Date().getFullYear()} txttohandwriting.org. All rights reserved.</p>
    </div>
  </footer>
);
