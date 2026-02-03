import React, { useState, useEffect } from 'react';
import { AdUnit } from './AdUnit';

export const SideAdUnit: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on screens wide enough to fit content + ads without overlap
    // Content max-w-7xl is approx 1280px
    // Ads are w-60 (240px)
    // Need: 1280 + 240 + 240 + margins ~ 1800px
    const checkWidth = () => {
      setIsVisible(window.innerWidth >= 1800);
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed left-6 top-1/2 -translate-y-1/2 w-60 z-40">
        <AdUnit />
      </div>
      <div className="fixed right-6 top-1/2 -translate-y-1/2 w-60 z-40">
        <AdUnit />
      </div>
    </>
  );
};