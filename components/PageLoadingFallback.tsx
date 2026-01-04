import React from 'react';
import { RoseSpinner } from './Spinner';

const PageLoadingFallback: React.FC = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-color)] z-50">
        <div className="flex flex-col items-center gap-4">
            <RoseSpinner size={64} label="Loading Page..." />
            <span className="text-[var(--text-muted)] text-sm animate-pulse">Loading...</span>
        </div>
    </div>
);

export default PageLoadingFallback;
