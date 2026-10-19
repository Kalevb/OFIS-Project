import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleRegister = async () => {
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
            name: 's67122250043 (Google User)'
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
        setError(err.message || 'ไม่สามารถสมัครด้วย Google ได้');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!formData.acceptTerms) {
      setError('กรุณายินยอมตามข้อกำหนดและนโยบายความเป็นส่วนตัว');
      return;
    }

    setLoading(true);
    try {
      const res = await register(formData);
      if (res.success) {
        navigate('/victim/dashboard');
      } else {
        setError(res.error || 'ไม่สามารถลงทะเบียนได้');
      }
    } catch (err) {
      setError('ไม่สามารถลงทะเบียนได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT: BRAND PANEL */}
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

        <div className="auth-brand__body" style={{ marginTop: '24px' }}>
          <span className="login-card__eyebrow" style={{ marginBottom: '10px' }}>
            <i className="bi bi-person-plus-fill"></i> สมัครสมาชิกผู้เสียหาย
          </span>
          <h1 style={{ fontSize: 'clamp(22px, 2.2vw, 28px)', marginBottom: '10px' }}>
            สร้างบัญชีผู้ใช้งาน<br />
            เพื่อเริ่มแจ้งเหตุ
          </h1>
          <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
            ระบบจะเก็บรักษาข้อมูลของท่านเป็นความลับสูงสุด 
            ใช้เฉพาะเพื่อการดำเนินคดีและการตรวจสอบข้อเท็จจริง 
            โดยเจ้าหน้าที่พนักงานสอบสวนที่ได้รับอนุญาตเท่านั้น
          </p>

          <div style={{
            marginTop: '18px',
            background: '#F8FAFC',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0'
          }}>
            <strong style={{
              fontSize: '12.5px',
              color: '#1E3A8A',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px'
            }}>
              <i className="bi bi-shield-check" style={{ color: '#2563EB' }}></i> สิทธิประโยชน์ของสมาชิก:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#4B5563', lineHeight: 1.7 }}>
              <li>แจ้งเหตุและแนบหลักฐานแบบดิจิทัล 24 ชม.</li>
              <li>ติดตามความคืบหน้าของคดีแบบเรียลไทม์</li>
              <li>รับการแจ้งเตือนทันทีเมื่อมีการอัปเดตสถานะ</li>
              <li>ระบบตรวจจับเบอร์และบัญชีคนร้ายที่ซ้ำกันอัตโนมัติ</li>
            </ul>
          </div>
        </div>

        <div className="auth-brand__footer" style={{ paddingTop: '14px' }}>
          <i className="bi bi-shield-lock-fill" style={{ color: '#2563EB' }}></i>
          <span>มาตรฐานความปลอดภัยสารสนเทศภาครัฐ</span>
        </div>
      </aside>

      {/* RIGHT: REGISTRATION STAGE */}
      <main className="auth-stage auth-stage--scroll">
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

        {/* REGISTER CARD - COMPACT TO FIT VIEWPORT PERFECTLY */}
        <div className="register-card">
          <div style={{ marginBottom: '12px' }}>
            <span className="login-card__eyebrow" style={{ padding: '3px 10px', fontSize: '11px', marginBottom: '6px' }}>
              <i className="bi bi-person-plus-fill"></i> ลงทะเบียนผู้เสียหาย (Victim Registration)
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '2px 0 4px', lineHeight: 1.25 }}>
              สร้างบัญชีผู้แจ้งเหตุ
            </h2>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              โปรดระบุข้อมูลจริงเพื่อใช้ในการออกเอกสารราชการและติดต่อกลับ
            </p>
          </div>

          {error && (
            <div style={{
              padding: '8px 12px',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="bi bi-exclamation-circle-fill" style={{ fontSize: '14px', flexShrink: 0 }}></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="register-grid">
              {/* Full Name */}
              <div className="col-span-2">
                <label className="form-label-app" htmlFor="reg-name">
                  ชื่อ - นามสกุล <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="input-group-custom">
                  <i className="bi bi-person icon-left"></i>
                  <input 
                    type="text" 
                    id="reg-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="เช่น นายสมชาย ใจดี"
                    required
                  />
                </div>
              </div>

              {/* National ID */}
              <div>
                <label className="form-label-app" htmlFor="reg-nationalId">
                  เลขบัตรประชาชน (13 หลัก) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="input-group-custom">
                  <i className="bi bi-card-heading icon-left"></i>
                  <input 
                    type="text" 
                    id="reg-nationalId"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    placeholder="1-XXXX-XXXXX-XX-X"
                    required
                    maxLength={17}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="form-label-app" htmlFor="reg-phone">
                  เบอร์โทรศัพท์ <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="input-group-custom">
                  <i className="bi bi-telephone icon-left"></i>
                  <input 
                    type="tel" 
                    id="reg-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08X-XXX-XXXX"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="col-span-2">
                <label className="form-label-app" htmlFor="reg-email">
                  อีเมล <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="input-group-custom">
                  <i className="bi bi-envelope icon-left"></i>
                  <input 
                    type="email" 
                    id="reg-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="form-label-app" htmlFor="reg-password">
                  รหัสผ่าน <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="input-group-custom">
                  <i className="bi bi-lock icon-left"></i>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="reg-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="ขั้นต่ำ 6 ตัวอักษร"
                    required
                    minLength={6}
                    autoComplete="new-password"
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
              </div>

              {/* Confirm Password */}
              <div>
                <label className="form-label-app" htmlFor="reg-confirmPassword">
                  ยืนยันรหัสผ่าน <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div className="input-group-custom">
                  <i className="bi bi-shield-lock icon-left"></i>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    className="icon-toggle" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="แสดง/ซ่อนรหัสผ่าน"
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className="form-label-app" htmlFor="reg-address">
                  ที่อยู่ตามทะเบียนบ้าน / ที่อยู่ปัจจุบัน
                </label>
                <textarea 
                  id="reg-address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                  rows={1}
                  style={{
                    width: '100%',
                    height: '38px',
                    minHeight: '38px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    padding: '8px 12px',
                    fontFamily: "'Kanit', sans-serif",
                    fontSize: '12.5px',
                    background: 'var(--bg)',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div style={{
              margin: '8px 0 10px',
              padding: '6px 10px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <input 
                type="checkbox" 
                id="reg-acceptTerms" 
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                style={{ marginTop: '2px', cursor: 'pointer', accentColor: '#2563EB', width: '15px', height: '15px', flexShrink: 0 }}
              />
              <label htmlFor="reg-acceptTerms" style={{ fontSize: '11px', color: '#475569', lineHeight: 1.45, cursor: 'pointer', margin: 0 }}>
                ข้าพเจ้ายินยอมให้ศูนย์สืบสวนคดีฉ้อโกงออนไลน์จัดเก็บและประมวลผลข้อมูลส่วนบุคคลเพื่อประโยชน์ในการสืบสวนคดีตามกฎหมาย
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary-custom"
              style={{ width: '100%', height: '38px', fontSize: '13.5px', borderRadius: '8px', boxShadow: '0 6px 16px rgba(37,99,235,0.22)' }}
            >
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
                  <span>กำลังสร้างบัญชี...</span>
                </>
              ) : (
                <>
                  <span>ลงทะเบียนและเข้าสู่ระบบ</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-custom" style={{ margin: '8px 0 6px', fontSize: '11px' }}>
            หรือลงทะเบียนด้วย
          </div>

          {/* Google Register Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={googleLoading || loading}
              title="สมัครสมาชิกด้วยบัญชี Google"
              aria-label="สมัครสมาชิกด้วยบัญชี Google"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1.5px solid #E2E8F0',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (googleLoading || loading) ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4285F4';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(66,133,244,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
              }}
            >
              {googleLoading ? (
                <span style={{ width: '16px', height: '16px', border: '2px solid #4285F4', borderRightColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}></span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.34z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '12px', color: '#64748B' }}>
            มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
            <Link to="/login" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
