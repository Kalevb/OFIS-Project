import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { firebaseService } from '../../services/firebaseService.js';

export default function Topbar({ onToggleSidebar }) {
  const { currentUser, logout, isOfficer } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.uid) {
      firebaseService.getNotifications(currentUser.uid).then(setNotifications);
    }
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = encodeURIComponent(searchQuery.trim());
      if (isOfficer) {
        navigate(`/officer/cases?search=${q}`);
      } else {
        navigate(`/victim/track-status?code=${q}`);
      }
    }
  };

  const isGoogleUser = currentUser?.provider === 'google.com' || currentUser?.email?.includes('ssru.ac.th');
  const googleAccountName = currentUser?.displayName || currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : '');
  const activeDisplayName = googleAccountName || (isOfficer ? 'เจ้าหน้าที่สืบสวน' : 'ผู้เสียหาย');

  const getInitials = (name) => {
    if (!name) return 'OF';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
    return name.slice(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button 
          onClick={onToggleSidebar}
          className="icon-btn-app"
          title="เมนู"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="topbar__search" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handleSearch({ key: 'Enter' })}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6B7280' }}
            title="คลิกหรือกด Enter เพื่อค้นหาข้อมูลคนร้ายหรือเลขคดี"
          >
            <i className="bi bi-search"></i>
          </button>
          <input 
            type="text" 
            placeholder={isOfficer ? "ค้นหาเลขคดี, ชื่อคนร้าย, เลขบัตรคนร้าย, ธนาคาร, เลขบัญชี..." : "ค้นหาเลขคดี, ชื่อคนร้าย, เลขบัตรคนร้าย, ธนาคาร, เลขบัญชี..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            title="กด Enter เพื่อค้นหาข้อมูลคนร้ายหรือรหัสคดีทันที"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer', color: '#9CA3AF' }}
              title="ล้างคำค้นหา"
            >
              <i className="bi bi-x-circle-fill" style={{ fontSize: '13px' }}></i>
            </button>
          )}
        </div>
      </div>

      <div className="topbar__right">
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="icon-btn-app"
            title="การแจ้งเตือน"
          >
            <i className="bi bi-bell"></i>
            {unreadCount > 0 && <span className="dot-badge"></span>}
          </button>

          {showNotifMenu && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: 'min(320px, calc(100vw - 32px))',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
              border: '1px solid #E5E7EB',
              padding: '16px',
              zIndex: 60
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '14px' }}>การแจ้งเตือน</strong>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>{notifications.length} รายการ</span>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '12.5px', color: '#9CA3AF', textAlign: 'center', padding: '16px' }}>ไม่มีการแจ้งเตือน</p>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: n.isRead ? '#F9FAFB' : '#EFF6FF',
                        borderLeft: n.isRead ? '3px solid #D1D5DB' : '3px solid #2563EB',
                        fontSize: '12px'
                      }}
                    >
                      <strong style={{ display: 'block', color: '#111827', marginBottom: '2px' }}>{n.title}</strong>
                      <p style={{ color: '#4B5563', lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help button */}
        <a href="tel:1441" className="icon-btn-app topbar__help-btn" title="โทรสายด่วน 1441" style={{ textDecoration: 'none' }}>
          <i className="bi bi-telephone-fill" style={{ fontSize: '14px' }}></i>
        </a>

        {/* User Chip */}
        <div style={{ position: 'relative' }}>
          <div 
            className="user-chip"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-chip__avatar" style={{ overflow: 'hidden' }}>
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={activeDisplayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                getInitials(activeDisplayName)
              )}
            </div>
            <div className="user-chip__meta">
              <strong>{activeDisplayName}</strong>
              <span>
                {isGoogleUser ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563EB', fontWeight: 600 }}>
                    <i className="bi bi-google" style={{ fontSize: '10px' }}></i>
                    {currentUser?.role === 'admin' ? 'ผู้ดูแลระบบ' : isOfficer ? 'เจ้าหน้าที่สืบสวน' : 'Google Account'}
                  </span>
                ) : (
                  currentUser?.role === 'admin' ? 'ผู้ดูแลระบบ' : isOfficer ? 'เจ้าหน้าที่สืบสวน' : 'ผู้เสียหาย'
                )}
              </span>
            </div>
            <i className="bi bi-chevron-down" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}></i>
          </div>

          {/* User Menu - Account Details */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: 'min(300px, calc(100vw - 32px))',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #E5E7EB',
              padding: '14px',
              zIndex: 60
            }}>
              {/* Account Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #F1F5F9'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isOfficer ? '#1E3A8A' : '#2563EB',
                  color: '#ffffff',
                  fontSize: '17px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={activeDisplayName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    getInitials(activeDisplayName)
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{
                    fontSize: '13.5px',
                    color: '#0F172A',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {activeDisplayName}
                  </strong>
                  <span style={{
                    fontSize: '11.5px',
                    color: '#64748B',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {currentUser?.email || '-'}
                  </span>
                </div>
              </div>

              {/* Account Information Details */}
              <div style={{
                padding: '10px 0',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                flexDirection: 'column',
                gap: '7px',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>ประเภทบัญชี</span>
                  <span style={{
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    background: isOfficer ? '#EFF6FF' : '#F0FDF4',
                    color: isOfficer ? '#1D4ED8' : '#15803D'
                  }}>
                    {currentUser?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : isOfficer ? 'เจ้าหน้าที่สืบสวน' : 'ผู้เสียหาย / ประชาชน'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>การเชื่อมต่อ</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                    fontSize: '11.5px',
                    color: isGoogleUser ? '#2563EB' : '#475569'
                  }}>
                    {isGoogleUser ? (
                      <>
                        <i className="bi bi-google" style={{ color: '#4285F4' }}></i>
                        Google Account
                      </>
                    ) : (
                      <>
                        <i className="bi bi-envelope"></i>
                        อีเมลระบบ
                      </>
                    )}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>สถานะบัญชี</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#16A34A', fontWeight: 500, fontSize: '11.5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }}></span>
                    เปิดใช้งานแล้ว (Active)
                  </span>
                </div>

                {currentUser?.phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B' }}>เบอร์โทรศัพท์</span>
                    <span style={{ color: '#1E293B', fontWeight: 500, fontSize: '11.5px' }}>{currentUser.phone}</span>
                  </div>
                )}
              </div>

              {/* Account Quick Links */}
              <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/victim/profile');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <i className="bi bi-person-gear text-primary" style={{ fontSize: '14px' }}></i>
                  <span>ดูและแก้ไขโปรไฟล์ของฉัน</span>
                </button>

                {isOfficer ? (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/officer/dashboard');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="bi bi-shield-check text-primary" style={{ fontSize: '14px' }}></i>
                    <span>ระบบงานสืบสวนเจ้าหน้าที่</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/victim/dashboard');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="bi bi-folder2-open text-primary" style={{ fontSize: '14px' }}></i>
                    <span>ติดตามสถานะและคดีของฉัน</span>
                  </button>
                )}
              </div>

              {/* Logout Button */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                <button 
                  onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    border: 'none',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                >
                  <i className="bi bi-box-arrow-right"></i> ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
