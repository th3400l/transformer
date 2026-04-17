import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdUnitProps {
  className?: string;
  slot?: string;
}

/**
 * Professional AdSense Unit
 * Note: While in review, this will appear as an empty space or show 'Auto Ads'.
 * Hardcoded banners to other sites (like nsa.tools) are removed to comply with
 * AdSense 'Valuable Inventory' policies.
 */
export const AdUnit: React.FC<AdUnitProps> = ({ className = '', slot }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }

    // Set up an observer to detect when the ad is actually filled
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
          const status = (mutation.target as HTMLElement).getAttribute('data-ad-status');
          const container = (mutation.target as HTMLElement).closest('.ad-container');
          if (status === 'filled' && container) {
            container.classList.add('is-filled');
          }
        }
      });
    });

    const insElement = document.querySelector(`.ad-container-${slot || 'default'} ins`);
    if (insElement) {
      observer.observe(insElement, { attributes: true });
    }

    return () => observer.disconnect();
  }, [slot]);

  return (
    <div className={`ad-container ad-container-${slot || 'default'} w-full my-6 overflow-hidden text-center hidden [&.is-filled]:block ${className}`}>
      <span className="text-[10px] text-text-muted uppercase tracking-widest mb-2 block opacity-50">
        Advertisement
      </span>
      {/* Standard Google AdSense Code */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-4658909141336304"
        data-ad-slot={slot || "default"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};
