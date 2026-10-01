import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiLockClosed, HiUser } from "react-icons/hi";

import { useAuth } from "../services/auth/authProvider";
import { loginUser } from "../services/auth/authService";
import loginImg from "../assets/login.jpg";
import CreditFooter from "../components/shared/CreditFooter";

const Login = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

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
      setDetail("Login failed. Check your username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col bg-bg text-ink'>
    <div className='flex-1 grid grid-cols-1 lg:grid-cols-2'>
      <div className='relative hidden lg:block'>
        <img className='w-full h-full object-cover opacity-50' src={loginImg} alt='Security monitoring' />
        <div className='absolute inset-0' style={{ background: 'linear-gradient(160deg, rgb(var(--accent)/0.55), transparent 45%), linear-gradient(to top, rgb(var(--bg)), rgb(var(--bg)/0.3) 55%, transparent)' }} />
        <div className='absolute top-10 left-10 flex items-center gap-3'>
          <img src="/logo.png" alt="Cerberus" className='h-9 w-9 rounded-xl object-cover ring-1 ring-white/15' />
          <div>
            <p className='text-white font-semibold leading-none'>Cerberus</p>
            <p className='text-white/60 text-xs mt-1'>Threat Monitoring</p>
          </div>
        </div>
        <div className='absolute bottom-12 left-10 right-10 text-white'>
          <h1 className='text-3xl font-bold leading-tight max-w-md'>Stay ahead of blacklist incidents with fast response workflows.</h1>
          <div className='mt-6 flex gap-8'>
            <div><div className='font-mono text-2xl font-semibold'>60+</div><div className='text-xs text-white/60'>DNSBL providers</div></div>
            <div><div className='font-mono text-2xl font-semibold'>7</div><div className='text-xs text-white/60'>check types</div></div>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-center px-6 py-12'>
        <form className='w-full max-w-md card p-8' onSubmit={handleLogin}>
          <p className='label'>Welcome back</p>
          <h2 className='text-ink text-2xl font-bold mt-2'>Sign in to Cerberus</h2>
          <p className='text-muted text-sm mt-1'>Use your operator credentials to open the dashboard.</p>

          <div className='mt-7 space-y-4'>
            <label className='block'>
              <span className='label'>Username</span>
              <div className='mt-2 relative'>
                <HiUser className='absolute left-3.5 top-1/2 -translate-y-1/2 text-faint' />
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
              <span className='label'>Password</span>
              <div className='mt-2 relative'>
                <HiLockClosed className='absolute left-3.5 top-1/2 -translate-y-1/2 text-faint' />
                <input
                  className='input pl-10'
                  placeholder='••••••••'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete='current-password'
                />
              </div>
            </label>
          </div>

          <button
            className='btn-primary w-full mt-7'
            disabled={loading || !username.trim() || !password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {detail ? <p className='text-bad text-sm mt-4'>{detail}</p> : null}

          <div className='mt-6 card !bg-surface-2 p-3'>
            <p className='label'>First sign-in</p>
            <p className='text-sm text-muted mt-1'>
              The admin password is generated on first start and printed once in the backend log.
            </p>
          </div>
        </form>
      </div>
    </div>
    <CreditFooter />
    </div>
  );
};

export default Login;
