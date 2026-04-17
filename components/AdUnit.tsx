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
  }, []);

  return (
    <div className={`ad-container w-full my-6 overflow-hidden text-center ${className}`}>
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
