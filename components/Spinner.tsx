import React from 'react';

export interface RoseSpinnerProps {
  size?: number;
  className?: string;
  label?: string;
  announce?: boolean;
}

export const RoseSpinner: React.FC<RoseSpinnerProps> = ({
  size = 80,
  className = '',
  label = 'Loading',
  announce = true
}) => {
  const accessibleProps = announce
    ? { role: 'status' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  return (
    <div
      className={`rose-spinner ${className}`}
      style={{ width: size, height: size }}
      {...accessibleProps}
    >
      {announce && <span className="sr-only">{label}</span>}
      <div className="rose-spinner__petal rose-spinner__petal--one" />
      <div className="rose-spinner__petal rose-spinner__petal--two" />
      <div className="rose-spinner__petal rose-spinner__petal--three" />
      <div className="rose-spinner__petal rose-spinner__petal--four" />
      <div className="rose-spinner__bud" />
      <div className="rose-spinner__glow" />
    </div>
  );
};

export default RoseSpinner;
