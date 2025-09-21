import React, { useEffect, useState } from 'react';

const CONSENT_STORAGE_KEY = 'ttwh-consent-preferences';

type ConsentState = 'granted' | 'denied';

const COOKIE_MESSAGE = `We use Google Analytics with Consent Mode to understand how txttohandwriting.org is used. We only enable analytics once you say it's okay.`;

const updateGtagConsent = (state: ConsentState) => {
  if (typeof window === 'undefined') {
    return;
  }
  const gtag = (window as any).gtag as ((...args: any[]) => void) | undefined;
  if (!gtag) {
    return;
  }

  const value = state === 'granted' ? 'granted' : 'denied';
  gtag('consent', 'update', {
    'ad_storage': value,
    'ad_user_data': value,
    'ad_personalization': value,
    'analytics_storage': value
  });
};

interface CookieConsentBannerProps {
  onOpenTerms?: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenTerms }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY) as ConsentState | null;
      if (stored === 'granted') {
        updateGtagConsent('granted');
        setIsVisible(false);
      } else if (stored === 'denied') {
        updateGtagConsent('denied');
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    } catch (error) {
      console.warn('Failed to load consent preferences:', error);
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!hasInteracted && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored === 'granted' || stored === 'denied') {
        setIsVisible(false);
      }
    }
  }, [hasInteracted]);

  const persistConsent = (state: ConsentState) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
      } catch (error) {
        console.warn('Failed to persist consent preferences:', error);
      }
    }
  };

  const handleAccept = () => {
    updateGtagConsent('granted');
    persistConsent('granted');
    setHasInteracted(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    updateGtagConsent('denied');
    persistConsent('denied');
    setHasInteracted(true);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-4 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)]/95 shadow-2xl backdrop-blur-md p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--text-color)]">Cookies & Consent</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
          {COOKIE_MESSAGE} Read our{' '}
          <button
            type="button"
            onClick={() => {
              if (onOpenTerms) {
                onOpenTerms();
              } else {
                window.location.href = '#terms';
              }
            }}
            className="text-[var(--accent-color)] hover:text-[var(--accent-color-hover)] underline-offset-4 hover:underline"
          >
            Terms & Conditions
          </button>{' '}
          to learn more.
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDecline}
            className="inline-flex items-center justify-center rounded-full border border-[var(--accent-color)] px-4 py-2 text-sm font-medium text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-[#1f1a13] hover:bg-[var(--accent-color-hover)] transition-colors"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
