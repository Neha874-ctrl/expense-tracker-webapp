import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from './api';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { CategoryCard } from './components/CategoryCard';
import { AddExpenseCard } from './components/AddExpenseCard';
import { ReportCard } from './components/ReportCard';
import { ExpenseLogCard } from './components/ExpenseLogCard';
import { DeleteModal } from './components/DeleteModal';
import { Snackbar } from './components/Snackbar';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [appState, setAppState] = useState({ categories: [], budget: {}, expenses: [] });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Alert Snackbar State
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 3500);
  }, []);

  // Modal Confirmation State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
  });

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, message: '', onConfirm: null });
  };

  // Sync Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (e) => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (e && e.clientX) {
      x = e.clientX;
      y = e.clientY;
    }
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 350,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  // Fetch Dashboard Data
  const loadDashboardData = useCallback(async () => {
    const stateRes = await apiFetch('/api/state');
    if (stateRes.ok && stateRes.data) {
      setAppState(stateRes.data);
    }

    const reportRes = await apiFetch('/api/report');
    if (reportRes.ok && reportRes.data) {
      setReportData(reportRes.data);
    }
  }, []);

  // Check Auth on Mount
  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      const res = await apiFetch('/api/auth/me');
      if (res.ok && res.data && res.data.authenticated) {
        setIsAuthenticated(true);
        setUsername(res.data.username);
        await loadDashboardData();
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }
      setLoading(false);
    }
    checkAuth();
  }, [loadDashboardData]);

  // Auth Success Handler
  const handleAuthSuccess = async (user) => {
    setIsAuthenticated(true);
    setUsername(user);
    await loadDashboardData();
  };

  // Logout Handler
  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', 'POST');
    setIsAuthenticated(false);
    setUsername('');
    setAppState({ categories: [], budget: {}, expenses: [] });
    setReportData(null);
    showAlert('Logged out successfully.', 'info');
  };

  // Category Actions
  const handleAddCategory = async (categoryName) => {
    const res = await apiFetch('/api/categories', 'POST', {
      action: 'add',
      category: categoryName,
    });
    if (res.ok) {
      showAlert(res.data.message || 'Category added.', 'success');
      await loadDashboardData();
    } else {
      showAlert(res.data.message || 'Failed to add category.', 'error');
    }
  };

  const onRequestDeleteCategory = (categoryName) => {
    setDeleteModal({
      isOpen: true,
      message: `Are you sure you want to remove the category "${categoryName}"? This will permanently delete all associated expenses.`,
      onConfirm: async () => {
        closeDeleteModal();
        const res = await apiFetch('/api/categories', 'POST', {
          action: 'remove',
          category: categoryName,
        });
        if (res.ok) {
          showAlert(res.data.message || 'Category removed.', 'success');
          await loadDashboardData();
        } else {
          showAlert(res.data.message || 'Failed to remove category.', 'error');
        }
      },
    });
  };

  // Expense Actions
  const handleAddExpense = async (expenseObj) => {
    const res = await apiFetch('/api/expense', 'POST', expenseObj);
    if (res.ok) {
      showAlert(res.data.message || 'Expense added!', 'success');
      await loadDashboardData();
    } else {
      showAlert(res.data.message || 'Failed to add expense.', 'error');
    }
  };

  const onRequestDeleteExpense = (exp) => {
    const descText = exp.description ? ` for "${exp.description}"` : '';
    setDeleteModal({
      isOpen: true,
      message: `Are you sure you want to remove this expense${descText}? This action cannot be undone.`,
      onConfirm: async () => {
        closeDeleteModal();
        const res = await apiFetch(`/api/expense/${exp.id}`, 'DELETE');
        if (res.ok) {
          showAlert(res.data.message || 'Expense removed.', 'success');
          await loadDashboardData();
        } else {
          showAlert(res.data.message || 'Failed to remove expense.', 'error');
        }
      },
    });
  };

  // Inline Budget Change
  const handleInlineBudgetChange = async (categoryName, amount) => {
    const res = await apiFetch('/api/budget', 'POST', { [categoryName]: amount });
    if (res.ok) {
      showAlert(res.data.message || 'Budget updated!', 'success');
      await loadDashboardData();
    } else {
      showAlert(res.data.message || 'Failed to update budget.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <Header theme={theme} onToggleTheme={toggleTheme} showUserControls={false} />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-primary animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <p className="text-xs font-semibold text-on-surface-variant">Loading Payground Tracker...</p>
          </div>
        </div>
        <footer className="w-full text-center py-6 text-xs text-on-surface-variant/50 font-medium">
          &copy; 2026 Payground Inc. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className={isAuthenticated ? 'dashboard-body flex flex-col min-h-screen' : 'min-h-screen flex flex-col justify-between overflow-x-hidden'}>
      <Snackbar alert={alert} />

      <DeleteModal
        isOpen={deleteModal.isOpen}
        message={deleteModal.message}
        onConfirm={deleteModal.onConfirm}
        onClose={closeDeleteModal}
      />

      <Header
        username={username}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        showUserControls={isAuthenticated}
      />

      {!isAuthenticated ? (
        <AuthForm onAuthSuccess={handleAuthSuccess} showAlert={showAlert} />
      ) : (
        <main className="dashboard-main">
          <div className="dashboard-grid">
            {/* LEFT COLUMN: Forms */}
            <div className="dashboard-col-left space-y-6 scrollbar-thin">
              <CategoryCard
                categories={appState.categories}
                onAddCategory={handleAddCategory}
                onRequestDeleteCategory={onRequestDeleteCategory}
              />
              <AddExpenseCard
                categories={appState.categories}
                onAddExpense={handleAddExpense}
                showAlert={showAlert}
              />
            </div>

            {/* RIGHT COLUMN: Report & Log */}
            <div className="dashboard-col-right">
              <ReportCard
                reportData={reportData}
                onInlineBudgetChange={handleInlineBudgetChange}
              />
              <ExpenseLogCard
                expenses={reportData?.expenses_log || []}
                report={reportData?.report || []}
                onRequestDeleteExpense={onRequestDeleteExpense}
              />
            </div>
          </div>
        </main>
      )}

      <footer className="w-full text-center py-6 text-xs text-on-surface-variant/50 font-medium">
        &copy; 2026 Payground Inc. All rights reserved.
      </footer>
    </div>
  );
}
