import React, { useState } from 'react';
import { Eye, EyeOff, X, ShieldCheck, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

/* ── Password strength helper ── */
const getStrength = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return [
    { label: 'Too short', color: '#ef4444', width: '15%' },
    { label: 'Weak',      color: '#f97316', width: '35%' },
    { label: 'Fair',      color: '#eab308', width: '58%' },
    { label: 'Good',      color: '#22c55e', width: '80%' },
    { label: 'Strong 🔒', color: '#06b6d4', width: '100%' },
  ][score];
};

/* ── Reusable password input ── */
const PwInput = ({ label, value, onChange, show, onToggle, placeholder, error, hint }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    <label style={{
      display: 'block', fontSize: '0.76rem', fontWeight: 700,
      color: 'var(--text-secondary)', marginBottom: '0.35rem',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        style={{
          width: '100%', padding: '0.78rem 2.8rem 0.78rem 1rem',
          borderRadius: '10px',
          border: `1px solid ${error ? '#ef4444' : 'var(--glass-border)'}`,
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--text-primary)', fontSize: '0.95rem',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = 'var(--accent-blue)'; }}
        onBlur={e => { if (!error) e.target.style.borderColor = 'var(--glass-border)'; }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'absolute', right: '0.78rem', top: '50%',
          transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', padding: 0, display: 'flex',
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
    {error && <span style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '3px', display: 'block' }}>{error}</span>}
    {hint && !error && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>{hint}</span>}
  </div>
);

/* ══════════════════════════════════════════
   STEP 1 — Verify Identity
   ══════════════════════════════════════════ */
const StepVerify = ({ onVerified, onClose }) => {
  const { token } = useAuth();
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!password) { setError('Please enter your current password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification failed');
      onVerified(password); // pass verified password to step 2
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(59,130,246,0.15)', borderRadius: '10px', padding: '0.5rem', display: 'flex' }}>
            <ShieldAlert size={22} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Confirm Your Identity</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Step 1 of 2 — Verify before changing password</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}>
          <X size={20} />
        </button>
      </div>

      {/* Info box */}
      <div style={{
        marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '10px',
        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
        fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        🔐 To protect your account, we need to verify your current password before allowing any changes.
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: '1rem', padding: '0.65rem 1rem', borderRadius: '10px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: '0.88rem', fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleVerify}>
        <PwInput
          label="Current Password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          show={show}
          onToggle={() => setShow(v => !v)}
          placeholder="Enter your current password"
          error=""
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: '12px',
            background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.95rem',
            cursor: loading ? 'wait' : 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
            : <><ShieldCheck size={16} /> Verify Identity</>
          }
        </button>
      </form>
    </>
  );
};

/* ══════════════════════════════════════════
   STEP 2 — Set New Password
   ══════════════════════════════════════════ */
const StepSetPassword = ({ verifiedPassword, onClose }) => {
  const { token } = useAuth();
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);

  const strength = getStrength(newPw);
  const mismatch = confirmPw && confirmPw !== newPw;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) { setStatus({ type: 'error', msg: 'Password must be at least 6 characters.' }); return; }
    if (newPw !== confirmPw) { setStatus({ type: 'error', msg: 'Passwords do not match.' }); return; }
    if (newPw === verifiedPassword) { setStatus({ type: 'error', msg: 'New password must differ from your current password.' }); return; }
    setLoading(true); setStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: verifiedPassword, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update password');
      setStatus({ type: 'success', msg: 'Password updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (status?.type === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem', animation: 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <CheckCircle2 size={32} color="#4ade80" />
        </div>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700 }}>
          Password Changed!
        </h3>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Your account is now secured with your new password.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '0.75rem 2rem', borderRadius: '12px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: '10px', padding: '0.5rem', display: 'flex' }}>
            <ShieldCheck size={22} color="#22c55e" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Set New Password</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#4ade80' }}>✓ Identity verified — Step 2 of 2</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.25rem' }}>
          <X size={20} />
        </button>
      </div>

      {/* Error banner */}
      {status?.type === 'error' && (
        <div style={{
          marginBottom: '1rem', padding: '0.65rem 1rem', borderRadius: '10px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: '0.88rem', fontWeight: 500,
        }}>
          ⚠️ {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* New password */}
        <PwInput
          label="New Password"
          value={newPw}
          onChange={e => { setNewPw(e.target.value); setStatus(null); }}
          show={showNew}
          onToggle={() => setShowNew(v => !v)}
          placeholder="Create a strong password"
        />
        {/* Strength bar */}
        {strength && (
          <div style={{ marginTop: '-0.75rem', marginBottom: '1.1rem' }}>
            <div style={{ height: '5px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: strength.width,
                background: strength.color, borderRadius: '4px',
                transition: 'width 0.4s ease, background 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 600, marginTop: '3px', display: 'inline-block' }}>
              {strength.label}
            </span>
          </div>
        )}

        {/* Confirm password */}
        <PwInput
          label="Confirm New Password"
          value={confirmPw}
          onChange={e => { setConfirmPw(e.target.value); setStatus(null); }}
          show={showConfirm}
          onToggle={() => setShowConfirm(v => !v)}
          placeholder="Repeat your new password"
          error={mismatch ? "Passwords don't match" : ''}
        />

        {/* Requirements checklist */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {[
            { label: 'At least 6 characters', met: newPw.length >= 6 },
            { label: 'Contains a number',     met: /[0-9]/.test(newPw) },
            { label: 'Contains uppercase',    met: /[A-Z]/.test(newPw) },
            { label: 'Passwords match',       met: newPw && newPw === confirmPw },
          ].map(req => (
            <span key={req.label} style={{
              fontSize: '0.76rem', fontWeight: 500,
              color: req.met ? '#4ade80' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'color 0.3s',
            }}>
              <span style={{ fontSize: '0.7rem' }}>{req.met ? '✓' : '○'}</span> {req.label}
            </span>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || mismatch || newPw.length < 6}
          style={{
            width: '100%', padding: '0.85rem', borderRadius: '12px',
            background: (loading || mismatch || newPw.length < 6)
              ? 'rgba(59,130,246,0.4)'
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', border: 'none', fontWeight: 700,
            fontSize: '0.95rem',
            cursor: (loading || mismatch || newPw.length < 6) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'opacity 0.2s',
          }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
            : 'Update Password'
          }
        </button>
      </form>
    </>
  );
};

/* ══════════════════════════════════════════
   MAIN MODAL SHELL
   ══════════════════════════════════════════ */
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep]                 = useState(1); // 1 = verify, 2 = set new
  const [verifiedPassword, setVerified] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setVerified('');
    onClose();
  };

  const handleVerified = (pw) => {
    setVerified(pw);
    setStep(2);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          zIndex: 1200,
        }}
      />

      {/* Modal card */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 2rem)', maxWidth: '430px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px', padding: '2rem',
        zIndex: 1201,
        animation: 'cpwDropIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <style>{`
          @keyframes cpwDropIn {
            from { opacity:0; transform: translate(-50%,-46%) scale(0.95); }
            to   { opacity:1; transform: translate(-50%,-50%) scale(1); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes scaleIn {
            from { opacity:0; transform: scale(0.6); }
            to   { opacity:1; transform: scale(1); }
          }

          /* Step progress indicator */
          .cpw-step-bar {
            display: flex; gap: 0.4rem; margin-bottom: 1.5rem;
          }
          .cpw-step-seg {
            height: 3px; flex: 1; border-radius: 4px;
            transition: background 0.5s ease;
          }
        `}</style>

        {/* Step progress bar */}
        <div className="cpw-step-bar">
          <div className="cpw-step-seg" style={{ background: '#3b82f6' }} />
          <div className="cpw-step-seg" style={{ background: step === 2 ? '#3b82f6' : 'var(--glass-border)' }} />
        </div>

        {step === 1
          ? <StepVerify onVerified={handleVerified} onClose={handleClose} />
          : <StepSetPassword verifiedPassword={verifiedPassword} onClose={handleClose} />
        }
      </div>
    </>
  );
};

export default ChangePasswordModal;
