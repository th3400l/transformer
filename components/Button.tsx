import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading,
    disabled,
    ...props
}, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg active:translate-y-0',
        secondary: 'bg-control-bg border border-control-border text-text hover:bg-control-border/50',
        outline: 'bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-white',
        ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-control-bg/50',
        icon: 'p-2 rounded-full bg-control-bg border border-panel-border text-text-muted hover:text-text hover:shadow-md'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    // Icon variant handles its own padding/sizing usually, but we can keep size prop effect if needed or override
    const sizeStyles = variant === 'icon' ? '' : sizes[size];

    return (
        <button
            ref={ref}
            className={`${baseStyles} ${variants[variant]} ${sizeStyles} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            {children}
        </button>
    );
});

Button.displayName = 'Button';
