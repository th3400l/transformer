/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../App';
import RoseLogo from './RoseLogo';



const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

const GearIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.03.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.337 6.337 0 0 1-.22.127c-.331.183-.581.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.337 6.337 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.072-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onGoHome: () => void;
    onGoToBlog: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme, onGoHome, onGoToBlog }) => {
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

    return (
        <header className="w-full py-3 px-4 sm:px-8 sticky top-0 z-50 bg-[var(--panel-bg)] backdrop-blur-lg border-b border-[var(--panel-border)] shadow-sm transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onGoHome} className="flex items-center justify-center gap-3">
                        <RoseLogo size={34} className="shrink-0 translate-y-[1px]" />
                        <h1 className="text-2xl font-semibold uppercase tracking-[0.28em] text-[var(--text-color)]">
                            Txt to handwriting
                        </h1>
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative" ref={engineMenuRef}>
                        <button
                            onClick={() => setIsEngineMenuOpen(!isEngineMenuOpen)}
                            className="p-2 rounded-full bg-[var(--control-bg)] border border-[var(--panel-border)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
                            aria-label="Generation Engine"
                            title="Generation Engine"
                        >
                            <GearIcon className="w-6 h-6" />
                        </button>
                        {isEngineMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl py-1 z-10 backdrop-blur-xl">
                                <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">GEN ENGINE</div>
                                <div className="flex items-center justify-between px-3 py-2 text-[var(--text-color)] bg-[var(--control-bg)] border-y border-[var(--panel-border)]">
                                    <span className="font-medium">Gear 1</span>
                                    <CheckIcon className="w-5 h-5 text-[var(--accent-color)]" />
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 text-[var(--text-muted)] opacity-60 cursor-not-allowed">
                                    <span className="font-medium">Gear 2</span>
                                    <span className="text-xs font-bold bg-[var(--control-border)] text-[var(--text-muted)] rounded-full px-2 py-0.5">Soon</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-[var(--control-bg)] border border-[var(--panel-border)] text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
                        aria-label="Toggle theme"
                        title={getTooltipText()}
                    >
                        {theme === 'nightlight' && <MoonIcon className="w-6 h-6" />}
                        {theme === 'dark' && <HeartIcon className="w-6 h-6" />}
                        {theme === 'feminine' && <SunIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
