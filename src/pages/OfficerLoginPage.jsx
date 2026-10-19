import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';

export default function OfficerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'officer' || res.user.role === 'admin') {
          navigate('/officer/dashboard');
        } else {
          // If a victim tries to log in through the officer portal
          setError('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบเจ้าหน้าที่สืบสวน');
        }
      } else {
        setError(res.error || 'อีเมลหรือรหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง');
      }
    } catch (err) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT: BRAND PANEL (OFFICER PORTAL) */}
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
            color: '#1E3A8A',
            background: '#EFF6FF',
            padding: '5px 12px',
            borderRadius: '20px',
            border: '1px solid #DBEAFE',
            marginBottom: '16px'
          }}>
            <i className="bi bi-shield-lock-fill"></i> ระบบงานเจ้าหน้าที่สืบสวน (Officer Portal)
          </span>

          <h1>ระบบปฏิบัติการสืบสวน<br />และวิเคราะห์ความเชื่อมโยง</h1>
          <p>
            เข้าถึงฐานข้อมูลคดีฉ้อโกง ตรวจจับความเชื่อมโยงของบัญชีม้า 
            เบอร์โทรศัพท์คนร้าย และประสานงานส่งต่อสำนวนคดีอย่างเป็นระบบ
          </p>

          <div className="auth-brand__stats">
            <div className="auth-brand__stat">
              <strong>99.8%</strong>
              <span>ความปลอดภัยระบบ</span>
            </div>
            <div className="auth-brand__stat">
              <strong>256-bit</strong>
              <span>การเข้ารหัสตามมาตรฐาน</span>
            </div>
          </div>
        </div>

        <div className="auth-brand__footer">
          <i className="bi bi-shield-check"></i>
          <span>สำหรับเจ้าหน้าที่ตำรวจและพนักงานสอบสวนที่ได้รับมอบหมายเท่านั้น</span>
        </div>
      </aside>

      {/* RIGHT: DETECTION STAGE + OFFICER LOGIN CARD */}
      <main className="auth-stage">
        {/* Switch to Victim Login */}
        <Link 
          to="/victim-login"
          className="role-switch"
        >
          <i className="bi bi-person"></i> สำหรับผู้เสียหาย <i className="bi bi-arrow-right"></i>
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

        {/* Officer Login Card */}
        <form className="login-card" onSubmit={handleSubmit}>
          <span className="login-card__eyebrow" style={{ background: 'rgba(30,58,138,0.08)', color: '#1E3A8A' }}>
            <i className="bi bi-shield-lock-fill"></i> ระบบเจ้าหน้าที่สืบสวน (Officer)
          </span>
          <h2>เข้าสู่ระบบเจ้าหน้าที่</h2>
          <p className="sub">
            ลงชื่อเข้าใช้ระบบปฏิบัติการสืบสวนคดีฉ้อโกง
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

          <label className="form-label-app" htmlFor="officer-email">อีเมลราชการ / เจ้าหน้าที่</label>
          <div className="input-group-custom">
            <i className="bi bi-envelope icon-left"></i>
            <input 
              type="email" 
              id="officer-email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@police.go.th" 
              autoComplete="email" 
              required 
            />
          </div>

          <label className="form-label-app" htmlFor="officer-password">รหัสผ่าน</label>
          <div className="input-group-custom">
            <i className="bi bi-lock icon-left"></i>
            <input 
              type={showPassword ? 'text' : 'password'} 
              id="officer-password" 
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
                id="officer-remember" 
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="officer-remember" style={{ cursor: 'pointer', margin: 0 }}>จดจำฉันไว้</label>
            </div>
            <button 
              type="button" 
              className="link-forgot" 
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => setError('กรุณาติดต่อผู้ดูแลระบบเครือข่ายภายในหน่วยงาน (Admin IT) เพื่อรีเซ็ตรหัสผ่านเจ้าหน้าที่')}
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary-custom" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #172554 100%)' }}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเจ้าหน้าที่'} <i className="bi bi-arrow-right"></i>
          </button>

          {/* Organization Account Notice: strictly issued by organization, NO register, NO Google icon */}
          <div style={{
            marginTop: '22px',
            padding: '14px 16px',
            background: 'rgba(241, 245, 249, 0.95)',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155'
            }}>
              <i className="bi bi-shield-lock-fill" style={{ color: '#2563EB', fontSize: '15px' }}></i>
              <span>ระบบเข้าใช้งานเฉพาะบัญชีที่ได้รับอนุญาต</span>
            </div>
            <p style={{
              margin: 0,
              fontSize: '12.5px',
              color: '#64748B',
              lineHeight: 1.55
            }}>
              ไม่อนุญาตให้ลงทะเบียนด้วยตนเอง <strong style={{ color: '#0F172A', fontWeight: 600 }}>ต้องเป็นบัญชีที่ออกให้ผ่านหน่วยงานเท่านั้น</strong>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
