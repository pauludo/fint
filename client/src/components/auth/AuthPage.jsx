import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { COUNTRY_MAP, CURRENCIES, getCurrencyForCountry, getCountriesByRegion } from '../../context/FinanceContext';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  PieChart,
  Wallet,
  BarChart2,
  ChevronUp,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';

/* ─────────────── Animated counter hook ─────────────── */
function useCounter(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ─────────────── Mini sparkline ─────────────── */
function Sparkline({ data, color = '#F59E0B', height = 36 }) {
  const w = 100, h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const gradId = `sg${color.replace('#', '')}`;
  const lastPt = pts[pts.length - 1].split(',');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={`url(#${gradId})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} stroke="#0F172A" strokeWidth="1.5" />
    </svg>
  );
}

/* ─────────────── Floating stat card ─────────────── */
function StatCard({ label, value, sub, color, icon: Icon, sparkData, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const count = useCounter(value, 1600, visible);
  return (
    <div className="auth-stat-card" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748B' }}>{label}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#F8FAFC', marginTop: 2 }}>{sub}{count.toLocaleString()}</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 16, height: 16, color }} />
        </div>
      </div>
      {sparkData && <Sparkline data={sparkData} color={color} />}
    </div>
  );
}

/* ─────────────── Donut chart ─────────────── */
function DonutChart() {
  const segments = [
    { pct: 42, color: '#F59E0B', label: 'Savings' },
    { pct: 28, color: '#6366F1', label: 'Invest' },
    { pct: 18, color: '#10B981', label: 'Bills' },
    { pct: 12, color: '#EC4899', label: 'Other' },
  ];
  const r = 30, cx = 40, cy = 40, circ = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: 'rotate(-90deg)', flexShrink: 0 }}>
        {segments.map((s, i) => {
          const dash = (s.pct / 100) * circ;
          const offset = (1 - cumulative / 100) * circ;
          cumulative += s.pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
              strokeWidth="10" strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-circ + offset} strokeLinecap="butt" />
          );
        })}
        <circle cx={cx} cy={cy} r="20" fill="#0F172A" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto', paddingLeft: 8 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Main AuthPage ─────────────── */
export default function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Derive baseCurrency from the selected country
  const baseCurrency = getCurrencyForCountry(country);
  const detectedCurrency = CURRENCIES[baseCurrency];
  const countriesByRegion = getCountriesByRegion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({ email, password, name, baseCurrency, country });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{AUTH_STYLES}</style>
      <div className="auth-root">

        {/* ── Left panel ── */}
        <div className="auth-left">
          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
          <div className="auth-blob auth-blob-3" />
          <div className="auth-grid-overlay" />

          <div className="auth-left-inner">
            {/* Logo */}
            <div className="auth-logo-row">
              <div className="auth-logo-icon">
                <TrendingUp style={{ width: 20, height: 20, color: '#422006' }} />
              </div>
              <span className="auth-logo-text">Fin<span style={{ color: '#F59E0B' }}>Track</span></span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="auth-h1">
                Your money,<br />
                <span className="auth-h1-accent">intelligently</span><br />
                managed.
              </h1>
              <p className="auth-tagline">
                Real-time insights, smart budgets, and automated wealth tracking — all in one place.
              </p>
            </div>

            {/* Stat cards */}
            <div className="auth-stats-grid">
              <StatCard label="Net Worth" sub="$" value={142850} color="#F59E0B" icon={Wallet}
                sparkData={[82, 91, 88, 97, 105, 112, 108, 119, 131, 143]} delay={200} />
              <StatCard label="Monthly Savings" sub="$" value={3420} color="#10B981" icon={TrendingUp}
                sparkData={[1800, 2100, 1950, 2600, 2800, 2400, 3100, 3420]} delay={350} />
            </div>

            {/* Portfolio donut */}
            <div className="auth-donut-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748B' }}>Portfolio Allocation</p>
                <span style={{ fontSize: 10, color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ChevronUp style={{ width: 12, height: 12 }} />+8.4% YTD
                </span>
              </div>
              <DonutChart />
            </div>

            {/* Trust badges */}
            <div className="auth-badges-row">
              <div className="auth-trust-badge">
                <ShieldCheck style={{ width: 14, height: 14, color: '#10B981' }} />
                <span>Bank-grade Encryption</span>
              </div>
              <div className="auth-trust-badge">
                <PieChart style={{ width: 14, height: 14, color: '#F59E0B' }} />
                <span>AI-Powered Insights</span>
              </div>
              <div className="auth-trust-badge">
                <BarChart2 style={{ width: 14, height: 14, color: '#6366F1' }} />
                <span>Multi-Currency</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="auth-right">
          <div className="auth-form-wrapper">
            {/* Mobile logo */}
            <div className="auth-mobile-logo">
              <div className="auth-logo-icon" style={{ width: 40, height: 40 }}>
                <TrendingUp style={{ width: 16, height: 16, color: '#422006' }} />
              </div>
              <span className="auth-logo-text">Fin<span style={{ color: '#F59E0B' }}>Track</span></span>
            </div>

            <div className="auth-form-card">
              <div className="auth-card-header">
                <h2 className="auth-card-title">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="auth-card-subtitle">
                  {isRegister ? 'Start your financial journey today.' : 'Sign in to your dashboard.'}
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form-body">
                {isRegister && (
                  <div className="auth-field">
                    <label className="auth-label">Full Name</label>
                    <div className="auth-input-wrap">
                      <User className="auth-input-icon" />
                      <input type="text" required placeholder="Alex Morgan" value={name}
                        onChange={(e) => setName(e.target.value)} className="auth-input" />
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" />
                    <input type="email" required placeholder="alex@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="auth-input" />
                  </div>
                </div>

                <div className="auth-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="auth-label">Password</label>
                    {!isRegister && <button type="button" className="auth-forgot">Forgot password?</button>}
                  </div>
                  <div className="auth-input-wrap">
                    <Lock className="auth-input-icon" />
                    <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="auth-input" style={{ paddingRight: '2.75rem' }} />
                    <button type="button" onClick={() => setShowPassword((p) => !p)}
                      className="auth-eye-btn" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div className="auth-field">
                    <label className="auth-label">Country</label>
                    <div className="auth-input-wrap">
                      <Globe className="auth-input-icon" />
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="auth-input auth-select"
                      >
                        {Object.entries(countriesByRegion).map(([region, countries]) => (
                          <optgroup key={region} label={region}>
                            {countries.map(({ code, name, flag }) => (
                              <option key={code} value={code}>
                                {flag} {name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    {/* Auto-detected currency badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 8, marginTop: 4,
                      background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                      width: 'fit-content'
                    }}>
                      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>Currency detected:</span>
                      <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700 }}>
                        {baseCurrency} {detectedCurrency?.symbol} — {detectedCurrency?.name}
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="auth-submit-btn">
                  {loading
                    ? <span className="auth-spinner" />
                    : <><span>{isRegister ? 'Create Account' : 'Sign In'}</span><ArrowRight style={{ width: 16, height: 16 }} /></>
                  }
                </button>
              </form>

              <div className="auth-toggle-row">
                <span className="auth-toggle-text">
                  {isRegister ? 'Already have an account?' : "Don't have an account?"}
                </span>
                <button type="button" onClick={() => { setIsRegister((p) => !p); setError(''); }}
                  className="auth-toggle-btn">
                  {isRegister ? 'Sign In' : 'Register'}
                </button>
              </div>

              <div className="auth-security-footer">
                <ShieldCheck style={{ width: 14, height: 14, color: '#10B981', flexShrink: 0 }} />
                <span>End-to-end encrypted &amp; session isolated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────── Scoped CSS ─────────────── */
const AUTH_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');

.auth-root {
  min-height: 100vh;
  display: flex;
  font-family: 'Inter', system-ui, sans-serif;
  background: #060A14;
  overflow: hidden;
}

/* ── Left panel ── */
.auth-left {
  position: relative;
  flex: 1 1 55%;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: linear-gradient(135deg, #060A14 0%, #0D1525 60%, #0A0F1E 100%);
}

.auth-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  animation: authBlobFloat 8s ease-in-out infinite alternate;
}
.auth-blob-1 {
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%);
  top: -120px; left: -80px;
  animation-delay: 0s;
}
.auth-blob-2 {
  width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%);
  bottom: -80px; right: -60px;
  animation-delay: -3s;
}
.auth-blob-3 {
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%);
  top: 50%; left: 55%;
  animation-delay: -5s;
}
@keyframes authBlobFloat {
  0%   { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20px, -30px) scale(1.08); }
}

.auth-grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  pointer-events: none;
}

.auth-left-inner {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 48px 48px 48px 56px;
  width: 100%;
  justify-content: center;
}

.auth-logo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.auth-logo-icon {
  width: 44px; height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(245,158,11,0.4);
}
.auth-logo-text {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 22px;
  color: #fff;
  letter-spacing: -0.5px;
}
.auth-mobile-logo {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.auth-h1 {
  font-family: 'Syne', sans-serif;
  font-size: clamp(30px, 3.2vw, 44px);
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -1px;
  margin: 0;
}
.auth-h1-accent {
  background: linear-gradient(90deg, #F59E0B, #FCD34D, #F59E0B);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: authShimmer 3s linear infinite;
}
@keyframes authShimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.auth-tagline {
  color: #64748B;
  font-size: 14px;
  line-height: 1.6;
  max-width: 360px;
  margin-top: 12px;
}

.auth-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.auth-stat-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(12px);
  animation: authCardUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
  transition: border-color 0.2s, background 0.2s;
}
.auth-stat-card:hover {
  border-color: rgba(245,158,11,0.25);
  background: rgba(255,255,255,0.06);
}
@keyframes authCardUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.auth-donut-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 16px 20px;
  backdrop-filter: blur(12px);
}

.auth-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.auth-trust-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 11px;
  font-weight: 500;
  color: #94A3B8;
}

/* ── Right panel ── */
.auth-right {
  flex: 0 0 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #070C19;
  border-left: 1px solid rgba(255,255,255,0.06);
  padding: 40px 32px;
}
.auth-form-wrapper {
  width: 100%;
  max-width: 360px;
}
.auth-form-card {
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 32px 28px;
  backdrop-filter: blur(20px);
  box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
  animation: authCardUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
.auth-card-header { margin-bottom: 24px; }
.auth-card-title {
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #F8FAFC;
  letter-spacing: -0.5px;
}
.auth-card-subtitle { font-size: 13px; color: #64748B; margin-top: 4px; }

.auth-error {
  padding: 10px 14px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  color: #FCA5A5;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 16px;
  text-align: center;
}

.auth-form-body { display: flex; flex-direction: column; gap: 16px; }
.auth-field { display: flex; flex-direction: column; gap: 6px; }
.auth-label { font-size: 12px; font-weight: 600; color: #94A3B8; letter-spacing: 0.3px; }
.auth-forgot {
  font-size: 11px; color: #F59E0B; font-weight: 500;
  cursor: pointer; background: none; border: none; padding: 0;
  transition: color 0.15s;
}
.auth-forgot:hover { color: #FCD34D; }

.auth-input-wrap { position: relative; display: flex; align-items: center; }
.auth-input-icon {
  position: absolute; left: 13px;
  width: 15px; height: 15px;
  color: #475569; pointer-events: none; flex-shrink: 0;
}
.auth-input {
  width: 100%;
  padding: 11px 14px 11px 38px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #F8FAFC;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  outline: none;
}
.auth-input::placeholder { color: #334155; }
.auth-input:focus {
  border-color: rgba(245,158,11,0.5);
  background: rgba(255,255,255,0.07);
  box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}
.auth-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%2364748B' d='M4 6l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}
.auth-select option { background: #0F172A; color: #F8FAFC; }
.auth-eye-btn {
  position: absolute; right: 12px;
  background: none; border: none;
  color: #475569; cursor: pointer; padding: 2px;
  display: flex; align-items: center;
  transition: color 0.15s;
}
.auth-eye-btn:hover { color: #94A3B8; }

.auth-submit-btn {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: #0C0A09;
  font-size: 14px; font-weight: 700;
  border: none; border-radius: 12px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  box-shadow: 0 4px 20px rgba(245,158,11,0.35);
  margin-top: 4px; letter-spacing: 0.2px;
}
.auth-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(245,158,11,0.45);
}
.auth-submit-btn:active:not(:disabled) { transform: scale(0.98); }
.auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.auth-spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(12,10,9,0.3);
  border-top-color: #0C0A09;
  border-radius: 50%;
  animation: authSpin 0.7s linear infinite;
  display: inline-block;
}
@keyframes authSpin { to { transform: rotate(360deg); } }

.auth-toggle-row {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin-top: 20px;
}
.auth-toggle-text { font-size: 12px; color: #64748B; }
.auth-toggle-btn {
  font-size: 12px; font-weight: 700; color: #F59E0B;
  background: none; border: none; cursor: pointer;
  transition: color 0.15s; padding: 0;
}
.auth-toggle-btn:hover { color: #FCD34D; }

.auth-security-footer {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin-top: 20px; padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 11px; color: #475569; font-weight: 500;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .auth-root { flex-direction: column; }
  .auth-left { flex: none; min-height: auto; }
  .auth-left-inner { padding: 32px 24px; gap: 20px; }
  .auth-right { flex: none; border-left: none; border-top: 1px solid rgba(255,255,255,0.06); padding: 32px 20px; }
  .auth-h1 { font-size: 28px; }
  .auth-logo-row { display: none; }
  .auth-mobile-logo { display: flex; }
}
@media (max-width: 480px) {
  .auth-stats-grid { grid-template-columns: 1fr; }
  .auth-donut-card { display: none; }
}

/* ── Light mode overrides ── */
.light .auth-root { background: #F1F5F9; }
.light .auth-left { background: linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 60%, #F0FDF4 100%); }
.light .auth-stat-card,
.light .auth-donut-card { background: rgba(255,255,255,0.85); border-color: rgba(0,0,0,0.08); }
.light .auth-right { background: #fff; border-left-color: #E2E8F0; }
.light .auth-form-card {
  background: rgba(255,255,255,0.96);
  border-color: #E2E8F0;
  box-shadow: 0 8px 40px rgba(0,0,0,0.1);
}
.light .auth-card-title { color: #0F172A !important; }
.light .auth-input {
  background: #F8FAFC !important;
  border-color: #CBD5E1 !important;
  color: #0F172A !important;
}
.light .auth-input::placeholder { color: #94A3B8 !important; }
.light .auth-input:focus { background: #fff !important; border-color: #F59E0B !important; }
.light .auth-security-footer { border-top-color: #E2E8F0; color: #94A3B8; }
.light .auth-trust-badge { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.07); color: #475569; }
.light .auth-grid-overlay {
  background-image:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
}
`;
