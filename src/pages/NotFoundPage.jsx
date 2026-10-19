import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
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
          background: '#EFF6FF',
          color: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 20px'
        }}>
          <i className="bi bi-compass"></i>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1E3A8A', marginBottom: '8px' }}>404</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>ไม่พบหน้าที่ท่านต้องการ</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, marginBottom: '24px' }}>
          หน้าที่ท่านพยายามเข้าถึงอาจถูกย้าย ลบ หรือไม่มีอยู่ในระบบศูนย์สืบสวนคดีฉ้อโกงออนไลน์
        </p>
        <Link to="/" className="btn-app btn-app-primary">
          <i className="bi bi-house-door-fill"></i> กลับสู่หน้าแรก
        </Link>
      </div>
    </div>
  );
}
