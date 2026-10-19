import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency, formatThaiDate } from '../utils/format.js';
import { matchCaseWithQuery } from '../utils/searchHelper.js';

export default function OfficerDuplicatesPage() {
  const [duplicates, setDuplicates] = useState([]);
  const [allCases, setAllCases] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [dupList, casesList] = await Promise.all([
      firebaseService.getDuplicates(),
      firebaseService.getCases()
    ]);
    const caseMap = {};
    casesList.forEach(c => { caseMap[c.id] = c; });
    setDuplicates(dupList);
    setAllCases(caseMap);
  };

  const handleRunScan = () => {
    setScanning(true);
    setScanMessage('กำลังสแกนและเปรียบเทียบข้อมูลเบอร์โทร เลขบัญชี และเว็บไซต์ระหว่างทุกคดีในระบบ...');
    setTimeout(() => {
      const results = firebaseService.runDuplicateDetection();
      setDuplicates(results);
      setScanning(false);
      setScanMessage(`สแกนเสร็จสิ้น! ตรวจพบกลุ่มข้อมูลที่เชื่อมโยงกันทั้งหมด ${results.length} กลุ่ม`);
      setTimeout(() => setScanMessage(''), 4000);
    }, 800);
  };

  const filtered = duplicates.filter(d => {
    if (filterType === 'all') {}
    else if (filterType === 'bank' && d.matchType !== 'bank_account') return false;
    else if (filterType === 'phone' && d.matchType !== 'phone') return false;
    else if (filterType === 'url' && d.matchType !== 'website') return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const qDigits = q.replace(/\D/g, '');

      const matchValue = (d.matchValue || '').toLowerCase();
      const matchTarget = (d.targetName || '').toLowerCase();
      const valueDigits = matchValue.replace(/\D/g, '');

      const directMatch = matchValue.includes(q) || matchTarget.includes(q) || (qDigits.length >= 3 && valueDigits.includes(qDigits));
      if (directMatch) return true;

      // Check linked cases for suspect / victim / caseCode match
      const hasCaseMatch = (d.caseIds || []).some(id => {
        const c = allCases[id];
        if (!c) return false;
        return matchCaseWithQuery(c, q);
      });

      return hasCaseMatch;
    }

    return true;
  });

  const bankCount = duplicates.filter(d => d.matchType === 'bank_account').length;
  const phoneCount = duplicates.filter(d => d.matchType === 'phone').length;
  const urlCount = duplicates.filter(d => d.matchType === 'website').length;

  return (
    <AppShell>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1>ตรวจจับรายการซ้ำ (Duplicate Detection)</h1>
          <p>ข้อมูลคนร้าย บัญชีม้า เบอร์โทรศัพท์ และ URL ที่พบซ้ำกันระหว่างหลายคดี ช่วยเชื่อมโยงเครือข่ายขบวนการฉ้อโกง</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleRunScan}
            disabled={scanning}
            className="btn-app btn-app-primary"
            style={{ height: '42px' }}
          >
            <i className={`bi ${scanning ? 'bi-arrow-repeat spin' : 'bi-radar'}`}></i>
            {scanning ? 'กำลังสแกน...' : 'สแกนซ้ำ'}
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="card-app" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}></i>
            <input 
              type="text" 
              placeholder="ค้นหาเลขบัญชีคนร้าย, เบอร์โทรคนร้าย, ชื่อคนร้าย, URL หรือรหัสคดี..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-app"
              style={{ paddingLeft: '38px', height: '42px', fontSize: '13.5px', width: '100%' }}
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

          <select 
            id="typeFilter" 
            className="select-app"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', height: '42px', fontSize: '13.5px' }}
          >
            <option value="all">ทุกประเภทข้อมูล</option>
            <option value="bank">บัญชีธนาคาร</option>
            <option value="phone">เบอร์โทรศัพท์</option>
            <option value="url">URL / เว็บไซต์</option>
          </select>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#64748B' }}>
          <span style={{ fontWeight: 600, color: '#334155' }}>
            <i className="bi bi-lightning-charge-fill" style={{ color: '#D97706', marginRight: '4px' }}></i>
            ค้นหาข้อมูลคนร้าย:
          </span>
          {[
            { label: '123-4-56789-0', type: 'เลขบัญชีม้า' },
            { label: '081-999-8888', type: 'เบอร์โทรคนร้าย' },
            { label: 'สุชาติ', type: 'ชื่อคนร้าย' },
            { label: 'กสิกรไทย', type: 'ธนาคาร' },
            { label: 'investment-fake-crypto.com', type: 'เว็บไซต์คนร้าย' }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSearch(item.label)}
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '3px 8px',
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
      </div>

      {scanMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          color: '#1E3A8A',
          marginBottom: '20px',
          fontSize: '13.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="bi bi-info-circle-fill" style={{ color: '#2563EB', fontSize: '18px' }}></i>
          <span>{scanMessage}</span>
        </div>
      )}

      {/* 3 STAT CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-danger">
              <i className="bi bi-bank"></i>
            </div>
          </div>
          <div>
            <div className="stat-card__value">{bankCount}</div>
            <div className="stat-card__label">บัญชีธนาคารซ้ำ</div>
          </div>
        </div>

        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-warning">
              <i className="bi bi-telephone"></i>
            </div>
          </div>
          <div>
            <div className="stat-card__value">{phoneCount}</div>
            <div className="stat-card__label">เบอร์โทรซ้ำ</div>
          </div>
        </div>

        <div className="card-app stat-card">
          <div className="stat-card__top">
            <div className="stat-card__icon tint-secondary">
              <i className="bi bi-link-45deg"></i>
            </div>
          </div>
          <div>
            <div className="stat-card__value">{urlCount}</div>
            <div className="stat-card__label">URL ซ้ำ</div>
          </div>
        </div>
      </div>

      {/* DETECTED DUPLICATE LIST */}
      <div className="card-app">
        <div className="card-app__head">
          <div>
            <h3>รายการที่ตรวจพบ ({filtered.length})</h3>
            <p>เรียงตามจำนวนคดีที่เกี่ยวข้องมากที่สุด</p>
          </div>
        </div>

        <div id="dupList">
          {filtered.map((item) => {
            const isBank = item.matchType === 'bank_account';
            const isPhone = item.matchType === 'phone';

            return (
              <div 
                key={item.id}
                className="dup-card"
                data-type={isBank ? 'bank' : isPhone ? 'phone' : 'url'}
              >
                <div className="dup-card__top">
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div className={`stat-card__icon ${isBank ? 'tint-danger' : isPhone ? 'tint-warning' : 'tint-secondary'}`}>
                      <i className={`bi ${isBank ? 'bi-bank' : isPhone ? 'bi-telephone' : 'bi-link-45deg'}`}></i>
                    </div>
                    <div>
                      <div className="dup-card__value">
                        {isBank ? `บัญชีธนาคาร ${item.matchValue}` : isPhone ? `เบอร์โทรศัพท์ ${item.matchValue}` : `URL ${item.matchValue}`}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.targetName} · พบใน {item.caseCount || item.caseIds?.length} คดี
                      </div>
                    </div>
                  </div>

                  {item.totalDamage && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>มูลค่าความเสียหายรวม</span>
                      <strong style={{ fontSize: '16px', color: 'var(--danger)' }}>
                        {formatCurrency(item.totalDamage)}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Linked cases pill links */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    คดีที่ตรวจพบข้อมูลนี้:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(item.caseIds || []).map((cid) => {
                      const cData = allCases[cid];
                      return (
                        <Link 
                          key={cid}
                          to={`/cases/${cid}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            background: '#fff',
                            border: '1px solid var(--border)',
                            fontSize: '12.5px',
                            color: 'var(--secondary)',
                            textDecoration: 'none'
                          }}
                        >
                          <i className="bi bi-folder2"></i>
                          <strong>{cData?.caseCode || cid}</strong>
                          {cData?.victimName && <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px' }}>({cData.victimName})</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
