import React from 'react';
import { CASE_STATUSES } from '../../utils/constants.js';

export default function StatusBadge({ status }) {
  const conf = CASE_STATUSES[status] || {
    label: status || 'ไม่ระบุ',
    color: '#6B7280',
    bgColor: '#F3F4F6'
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
      color: conf.color,
      backgroundColor: conf.bgColor,
      border: `1px solid ${conf.color}30`
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: conf.color
      }} />
      {conf.label}
    </span>
  );
}
