import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff, HiLockClosed, HiUser } from "react-icons/hi";

import { useAuth } from "../services/auth/authProvider";
import { loginUser } from "../services/auth/authService";
import CreditFooter from "../components/shared/CreditFooter";
import FindPasswordDialog from "../components/landing/FindPasswordDialog";

// Remember how this browser tab was opened, so a refresh on /login can go back home.
const OPENED_ON_LOGIN = window.location.pathname.replace(/\/$/, "") === "/login";
const WAS_RELOAD = performance.getEntriesByType("navigation")[0]?.type === "reload";
let reloadHandled = false;

const Login = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Refreshing the login page sends you back to the home page.
  useEffect(() => {
    if (reloadHandled) return;
    reloadHandled = true;
    if (OPENED_ON_LOGIN && WAS_RELOAD) navigate("/", { replace: true });
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setDetail("");

    try {
      const response = await loginUser(username.trim(), password);
      if (response.data.access) {
        setToken(response.data.access, response.data.refresh);
        navigate("/dashboard/", { replace: true });
      } else {
        setDetail("Login failed: Access token not found in response.");
      }
    } catch (error) {
      const status = error.response?.status;
      const hasBackendMessage = typeof error.response?.data === "object" && error.response?.data?.detail;
      if (status === 401) {
        setDetail("Wrong username or password. Tip: copy and paste the password instead of typing it.");
      } else if (status === 429) {
        setDetail("Too many attempts. Wait one minute and try again.");
      } else if (status === 403) {
        setDetail("This account is disabled.");
      } else if (!error.response || (status >= 500 && !hasBackendMessage)) {
        setDetail("Can't reach the backend. Make sure the backend window is running (\"Uvicorn running on http://127.0.0.1:8000\").");
      } else {
        setDetail(error.response?.data?.detail || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col bg-bg text-ink'>
      <main className='flex-1 flex flex-col items-center justify-center px-4 py-12'>
        <Link to='/' className='flex items-center gap-3 mb-8'>
          <img src='/logo.png' alt='' className='h-10 w-10 rounded-xl object-cover ring-1 ring-line' />
          <div>
            <p className='text-base font-semibold text-ink leading-none'>Cerberus</p>
            <p className='text-xs text-faint mt-1'>Threat Monitoring with Tirth</p>
          </div>
        </Link>

        <form className='w-full max-w-sm card p-7' onSubmit={handleLogin}>
          <h1 className='text-xl font-semibold text-ink'>Sign in</h1>
          <p className='text-muted text-sm mt-1'>Open the Cerberus dashboard.</p>

          <div className='mt-6 space-y-4'>
            <label className='block'>
              <span className='text-sm font-medium text-ink'>Username</span>
              <div className='mt-1.5 relative'>
                <HiUser className='absolute left-3.5 top-1/2 -translate-y-1/2 text-faint' aria-hidden='true' />
                <input
                  className='input pl-10'
                  placeholder='admin'
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete='username'
                />
              </div>
            </label>

            <label className='block'>
              <span className='text-sm font-medium text-ink'>Password</span>
              <div className='mt-1.5 relative'>
                <HiLockClosed className='absolute left-3.5 top-1/2 -translate-y-1/2 text-faint' aria-hidden='true' />
                <input
                  className='input pl-10 pr-11'
                  placeholder='••••••••'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.trim())}
                  autoComplete='current-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-faint hover:text-ink'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </label>
          </div>

          {detail ? <p className='text-bad text-sm mt-4' role='alert'>{detail}</p> : null}

          <button
            type='submit'
            className='btn-primary w-full mt-6'
            disabled={loading || !username.trim() || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className='mt-5 text-sm text-muted'>
            First time or forgot it?{' '}
            <button
              type='button'
              className='font-medium text-accent hover:underline'
              onClick={() => setHelpOpen(true)}
            >
              Find your password
            </button>
          </p>
        </form>
        <FindPasswordDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

        <Link to='/' className='mt-6 text-sm text-muted hover:text-ink transition-colors'>
          ← Back to home
        </Link>
      </main>
      <CreditFooter />
    </div>
  );
};

export default Login;
