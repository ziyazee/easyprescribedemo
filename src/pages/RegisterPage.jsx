import { useMemo, useState } from 'react';
import { MedicalBackground } from '../components/layout/MedicalBackground';
import { LoginBrand } from '../features/auth/components/LoginBrand';
import { registerDoctor, loginDoctor } from '../features/auth/services/authService';

function getPasswordChecks(password) {
  return [
    { key: 'length', label: 'At least 8 characters', passed: password.length >= 8 },
    { key: 'upper', label: '1 uppercase letter', passed: /[A-Z]/.test(password) },
    { key: 'lower', label: '1 lowercase letter', passed: /[a-z]/.test(password) },
    { key: 'number', label: '1 number', passed: /[0-9]/.test(password) },
    { key: 'special', label: '1 special character', passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getPasswordStrength(password) {
  if (!password) return null;
  const checks = getPasswordChecks(password);
  const score = checks.filter((item) => item.passed).length;
  const levelByScore = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const barClassByScore = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-500'];
  return {
    score,
    label: levelByScore[score],
    percentage: (score / checks.length) * 100,
    barClass: barClassByScore[score],
    checks,
  };
}

function validate(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required';
  } else if (values.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters';
  } else if (values.name.trim().replace(/[^a-zA-Z0-9._\s]/g, '').trim().length < 4) {
    errors.name = 'Name should create a valid username (minimum 4 letters/numbers)';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else {
    if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) || !/[0-9]/.test(values.password) || !/[^A-Za-z0-9]/.test(values.password)) {
      errors.password = 'Password must include uppercase, lowercase, number and special character';
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Verify password is required';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

export function RegisterPage({ onRegistered, onLoggedIn }) {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerTouched, setRegisterTouched] = useState({});
  const [loginTouched, setLoginTouched] = useState({});
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => validate(form), [form]);
  const isValid = Object.keys(errors).length === 0;
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const loginErrors = useMemo(() => ({
    username: !loginForm.username.trim() ? 'Username is required' : '',
    password: !loginForm.password ? 'Password is required' : '',
  }), [loginForm]);

  const switchMode = (m) => {
    setMode(m);
    setSubmitted(false);
    setApiError('');
    setRegisterTouched({});
    setLoginTouched({});
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setApiError('');
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const authSession = await registerDoctor({ name: form.name.trim(), password: form.password });
      onRegistered?.(authSession);
    } catch (error) {
      setApiError(error.message || 'Unable to register right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setApiError('');
    if (!loginForm.username.trim() || !loginForm.password) return;
    setIsSubmitting(true);
    try {
      const authSession = await loginDoctor({ username: loginForm.username.trim(), password: loginForm.password });
      onLoggedIn?.(authSession);
    } catch (error) {
      setApiError(error.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (field) => (submitted || registerTouched[field]) && errors[field];
  const showLoginError = (field) => (submitted || loginTouched[field]) && loginErrors[field];

  if (mode === 'login') {
    return (
      <MedicalBackground>
        <LoginBrand />
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden relative">
          <div className="p-10 sm:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-light/70 px-3 py-1 text-xs font-semibold text-primary mb-3">
                <span aria-hidden="true">✚</span>
                EasyPrescribe Secure Access
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-text-sub text-sm font-normal leading-relaxed max-w-[300px] mx-auto">
                Login with your username and password.
              </p>
            </div>
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-1" htmlFor="login-username">
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  className={`w-full rounded-lg border bg-slate-50 px-3 py-3 text-sm text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    showLoginError('username') ? 'border-red-400' : 'border-slate-400'
                  }`}
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                  onBlur={() => setLoginTouched((prev) => ({ ...prev, username: true }))}
                  placeholder="dr.rajesh.kumar"
                  autoComplete="username"
                />
                {showLoginError('username') ? <p className="mt-1 text-xs text-red-600">{loginErrors.username}</p> : null}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-1" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className={`w-full rounded-lg border bg-slate-50 px-3 py-3 pr-16 text-sm text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                      showLoginError('password') ? 'border-red-400' : 'border-slate-400'
                    }`}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    onBlur={() => setLoginTouched((prev) => ({ ...prev, password: true }))}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showLoginError('password') ? <p className="mt-1 text-xs text-red-600">{loginErrors.password}</p> : null}
              </div>
              <button
                className="w-full py-4 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-base shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
              {apiError ? <p className="text-sm text-red-600 text-center">{apiError}</p> : null}
            </form>
            <div className="text-center pt-4">
              <span className="text-sm text-slate-400">Don't have an account?</span>
              <button className="text-primary hover:text-primary-dark font-medium text-sm ml-1 transition-colors" type="button" onClick={() => switchMode('register')}>
                Register
              </button>
            </div>
          </div>
        </div>
      </MedicalBackground>
    );
  }

  return (
    <MedicalBackground>
      <LoginBrand />

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden relative">
        <div className="p-10 sm:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-light/70 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <span aria-hidden="true">✚</span>
              EasyPrescribe Onboarding
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Register Doctor Account</h2>
            <p className="text-text-sub text-sm font-normal leading-relaxed max-w-[300px] mx-auto">
              Create your account with name and password before login.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-1" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                className={`w-full rounded-lg border bg-slate-50 px-3 py-3 text-sm text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  showError('name') ? 'border-red-400' : 'border-slate-400'
                }`}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => setRegisterTouched((prev) => ({ ...prev, name: true }))}
                placeholder="Dr. Rajesh Kumar"
              />
              {showError('name') ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg border bg-slate-50 px-3 py-3 pr-16 text-sm text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    showError('password') ? 'border-red-400' : 'border-slate-400'
                  }`}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  onBlur={() => setRegisterTouched((prev) => ({ ...prev, password: true }))}
                  placeholder="Enter strong password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegisterPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {passwordStrength ? (
                <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Password strength</span>
                    <span className="font-semibold text-slate-800">{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClass}`} style={{ width: `${passwordStrength.percentage}%` }} />
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                    {passwordStrength.checks.map((item) => (
                      <li key={item.key} className={`text-xs ${item.passed ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {item.passed ? '✓' : '○'} {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {showError('password') ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-700 mb-1" htmlFor="confirmPassword">
                Verify Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showRegisterConfirmPassword ? 'text' : 'password'}
                  className={`w-full rounded-lg border bg-slate-50 px-3 py-3 pr-16 text-sm text-slate-950 placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    showError('confirmPassword') ? 'border-red-400' : 'border-slate-400'
                  }`}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  onBlur={() => setRegisterTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                  aria-label={showRegisterConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegisterConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.confirmPassword && form.password === form.confirmPassword ? (
                <p className="mt-1 text-xs text-emerald-700">Passwords match</p>
              ) : null}
              {showError('confirmPassword') ? <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p> : null}
            </div>

            <button
              className="w-full py-4 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-base shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting || (!isValid && submitted)}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
            {apiError ? <p className="text-sm text-red-600 text-center">{apiError}</p> : null}
          </form>

          <div className="text-center pt-4">
            <span className="text-sm text-slate-400">Already have an account?</span>
            <button className="text-primary hover:text-primary-dark font-medium text-sm ml-1 transition-colors" type="button" onClick={() => switchMode('login')}>
              Login
            </button>
          </div>
        </div>
      </div>
    </MedicalBackground>
  );
}
