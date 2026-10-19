import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [activeHash, setActiveHash] = useState(window.location.hash || location.hash || '');

  useEffect(() => {
    setActiveHash(window.location.hash || location.hash || '');
  }, [location.pathname, location.hash]);

  const handleHashClick = (hash) => {
    setActiveHash(hash);
  };

  const handleHomeClick = (e) => {
    e?.preventDefault?.();
    setActiveHash('');
    if (window.location.pathname === '/' && (!window.location.hash || window.location.hash === '#')) {
      window.location.reload();
    } else {
      window.location.href = '/';
    }
  };

  const isHomeActive = location.pathname === '/' && (!activeHash || activeHash === '#');
  const isAboutActive = activeHash === '#about-section';
  const isTrackActive = location.pathname === '/victim/track-status' || location.pathname.startsWith('/victim/track');
  const isContactActive = activeHash === '#contact-section';

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '76px',
      background: 'rgba(248, 250, 252, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 clamp(12px, 3vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minWidth: 0,
        boxSizing: 'border-box'
      }}>
        {/* Brand */}
        <Link 
          to="/" 
          onClick={handleHomeClick} 
          className="nav-brand-link"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            textDecoration: 'none',
            minWidth: 0,
            flexShrink: 1
          }}
        >
          <img 
            src="/images/logo.png" 
            alt="OFIC Logo" 
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '10px',
              objectFit: 'contain',
              boxShadow: '0 3px 8px rgba(30, 58, 138, 0.25)',
              flexShrink: 0
            }}
          />
          <div className="nav-brand-text" style={{ minWidth: 0, overflow: 'hidden' }}>
            <strong className="nav-brand-title" style={{ 
              display: 'block', 
              fontSize: '14.5px', 
              fontWeight: 600, 
              color: '#111827', 
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              ศูนย์สืบสวนคดีฉ้อโกงออนไลน์
            </strong>
            <span className="nav-brand-sub" style={{ 
              display: 'block', 
              fontSize: '11px', 
              color: '#6B7280', 
              fontWeight: 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Online Fraud Investigation Center
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(14px, 1.8vw, 26px)',
          flexShrink: 0
        }}>
          <Link 
            to="/" 
            onClick={handleHomeClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: isHomeActive ? 600 : 400,
              color: isHomeActive ? '#2563EB' : '#4B5563',
              position: 'relative',
              padding: '6px 0',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-house-door-fill" style={{ fontSize: '15px', color: isHomeActive ? '#2563EB' : 'inherit' }}></i>
            หน้าแรก
            {isHomeActive && (
              <span style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: '2px',
                background: '#2563EB',
                borderRadius: '2px'
              }} />
            )}
          </Link>

          <a 
            href="#about-section" 
            onClick={() => handleHashClick('#about-section')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: isAboutActive ? 600 : 400,
              color: isAboutActive ? '#2563EB' : '#4B5563',
              position: 'relative',
              padding: '6px 0',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-shield-check" style={{ fontSize: '15px', color: isAboutActive ? '#2563EB' : 'inherit' }}></i>
            เกี่ยวกับระบบ
            {isAboutActive && (
              <span style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: '2px',
                background: '#2563EB',
                borderRadius: '2px'
              }} />
            )}
          </a>

          <Link 
            to="/victim/track-status" 
            onClick={() => handleHashClick('')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: isTrackActive ? 600 : 400,
              color: isTrackActive ? '#2563EB' : '#4B5563',
              position: 'relative',
              padding: '6px 0',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-search" style={{ fontSize: '14px', color: isTrackActive ? '#2563EB' : 'inherit' }}></i>
            ติดตามสถานะคดี
            {isTrackActive && (
              <span style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: '2px',
                background: '#2563EB',
                borderRadius: '2px'
              }} />
            )}
          </Link>

          <a 
            href="#contact-section" 
            onClick={() => handleHashClick('#contact-section')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: isContactActive ? 600 : 400,
              color: isContactActive ? '#2563EB' : '#4B5563',
              position: 'relative',
              padding: '6px 0',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-envelope" style={{ fontSize: '15px', color: isContactActive ? '#2563EB' : 'inherit' }}></i>
            ติดต่อเรา
            {isContactActive && (
              <span style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: '2px',
                background: '#2563EB',
                borderRadius: '2px'
              }} />
            )}
          </a>
        </div>

        {/* Action Buttons */}
        <div className="nav-actions" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexShrink: 0
        }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link 
                to={currentUser.role === 'victim' ? '/victim/dashboard' : '/officer/dashboard'} 
                className="btn-app btn-app-primary btn-app-sm nav-dash-btn"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  padding: '7px 12px'
                }}
              >
                <i className="bi bi-grid-fill"></i>
                <span className="nav-dash-label">แดชบอร์ด</span>
                <span className="nav-role-badge" style={{
                  fontSize: '11px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 500
                }}>
                  {currentUser.role === 'victim' ? 'ผู้เสียหาย' : 'เจ้าหน้าที่'}
                </span>
              </Link>
              <button 
                onClick={logout}
                className="btn-app btn-app-outline-gray btn-app-sm nav-logout-btn"
                title="ออกจากระบบ"
                style={{ 
                  padding: '7px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-app btn-app-primary btn-app-sm" style={{ padding: '7px 14px', whiteSpace: 'nowrap' }}>
              <i className="bi bi-lock-fill"></i>
              เข้าสู่ระบบ
            </Link>
          )}

          {/* Mobile hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              background: '#ffffff',
              border: '1px solid #E5E7EB',
              borderRadius: '9px',
              width: '36px',
              height: '36px',
              minWidth: '36px',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} style={{ fontSize: '18px' }}></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '76px',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 99
        }}>
          <Link 
            to="/" 
            onClick={(e) => { setMobileMenuOpen(false); handleHomeClick(e); }} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '8px 0',
              fontWeight: isHomeActive ? 600 : 400,
              color: isHomeActive ? '#2563EB' : '#4B5563'
            }}
          >
            <i className="bi bi-house-door-fill" style={{ color: isHomeActive ? '#2563EB' : '#6B7280' }}></i> หน้าแรก
          </Link>
          <a 
            href="#about-section" 
            onClick={() => { handleHashClick('#about-section'); setMobileMenuOpen(false); }} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '8px 0',
              fontWeight: isAboutActive ? 600 : 400,
              color: isAboutActive ? '#2563EB' : '#4B5563'
            }}
          >
            <i className="bi bi-shield-check" style={{ color: isAboutActive ? '#2563EB' : '#6B7280' }}></i> เกี่ยวกับระบบ
          </a>
          <Link 
            to="/victim/track-status" 
            onClick={() => { handleHashClick(''); setMobileMenuOpen(false); }} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '8px 0',
              fontWeight: isTrackActive ? 600 : 400,
              color: isTrackActive ? '#2563EB' : '#4B5563'
            }}
          >
            <i className="bi bi-search" style={{ color: isTrackActive ? '#2563EB' : '#6B7280' }}></i> ติดตามสถานะคดี
          </Link>
          <a 
            href="#contact-section" 
            onClick={() => { handleHashClick('#contact-section'); setMobileMenuOpen(false); }} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '8px 0',
              fontWeight: isContactActive ? 600 : 400,
              color: isContactActive ? '#2563EB' : '#4B5563'
            }}
          >
            <i className="bi bi-envelope" style={{ color: isContactActive ? '#2563EB' : '#6B7280' }}></i> ติดต่อเรา
          </a>
          
          <div style={{ paddingTop: '8px', borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!isAuthenticated ? (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-app btn-app-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="bi bi-lock-fill"></i> เข้าสู่ระบบ
              </Link>
            ) : (
              <>
                <Link 
                  to={currentUser.role === 'victim' ? '/victim/dashboard' : '/officer/dashboard'} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="btn-app btn-app-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <i className="bi bi-grid-fill"></i> เข้าสู่แดชบอร์ด ({currentUser.role === 'victim' ? 'ผู้เสียหาย' : 'เจ้าหน้าที่'})
                </Link>
                <button 
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="btn-app btn-app-outline-gray" 
                  style={{ width: '100%', justifyContent: 'center', color: '#DC2626' }}
                >
                  <i className="bi bi-box-arrow-right"></i> ออกจากระบบ
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        /* Switch to hamburger at 1040px to give ample room for brand, tabs & dashboard button */
        @media (max-width: 1040px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }

        /* On screens below 768px, hide the sub-role pill in dashboard button to prevent wrapping */
        @media (max-width: 768px) {
          .nav-role-badge { display: none !important; }
        }

        /* On mobile screens below 540px, optimize brand and button sizes */
        @media (max-width: 540px) {
          .nav-brand-sub { display: none !important; }
          .nav-brand-title { font-size: 13.5px !important; }
          .nav-dash-btn { padding: 6px 9px !important; font-size: 13px !important; }
          .nav-logout-btn { padding: 6px 8px !important; }
        }

        /* Extremely narrow devices (360px and below) */
        @media (max-width: 380px) {
          .nav-dash-label { display: none !important; }
          .nav-dash-btn { padding: 6px 8px !important; }
          .nav-brand-title { max-width: 150px !important; }
        }
      `}</style>
    </nav>
  );
}
