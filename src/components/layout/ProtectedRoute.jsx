import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="bi bi-shield-shaded" style={{ fontSize: '36px', color: '#2563EB', animation: 'spin 1s linear infinite' }}></i>
          <p style={{ marginTop: '12px', color: '#6B7280' }}>กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
