import React from 'react';

export function Header({ username, theme, onToggleTheme, onLogout, showUserControls = true }) {
  return (
    <header className="flex-shrink-0 sticky top-0 z-40 bg-surface-container-low border-b border-outline-variant/30 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center space-x-3.5">
        <svg className="h-10 w-10 flex-shrink-0" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--md-sys-color-primary)" />
              <stop offset="100%" stopColor="var(--md-sys-color-tertiary)" />
            </linearGradient>
          </defs>
          <circle cx="256" cy="256" r="210" fill="none" stroke="url(#logoGrad)" strokeWidth="36" />
          <g fill="url(#logoGrad)">
            <path d="M 165,171 H 317 A 24,24 0 0 1 341,195 V 205 H 141 V 195 A 24,24 0 0 1 165,171 Z" opacity="0.85" />
            <rect x="141" y="201" width="200" height="140" rx="24" />
            <rect x="311" y="246" width="60" height="50" rx="16" />
            <circle cx="346" cy="271" r="7" fill="var(--md-sys-color-surface-container-lowest)" />
          </g>
          <svg x="196" y="226" width="90" height="90" viewBox="0 0 16 16" fill="var(--md-sys-color-surface-container-lowest)">
            <path d="M4 3.06h2.726c1.22 0 2.12.575 2.325 1.724H4v1.051h5.051C8.855 7.001 8 7.558 6.788 7.558H4v1.317L8.437 14h2.11L6.095 8.884h.855c2.316-.018 3.465-1.476 3.688-3.049H12V4.784h-1.345c-.08-.778-.357-1.335-.793-1.732H12V2H4z"/>
          </svg>
        </svg>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">PAYGROUND TRACKER</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showUserControls && username && (
          <div className="hidden sm:flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full border border-outline-variant/20 text-xs font-semibold">
            <span className="material-symbols-outlined text-base">person</span>
            <span>{username}</span>
          </div>
        )}

        <button
          onClick={onToggleTheme}
          className="h-10 w-10 rounded-full border border-outline hover:bg-on-surface/5 active:scale-95 flex items-center justify-center transition-all duration-200 text-on-surface-variant hover:text-on-surface cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {showUserControls && onLogout && (
          <button
            onClick={onLogout}
            className="h-10 px-4 rounded-full border border-error/40 text-error hover:bg-error-container/10 hover:text-error active:scale-95 flex items-center justify-center gap-1.5 transition-all duration-200 text-xs font-semibold cursor-pointer"
            title="Sign Out"
          >
            <span>Sign Out</span>
            <span className="material-symbols-outlined text-sm font-bold">logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
