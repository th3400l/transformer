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
        <stop offset="0%" stopColor="var(--spinner-color-highlight)" stopOpacity="0.9" />
        <stop offset="70%" stopColor="var(--spinner-color-primary)" stopOpacity="0.24" />
        <stop offset="100%" stopColor="var(--spinner-color-primary)" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="rosePetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--spinner-color-highlight)" />
        <stop offset="45%" stopColor="var(--spinner-color-primary)" />
        <stop offset="100%" stopColor="var(--spinner-color-secondary)" />
      </linearGradient>
      <radialGradient id="roseBudGradient" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="55%" stopColor="var(--spinner-color-highlight)" />
        <stop offset="100%" stopColor="var(--spinner-color-secondary)" />
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
    <circle cx="60" cy="60" r="36" fill="none" stroke="var(--spinner-color-secondary)" strokeOpacity="0.38" strokeWidth="2" />
  </svg>
);

export default RoseLogo;
