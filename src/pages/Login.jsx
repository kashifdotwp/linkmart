/**
 * Login Page — Link Mart
 * Secure email + password authentication with beautiful UI.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in → go to dashboard
  useEffect(() => {
    if (currentUser) navigate('/', { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.ok) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Login failed. Check your email and password.');
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#C9A24D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.appName}>Link Mart</h1>
            <p style={styles.appTagline}>SEO Agency Suite</p>
          </div>
        </div>

        {/* Welcome text */}
        <div style={styles.welcomeSection}>
          <div style={styles.securityBadge}>
            <Shield size={12} style={{ marginRight: 5 }} /> Secure Access
          </div>
          <h2 style={styles.welcomeTitle}>Welcome back</h2>
          <p style={styles.welcomeSubtitle}>Sign in to your workspace</p>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={15} style={{ marginRight: 8, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                style={styles.input}
                placeholder="you@agency.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                style={{ ...styles.input, paddingRight: 44 }}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={styles.eyeBtn} tabIndex={-1}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.8 : 1 }}
          >
            {loading ? (
              <><Loader2 size={18} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} /> Signing in...</>
            ) : (
              'Sign In to Workspace'
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footer}>
          No public registration — contact your admin to get access.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,15px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        #login-email:focus, #login-password:focus {
          outline: none;
          border-color: #C9A24D !important;
          box-shadow: 0 0 0 3px rgba(201,162,77,0.18) !important;
        }
        #login-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(15,42,68,0.4);
        }
        #login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #0F2A44 50%, #1a0a2e 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, position: 'relative', overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(201,162,77,0.12) 0%, transparent 70%)',
    top: '-100px', left: '-100px', animation: 'float1 8s ease-in-out infinite',
  },
  blob2: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
    bottom: '-80px', right: '-80px', animation: 'float2 10s ease-in-out infinite',
  },
  blob3: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)',
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
    animation: 'float3 12s ease-in-out infinite',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
    animation: 'fadeUp 0.5s ease-out',
    position: 'relative', zIndex: 1,
  },
  logoSection: {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32,
  },
  logoIcon: {
    width: 52, height: 52, borderRadius: 14,
    background: 'linear-gradient(135deg, #0F2A44 0%, #1a3a5c 100%)',
    border: '1px solid rgba(201,162,77,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(201,162,77,0.2)',
  },
  appName: {
    fontSize: '1.4rem', fontWeight: 800, color: '#fff',
    margin: 0, letterSpacing: '-0.02em',
  },
  appTagline: {
    fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)',
    margin: '2px 0 0', letterSpacing: '0.04em',
  },
  welcomeSection: { marginBottom: 28 },
  securityBadge: {
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 10px', borderRadius: 20,
    background: 'rgba(201,162,77,0.12)', border: '1px solid rgba(201,162,77,0.2)',
    color: '#C9A24D', fontSize: '0.7rem', fontWeight: 700,
    marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontSize: '1.7rem', fontWeight: 800, color: '#fff',
    margin: '0 0 6px', letterSpacing: '-0.02em',
  },
  welcomeSubtitle: {
    fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', margin: 0,
  },
  errorBox: {
    display: 'flex', alignItems: 'flex-start',
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 10, padding: '10px 14px', marginBottom: 20,
    color: '#fca5a5', fontSize: '0.84rem', lineHeight: 1.5,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: {
    position: 'absolute', left: 14, color: 'rgba(255,255,255,0.3)',
    pointerEvents: 'none', zIndex: 1,
  },
  input: {
    width: '100%', padding: '12px 14px 12px 42px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: '0.92rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: 12, background: 'none', border: 'none',
    cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4,
    display: 'flex', alignItems: 'center',
  },
  submitBtn: {
    marginTop: 6, padding: '14px 20px', borderRadius: 12,
    background: 'linear-gradient(135deg, #0F2A44 0%, #1e4a70 100%)',
    border: '1px solid rgba(201,162,77,0.3)',
    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s ease', letterSpacing: '0.01em',
    boxShadow: '0 4px 16px rgba(15,42,68,0.4)',
  },
  footer: {
    textAlign: 'center', marginTop: 24,
    fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5,
  },
};
