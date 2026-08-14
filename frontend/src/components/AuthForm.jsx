import React, { useState } from 'react';

export function AuthForm({ onAuthSuccess, showAlert }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showAlert('Username and password cannot be empty.', 'error');
      return;
    }

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showAlert(data.message || 'Authentication failed.', 'error');
        setIsLoading(false);
        return;
      }

      showAlert(data.message || 'Success!', 'success');
      setTimeout(() => {
        onAuthSuccess(data.username || username);
      }, 500);
    } catch (err) {
      console.error('Auth submit error:', err);
      showAlert('Network or server error, please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-8">
      <div
        className="bg-surface-container-low border border-outline-variant/30 rounded-[28px] p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 relative transition-colors duration-300"
        style={{ maxWidth: '448px' }}
      >
        {/* Card Header */}
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">
            {isLoginMode
              ? 'Please enter your details to sign in'
              : 'Enter details to start managing your budget'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username Field */}
          <div className="relative">
            <input
              type="text"
              id="username"
              required
              autoComplete="username"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="peer w-full border border-outline rounded-xl px-4 py-3 bg-transparent text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 text-sm"
            />
            <label
              htmlFor="username"
              className="absolute left-3 -top-2 px-1 bg-surface-container-low text-xs text-on-surface-variant peer-focus:text-primary transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs"
            >
              Username
            </label>
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type="password"
              id="password"
              required
              autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full border border-outline rounded-xl px-4 py-3 bg-transparent text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 text-sm"
            />
            <label
              htmlFor="password"
              className="absolute left-3 -top-2 px-1 bg-surface-container-low text-xs text-on-surface-variant peer-focus:text-primary transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs"
            >
              Password
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-on-primary py-3 rounded-full font-semibold hover:shadow-md active:scale-95 transition-all duration-200 text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoginMode ? 'Sign In' : 'Sign Up'}</span>
            <span className="material-symbols-outlined text-base">
              {isLoginMode ? 'login' : 'person_add'}
            </span>
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center mt-2">
          <p className="text-sm text-on-surface-variant">
            <span>
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-primary font-bold hover:underline ml-1 focus:outline-none cursor-pointer"
            >
              {isLoginMode ? 'Create one' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
