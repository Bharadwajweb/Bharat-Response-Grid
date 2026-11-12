import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { authClient, getAuthToken } from '../services/neonAuth';
import { brgApi, getCurrentUser, recordAuthEvent, type ApiUser } from '../services/brgApi';
import { useAppStore } from '../store/appStore';
import '../types';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate } = useSWRConfig();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const { data: activeUser, isLoading: checkingSession } = useSWR<ApiUser>('brg-current-user', getCurrentUser, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    dedupingInterval: 30_000,
  });
  const { data: systemEnvelope } = useSWR('system-status', brgApi.systemStatus, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const returnTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
  if (activeUser) return <Navigate to={returnTo} replace />;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authClient) {
      setMessage({ kind: 'error', text: 'Neon Auth is not configured for this deployment.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const result = await authClient.signIn.email({ email: email.trim(), password, rememberMe });
      if (result.error) throw new Error(result.error.message || 'Email or password could not be verified.');

      const token = await getAuthToken();
      if (!token) throw new Error('Sign-in completed, but the secure API session could not be established.');

      const user = await getCurrentUser();
      setCurrentUser(user);
      await mutate('brg-current-user', user, { revalidate: false });
      await recordAuthEvent('login');
      navigate(returnTo, { replace: true });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '';
      const originHint = /origin|cors|fetch/i.test(messageText)
        ? ' This deployment origin may need to be added to Neon Auth trusted origins.'
        : '';
      setMessage({ kind: 'error', text: `${messageText || 'Unable to sign in. Check your credentials and try again.'}${originHint}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setMessage({ kind: 'error', text: 'Enter your account email first.' });
      return;
    }
    if (!authClient) {
      setMessage({ kind: 'error', text: 'Password recovery is unavailable because Neon Auth is not configured.' });
      return;
    }

    setResetting(true);
    setMessage(null);
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/login?password-reset=complete`,
      });
      if (result.error) throw new Error(result.error.message || 'Password recovery could not be started.');
      setMessage({ kind: 'success', text: 'If the account can receive recovery email, instructions have been sent.' });
    } catch {
      setMessage({ kind: 'error', text: 'Password recovery could not be started. Contact your organization administrator.' });
    } finally {
      setResetting(false);
    }
  };

  const status = systemEnvelope?.data;
  const overall = status?.overall ?? 'OFFLINE';
  const statusLabel = checkingSession ? 'CHECKING SESSION' : overall;

  return (
    <main className="brg-login">
      <section className="brg-login__visual" aria-label="Bharat Response Grid">
        <div className="brg-login__network" aria-hidden="true">
          <div className="brg-login__network-ring" />
          <div className="brg-login__network-ring brg-login__network-ring--inner" />
          <div className="brg-login__network-path" />
          <div className="brg-login__network-path brg-login__network-path--second" />
          <span className="brg-login__network-node" />
          <span className="brg-login__network-node" />
          <span className="brg-login__network-node" />
          <span className="brg-login__network-node" />
        </div>

        <div className="brg-login__brand">
          <div className="brg-login__brand-mark"><ShieldCheck size={23} /></div>
          <div>
            <p className="brg-login__brand-title">BHARAT RESPONSE GRID</p>
            <p className="brg-login__brand-subtitle">National emergency coordination</p>
          </div>
        </div>

        <div className="brg-login__hero">
          <div className="brg-login__eyebrow"><span className="brg-login__pulse" /> Situational awareness · coordinated response</div>
          <h1>One grid.<br />A clearer response.</h1>
          <p>Secure access for authorized command teams coordinating verified information, resources and emergency response across jurisdictions.</p>
          <div className="brg-login__stages" aria-label="Response workflow">
            <span className="brg-login__stage">Situation</span>
            <span className="brg-login__stage">Analysis</span>
            <span className="brg-login__stage">Coordination</span>
            <span className="brg-login__stage">Response</span>
          </div>
        </div>

        <footer className="brg-login__footer">
          <span>AUTHORIZED ACCESS ONLY</span>
          <span>BRG · Secure command workspace</span>
        </footer>
      </section>

      <section className="brg-login__panel" aria-labelledby="login-title">
        <div className="brg-login__card">
          <div className="brg-login__kicker">Secure access portal</div>
          <h2 id="login-title">Sign in to BRG</h2>
          <p className="brg-login__description">Use the account provisioned for your response organization. Your access level is assigned by an administrator.</p>

          <form onSubmit={handleSubmit} aria-describedby="login-help" noValidate>
            <div className="brg-login__field">
              <label htmlFor="brg-email">Work email</label>
              <input
                id="brg-email"
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                maxLength={320}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@organization.gov.in"
                disabled={submitting || resetting}
              />
            </div>

            <div className="brg-login__field">
              <label htmlFor="brg-password">Password</label>
              <div className="brg-login__password-wrap">
                <input
                  id="brg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  disabled={submitting || resetting}
                />
                <button
                  className="brg-login__toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="brg-login__form-meta">
              <label className="brg-login__remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /> Keep me signed in</label>
              <button className="brg-login__link" type="button" onClick={handlePasswordReset} disabled={submitting || resetting}>
                {resetting ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>

            <button className="brg-login__submit" type="submit" disabled={submitting || resetting}>
              {submitting ? 'Verifying secure session…' : <><LockKeyhole size={15} /> Sign in securely <ArrowRight size={15} /></>}
            </button>
            {message && <p className={`brg-login__message brg-login__message--${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>}
          </form>

          <p id="login-help" className="brg-login__access-note"><ShieldCheck size={14} aria-hidden="true" /> Accounts and command roles are managed by Neon Auth and BRG administrators. No demo credentials or client-side role selection are available.</p>

          <div className="brg-login__service" role="status" aria-live="polite">
            <span className={`brg-login__service-dot ${overall === 'ONLINE' ? 'brg-login__service-dot--online' : overall === 'DEGRADED' ? 'brg-login__service-dot--degraded' : ''}`} />
            <Activity size={14} aria-hidden="true" />
            <span>BRG service status</span>
            <strong>{statusLabel}</strong>
          </div>

          <p className="brg-login__citizen-link">Need to report an emergency? <Link to="/citizen">Open the Citizen Safety Portal</Link></p>
        </div>
      </section>
    </main>
  );
};
