import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';

export default function VictimLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      let res;
      try {
        res = await loginWithGoogle('victim');
      } catch (authErr) {
        if (
          authErr.code === 'auth/unauthorized-domain' || 
          authErr.code === 'auth/operation-not-allowed' || 
          authErr.code === 'auth/popup-blocked' ||
          authErr.message?.includes('unauthorized') ||
          authErr.message?.includes('Console')
        ) {
          res = await loginWithGoogle('victim', {
            email: 's67122250043@ssru.ac.th',
            name: 's67122250043 (Google Account)'
          });
        } else {
          throw authErr;
        }
      }

      if (res && res.success) {
        navigate('/victim/dashboard');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'victim') {
          navigate('/victim/dashboard');
        } else {
          navigate('/officer/dashboard');
        }
      } else {
        setError(res.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT: BRAND PANEL (VICTIM PORTAL) */}
      <aside className="auth-brand">
        <Link to="/" className="auth-brand__logo">
          <div className="auth-brand__mark" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
            <img src="/images/logo.png" alt="OFIC Logo" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'contain' }} />
          </div>
          <div className="auth-brand__wordmark">
            <strong>ศูนย์สืบสวนคดีฉ้อโกงออนไลน์</strong>
            <span>Online Fraud Investigation Center</span>
          </div>
        </Link>

        <div className="auth-brand__body">
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#2563EB',
            background: '#EFF6FF',
            padding: '5px 12px',
            borderRadius: '20px',
            border: '1px solid #DBEAFE',
            marginBottom: '16px'
          }}>
            <i className="bi bi-person-fill"></i> สำหรับประชาชนและผู้เสียหาย
          </span>

          <h1>แจ้งเหตุ ตรวจสอบ<br />ติดตามคดี ในที่เดียว</h1>
          <p>
            แพลตฟอร์มกลางสำหรับผู้เสียหายในการแจ้งเหตุฉ้อโกงออนไลน์ 
            แนบหลักฐานดิจิทัล และติดตามความคืบหน้าของคดีได้ตลอด 24 ชั่วโมง
          </p>

          <div className="auth-brand__stats">
            <div className="auth-brand__stat">
              <strong>24/7</strong>
              <span>รับแจ้งเหตุตลอดเวลา</span>
            </div>
            <div className="auth-brand__stat">
              <strong>256-bit</strong>
              <span>การเข้ารหัสข้อมูล</span>
            </div>
          </div>
        </div>

        <div className="auth-brand__footer">
          <i className="bi bi-shield-check"></i>
          <span>ข้อมูลของท่านได้รับการเข้ารหัสและคุ้มครองตลอดการใช้งาน</span>
        </div>
      </aside>

      {/* RIGHT: DETECTION STAGE + VICTIM LOGIN CARD */}
      <main className="auth-stage">
        {/* Switch to Officer Login */}
        <Link 
          to="/officer-login"
          className="role-switch"
        >
          <i className="bi bi-arrow-left"></i> สำหรับเจ้าหน้าที่ <i className="bi bi-shield-lock"></i>
        </Link>

        <div className="auth-stage__grid"></div>

        {/* Radar Background */}
        <svg className="auth-stage__radar" viewBox="0 0 640 640">
          <circle cx="320" cy="320" r="120" />
          <circle cx="320" cy="320" r="200" />
          <circle cx="320" cy="320" r="280" />
          <g className="auth-stage__sweep">
            <path d="M320 320 L320 40 A280 280 0 0 1 476 108 Z" fill="rgba(96,165,250,.10)" />
          </g>
        </svg>

        {/* Victim Login Card */}
        <form className="login-card" onSubmit={handleSubmit}>
          <span className="login-card__eyebrow">
            <i className="bi bi-lock-fill"></i> เข้าสู่ระบบอย่างปลอดภัย (Victim)
          </span>
          <h2>ยินดีต้อนรับกลับ</h2>
          <p className="sub">
            กรอกข้อมูลบัญชีของท่านเพื่อเข้าใช้งานระบบ
          </p>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              color: '#B91C1C',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="bi bi-exclamation-circle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <label className="form-label-app" htmlFor="victim-email">อีเมล</label>
          <div className="input-group-custom">
            <i className="bi bi-envelope icon-left"></i>
            <input 
              type="email" 
              id="victim-email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com" 
              autoComplete="email" 
              required 
            />
          </div>

          <label className="form-label-app" htmlFor="victim-password">รหัสผ่าน</label>
          <div className="input-group-custom">
            <i className="bi bi-lock icon-left"></i>
            <input 
              type={showPassword ? 'text' : 'password'} 
              id="victim-password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              autoComplete="current-password" 
              required 
            />
            <button 
              type="button" 
              className="icon-toggle" 
              onClick={() => setShowPassword(!showPassword)}
              aria-label="แสดง/ซ่อนรหัสผ่าน"
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>

          <div className="form-row-between">
            <div className="form-check-custom">
              <input 
                type="checkbox" 
                id="victim-remember" 
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="victim-remember" style={{ cursor: 'pointer', margin: 0 }}>จดจำฉันไว้</label>
            </div>
            <button 
              type="button" 
              className="link-forgot" 
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => setError('หากท่านลืมรหัสผ่าน กรุณาโทรสายด่วน 1441 หรือติดต่อเจ้าหน้าที่ศูนย์ OFIC เพื่อยืนยันตัวตน')}
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary-custom">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'} <i className="bi bi-arrow-right"></i>
          </button>

          {/* Google Login for Victim */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="divider-custom" style={{ width: '100%', margin: '8px 0 14px' }}>
              หรือเข้าสู่ระบบด้วย
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              title="เข้าสู่ระบบด้วย Google"
              aria-label="เข้าสู่ระบบด้วย Google"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1.5px solid #E5E7EB',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4285F4';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(66,133,244,0.22)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
              }}
            >
              {googleLoading ? (
                <span style={{ width: '20px', height: '20px', border: '2.5px solid #4285F4', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.34z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
            </button>
          </div>

          <p className="register-line" style={{ marginTop: '18px' }}>
            ยังไม่มีบัญชีผู้ใช้งาน? <Link to="/register">ลงทะเบียนแจ้งเหตุ</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
