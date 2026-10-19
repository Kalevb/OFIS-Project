import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { firebaseService } from '../../services/firebaseService.js';

// Module-level persistent cache across route changes so badges never bounce/flicker
let cachedOfficerCaseCount = null;
let cachedVictimCaseCount = null;

function getInitialOfficerCaseCount() {
  if (cachedOfficerCaseCount !== null) return cachedOfficerCaseCount;
  try {
    const raw = localStorage.getItem('OFIC_DATABASE_STATE_RTDB_V1');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.cases) {
        const count = Object.keys(data.cases).length;
        if (count > 0) {
          cachedOfficerCaseCount = count;
          return count;
        }
      }
    }
  } catch (e) {}
  return 12;
}

function getInitialVictimCaseCount() {
  if (cachedVictimCaseCount !== null) return cachedVictimCaseCount;
  return 3;
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { currentUser, isOfficer, isAdmin, logout } = useAuth();
  const [victimCaseCount, setVictimCaseCount] = useState(getInitialVictimCaseCount);
  const [officerCaseCount, setOfficerCaseCount] = useState(getInitialOfficerCaseCount);

  useEffect(() => {
    let isMounted = true;

    const isMyOfficerCase = (c, user) => {
      if (!user) return false;
      const uid = user.uid;
      const name = user.name || user.displayName || '';
      const email = user.email || '';
      return (
        (c.assignedOfficerId && c.assignedOfficerId === uid) ||
        (c.assignedOfficerName && (c.assignedOfficerName === name || name.includes(c.assignedOfficerName) || c.assignedOfficerName.includes(name))) ||
        (c.assignedOfficer && (c.assignedOfficer === name || name.includes(c.assignedOfficer) || c.assignedOfficer.includes(name))) ||
        (c.assignedOfficerEmail && c.assignedOfficerEmail === email)
      );
    };

    const isVictimMatch = (c, user) => {
      if (!user) return false;
      const uid = user.uid;
      const fbUid = user.fbUid;
      const email = (user.email || '').toLowerCase().trim();
      const phone = (user.phone || '').replace(/\D/g, '');
      const name = (user.name || user.displayName || '').toLowerCase().trim();

      if (c.victimId && (c.victimId === uid || (fbUid && c.victimId === fbUid))) return true;
      if (email && c.victimEmail && c.victimEmail.toLowerCase().trim() === email) return true;
      if (phone && c.victimPhone && c.victimPhone.replace(/\D/g, '') === phone) return true;
      if (name && c.victimName && (c.victimName.toLowerCase().trim() === name || name.includes(c.victimName.toLowerCase().trim()))) return true;
      if ((email === 'somchai@example.com' || uid === 'user_v001') && c.victimId === 'user_v001') return true;
      return false;
    };

    const updateCounts = (cases) => {
      if (!isMounted || !Array.isArray(cases)) return;
      const myOfficerCases = cases.filter(c => isMyOfficerCase(c, currentUser));
      setOfficerCaseCount(myOfficerCases.length);
      cachedOfficerCaseCount = myOfficerCases.length;

      if (currentUser?.uid) {
        const myCases = cases.filter(c => isVictimMatch(c, currentUser));
        if (myCases.length > 0) {
          cachedVictimCaseCount = myCases.length;
          setVictimCaseCount(myCases.length);
        }
      }
    };

    // Real-time listener for instant accurate count
    const unsubscribe = firebaseService.subscribeCases ? firebaseService.subscribeCases(updateCounts) : null;

    return () => { 
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 59,
            display: 'block'
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        {/* Brand */}
        <div className="sidebar__brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div className="sidebar__mark" style={{ background: 'transparent', padding: 0, overflow: 'hidden' }}>
              <img 
                src="/images/logo.png" 
                alt="OFIC Logo" 
                style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'contain' }} 
              />
            </div>
            <div className="sidebar__wordmark">
              <strong>ศูนย์สืบสวนคดีฉ้อโกงออนไลน์</strong>
              <span>{isOfficer ? 'Officer Console' : 'สำหรับผู้เสียหาย'}</span>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="btn-app-ghost mobile-only" 
            style={{ marginLeft: 'auto', color: '#dbe4ff', width: '32px', height: '32px', padding: 0 }}
            aria-label="ปิดเมนู"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="sidebar__nav">
          {!isOfficer ? (
            /* Victim Nav */
            <>
              <div className="nav-label">เมนูหลัก</div>
              <NavLink 
                to="/victim/dashboard" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-grid-1x2-fill"></i>
                <span>แดชบอร์ด</span>
              </NavLink>

              <NavLink 
                to="/victim/submit-case" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-file-earmark-plus"></i>
                <span>แจ้งเหตุใหม่</span>
              </NavLink>

              <NavLink 
                to="/victim/track-status" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-folder2-open"></i>
                <span>ติดตามสถานะคดี</span>
                <span className="badge-count">{victimCaseCount}</span>
              </NavLink>

              <div className="nav-label">บัญชี</div>
              <NavLink 
                to="/victim/profile" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-person-circle"></i>
                <span>โปรไฟล์ของฉัน</span>
              </NavLink>
            </>
          ) : (
            /* Officer / Admin Nav */
            <>
              <div className="nav-label">ภาพรวม</div>
              <NavLink 
                to="/officer/dashboard" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className="bi bi-grid-1x2-fill"></i>
                <span>แดชบอร์ด</span>
              </NavLink>

              <div className="nav-label">การสืบสวน</div>
              <NavLink 
                to="/officer/cases" 
                className={({ isActive }) => {
                  const isCasesActive = isActive || location.pathname === '/officer/cases' || location.pathname === '/cases' || (location.pathname.startsWith('/cases/') && !location.pathname.includes('/evidence') && !location.pathname.includes('/timeline'));
                  return `nav-link-app ${isCasesActive ? 'active' : ''}`;
                }}
                onClick={onClose}
              >
                <i className="bi bi-folder2-open"></i>
                <span>คดีทั้งหมดของฉัน</span>
                <span className="badge-count">{officerCaseCount}</span>
              </NavLink>

              <NavLink 
                to="/officer/victims" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <img src="/images/icon-victims.png" alt="" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain', flexShrink: 0 }} />
                <span>ผู้เสียหาย</span>
              </NavLink>

              <NavLink 
                to="/officer/duplicates" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <img src="/images/icon-duplicate-detection.png" alt="" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain', flexShrink: 0 }} />
                <span>ตรวจจับรายการซ้ำ</span>
              </NavLink>

              <div className="nav-label">ระบบ</div>
              <NavLink 
                to="/officer/reports" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <img src="/images/icon-reports.png" alt="" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain', flexShrink: 0 }} />
                <span>รายงาน</span>
              </NavLink>

              {isAdmin && (
                <NavLink 
                  to="/officer/users" 
                  className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>จัดการผู้ใช้งาน</span>
                </NavLink>
              )}

              <NavLink 
                to="/officer/settings" 
                className={({ isActive }) => `nav-link-app ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <img src="/images/icon-settings.png" alt="" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain', flexShrink: 0 }} />
                <span>ตั้งค่า</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer with logout */}
        <div className="sidebar__footer">
          <button 
            onClick={logout}
            className="logout-link"
          >
            <i className="bi bi-box-arrow-left"></i>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
