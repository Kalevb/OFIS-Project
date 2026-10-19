import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency, formatThaiDate } from '../utils/format.js';
import { CASE_TYPES } from '../utils/constants.js';
import { matchCaseWithQuery, getSuspectMatchSummary } from '../utils/searchHelper.js';

export default function VictimDashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, investigating, pending, resolved
  const [searchQuery, setSearchQuery] = useState('');

  const isVictimCase = (c, user) => {
    if (!user) return true;
    const uid = user.uid;
    const fbUid = user.fbUid;
    const email = (user.email || '').toLowerCase().trim();
    const phone = (user.phone || '').replace(/\D/g, '');
    const name = (user.name || user.displayName || '').toLowerCase().trim();

    // 1. Direct UID match
    if (c.victimId && (c.victimId === uid || (fbUid && c.victimId === fbUid))) return true;
    // 2. Email match
    if (email && c.victimEmail && c.victimEmail.toLowerCase().trim() === email) return true;
    // 3. Phone match
    if (phone && c.victimPhone && c.victimPhone.replace(/\D/g, '') === phone) return true;
    // 4. Name match
    if (name && c.victimName && (c.victimName.toLowerCase().trim() === name || name.includes(c.victimName.toLowerCase().trim()))) return true;
    // 5. Default demo fallback for somchai
    if ((email === 'somchai@example.com' || uid === 'user_v001') && c.victimId === 'user_v001') return true;

    return false;
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Instant load from local memory/cache without blocking
    const fetchCases = async () => {
      try {
        const allCases = await firebaseService.getCases();
        if (!isMounted) return;
        const myCases = allCases.filter(c => isVictimCase(c, currentUser));
        // If current victim has no cases yet, fallback to all cases if they want to explore or test
        setCases(myCases);
      } catch (err) {
        console.warn('[VictimDashboard] Load notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCases();

    // 2. Real-time subscription to instantly reflect status changes from officers
    const unsubscribe = firebaseService.subscribeCases ? firebaseService.subscribeCases((allCases) => {
      if (!isMounted || !Array.isArray(allCases)) return;
      const myCases = allCases.filter(c => isVictimCase(c, currentUser));
      setCases(myCases);
      setLoading(false);
    }) : null;

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser]);

  const totalDamage = cases.reduce((acc, c) => acc + (Number(c.damageAmount) || 0), 0);
  const activeCases = cases.filter(c => c.status === 'investigating' || c.status === 'evidence_review').length;
  const pendingCases = cases.filter(c => c.status === 'pending').length;
  const resolvedCases = cases.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  const filteredCases = cases.filter(c => {
    if (activeTab === 'investigating' && !(c.status === 'investigating' || c.status === 'evidence_review')) return false;
    if (activeTab === 'pending' && c.status !== 'pending') return false;
    if (activeTab === 'resolved' && !(c.status === 'resolved' || c.status === 'closed')) return false;

    if (!matchCaseWithQuery(c, searchQuery)) return false;
    return true;
  });

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: '12px', marginBottom: '8px' }}>
            <i className="bi bi-person-check-fill"></i> พอร์ทัลผู้เสียหายและประชาชน
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1E3A8A' }}>แดชบอร์ดผู้เสียหาย</h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            ยินดีต้อนรับคุณ <strong style={{ color: '#1E293B' }}>{currentUser?.name || currentUser?.displayName || 'ผู้เสียหาย'}</strong> — ภาพรวมและสถานะคดีที่คุณแจ้งไว้
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/victim/submit-case" className="btn-app btn-app-primary">
            <i className="bi bi-file-earmark-plus"></i>
            แจ้งเหตุคดีใหม่
          </Link>
          <Link to="/victim/track-status" className="btn-app btn-app-outline">
            <i className="bi bi-search"></i>
            ค้นหารหัสคดี
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="stats-grid-app" style={{ marginBottom: '24px' }}>
        <div className="card-app" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0
          }}>
            <i className="bi bi-folder2-open"></i>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>คดีที่แจ้งทั้งหมด</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
              {cases.length} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748B' }}>คดี</span>
            </div>
          </div>
        </div>

        <div className="card-app" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0
          }}>
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>กำลังดำเนินการสืบสวน</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706' }}>
              {activeCases} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748B' }}>คดี</span>
            </div>
          </div>
        </div>

        <div className="card-app" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(22, 163, 74, 0.1)',
            color: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0
          }}>
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>คลี่คลาย / ปิดคดีแล้ว</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A' }}>
              {resolvedCases} <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748B' }}>คดี</span>
            </div>
          </div>
        </div>

        <div className="card-app" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0
          }}>
            <i className="bi bi-cash-coin"></i>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>มูลค่าความเสียหายรวม</span>
            <div style={{ fontSize: '21px', fontWeight: 700, color: '#DC2626' }}>
              {formatCurrency(totalDamage)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Cases Table Card */}
      <div className="card-app" style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
              รายการคดีของฉัน ({cases.length})
            </h3>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              คลิกที่รหัสคดีหรือปุ่มติดตามเพื่อดูความคืบหน้าและบันทึกของเจ้าหน้าที่แบบเรียลไทม์
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '14px' }}></i>
              <input 
                type="text" 
                placeholder="ค้นหาเลขคดี, ชื่อคนร้าย, เลขบัตร, ธนาคาร, เลขบัญชี..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-app"
                style={{ paddingLeft: '34px', height: '38px', fontSize: '13px', width: '100%' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
            <Link to="/victim/track-status" className="btn-app btn-app-outline btn-app-sm">
              <i className="bi bi-clock-history"></i> ไทม์ไลน์รวม
            </Link>
          </div>
        </div>

        {/* QUICK SEARCH SUGGESTIONS */}
        <div style={{
          padding: '8px 24px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: '#64748B'
        }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>
            <i className="bi bi-lightning-charge-fill" style={{ color: '#D97706', marginRight: '4px' }}></i>
            ค้นหาคนร้ายทันที:
          </span>
          {[
            { label: 'สุชาติ', type: 'ชื่อคนร้าย' },
            { label: 'กสิกรไทย', type: 'ธนาคาร' },
            { label: '123-4-56789-0', type: 'เลขบัญชีม้า' },
            { label: '1234567890123', type: 'เลขบัตรคนร้าย' },
            { label: 'CASE-2026-001', type: 'เลขคดี' }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSearchQuery(item.label)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11.5px',
                color: '#1E40AF',
                cursor: 'pointer'
              }}
              title={`ค้นหาตาม${item.type}`}
            >
              {item.label} <span style={{ color: '#94A3B8', fontSize: '10px' }}>({item.type})</span>
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        {cases.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            overflowX: 'auto'
          }}>
            {[
              { id: 'all', label: 'ทั้งหมด', count: cases.length },
              { id: 'investigating', label: 'กำลังสืบสวน', count: activeCases },
              { id: 'pending', label: 'รอรับเรื่อง', count: pendingCases },
              { id: 'resolved', label: 'คลี่คลายแล้ว', count: resolvedCases }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none',
                  background: activeTab === tab.id ? '#1E3A8A' : '#FFFFFF',
                  color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: activeTab === tab.id ? '0 2px 6px rgba(30, 58, 138, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#94A3B8' }}>
            <i className="bi bi-arrow-repeat" style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }}></i>
            <p style={{ marginTop: '8px', fontSize: '13.5px' }}>กำลังโหลดข้อมูลคดี...</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ padding: '40px 24px' }}>
            <EmptyState 
              icon="bi-file-earmark-plus"
              title="ยังไม่มีรายการแจ้งเหตุของคุณ"
              description="คุณยังไม่ได้แจ้งเหตุคดีฉ้อโกงออนไลน์ หรือหากท่านเพิ่งลงทะเบียน สามารถกดปุ่มแจ้งเหตุเพื่อส่งเรื่องต่อพนักงานสอบสวนได้ทันที"
              actionText="แจ้งเหตุคดีแรกของคุณ"
              onAction={() => navigate('/victim/submit-case')}
            />
          </div>
        ) : filteredCases.length === 0 ? (
          <div style={{ padding: '36px 24px', textAlign: 'center', color: '#64748B' }}>
            <i className="bi bi-search" style={{ fontSize: '24px', color: '#CBD5E1', display: 'block', marginBottom: '8px' }}></i>
            <p style={{ fontSize: '14px', margin: 0 }}>ไม่พบคดีในหมวดนี้ที่ตรงกับเงื่อนไขการค้นหา</p>
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="btn-app btn-app-outline btn-app-sm"
                style={{ marginTop: '12px' }}
              >
                ล้างคำค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-app">
              <thead>
                <tr>
                  <th>รหัสคดี</th>
                  <th>ประเภทคดี</th>
                  <th>วันที่เกิดเหตุ</th>
                  <th>มูลค่าความเสียหาย</th>
                  <th>เจ้าหน้าที่ผู้รับผิดชอบ</th>
                  <th>สถานะ</th>
                  <th>วันที่แจ้ง</th>
                  <th style={{ textAlign: 'center' }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const typeObj = CASE_TYPES[c.caseType] || { name: c.caseType || 'คดีทั่วไป', icon: 'bi-shield-shaded' };
                  const suspectMatch = getSuspectMatchSummary(c, searchQuery);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong style={{ color: '#2563EB', fontFamily: 'monospace', fontSize: '14px', display: 'block' }}>
                          {c.caseCode || c.caseNumber}
                        </strong>
                        {suspectMatch && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#B91C1C',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            marginTop: '3px'
                          }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '10px' }}></i>
                            ตรงกับ: {suspectMatch.type} ({suspectMatch.value})
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <i className={`bi ${typeObj.icon || 'bi-shield'}`} style={{ color: '#2563EB' }}></i>
                          {typeObj.nameEn || typeObj.name}
                        </span>
                      </td>
                      <td>{formatThaiDate(c.incidentDate)}</td>
                      <td>
                        <strong style={{ color: '#DC2626' }}>
                          {formatCurrency(c.damageAmount)}
                        </strong>
                      </td>
                      <td>
                        {c.assignedOfficer ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1E293B' }}>
                            <i className="bi bi-person-badge text-primary"></i>
                            {c.assignedOfficer}
                          </span>
                        ) : (
                          <span style={{ color: '#D97706', fontSize: '12px', background: '#FEF3C7', padding: '2px 8px', borderRadius: '6px', fontWeight: 500 }}>
                            รอรับเรื่อง
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>{formatThaiDate(c.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link 
                            to={`/cases/${c.id}`}
                            className="btn-app btn-app-outline-gray btn-app-sm"
                            title="ดูรายละเอียดสำนวนคดี"
                          >
                            <i className="bi bi-eye"></i> ดูสำนวน
                          </Link>
                          <Link 
                            to={`/cases/${c.id}/timeline`}
                            className="btn-app btn-app-primary btn-app-sm"
                            title="ดูไทม์ไลน์ความคืบหน้า"
                          >
                            <i className="bi bi-clock-history"></i> ไทม์ไลน์
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security notice and guidance */}
      <div style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        border: '1px solid #BFDBFE',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#2563EB',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0
          }}>
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <strong style={{ color: '#1E3A8A', fontSize: '15px', display: 'block' }}>
              ต้องการความช่วยเหลือด่วน หรือปรึกษาเจ้าหน้าที่?
            </strong>
            <span style={{ fontSize: '13px', color: '#4B5563' }}>
              โทรสายด่วนสำนักงานตำรวจแห่งชาติ 1441 (ศูนย์ AOC 1441 ให้บริการตลอด 24 ชั่วโมง)
            </span>
          </div>
        </div>
        <a 
          href="tel:1441" 
          className="btn-app btn-app-primary"
          style={{ height: '42px', padding: '0 18px', background: '#1E3A8A', textDecoration: 'none' }}
        >
          <i className="bi bi-telephone-fill"></i> โทร 1441 ทันที
        </a>
      </div>
    </AppShell>
  );
}
