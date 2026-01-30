import React, { useState } from 'react';

export const AdUnit: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={`w-full my-4 relative ${className}`}>
      <div className="flex justify-between items-end mb-1 px-1">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Advertisement</div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="text-[var(--text-muted)] hover:text-[var(--text-color)] p-0.5 rounded-full hover:bg-[var(--control-bg)] transition-colors"
          aria-label="Close advertisement"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      <a 
        href="https://nsa.tools" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block bg-[var(--panel-bg)] border border-[var(--accent-color)]/30 hover:border-[var(--accent-color)] rounded-xl overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-md"
        aria-label="Visit nsa.tools - Next-gen Software Archive"
      >
        <div className="p-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--accent-color)]/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <h3 className="text-base font-bold text-[var(--text-color)] mb-1 flex items-center gap-2">
              <span>nsa.tools</span>
              <span className="text-[10px] bg-[var(--accent-color)] text-white px-1.5 py-0.5 rounded font-medium">NEW</span>
            </h3>
            <p className="text-xs font-medium text-[var(--accent-color)] mb-2">Next-gen Software Archive</p>
          <p className="text-[var(--text-muted)] text-xs mb-3 leading-relaxed">
            The Swiss Army Knife for the modern web. Convert, Encrypt, Edit files and play games directly in your browser with WebAssembly performance.
          </p>
            
            <div className="flex flex-wrap gap-1.5">
              {['PDF Tools', 'Converters', 'Encryption', 'Dev Tools'].map((tag) => (
                <span key={tag} className="text-[10px] bg-[var(--control-bg)] border border-[var(--control-border)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};
