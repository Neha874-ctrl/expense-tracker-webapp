import React from 'react';

export function Snackbar({ alert }) {
  if (!alert || !alert.message) return null;

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const iconColors = {
    success: 'var(--md-sys-color-primary)',
    error: 'var(--md-sys-color-error)',
    warning: 'var(--md-sys-color-secondary)',
    info: 'var(--md-sys-color-on-surface-variant)',
  };

  const type = alert.type || 'info';
  const icon = icons[type] || icons.info;
  const iconColor = iconColors[type] || iconColors.info;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]"
      style={{ minWidth: '300px', maxWidth: '420px', width: 'max-content' }}
    >
      <div
        className="animate-fade-in flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl transition-all duration-200"
        style={{
          background: 'var(--md-sys-color-inverse-surface)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)',
        }}
      >
        <span
          className="material-symbols-outlined shrink-0"
          style={{ fontSize: '1.1rem', color: iconColor }}
        >
          {icon}
        </span>
        <span
          className="text-xs font-medium tracking-wide"
          style={{ color: 'var(--md-sys-color-inverse-on-surface)' }}
        >
          {alert.message}
        </span>
      </div>
    </div>
  );
}
