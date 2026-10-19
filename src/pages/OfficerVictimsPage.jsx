import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatNationalId, formatCurrency } from '../utils/format.js';
import { matchCaseWithQuery } from '../utils/searchHelper.js';

export default function OfficerVictimsPage() {
  const [victims, setVictims] = useState([]);
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allUsers, allCases] = await Promise.all([
      firebaseService.getUsers(),
      firebaseService.getCases()
    ]);
    const victimList = allUsers.filter(u => u.role === 'victim');
    setVictims(victimList);
    setCases(allCases);
    setLoading(false);
  };

  const filtered = victims.filter(v => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');

    // 1. Direct victim info match
    const victimName = (v.name || '').toLowerCase();
    const victimPhone = (v.phone || '');
    const victimEmail = (v.email || '').toLowerCase();
    const victimIdCard = (v.victimProfile?.nationalId || v.nationalId || '');

    if (victimName.includes(q)) return true;
    if (victimEmail.includes(q)) return true;
    if (victimPhone.includes(q) || (qDigits.length >= 3 && victimPhone.replace(/\D/g, '').includes(qDigits))) return true;
    if (victimIdCard.includes(q) || (qDigits.length >= 4 && victimIdCard.replace(/\D/g, '').includes(qDigits))) return true;

    // 2. Suspect & Case match: Find victims who were scammed by this suspect
    const userCases = cases.filter(c => c.victimId === v.uid || c.victimPhone === v.phone || (v.email && c.victimEmail === v.email));
    const hasSuspectOrCaseMatch = userCases.some(c => matchCaseWithQuery(c, search));
    if (hasSuspectOrCaseMatch) return true;

    return false;
  });

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>รายชื่อผู้เสียหายทั้งหมด</h1>
          <p>ข้อมูลผู้เสียหายที่ได้ลงทะเบียนหรือแจ้งความในระบบ พร้อมประวัติการแจ้งเหตุและค้นหาตามข้อมูลคนร้ายที่เกี่ยวข้อง</p>
        </div>
      </div>

      <div className="card-app">
        <div className="card-app-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', minWidth: '320px', flex: '1 1 320px' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อผู้เสียหาย, เลขบัตร, หรือคนร้าย (เลขบัญชี, ชื่อคนร้าย, ธนาคาร)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-app"
              style={{ paddingLeft: '38px', height: '40px', fontSize: '13px', width: '100%' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            แสดงทั้งหมด {filtered.length} คน
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#6B7280' }}>
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '24px' }}></i>
            <p style={{ marginTop: '8px' }}>กำลังโหลดรายชื่อผู้เสียหาย...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-app">
              <thead>
                <tr>
                  <th>ชื่อ - นามสกุล</th>
                  <th>เลขบัตรประชาชน</th>
                  <th>เบอร์โทรศัพท์</th>
                  <th>อีเมล</th>
                  <th>จำนวนคดีที่แจ้ง</th>
                  <th>มูลค่าเสียหายรวม</th>
                  <th style={{ textAlign: 'center' }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const userCases = cases.filter(c => c.victimId === v.uid || c.victimPhone === v.phone);
                  const totalDamage = userCases.reduce((sum, c) => sum + (Number(c.damageAmount) || 0), 0);

                  return (
                    <tr key={v.uid}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '13px'
                          }}>
                            {v.name ? v.name.slice(0, 2) : 'ผส'}
                          </div>
                          <strong>{v.name}</strong>
                        </div>
                      </td>
                      <td>{formatNationalId(v.victimProfile?.nationalId) || '-'}</td>
                      <td>{v.phone || '-'}</td>
                      <td>{v.email || '-'}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: userCases.length > 0 ? '#DBEAFE' : '#F3F4F6',
                          color: userCases.length > 0 ? '#1E40AF' : '#6B7280',
                          fontSize: '12.5px',
                          fontWeight: 600
                        }}>
                          {userCases.length} คดี
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#DC2626' }}>
                          {formatCurrency(totalDamage)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Link 
                          to={`/officer/dashboard?search=${encodeURIComponent(v.name)}`}
                          className="btn-app btn-app-outline btn-app-sm"
                        >
                          <i className="bi bi-folder2-open"></i> ดูคดีทั้งหมด
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
