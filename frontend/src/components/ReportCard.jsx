import React, { useState } from 'react';

const CATEGORY_PALETTE = [
  '#00b4d8', // Vibrant Blue-Teal
  '#9b5de5', // Vibrant Purple
  '#f15bb5', // Vibrant Magenta
  '#fee440', // Vibrant Yellow
  '#00f5d4', // Vibrant Mint
  '#ff70a6', // Vibrant Pastel Pink
  '#ff9770', // Vibrant Coral
  '#4ea8de', // Vibrant Sky Blue
  '#70e000', // Vibrant Lime Green
  '#ff5400', // Vibrant Red-Orange
];

export function getCategoryColor(categoryName, report = []) {
  const idx = report.findIndex((item) => item.category === categoryName);
  if (idx !== -1) {
    return CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
  }
  return 'var(--md-sys-color-primary)';
}

function DonutChart({ report, totalSpent, totalBudget }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!report || report.length === 0) return null;

  const itemsWithSpend = report.filter((i) => i.spent > 0);
  const SIZE = 72;
  const R = 26;
  const cx = 36;
  const cy = 36;
  const CIRC = 2 * Math.PI * R;

  const cap =
    totalBudget > 0
      ? Math.max(totalBudget, totalSpent)
      : totalSpent > 0
      ? totalSpent
      : 1;

  let offsetAcc = 0;

  return (
    <div
      className="relative flex items-center gap-3 p-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl mb-2"
      style={{ minHeight: '80px' }}
    >
      {/* SVG Donut */}
      <div className="relative shrink-0" style={{ width: `${SIZE}px`, height: `${SIZE}px` }}>
        <svg
          viewBox="0 0 72 72"
          className="w-full h-full shrink-0 -rotate-90 overflow-visible"
        >
          {/* Background circle track */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke="var(--md-sys-color-surface-variant)"
            strokeWidth="10"
          />
          {/* Segments */}
          {itemsWithSpend.map((item) => {
            const ratio = item.spent / cap;
            const dash = ratio * CIRC;
            const gap = CIRC - dash;
            const color = getCategoryColor(item.category, report);
            const currentOffset = offsetAcc;
            offsetAcc += dash;

            const spentRatio = totalSpent > 0 ? item.spent / totalSpent : 0;
            const isHovered = activeTooltip && activeTooltip.category === item.category;

            return (
              <circle
                key={item.category}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? 13 : 10}
                strokeDasharray={`${dash.toFixed(3)} ${gap.toFixed(3)}`}
                strokeDashoffset={(-currentOffset).toFixed(3)}
                strokeLinecap="butt"
                style={{
                  cursor: 'pointer',
                  opacity: activeTooltip && !isHovered ? 0.3 : 1,
                  transition: 'stroke-width 120ms, opacity 120ms',
                }}
                onMouseEnter={() =>
                  setActiveTooltip({
                    category: item.category,
                    spent: item.spent,
                    pct: (spentRatio * 100).toFixed(1),
                  })
                }
                onMouseLeave={() => setActiveTooltip(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[0.6rem] font-extrabold text-on-surface leading-none">
            ₹{totalSpent >= 1000 ? (totalSpent / 1000).toFixed(1) + 'k' : totalSpent.toFixed(0)}
          </span>
          <span className="text-[0.45rem] text-on-surface-variant mt-0.5">spent</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 flex-1">
        {itemsWithSpend.map((item) => {
          const pct = totalSpent > 0 ? ((item.spent / totalSpent) * 100).toFixed(1) : '0.0';
          const color = getCategoryColor(item.category, report);
          return (
            <div
              key={item.category}
              className="flex items-center gap-1 text-[0.68rem] font-semibold text-on-surface-variant"
            >
              <span
                className="w-1.75 h-1.75 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span>{item.category}</span>
              <span className="text-on-surface-variant/60 font-normal">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {activeTooltip && (
        <div
          className="absolute left-1/2 -bottom-2 -translate-x-1/2 translate-y-full bg-inverse-surface rounded-lg px-2.5 py-1 text-center pointer-events-none z-50 flex flex-col gap-0.5 shadow-md"
        >
          <span className="text-[0.65rem] font-bold text-primary">
            {activeTooltip.category}
          </span>
          <span className="text-[0.65rem] font-medium text-inverse-on-surface">
            ₹{activeTooltip.spent.toFixed(2)} · {activeTooltip.pct}%
          </span>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ percentage, isOver }) {
  const R = 20;
  const cx = 24;
  const cy = 24;
  const CIRC = 2 * Math.PI * R;
  const dash = (Math.min(percentage, 100) / 100) * CIRC;
  const color = isOver ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)';

  return (
    <svg
      viewBox="0 0 48 48"
      width="52"
      height="52"
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="var(--md-sys-color-surface-variant)"
        strokeWidth="5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC - dash}
        style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.34,1.2,0.64,1)' }}
      />
    </svg>
  );
}

export function ReportCard({ reportData, onInlineBudgetChange }) {
  const [editingValues, setEditingValues] = useState({});

  if (!reportData) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-[28px] shadow-sm flex flex-col gap-3 dashboard-card-half animate-pulse">
        <div className="h-6 w-32 bg-on-surface/10 rounded"></div>
      </div>
    );
  }

  const { report = [], total_spent = 0, total_budget = 0 } = reportData;
  const isOverBudget = total_spent > total_budget;
  const statusClass = isOverBudget ? 'text-error font-bold' : 'text-primary font-semibold';

  const handleInputChange = (category, val) => {
    setEditingValues((prev) => ({ ...prev, [category]: val }));
  };

  const handleInputBlur = (category, currentBudget) => {
    const rawVal = editingValues[category];
    if (rawVal === undefined) return;
    const num = parseFloat(rawVal);
    if (isNaN(num) || num < 0 || num === currentBudget) {
      setEditingValues((prev) => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
      return;
    }
    onInlineBudgetChange(category, num);
    setEditingValues((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-[28px] shadow-sm flex flex-col gap-3 dashboard-card-half">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary">analytics</span>
          <h2 className="text-xl font-bold text-on-surface">Monthly Report</h2>
        </div>
        <div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm font-medium bg-surface-container-lowest border border-outline-variant/20 px-4 py-2 rounded-full">
            <span className="text-on-surface-variant">
              Limit: <strong className="text-on-surface">₹{total_budget.toFixed(2)}</strong>
            </span>
            <span className="text-on-surface-variant">
              Spent: <strong className={statusClass}>₹{total_spent.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <DonutChart report={report} totalSpent={total_spent} totalBudget={total_budget} />

      {/* Category Summaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto p-1 flex-1 min-h-0 scrollbar-thin pr-1 pb-4">
        {report.map((item) => {
          const isItemOverBudget = item.difference > 0;
          const containerBg = isItemOverBudget
            ? 'bg-error-container/10 border-error/20'
            : 'bg-surface-container-lowest border-outline-variant/30';

          const spentPercentage =
            item.budget > 0
              ? Math.min(100, (item.spent / item.budget) * 100)
              : item.spent > 0
              ? 100
              : 0;

          const statusText = isItemOverBudget
            ? `Over by ₹${Math.abs(item.difference).toFixed(2)}`
            : item.difference === 0
            ? 'Within Budget'
            : `₹${Math.abs(item.difference).toFixed(2)} left`;

          const statusColor = isItemOverBudget
            ? 'var(--md-sys-color-error)'
            : 'var(--md-sys-color-primary)';

          const badgeStyle = isItemOverBudget
            ? {
                background: 'var(--md-sys-color-error-container)',
                color: 'var(--md-sys-color-on-error-container)',
              }
            : {
                background: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
              };

          const currentInputValue =
            editingValues[item.category] !== undefined
              ? editingValues[item.category]
              : item.budget.toFixed(2);

          return (
            <div
              key={item.category}
              className={`animate-fade-in p-4 rounded-[24px] border shadow-sm transition duration-200 hover:shadow-md flex flex-col gap-3 ${containerBg}`}
            >
              <div className="flex items-center gap-3">
                {/* Circular ring */}
                <ProgressRing percentage={spentPercentage} isOver={isItemOverBudget} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <h3 className="font-bold text-sm text-on-surface truncate">
                      {item.category}
                    </h3>
                    <span
                      className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                      style={badgeStyle}
                    >
                      {isItemOverBudget ? 'Alert' : 'On Track'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-[0.72rem] text-on-surface-variant mb-0.5">
                      <span className="shrink-0">Limit: ₹</span>
                      <div className="budget-input-wrapper flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="budget-input"
                          value={currentInputValue}
                          onChange={(e) => handleInputChange(item.category, e.target.value)}
                          onBlur={() => handleInputBlur(item.category, item.budget)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                          }}
                        />
                        <span
                          className="material-symbols-outlined text-on-surface-variant/40 pointer-events-none"
                          style={{ fontSize: '11px' }}
                        >
                          edit
                        </span>
                      </div>
                    </div>

                    <div className="text-[0.72rem] text-on-surface-variant pl-0.5 mb-0.5">
                      Spent: <strong className="text-on-surface">₹{item.spent.toFixed(2)}</strong>
                    </div>

                    <div
                      className="text-[0.7rem] font-bold mt-0.5 pl-0.5"
                      style={{ color: statusColor }}
                    >
                      {statusText}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
