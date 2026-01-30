import React, { useState, useEffect } from 'react';
import { AdUnit } from './AdUnit';

export const SideAdUnit: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on very large screens where there's ample whitespace
    // standard 1280px container + 300px sidebar space
    const checkWidth = () => {
      setIsVisible(window.innerWidth >= 1600);
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 w-64 z-40 hidden 2xl:block">
      <AdUnit />
    </div>
  );
};
