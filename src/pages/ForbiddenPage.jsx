import React from 'react';
import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '440px' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#FEE2E2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 20px'
        }}>
          <i className="bi bi-shield-slash"></i>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>403</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, marginBottom: '24px' }}>
          หน้านี้จำกัดสิทธิ์เฉพาะเจ้าหน้าที่สืบสวนหรือผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น
        </p>
        <Link to="/" className="btn-app btn-app-primary">
          <i className="bi bi-house-door-fill"></i> กลับสู่หน้าแรก
        </Link>
      </div>
    </div>
  );
}
