import React from 'react';

export default function StatCard({ icon, title, value, subtext, trend, color = '#2563EB', bgColor = 'rgba(37, 99, 235, 0.1)' }) {
  return (
    <div className="card-app" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          background: bgColor,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          <i className={`bi ${icon}`}></i>
        </div>
        {trend && (
          <span style={{
            fontSize: '11.5px',
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: '12px',
            background: trend.up ? '#DCFCE7' : '#F3F4F6',
            color: trend.up ? '#15803D' : '#4B5563',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            {trend.up ? <i className="bi bi-arrow-up-short"></i> : null}
            {trend.text}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', lineHeight: 1.15, marginBottom: '4px' }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
