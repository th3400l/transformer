/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect } from 'react';
import { Theme, Page } from '../app/constants';
import RoseLogo from './RoseLogo';
import { Button } from './Button';
import { SunIcon, MoonIcon, HeartIcon, GearIcon, CheckIcon } from './icons';

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onNavigate: (page: Page) => void;
    currentPage: Page;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme, onNavigate, currentPage }) => {
    const [isEngineMenuOpen, setIsEngineMenuOpen] = useState(false);
    const engineMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (engineMenuRef.current && !engineMenuRef.current.contains(event.target as Node)) {
                setIsEngineMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [engineMenuRef]);

    const toggleTheme = () => {
        if (theme === 'nightlight') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('feminine');
        } else {
            setTheme('nightlight');
        }
    };

    const getTooltipText = () => {
        if (theme === 'nightlight') return 'Slip into Midnight Mode';
        if (theme === 'dark') return 'Glow with Rose Hues';
        return 'Return to Notebook Glow';
    };

    // Fallback for missing theme
    const currentTheme = theme || 'nightlight';

    return (
        <header className="w-full py-3 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 bg-panel-bg backdrop-blur-lg border-b border-panel-border shadow-sm transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={() => onNavigate('main')} className="flex items-center justify-center gap-2 sm:gap-3 group">
                        <RoseLogo size={32} className="shrink-0 translate-y-[1px] sm:w-[34px] sm:h-[34px] transition-transform group-hover:scale-105" />
                        <span className="text-lg sm:text-2xl font-semibold uppercase tracking-[0.2em] sm:tracking-[0.28em] text-text">
                            <span className="hidden sm:inline">Txt to handwriting</span>
                            <span className="sm:hidden">Txt2HW</span>
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative" ref={engineMenuRef}>
                        <Button
                            variant="icon"
                            onClick={() => setIsEngineMenuOpen(!isEngineMenuOpen)}
                            aria-label="Generation Engine"
                            title="Generation Engine"
                        >
                            <GearIcon className="w-6 h-6" />
                        </Button>
                        {isEngineMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-panel-bg border border-panel-border rounded-lg shadow-xl py-1 z-10 backdrop-blur-xl">
                                <div className="px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">GEN ENGINE</div>
                                <div className="flex items-center justify-between px-3 py-2 text-text bg-control-bg border-y border-panel-border">
                                    <span className="font-medium">Version 1.4</span>
                                    <CheckIcon className="w-5 h-5 text-accent" />
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 text-text-muted opacity-60 cursor-not-allowed">
                                    <span className="font-medium">Version 2</span>
                                    <span className="text-xs font-bold bg-control-border text-text-muted rounded-full px-2 py-0.5">Soon</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="icon"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        title={getTooltipText()}
                    >
                        {currentTheme === 'nightlight' && <MoonIcon className="w-6 h-6" />}
                        {currentTheme === 'dark' && <HeartIcon className="w-6 h-6" />}
                        {currentTheme === 'feminine' && <SunIcon className="w-6 h-6" />}
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
