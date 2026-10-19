import React from 'react';

export default function EmptyState({ icon = 'bi-folder-x', title = 'ไม่พบข้อมูล', description = 'ยังไม่มีข้อมูลในระบบ หรือไม่มีข้อมูลที่ตรงกับเงื่อนไขการค้นหา', actionText, onAction }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      background: '#ffffff',
      borderRadius: '18px',
      border: '1px dashed #E5E7EB'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#EFF6FF',
        color: '#2563EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        margin: '0 auto 16px'
      }}>
        <i className={`bi ${icon}`}></i>
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13.5px', color: '#6B7280', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.6 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-app btn-app-primary btn-app-sm">
          {actionText}
        </button>
      )}
    </div>
  );
}
