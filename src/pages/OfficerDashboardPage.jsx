import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { TrendChart, CategoryChart } from '../components/charts/DashboardCharts.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency, formatThaiDate } from '../utils/format.js';
import { CASE_TYPES } from '../utils/constants.js';
import { matchCaseWithQuery, getSuspectMatchSummary } from '../utils/searchHelper.js';

export default function OfficerDashboardPage() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || searchParams.get('code') || '';

  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimToast, setClaimToast] = useState('');

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30 วันล่าสุด');

  // Sync with URL query parameter
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || searchParams.get('code') || '';
    if (q && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  const isCaseOwnedByCurrentOfficer = (c) => {
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

  const handleClaimCase = async (caseId) => {
    try {
      const officerId = currentUser?.uid || 'user_o001';
      const officerName = currentUser?.name || currentUser?.displayName || 'ร.ต.อ. พงศกร นิลวรรณ';
      await firebaseService.assignOfficer(caseId, officerId, officerName);

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

      setClaimToast(`รับเรื่องสำเร็จ! คดีนี้ได้ถูกมอบหมายให้ ${officerName} เรียบร้อยแล้ว (สามารถกดรับเรื่องคดีอื่นเพิ่มเติมได้ตลอดเวลา)`);
      setTimeout(() => setClaimToast(''), 4500);
    } catch (err) {
      console.error('Failed to claim case:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = firebaseService.subscribeCases((updatedCases) => {
      setCases(updatedCases);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [casesData, statsData] = await Promise.all([
      firebaseService.getCases(),
      firebaseService.getStats()
    ]);
    setCases(casesData);
    setStats(statsData);
    setLoading(false);
  };

  const filteredCases = cases.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (typeFilter !== 'all' && c.caseType !== typeFilter) return false;
    if (!matchCaseWithQuery(c, search)) return false;
    return true;
  });

  const totalDamage = cases.reduce((sum, c) => sum + (Number(c.damageAmount) || 0), 0);

  return (
    <AppShell>
      {/* CLAIM SUCCESS TOAST */}
      {claimToast && (
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
          <span>{claimToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>แดชบอร์ดภาพรวม</h1>
          <p>ข้อมูลคดีและสถิติการสืบสวนแบบเรียลไทม์</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="btn-app btn-app-outline"
            style={{ paddingRight: '14px' }}
          >
            <option>30 วันล่าสุด</option>
            <option>90 วันล่าสุด</option>
            <option>ปีนี้</option>
          </select>
          <Link to="/officer/reports" className="btn-app btn-app-primary">
            <i className="bi bi-download"></i> ออกรายงาน
          </Link>
        </div>
      </div>

      {/* STAT CARDS (Matched exact markup from blade) */}
      <div className="stats-grid-app">
        {/* Card 1 */}
        <Link to="/officer/cases" className="card-app stat-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div className="stat-card__top">
            <div className="stat-card__icon tint-primary">
              <i className="bi bi-folder2-open"></i>
            </div>
            <span className="stat-card__trend up">
              ดูทั้งหมด <i className="bi bi-chevron-right"></i>
            </span>
          </div>
          <div>
            <div className="stat-card__value">{cases.length || 12}</div>
            <div className="stat-card__label">คดีทั้งหมด</div>
          </div>
        </Link>

        {/* Card 2 */}
        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-secondary">
              <i className="bi bi-people"></i>
            </div>
            <span className="stat-card__trend up">
              <i className="bi bi-arrow-up-short"></i> 3.1%
            </span>
          </div>
          <div>
            <div className="stat-card__value">96</div>
            <div className="stat-card__label">ผู้เสียหายทั้งหมด</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-warning">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <span className="stat-card__trend down">
              <i className="bi bi-arrow-down-short"></i> 2 รายการ
            </span>
          </div>
          <div>
            <div className="stat-card__value">23</div>
            <div className="stat-card__label">หลักฐานรอตรวจสอบ</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-danger">
              <i className="bi bi-cash-coin"></i>
            </div>
            <span className="stat-card__trend flat">เดือนนี้</span>
          </div>
          <div>
            <div className="stat-card__value">{formatCurrency(totalDamage)}</div>
            <div className="stat-card__label">มูลค่าความเสียหายรวม</div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px',
        marginBottom: '24px'
      }}>
        <div className="card-app" style={{ gridColumn: 'span 7' }}>
          <div className="card-app__head">
            <div>
              <h3>แนวโน้มคดีย้อนหลัง 6 เดือน</h3>
              <p>จำนวนคดีที่แจ้งเข้าระบบรายเดือน</p>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <TrendChart />
          </div>
        </div>

        <div className="card-app" style={{ gridColumn: 'span 5' }}>
          <div className="card-app__head">
            <div>
              <h3>สัดส่วนประเภทคดี</h3>
              <p>แบ่งตามรูปแบบการฉ้อโกง</p>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <CategoryChart cases={cases} />
          </div>
        </div>
      </div>

      {/* CASES TABLE */}
      <div className="card-app" id="cases-list">
        <div className="card-app__head" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3>รายการคดีทั้งหมด ({filteredCases.length})</h3>
            <p>ค้นหา ตรวจสอบหลักฐาน และจัดการคดีสืบสวน</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '280px' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
              <input 
                type="text" 
                placeholder="ค้นหาเลขคดี, ชื่อคนร้าย, เลขบัตรคนร้าย, ธนาคาร, เลขบัญชี..."
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

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-app"
              style={{ height: '38px', fontSize: '13px', width: 'auto' }}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอรับเรื่อง</option>
              <option value="investigating">กำลังสืบสวน</option>
              <option value="evidence_review">รอตรวจหลักฐาน</option>
              <option value="resolved">คลี่คลายแล้ว</option>
              <option value="closed">ปิดคดี</option>
            </select>

            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select-app"
              style={{ height: '38px', fontSize: '13px', width: 'auto' }}
            >
              <option value="all">ทุกประเภทคดี</option>
              <option value="call_center">Call Center</option>
              <option value="investment">Investment</option>
              <option value="online_shopping">Shopping</option>
            </select>
          </div>
        </div>

        {/* QUICK SEARCH SUGGESTIONS */}
        <div style={{
          padding: '8px 20px',
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
              onClick={() => setSearch(item.label)}
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

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '24px' }}></i>
            <p style={{ marginTop: '8px' }}>กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-app">
              <thead>
                <tr>
                  <th>รหัสคดี</th>
                  <th>ประเภท</th>
                  <th>ผู้เสียหาย</th>
                  <th>คนร้าย / บัญชีม้า</th>
                  <th>ความเสียหาย</th>
                  <th>สถานะ</th>
                  <th>วันที่แจ้ง</th>
                  <th style={{ textAlign: 'center' }}>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => {
                  const typeObj = CASE_TYPES[c.caseType] || { name: c.caseType, icon: 'bi-shield' };
                  const suspects = Object.values(c.suspects || {});
                  const firstSuspect = suspects[0] || (c.suspect || {});
                  const suspectMatch = getSuspectMatchSummary(c, search);

                  return (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/cases/${c.id}`} style={{ color: '#2563EB', fontWeight: 600, fontFamily: 'monospace' }}>
                          {c.caseCode}
                        </Link>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <i className={`bi ${typeObj.icon}`} style={{ color: '#2563EB' }}></i>
                          {typeObj.nameEn || typeObj.name}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong style={{ fontSize: '13px', display: 'block' }}>{c.victimName || 'ไม่ระบุชื่อ'}</strong>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>{c.victimPhone || '-'}</span>
                        </div>
                      </td>
                      <td>
                        {firstSuspect.bankAccountNumber ? (
                          <div>
                            <span style={{ fontSize: '12.5px', color: '#DC2626', fontWeight: 500, display: 'block' }}>
                              {firstSuspect.bankAccountNumber}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>
                              {firstSuspect.bankName || firstSuspect.name || 'ไม่ระบุ'}
                            </span>
                          </div>
                        ) : firstSuspect.phone ? (
                          <div>
                            <span style={{ fontSize: '12.5px', color: '#F59E0B', fontWeight: 500 }}>
                              {firstSuspect.phone}
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
                              ตรงกับ: {suspectMatch.type} ({suspectMatch.value})
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#111827' }}>
                          {formatCurrency(c.damageAmount)}
                        </strong>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>{formatThaiDate(c.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <Link 
                            to={`/cases/${c.id}`}
                            className="btn-app btn-app-primary btn-app-sm"
                            title="ดูรายละเอียดคดี"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="bi bi-folder-check"></i> ตรวจสอบ
                          </Link>

                          {/* SMART CLAIM & STATUS BUTTON */}
                          {isCaseOwnedByCurrentOfficer(c) ? (
                            <span 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                background: '#DCFCE7', 
                                color: '#16A34A', 
                                border: '1px solid #BBF7D0',
                                padding: '5px 10px', 
                                borderRadius: '8px', 
                                fontSize: '11.5px', 
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                              title="ท่านเป็นผู้ดูแลรับผิดชอบคดีนี้เรียบร้อยแล้ว"
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
                                fontSize: '11.5px',
                                fontWeight: 600,
                                padding: '5px 10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                              }}
                              title="กดเพื่อรับเรื่องและเป็นเจ้าหน้าที่ผู้รับผิดชอบคดีนี้"
                            >
                              <i className="bi bi-person-check-fill"></i> รับเรื่อง
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
                                fontSize: '11.5px',
                                fontWeight: 600,
                                padding: '5px 10px',
                                borderRadius: '8px',
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
      </div>

      <style>{`
        @media (max-width: 991px) {
          .card-app[style*="grid-column: span 7"],
          .card-app[style*="grid-column: span 5"] {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
