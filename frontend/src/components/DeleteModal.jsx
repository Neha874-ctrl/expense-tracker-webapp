import React from 'react';

export function DeleteModal({ isOpen, message, onConfirm, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-surface-container-high rounded-[28px] p-8 max-w-sm w-full border border-outline-variant/30 shadow-2xl transform scale-100 transition-transform flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="material-symbols-outlined text-error text-3xl">warning</span>
          <h3 className="text-2xl font-semibold text-on-surface mt-2">Confirm Deletion</h3>
          <p className="text-on-surface-variant text-sm mt-1">{message}</p>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold rounded-full text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-error text-on-error px-5 py-2.5 text-sm font-semibold rounded-full hover:shadow-md active:scale-95 transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
