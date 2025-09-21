import React from 'react';

interface RoseLogoProps {
  size?: number;
  className?: string;
}

const RoseLogo: React.FC<RoseLogoProps> = ({ size = 36, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    className={className}
    role="img"
    aria-label="txttohandwriting.org rose logo"
    focusable="false"
  >
    <defs>
      <radialGradient id="roseLogoGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#fde6f1" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#f195b7" stopOpacity="0.24" />
        <stop offset="100%" stopColor="#f195b7" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="rosePetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbd6e6" />
        <stop offset="45%" stopColor="#f195b7" />
        <stop offset="100%" stopColor="#de6e9c" />
      </linearGradient>
      <radialGradient id="roseBudGradient" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#fff7fb" />
        <stop offset="55%" stopColor="#f8bbd8" />
        <stop offset="100%" stopColor="#de6e9c" />
      </radialGradient>
    </defs>

    <circle cx="60" cy="60" r="56" fill="url(#roseLogoGlow)" />

    <g fill="url(#rosePetalGradient)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
      <ellipse cx="60" cy="38" rx="24" ry="30" />
      <ellipse cx="60" cy="82" rx="24" ry="30" />
      <ellipse cx="36" cy="60" rx="22" ry="30" transform="rotate(-90 36 60)" />
      <ellipse cx="84" cy="60" rx="22" ry="30" transform="rotate(90 84 60)" />
      <ellipse cx="60" cy="60" rx="24" ry="28" transform="rotate(45 60 60)" opacity="0.72" />
      <ellipse cx="60" cy="60" rx="24" ry="28" transform="rotate(-45 60 60)" opacity="0.72" />
    </g>

    <circle cx="60" cy="60" r="22" fill="url(#roseBudGradient)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(222,110,156,0.38)" strokeWidth="2" />
  </svg>
);

export default RoseLogo;
