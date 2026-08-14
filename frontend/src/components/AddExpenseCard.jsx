import React, { useState, useRef, useEffect } from 'react';

export function AddExpenseCard({ categories, onAddExpense, showAlert }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updateDropdownPos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isDropdownOpen) {
      updateDropdownPos();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleScrollResize = () => {
      if (isDropdownOpen) updateDropdownPos();
    };

    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleScrollResize);
    window.addEventListener('scroll', handleScrollResize, true);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleScrollResize);
      window.removeEventListener('scroll', handleScrollResize, true);
    };
  }, [isDropdownOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      showAlert('Please select a category first.', 'error');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Please enter a valid positive amount.', 'error');
      return;
    }

    onAddExpense({
      category: selectedCategory,
      amount: numAmount,
      description: description.trim(),
    });

    setAmount('');
    setDescription('');
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-[28px] shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-primary">add_shopping_cart</span>
        <h2 className="text-xl font-bold text-on-surface">Add Expense (₹)</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Custom Category Dropdown Trigger */}
        <div className="relative w-full">
          <div
            ref={triggerRef}
            onClick={toggleDropdown}
            className={`w-full border rounded-xl px-4 py-3 bg-surface-container-low text-on-surface transition-all duration-200 text-sm cursor-pointer flex items-center justify-between ${
              isDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline'
            }`}
          >
            <span
              className={
                selectedCategory
                  ? 'text-on-surface font-semibold'
                  : 'text-on-surface-variant/70'
              }
            >
              {selectedCategory || 'Select Category'}
            </span>
            <span
              className="material-symbols-outlined text-on-surface-variant transition-transform duration-200"
              style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              arrow_drop_down
            </span>
          </div>
          <label className="absolute left-3 -top-2 px-1 bg-surface-container-low text-xs text-on-surface-variant pointer-events-none">
            Category
          </label>
        </div>

        {/* Portal Dropdown Menu */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="fixed rounded-2xl border border-outline-variant/30 p-2 flex flex-col gap-0.5 overflow-y-auto"
            style={{
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 9999,
              maxHeight: '220px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
              background: 'var(--md-sys-color-surface-container-high)',
            }}
          >
            {categories.length === 0 ? (
              <div className="p-3 text-xs text-on-surface-variant text-center">
                No categories available. Please add one above.
              </div>
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsDropdownOpen(false);
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-between transition-colors"
                    style={{
                      color: isSelected
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-on-surface)',
                      background: isSelected
                        ? 'color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent)'
                        : 'transparent',
                    }}
                  >
                    <span>{cat}</span>
                    {isSelected && (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '1rem' }}
                      >
                        check
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Amount Field */}
        <div className="relative">
          <input
            type="number"
            id="expense-amount"
            name="amount"
            required
            step="0.01"
            min="0.01"
            placeholder=" "
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="peer w-full border border-outline rounded-xl px-4 py-3 bg-transparent text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 text-sm"
          />
          <label
            htmlFor="expense-amount"
            className="absolute left-3 -top-2 px-1 bg-surface-container-low text-xs text-on-surface-variant peer-focus:text-primary transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs"
          >
            Amount (₹)
          </label>
        </div>

        {/* Description Field */}
        <div className="relative">
          <input
            type="text"
            id="expense-description"
            name="description"
            placeholder=" "
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="peer w-full border border-outline rounded-xl px-4 py-3 bg-transparent text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 text-sm"
          />
          <label
            htmlFor="expense-description"
            className="absolute left-3 -top-2 px-1 bg-surface-container-low text-xs text-on-surface-variant peer-focus:text-primary transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs"
          >
            Description (Optional)
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-3 rounded-full font-semibold hover:shadow-md active:scale-95 transition-all duration-200 text-sm cursor-pointer"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
}
