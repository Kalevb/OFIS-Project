import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency, formatThaiDate } from '../utils/format.js';
import { CASE_TYPES } from '../utils/constants.js';
import { matchCaseWithQuery, getSuspectMatchSummary } from '../utils/searchHelper.js';

export default function OfficerCasesPage() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || searchParams.get('q') || searchParams.get('code') || '';

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScope, setActiveScope] = useState(initialQuery ? 'all' : 'my'); // 'my' = คดีทั้งหมดของฉัน, 'all' = คดีทั้งหมดในระบบ
  const [search, setSearch] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [toastMsg, setToastMsg] = useState('');

  // Sync with URL query parameter
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || searchParams.get('code') || '';
    if (q && q !== search) {
      setSearch(q);
      setActiveScope('all'); // auto expand scope to all when searching from URL/topbar
    }
  }, [searchParams]);

  useEffect(() => {
    loadCases();
    const unsubscribe = firebaseService.subscribeCases((updatedCases) => {
      if (Array.isArray(updatedCases)) {
        setCases(updatedCases);
        setLoading(false);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getCases();
      setCases(data || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCase = async (caseId) => {
    try {
      const officerId = currentUser?.uid || 'user_o001';
      const officerName = currentUser?.name || currentUser?.displayName || 'ร.ต.อ. พงศกร นิลวรรณ';
      await firebaseService.assignOfficer(caseId, officerId, officerName);

      // Update state locally and immediately
      setCases(prev => prev.map(c => {
        if (c.id === caseId) {
          return {
            ...c,
            assignedOfficerId: officerId,
            assignedOfficerName: officerName,
            assignedOfficer: officerName,
            status: c.status === 'pending' ? 'investigating' : c.status,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));

      setToastMsg(`รับเรื่องสำเร็จ! คดีนี้ได้ถูกมอบหมายให้ ${officerName} เรียบร้อยแล้ว (สามารถกดรับเรื่องคดีอื่นเพิ่มเติมได้ตลอดเวลา)`);
      setTimeout(() => setToastMsg(''), 4500);
    } catch (err) {
      console.error('Failed to claim case:', err);
    }
  };

  // Check if a case belongs to current officer
  const isMyCase = (c) => {
    if (!currentUser) return false;
    const uid = currentUser.uid;
    const fbUid = currentUser.fbUid;
    const name = (currentUser.name || currentUser.displayName || '').trim();
    const email = (currentUser.email || '').trim().toLowerCase();

    return Boolean(
      (c.assignedOfficerId && (c.assignedOfficerId === uid || (fbUid && c.assignedOfficerId === fbUid) || (c.assignedOfficerId === 'user_o001' && (email.includes('officer') || name.includes('พงศกร'))))) ||
      (c.assignedOfficerName && name && (c.assignedOfficerName === name || name.includes(c.assignedOfficerName) || c.assignedOfficerName.includes(name))) ||
      (c.assignedOfficer && name && (c.assignedOfficer === name || name.includes(c.assignedOfficer) || c.assignedOfficer.includes(name))) ||
      (c.assignedOfficerEmail && email && c.assignedOfficerEmail.toLowerCase() === email)
    );
  };

  // Base scope filtering
  const scopedCases = cases.filter(c => {
    if (activeScope === 'my') {
      return isMyCase(c);
    }
    return true;
  });

  // Search & Filter (uses matchCaseWithQuery for suspect bank, suspect account, suspect ID card, suspect name, caseCode, victim, etc.)
  const filteredCases = scopedCases.filter(c => {
    const matchesSearch = matchCaseWithQuery(c, search);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.caseType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === 'damageDesc') {
      return (Number(b.damageAmount) || 0) - (Number(a.damageAmount) || 0);
    } else if (sortBy === 'damageAsc') {
      return (Number(a.damageAmount) || 0) - (Number(b.damageAmount) || 0);
    }
    return 0;
  });

  // Counts
  const myTotalCases = cases.filter(isMyCase).length;
  const allTotalCases = cases.length;
  const pendingCount = scopedCases.filter(c => c.status === 'pending').length;
  const investigatingCount = scopedCases.filter(c => c.status === 'investigating' || c.status === 'freezing').length;
  const totalDamage = scopedCases.reduce((acc, c) => acc + (Number(c.damageAmount) || 0), 0);

  return (
    <AppShell>
      {/* TOAST ALERT */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#065F46',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13.5px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: '18px', color: '#34D399' }}></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
            <Link to="/officer/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>แดชบอร์ด</Link>
            <i className="bi bi-chevron-right" style={{ fontSize: '11px' }}></i>
            <span style={{ color: '#2563EB', fontWeight: 500 }}>การสืบสวน</span>
            <i className="bi bi-chevron-right" style={{ fontSize: '11px' }}></i>
            <span>คดีทั้งหมดของฉัน</span>
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <i className="bi bi-person-badge-fill" style={{ color: '#2563EB' }}></i>
            {activeScope === 'my' ? 'คดีทั้งหมดของฉัน (My Cases)' : 'คดีทั้งหมดในระบบ (All Cases)'}
            <span style={{
              fontSize: '13.5px',
              fontWeight: 600,
              background: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
              borderRadius: '20px',
              padding: '2px 12px'
            }}>
              {filteredCases.length} คดี
            </span>
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13.5px' }}>
            {activeScope === 'my'
              ? `รายการคดีฉ้อโกงออนไลน์ที่ ${currentUser?.name || 'ท่าน'} ได้รับมอบหมายให้รับผิดชอบโดยตรง`
              : 'สำนวนคดีฉ้อโกงออนไลน์ทั้งหมดในระบบของศูนย์สืบสวน OFIC'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={loadCases} 
            className="btn-app btn-app-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="รีเฟรชข้อมูลคดีล่าสุด"
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> รีเฟรช
          </button>

          <Link to="/officer/reports" className="btn-app btn-app-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <i className="bi bi-file-earmark-bar-graph"></i> รายงานสถิติ
          </Link>
        </div>
      </div>

      {/* SCOPE SWITCHER TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveScope('my')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeScope === 'my' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            background: activeScope === 'my' ? '#EFF6FF' : '#ffffff',
            color: activeScope === 'my' ? '#1D4ED8' : '#64748B',
            fontWeight: activeScope === 'my' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <i className="bi bi-person-check-fill"></i>
          คดีทั้งหมดของฉัน
          <span style={{
            background: activeScope === 'my' ? '#2563EB' : '#F1F5F9',
            color: activeScope === 'my' ? '#ffffff' : '#64748B',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            {myTotalCases}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveScope('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeScope === 'all' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            background: activeScope === 'all' ? '#EFF6FF' : '#ffffff',
            color: activeScope === 'all' ? '#1D4ED8' : '#64748B',
            fontWeight: activeScope === 'all' ? 700 : 500,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <i className="bi bi-globe"></i>
          คดีทั้งหมดในระบบ
          <span style={{
            background: activeScope === 'all' ? '#2563EB' : '#F1F5F9',
            color: activeScope === 'all' ? '#ffffff' : '#64748B',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700
          }}>
            {allTotalCases}
          </span>
        </button>
      </div>

      {/* KPI METRICS BAR */}
      <div className="stats-grid-app" style={{ marginBottom: '24px' }}>
        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-primary">
              <i className="bi bi-folder2-open"></i>
            </div>
            <span className="stat-card__trend up">
              {activeScope === 'my' ? 'ของฉัน' : 'ทั้งระบบ'}
            </span>
          </div>
          <div>
            <div className="stat-card__value">{scopedCases.length}</div>
            <div className="stat-card__label">
              {activeScope === 'my' ? 'คดีที่ฉันรับผิดชอบ' : 'คดีทั้งหมดในระบบ'}
            </div>
          </div>
        </div>

        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-danger">
              <i className="bi bi-bell-fill"></i>
            </div>
            <span className="stat-card__trend down">รอดำเนินการ</span>
          </div>
          <div>
            <div className="stat-card__value">{pendingCount}</div>
            <div className="stat-card__label">คดีใหม่รอรับเรื่อง</div>
          </div>
        </div>

        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-warning">
              <i className="bi bi-search"></i>
            </div>
            <span className="stat-card__trend up">กำลังดำเนินการ</span>
          </div>
          <div>
            <div className="stat-card__value">{investigatingCount}</div>
            <div className="stat-card__label">อยู่ระหว่างสืบสวน</div>
          </div>
        </div>

        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-secondary">
              <i className="bi bi-cash-stack"></i>
            </div>
            <span className="stat-card__trend flat">รวมมูลค่า</span>
          </div>
          <div>
            <div className="stat-card__value" style={{ fontSize: '20px' }}>
              {formatCurrency(totalDamage)}
            </div>
            <div className="stat-card__label">มูลค่าความเสียหายรวม</div>
          </div>
        </div>
      </div>

      {/* MAIN CASES DATA CARD */}
      <div className="card-app">
        {/* FILTER & SEARCH TOOLBAR */}
        <div className="card-app__head" style={{ flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>
              {activeScope === 'my' ? 'รายการคดีที่ได้รับมอบหมาย' : 'รายการคดีทั้งหมดในระบบ'} ({filteredCases.length})
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B' }}>
              กดปุ่ม "รับเรื่อง" เพื่อรับผิดชอบคดี หรือคลิก "สำนวน" เพื่อดูรายละเอียดฉบับเต็ม
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
              <input 
                type="text" 
                placeholder="ค้นหาเลขคดี, ชื่อคนร้าย, เลขบัตรคนร้าย, ธนาคารคนร้าย, เลขบัญชีม้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-app"
                style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-app"
              style={{ height: '38px', fontSize: '13px', width: 'auto' }}
            >
              <option value="all">ทุกสถานะคดี</option>
              <option value="pending">คดีใหม่ (รอรับเรื่อง)</option>
              <option value="investigating">กำลังสืบสวน</option>
              <option value="evidence_review">รอตรวจหลักฐาน</option>
              <option value="freezing">อายัดบัญชีแล้ว</option>
              <option value="prosecuting">ส่งฟ้องดำเนินคดี</option>
              <option value="resolved">คลี่คลายแล้ว</option>
              <option value="closed">ปิดคดี</option>
            </select>

            {/* Case Type Filter */}
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select-app"
              style={{ height: '38px', fontSize: '13px', width: 'auto' }}
            >
              <option value="all">ทุกประเภทคดี</option>
              <option value="call_center">Call Center Scam</option>
              <option value="investment">Investment Scam</option>
              <option value="online_shopping">Online Shopping Scam</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select-app"
              style={{ height: '38px', fontSize: '13px', width: 'auto' }}
            >
              <option value="newest">วันที่แจ้ง (ล่าสุดก่อน)</option>
              <option value="oldest">วันที่แจ้ง (เก่าสุดก่อน)</option>
              <option value="damageDesc">ความเสียหาย (มากไปน้อย)</option>
              <option value="damageAsc">ความเสียหาย (น้อยไปมาก)</option>
            </select>
          </div>
        </div>

        {/* QUICK SEARCH SUGGESTIONS & SYSTEM SEARCH MATCH BANNER */}
        <div style={{
          padding: '10px 20px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#64748B' }}>
            <span style={{ fontWeight: 600, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <i className="bi bi-lightning-charge-fill" style={{ color: '#D97706' }}></i>
              ค้นหาข้อมูลคนร้ายทันที:
            </span>
            {[
              { label: 'สุชาติ', type: 'ชื่อคนร้าย' },
              { label: 'กสิกรไทย', type: 'ธนาคาร' },
              { label: '123-4-56789-0', type: 'เลขบัญชีม้า' },
              { label: '1234567890123', type: 'เลขบัตรคนร้าย' },
              { label: '081-999-8888', type: 'เบอร์โทรคนร้าย' },
              { label: 'CASE-2026-001', type: 'รหัสคดี' }
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearch(item.label);
                  setActiveScope('all');
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
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

          {search && activeScope === 'my' && (
            <button
              type="button"
              onClick={() => setActiveScope('all')}
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#1D4ED8',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="bi bi-globe"></i>
              ค้นหาในคดีทั้งหมดของระบบ
            </button>
          )}
        </div>

        {/* LOADING & TABLE CONTENT */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '28px', color: '#2563EB' }}></i>
            <p style={{ marginTop: '12px', fontSize: '14px' }}>กำลังโหลดข้อมูลคดี...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 14px' }}>
              <i className="bi bi-folder-x"></i>
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 6px' }}>
              {activeScope === 'my' ? 'ยังไม่มีคดีที่ท่านรับผิดชอบที่ตรงกับเงื่อนไข' : 'ไม่พบคดีที่ตรงกับเงื่อนไขการค้นหา'}
            </h4>
            <p style={{ fontSize: '13px', margin: '0 0 16px', color: '#94A3B8' }}>
              {activeScope === 'my' 
                ? 'ท่านสามารถสลับไปที่แท็บ "คดีทั้งหมดในระบบ" เพื่อกดรับเรื่องคดีใหม่เข้ามาดูแลได้' 
                : 'ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสถานะและประเภทคดี'}
            </p>
            {activeScope === 'my' ? (
              <button
                type="button"
                onClick={() => setActiveScope('all')}
                className="btn-app btn-app-primary btn-app-sm"
              >
                <i className="bi bi-globe"></i> ดูคดีทั้งหมดในระบบเพื่อรับเรื่อง
              </button>
            ) : (
              (search || statusFilter !== 'all' || typeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
                  className="btn-app btn-app-outline btn-app-sm"
                >
                  <i className="bi bi-arrow-counterclockwise"></i> ล้างตัวกรองทั้งหมด
                </button>
              )
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-app">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>รหัสคดี</th>
                  <th style={{ minWidth: '150px' }}>ประเภทคดี</th>
                  <th style={{ minWidth: '170px' }}>ผู้เสียหาย</th>
                  <th style={{ minWidth: '190px' }}>คนร้าย / บัญชีม้า</th>
                  <th style={{ minWidth: '130px' }}>ความเสียหาย</th>
                  <th style={{ width: '130px' }}>สถานะ</th>
                  <th style={{ minWidth: '160px' }}>ผู้รับผิดชอบ</th>
                  <th style={{ textAlign: 'center', width: '190px' }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const typeObj = CASE_TYPES[c.caseType] || { name: c.caseType, nameEn: c.caseType, icon: 'bi-shield' };
                  const suspects = Object.values(c.suspects || {});
                  const firstSuspect = suspects[0] || (c.suspect || {});
                  const suspectMatch = getSuspectMatchSummary(c, search);
                  const isMine = isMyCase(c);

                  return (
                    <tr key={c.id}>
                      {/* CASE CODE */}
                      <td>
                        <Link 
                          to={`/cases/${c.id}`} 
                          style={{
                            color: '#1D4ED8',
                            fontWeight: 700,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            background: '#EFF6FF',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #BFDBFE',
                            display: 'inline-block',
                            textDecoration: 'none'
                          }}
                        >
                          {c.caseNumber || c.caseCode}
                        </Link>
                      </td>

                      {/* CASE TYPE */}
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <i className={`bi ${typeObj.icon}`} style={{ color: '#2563EB' }}></i>
                          <span>{typeObj.nameEn || typeObj.name}</span>
                        </span>
                      </td>

                      {/* VICTIM */}
                      <td>
                        <div>
                          <strong style={{ fontSize: '13px', display: 'block', color: '#111827' }}>
                            {c.victimName || 'ไม่ระบุชื่อ'}
                          </strong>
                          <span style={{ fontSize: '11.5px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="bi bi-telephone" style={{ fontSize: '10px' }}></i> {c.victimPhone || '-'}
                          </span>
                        </div>
                      </td>

                      {/* SUSPECT / MULE ACCOUNT */}
                      <td>
                        {firstSuspect.bankAccountNumber ? (
                          <div>
                            <span style={{ fontSize: '12.5px', color: '#DC2626', fontWeight: 600, display: 'block', fontFamily: 'monospace' }}>
                              <i className="bi bi-credit-card-2-front" style={{ marginRight: '4px' }}></i>
                              {firstSuspect.bankAccountNumber}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>
                              {firstSuspect.bankName || firstSuspect.name || 'ไม่ระบุธนาคาร'}
                            </span>
                          </div>
                        ) : firstSuspect.phone ? (
                          <div>
                            <span style={{ fontSize: '12.5px', color: '#D97706', fontWeight: 600 }}>
                              <i className="bi bi-telephone" style={{ marginRight: '4px' }}></i>
                              {firstSuspect.phone}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6B7280', display: 'block' }}>
                              {firstSuspect.name || 'ไม่ระบุชื่อ'}
                            </span>
                          </div>
                        ) : firstSuspect.name ? (
                          <div>
                            <span style={{ fontSize: '12.5px', color: '#4B5563', fontWeight: 500 }}>
                              {firstSuspect.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>
                        )}

                        {/* Suspect Match Highlight */}
                        {suspectMatch && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#FEF2F2',
                              border: '1px solid #FECACA',
                              color: '#B91C1C',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '10px' }}></i>
                              พบข้อมูลคนร้าย: {suspectMatch.type} ({suspectMatch.value})
                            </span>
                          </div>
                        )}
                      </td>

                      {/* DAMAGE */}
                      <td>
                        <strong style={{ color: '#111827', fontSize: '13.5px' }}>
                          {formatCurrency(c.damageAmount)}
                        </strong>
                      </td>

                      {/* STATUS */}
                      <td>
                        <StatusBadge status={c.status} />
                      </td>

                      {/* ASSIGNED OFFICER */}
                      <td>
                        {c.assignedOfficerName ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '12px',
                            fontWeight: isMine ? 700 : 500,
                            color: isMine ? '#1D4ED8' : '#475569',
                            background: isMine ? '#EFF6FF' : '#F1F5F9',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: isMine ? '1px solid #BFDBFE' : '1px solid #E2E8F0'
                          }}>
                            <i className="bi bi-person-fill"></i>
                            {c.assignedOfficerName}
                          </span>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '12px', fontStyle: 'italic' }}>
                            รอการจัดสรร
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <Link 
                            to={`/cases/${c.id}`}
                            className="btn-app btn-app-primary btn-app-sm"
                            title="ดูสำนวนคดีฉบับเต็ม"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            <i className="bi bi-file-earmark-text"></i> สำนวน
                          </Link>

                          {/* CLAIM BUTTON OR STATUS */}
                          {isMine ? (
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                background: '#DCFCE7', 
                                color: '#16A34A', 
                                border: '1px solid #BBF7D0',
                                padding: '4px 8px', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                              title="ท่านเป็นผู้รับผิดชอบคดีนี้"
                            >
                              <i className="bi bi-check-circle-fill"></i> รับเรื่องแล้ว
                            </span>
                          ) : !c.assignedOfficerId && !c.assignedOfficerName ? (
                            <button
                              type="button"
                              onClick={() => handleClaimCase(c.id)}
                              className="btn-app btn-app-sm"
                              style={{
                                background: '#10B981',
                                color: '#ffffff',
                                border: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '5px 9px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                              }}
                              title="กดเพื่อรับเรื่องและเป็นเจ้าหน้าที่ผู้รับผิดชอบคดีนี้"
                            >
                              <i className="bi bi-person-plus-fill"></i> รับเรื่อง
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleClaimCase(c.id)}
                              className="btn-app btn-app-sm"
                              style={{
                                background: '#4F46E5',
                                color: '#ffffff',
                                border: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '5px 9px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                              }}
                              title={`ปัจจุบันมอบหมายให้: ${c.assignedOfficerName || 'เจ้าหน้าที่ท่านอื่น'} - คลิกเพื่อโอนมารับผิดชอบ`}
                            >
                              <i className="bi bi-arrow-left-right"></i> โอนมารับเรื่อง
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER COUNT BAR */}
        {!loading && filteredCases.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderTop: '1px solid #E2E8F0',
            fontSize: '12.5px',
            color: '#64748B',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              กำลังแสดง <strong>{filteredCases.length}</strong> จาก <strong>{scopedCases.length}</strong> คดี
              {activeScope === 'my' && ` (ของ ${currentUser?.name || 'ท่าน'})`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bi bi-shield-check" style={{ color: '#10B981' }}></i> ระบบกระจายงานสอบสวนอย่างเท่าเทียม
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
