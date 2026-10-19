import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency, formatThaiDate } from '../utils/format.js';
import { CASE_TYPES } from '../utils/constants.js';
import { matchCaseWithQuery, getSuspectMatchSummary } from '../utils/searchHelper.js';

export default function TrackStatusPage() {
  const { currentUser, isOfficer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || searchParams.get('search') || '';

  const [searchCode, setSearchCode] = useState(queryCode);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'investigating', 'pending', 'resolved'
  const [cases, setCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [timelineLogs, setTimelineLogs] = useState({});
  const [loading, setLoading] = useState(true);

  // Sync with URL query parameter
  useEffect(() => {
    if (queryCode && queryCode !== searchCode) {
      setSearchCode(queryCode);
    }
  }, [queryCode]);

  useEffect(() => {
    let isMounted = true;

    const isVictimMatch = (c, user) => {
      if (!user) return true;
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

    const loadCases = async () => {
      try {
        const all = await firebaseService.getCases();
        if (!isMounted) return;

        let filtered = all;
        // If victim is logged in, prioritize victim's cases, but if they search suspect or code, allow matching
        if (!isOfficer && currentUser) {
          const myCases = all.filter(c => isVictimMatch(c, currentUser));
          if (myCases.length > 0) {
            filtered = myCases;
          }
        }
        setCases(filtered);

        // Auto-open matching case or first case
        if (filtered.length > 0) {
          const match = queryCode 
            ? filtered.find(c => matchCaseWithQuery(c, queryCode))
            : filtered[0];
          const selectedId = match ? match.id : filtered[0].id;
          setActiveCaseId(selectedId);
          loadTimeline(selectedId);
        }
      } catch (err) {
        console.warn('TrackStatus load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadCases();

    const unsubscribe = firebaseService.subscribeCases ? firebaseService.subscribeCases(all => {
      if (!isMounted || !Array.isArray(all)) return;
      let filtered = all;
      if (!isOfficer && currentUser) {
        const myCases = all.filter(c => isVictimMatch(c, currentUser));
        if (myCases.length > 0) filtered = myCases;
      }
      setCases(filtered);
      setLoading(false);
    }) : null;

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser, isOfficer, queryCode]);

  const loadTimeline = async (caseId) => {
    if (!caseId) return;
    try {
      const logs = await firebaseService.getTimeline(caseId);
      setTimelineLogs(prev => ({ ...prev, [caseId]: logs }));
    } catch {}
  };

  const toggleAccordion = (caseId) => {
    if (activeCaseId === caseId) {
      setActiveCaseId(null);
    } else {
      setActiveCaseId(caseId);
      loadTimeline(caseId);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchCode.trim()) {
      setSearchParams({ code: searchCode.trim() });
    } else {
      setSearchParams({});
    }
  };

  // Filter cases by search code (suspects, case code, victim, bank, ID card) and active tab
  const displayedCases = cases.filter(c => {
    if (!matchCaseWithQuery(c, searchCode)) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'investigating') return c.status === 'investigating' || c.status === 'evidence_review';
    if (activeTab === 'pending') return c.status === 'pending';
    if (activeTab === 'resolved') return c.status === 'resolved' || c.status === 'closed';
    return true;
  });

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E3A8A' }}>
            ติดตามสถานะคดี (Case Tracking)
          </h1>
          <p style={{ color: '#4B5563', fontSize: '14px', marginTop: '4px' }}>
            ตรวจสอบความคืบหน้าของคดีฉ้อโกงออนไลน์ ขั้นตอนสืบสวน และบันทึกการทำงานของเจ้าหน้าที่แบบเรียลไทม์
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/victim/submit-case" className="btn-app btn-app-primary">
            <i className="bi bi-file-earmark-plus"></i> แจ้งเหตุใหม่
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card-app" style={{ marginBottom: '20px', padding: '18px 22px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: '16px' }}></i>
            <input 
              type="text" 
              placeholder="ค้นหาเลขคดี, ชื่อคนร้าย, เลขบัตรคนร้าย, ธนาคารคนร้าย, เลขบัญชี หรือชื่อผู้เสียหาย..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="input-app"
              style={{ paddingLeft: '42px', height: '44px', width: '100%', fontSize: '14px' }}
            />
          </div>
          <button type="submit" className="btn-app btn-app-primary" style={{ height: '44px', padding: '0 20px' }}>
            <i className="bi bi-search"></i> ค้นหา
          </button>
          {searchCode && (
            <button 
              type="button" 
              onClick={() => {
                setSearchCode('');
                setSearchParams({});
              }} 
              className="btn-app btn-app-outline-gray" 
              style={{ height: '44px' }}
            >
              ล้างคำค้นหา
            </button>
          )}
        </form>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap', fontSize: '12.5px', color: '#6B7280' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>
            <i className="bi bi-lightning-charge-fill" style={{ color: '#D97706', marginRight: '4px' }}></i>
            ตัวอย่างค้นหา:
          </span>
          {[
            { label: 'สุชาติ', type: 'ชื่อคนร้าย' },
            { label: 'กสิกรไทย', type: 'ธนาคารคนร้าย' },
            { label: '123-4-56789-0', type: 'เลขบัญชีม้า' },
            { label: '1234567890123', type: 'เลขบัตรคนร้าย' },
            { label: 'CASE-2026-001', type: 'เลขคดี' }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSearchCode(item.label);
                setSearchParams({ code: item.label });
              }}
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '12px',
                color: '#1E40AF',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={`ค้นหาตาม${item.type}`}
            >
              <span>{item.label}</span>
              <span style={{ color: '#94A3B8', fontSize: '10.5px' }}>({item.type})</span>
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
          overflowX: 'auto'
        }}>
          {[
            { id: 'all', label: 'ทั้งหมด', count: cases.length },
            { id: 'investigating', label: 'กำลังสืบสวน', count: cases.filter(c => c.status === 'investigating' || c.status === 'evidence_review').length },
            { id: 'pending', label: 'รอรับเรื่อง', count: cases.filter(c => c.status === 'pending').length },
            { id: 'resolved', label: 'คลี่คลายแล้ว', count: cases.filter(c => c.status === 'resolved' || c.status === 'closed').length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                background: activeTab === tab.id ? '#1E3A8A' : '#F1F5F9',
                color: activeTab === tab.id ? '#ffffff' : '#4B5563',
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accordion list */}
      {loading ? (
        <div className="card-app" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
          <i className="bi bi-arrow-repeat" style={{ fontSize: '28px', animation: 'spin 1s linear infinite' }}></i>
          <p style={{ marginTop: '10px' }}>กำลังโหลดข้อมูลสถานะคดี...</p>
        </div>
      ) : displayedCases.length === 0 ? (
        <div className="card-app" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px'
          }}>
            <i className="bi bi-search"></i>
          </div>
          <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '8px' }}>
            {searchCode ? `ไม่พบคดีที่ตรงกับคำค้นหา "${searchCode}"` : 'ยังไม่มีข้อมูลคดีในระบบ'}
          </h3>
          <p style={{ fontSize: '13.5px', color: '#6B7280', maxWidth: '440px', margin: '0 auto 20px' }}>
            กรุณาตรวจสอบรหัสคดีใหม่อีกครั้ง หรือกดแจ้งเหตุคดีใหม่เพื่อสร้างรายการแจ้งความ
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {searchCode && (
              <button onClick={() => { setSearchCode(''); setSearchParams({}); }} className="btn-app btn-app-outline-gray">
                ล้างคำค้นหา
              </button>
            )}
            <Link to="/victim/submit-case" className="btn-app btn-app-primary">
              <i className="bi bi-file-earmark-plus"></i> แจ้งเหตุคดีใหม่
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="caseAccordion">
          {displayedCases.map((c) => {
            const isOpen = activeCaseId === c.id;
            const typeObj = CASE_TYPES[c.caseType] || { name: c.caseType, nameEn: 'Scam Case', icon: 'bi-shield-shaded' };
            const currentLogs = timelineLogs[c.id] || [];
            const suspectMatch = getSuspectMatchSummary(c, searchCode);

            return (
              <div 
                key={c.id} 
                className="card-app" 
                style={{ 
                  padding: 0, 
                  overflow: 'hidden', 
                  border: isOpen ? '1.5px solid #2563EB' : '1px solid #E5E7EB',
                  boxShadow: isOpen ? '0 10px 25px rgba(37, 99, 235, 0.08)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Accordion header button */}
                <button 
                  type="button"
                  className="case-toggle" 
                  onClick={() => toggleAccordion(c.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isOpen ? 'linear-gradient(to right, #EFF6FF, #FFFFFF)' : '#FFFFFF',
                    border: 'none',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'background .15s ease'
                  }}
                >
                  <div className="stat-card__icon tint-secondary" style={{ flexShrink: 0, width: '46px', height: '46px', borderRadius: '12px' }}>
                    <i className={`bi ${typeObj.icon || 'bi-shield-fill'}`} style={{ fontSize: '20px' }}></i>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '15px', fontWeight: 600, color: '#1E3A8A', fontFamily: 'monospace' }}>
                        {c.caseCode}
                      </strong>
                      <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: 500 }}>
                        · {typeObj.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span>
                        <i className="bi bi-cash-stack" style={{ marginRight: '4px' }}></i>
                        มูลค่าความเสียหาย <strong style={{ color: '#DC2626' }}>{formatCurrency(c.damageAmount)}</strong>
                      </span>
                      <span>
                        <i className="bi bi-calendar3" style={{ marginRight: '4px' }}></i>
                        แจ้งเมื่อ {formatThaiDate(c.createdAt)}
                      </span>
                      {c.victimName && (
                        <span>
                          <i className="bi bi-person" style={{ marginRight: '4px' }}></i>
                          ผู้แจ้ง: {c.victimName}
                        </span>
                      )}
                    </div>

                    {/* Suspect search match highlight */}
                    {suspectMatch && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#B91C1C',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#DC2626' }}></i>
                          พบข้อมูลคนร้ายตรงกัน: {suspectMatch.type} <strong>{suspectMatch.value}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status pill */}
                  <span className={`status-pill ${
                    c.status === 'investigating' || c.status === 'evidence_review' ? 'status-investigating' : 
                    c.status === 'pending' ? 'status-pending' : 'status-verified'
                  }`} style={{ flexShrink: 0 }}>
                    <span className="dot"></span>
                    {c.status === 'investigating' || c.status === 'evidence_review' ? 'กำลังสืบสวน' : 
                     c.status === 'pending' ? 'รอรับเรื่อง' : 'คลี่คลายแล้ว'}
                  </span>

                  <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'} case-chevron`} style={{ color: isOpen ? '#2563EB' : '#9CA3AF', fontSize: '18px', flexShrink: 0 }}></i>
                </button>

                {/* Accordion body: Timeline & Action Details */}
                {isOpen && (
                  <div className="case-body" style={{ padding: '0 clamp(14px, 3vw, 24px) 24px', display: 'block', maxWidth: '100%', boxSizing: 'border-box' }}>
                    <div style={{ height: '1px', background: '#E5E7EB', margin: '0 0 24px' }}></div>
                    
                    {/* Action banner & buttons */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#F8FAFC',
                      padding: '14px clamp(12px, 2.5vw, 18px)',
                      borderRadius: '12px',
                      marginBottom: '24px',
                      border: '1px solid #E2E8F0',
                      flexWrap: 'wrap',
                      gap: '12px',
                      maxWidth: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                        <span style={{ fontSize: '12.5px', color: '#6B7280', display: 'block' }}>สถานะการดำเนินการปัจจุบัน:</span>
                        <strong style={{ fontSize: '14.5px', color: '#1E3A8A', wordBreak: 'break-word', display: 'block', marginTop: '2px' }}>
                          {c.status === 'investigating' ? 'พนักงานสอบสวนกำลังรวบรวมพยานหลักฐานและตรวจสอบเส้นทางการเงิน' :
                           c.status === 'pending' ? 'เจ้าหน้าที่ได้รับข้อมูลแล้ว อยู่ระหว่างการคัดกรองและส่งต่อชุดสืบสวน' :
                           'คดีนี้ได้รับการคลี่คลายหรือส่งฟ้องศาลแล้ว'}
                        </strong>
                      </div>
                      <div className="case-banner-actions" style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        flexWrap: 'wrap', 
                        alignItems: 'center',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}>
                        <Link to={`/cases/${c.id}`} className="btn-app btn-app-outline btn-app-sm" style={{ maxWidth: '100%' }}>
                          <i className="bi bi-eye"></i> ดูสำนวนคดีฉบับเต็ม
                        </Link>
                        <Link to={`/cases/${c.id}/timeline`} className="btn-app btn-app-primary btn-app-sm" style={{ maxWidth: '100%' }}>
                          <i className="bi bi-clock-history"></i> ประวัติไทม์ไลน์
                        </Link>
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div className="timeline-app">
                      {/* Step 1: Submission */}
                      <div className="timeline-node done">
                        <div className="timeline-node__dot"><i className="bi bi-check-lg"></i></div>
                        <div className="timeline-node__title">ส่งเรื่องแจ้งความสำเร็จ</div>
                        <div className="timeline-node__desc">
                          ผู้เสียหายกรอกข้อมูลและส่งเรื่องผ่านศูนย์สืบสวนคดีฉ้อโกงออนไลน์ (OFIC)
                        </div>
                        <div className="timeline-node__time">{formatThaiDate(c.createdAt, true)}</div>
                      </div>

                      {/* Step 2: Officer Assigned */}
                      <div className={`timeline-node ${c.status !== 'pending' ? 'done' : 'active'}`}>
                        <div className="timeline-node__dot">
                          <i className={`bi ${c.status !== 'pending' ? 'bi-check-lg' : 'bi-hourglass-split'}`}></i>
                        </div>
                        <div className="timeline-node__title">เจ้าหน้าที่รับเรื่องและลงรับในระบบ</div>
                        <div className="timeline-node__desc">
                          {c.assignedOfficerName ? `มอบหมายให้ ${c.assignedOfficerName} เป็นพนักงานสอบสวนผู้รับผิดชอบ` : 'อยู่ระหว่างรอเจ้าหน้าที่ฝ่ายสืบสวนกดรับเรื่อง'}
                        </div>
                        <div className="timeline-node__time">
                          {c.assignedOfficerName ? 'เจ้าหน้าที่รับเรื่องแล้ว' : 'รอเจ้าหน้าที่รับเรื่อง'}
                        </div>
                      </div>

                      {/* Step 3: Evidence verification */}
                      <div className={`timeline-node ${c.status === 'investigating' ? 'active' : c.status === 'resolved' || c.status === 'closed' ? 'done' : ''}`}>
                        <div className="timeline-node__dot">
                          <i className={`bi ${c.status === 'resolved' ? 'bi-check-lg' : 'bi-search'}`}></i>
                        </div>
                        <div className="timeline-node__title">ตรวจสอบหลักฐานและเส้นทางการเงิน</div>
                        <div className="timeline-node__desc">
                          ประสานงานสถาบันการเงินเพื่อขอสเตทเมนต์ ตรวจสอบบัญชีม้า และอายัดบัญชีที่เกี่ยวข้อง
                        </div>
                        <div className="timeline-node__time">
                          {c.status === 'investigating' ? 'กำลังดำเนินการในขั้นตอนนี้' : c.status === 'resolved' ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
                        </div>
                      </div>

                      {/* Step 4: Multi-agency coordination */}
                      <div className={`timeline-node ${c.status === 'resolved' ? 'done' : ''}`}>
                        <div className="timeline-node__dot"><i className="bi bi-diagram-3"></i></div>
                        <div className="timeline-node__title">ประสานงานหน่วยงานและออกหมายเรียก/หมายจับ</div>
                        <div className="timeline-node__desc">
                          ประสาน ปปง., ผู้ให้บริการเครือข่าย หรือแพลตฟอร์ม เพื่อขยายผลดำเนินคดี
                        </div>
                        <div className="timeline-node__time">
                          {c.status === 'resolved' ? 'ดำเนินการแล้ว' : 'รอดำเนินการ'}
                        </div>
                      </div>

                      {/* Step 5: Final conclusion */}
                      <div className={`timeline-node ${c.status === 'resolved' ? 'done' : ''}`}>
                        <div className="timeline-node__dot"><i className="bi bi-flag-fill"></i></div>
                        <div className="timeline-node__title">สรุปผลคดี / ส่งฟ้องดำเนินคดี</div>
                        <div className="timeline-node__desc">
                          {c.status === 'resolved' ? 'ส่งสำนวนต่อพนักงานอัยการ หรือติดตามเงินคืนสำเร็จ' : 'รอดำเนินการหลังจากสืบสวนเสร็จสิ้น'}
                        </div>
                        <div className="timeline-node__time">
                          {c.status === 'resolved' ? 'คดีคลี่คลายแล้ว' : 'รอดำเนินการ'}
                        </div>
                      </div>

                      {/* Dynamic timeline logs from database */}
                      {currentLogs && currentLogs.length > 0 && (
                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #E5E7EB' }}>
                          <strong style={{ fontSize: '13px', color: '#1E3A8A', display: 'block', marginBottom: '12px' }}>
                            <i className="bi bi-journal-text me-1"></i> บันทึกเหตุการณ์เพิ่มเติมจากเจ้าหน้าที่ ({currentLogs.length} รายการ):
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {currentLogs.map((log, idx) => (
                              <div key={log.id || idx} style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ fontSize: '13.5px', color: '#111827' }}>{log.title}</strong>
                                  <span style={{ fontSize: '11px', color: '#6B7280' }}>{formatThaiDate(log.createdAt, true)}</span>
                                </div>
                                {log.description && (
                                  <p style={{ fontSize: '12.5px', color: '#4B5563', margin: '4px 0 2px' }}>{log.description}</p>
                                )}
                                <span style={{ fontSize: '11px', color: '#2563EB' }}>โดย: {log.createdBy}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
