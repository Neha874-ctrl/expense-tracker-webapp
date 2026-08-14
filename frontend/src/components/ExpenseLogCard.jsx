import React from 'react';
import { getCategoryColor } from './ReportCard';

export function ExpenseLogCard({ expenses = [], report = [], onRequestDeleteExpense }) {
  const reversedExpenses = [...expenses].reverse();

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-6 rounded-[28px] shadow-sm flex flex-col gap-4 dashboard-card-half">
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="material-symbols-outlined text-primary">receipt_long</span>
        <h2 className="text-xl font-bold text-on-surface">Transaction Log</h2>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/30 flex-1 min-h-0 overflow-y-auto">
        <table className="min-w-full divide-y divide-outline-variant/20 table-fixed">
          <thead className="sticky top-0 z-10 bg-surface-container-high">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-1/5">
                Date
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-1/4">
                Category
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-1/3">
                Description
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-1/5">
                Amount (₹)
              </th>
              <th className="px-6 py-3.5 text-center text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-14">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {reversedExpenses.map((exp) => {
              const color = getCategoryColor(exp.category, report);
              return (
                <tr
                  key={exp.id}
                  className="animate-fade-in hover:bg-surface-container-high/50 transition-colors duration-150 border-b border-outline-variant/20"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface font-medium">
                    {exp.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                    {exp.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                    {exp.description || '—'}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right"
                    style={{ color }}
                  >
                    ₹{exp.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      type="button"
                      onClick={() => onRequestDeleteExpense(exp)}
                      className="h-8 w-8 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-all duration-150 flex items-center justify-center mx-auto cursor-pointer"
                      title="Remove Expense"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-10 flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg
              className="w-14 h-14 text-primary/40 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v4a1 1 0 0 1-1 1H4m15-9h.01" />
              <path d="M7 6h6" strokeDasharray="2 2" />
              <path d="M7 10h4" strokeDasharray="2 2" />
            </svg>
          </div>
          <p className="text-xs text-on-surface-variant font-bold mt-1">
            No Transaction Logs Found
          </p>
          <p className="text-[10px] text-on-surface-variant/70 max-w-[240px]">
            Record a new expense using the form on the left to see itemized entries here.
          </p>
        </div>
      )}
    </div>
  );
}
