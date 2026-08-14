import React, { useState } from 'react';

export function CategoryCard({ categories, onAddCategory, onRequestDeleteCategory }) {
  const [newCatName, setNewCatName] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setNewCatName('');
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-[28px] shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-primary">label</span>
        <h2 className="text-xl font-bold text-on-surface">Budget Categories</h2>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[30px] p-3 border border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest/50">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center w-full animate-fade-in">
            <svg
              className="w-12 h-12 text-primary/40 mb-2.5 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 20 4c-.48 3-1 4.5-2.1 10.2A7 7 0 0 1 11 20z" />
              <path d="M19 5L9 15" />
              <path d="M4 17a3 3 0 0 0 5.4 1.8M3 13a4 4 0 0 0 7.8 0M3.5 9A4 4 0 0 1 10 9" />
            </svg>
            <p className="text-xs font-bold text-on-surface-variant">No Categories Created</p>
            <p className="text-[10px] text-on-surface-variant/70 mt-1 max-w-[200px]">
              Define a custom category name below to structure your budget limits.
            </p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat}
              className="animate-fade-in flex items-center bg-secondary-container text-on-secondary-container text-xs font-medium pl-3.5 pr-2 py-1.5 rounded-full border border-outline-variant/30 shadow-sm"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => onRequestDeleteCategory(cat)}
                className="ml-2 h-5 w-5 rounded-full text-on-secondary-container/70 hover:bg-on-secondary-container/10 hover:text-error transition duration-150 flex items-center justify-center cursor-pointer"
                title={`Remove ${cat}`}
              >
                <span className="material-symbols-outlined text-sm font-bold">close</span>
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            id="new-category-name"
            placeholder=" "
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="peer w-full border border-outline rounded-xl px-4 py-3 bg-transparent text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 text-sm"
          />
          <label
            htmlFor="new-category-name"
            className="absolute left-3 -top-2 px-1 bg-surface-container-low text-xs text-on-surface-variant peer-focus:text-primary transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs"
          >
            New Category
          </label>
        </div>
        <button
          type="submit"
          className="bg-primary text-on-primary h-11 px-5 rounded-full font-semibold hover:shadow-md active:scale-95 transition-all duration-200 text-sm whitespace-nowrap cursor-pointer"
        >
          Add
        </button>
      </form>
    </div>
  );
}
