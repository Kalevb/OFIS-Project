import React, { useState, useEffect } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import { TrendChart, StatusBarChart } from '../components/charts/DashboardCharts.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency, formatThaiDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function OfficerReportsPage() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [cases, setCases] = useState([]);
  const [reportRange, setReportRange] = useState('30 วันล่าสุด');
  const [reportType, setReportType] = useState('ทุกประเภทคดี');
  const [reportFormat, setReportFormat] = useState('Excel (.xlsx / .csv)');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [reps, cs] = await Promise.all([
      firebaseService.getReports(),
      firebaseService.getCases()
    ]);
    setReports(reps);
    setCases(cs);
  };

  const handleExportCSV = async () => {
    setGenerating(true);

    try {
      const typeKey = reportType.includes('Call') ? 'call_center' : reportType.includes('Investment') ? 'investment' : reportType.includes('Shopping') ? 'online_shopping' : 'all';
      const filtered = cases.filter(c => {
        if (typeKey !== 'all' && c.caseType !== typeKey) return false;
        return true;
      });

      const headers = ['รหัสคดี', 'ประเภทคดี', 'ชื่อผู้เสียหาย', 'เบอร์โทรผู้เสียหาย', 'วันที่เกิดเหตุ', 'มูลค่าความเสียหาย (บาท)', 'สถานะ', 'ชื่อคนร้าย/บัญชีม้า', 'เลขบัญชีคนร้าย', 'เบอร์โทรคนร้าย', 'แจ้งความ สน.'];
      const rows = filtered.map(c => {
        const suspects = Object.values(c.suspects || {});
        const s = suspects[0] || {};
        return [
          `"${c.caseCode || ''}"`,
          `"${c.caseType || ''}"`,
          `"${c.victimName || ''}"`,
          `"${c.victimPhone || ''}"`,
          `"${c.incidentDate || ''}"`,
          `"${c.damageAmount || 0}"`,
          `"${c.status || ''}"`,
          `"${s.name || ''}"`,
          `"${s.bankAccountNumber || ''}"`,
          `"${s.phone || ''}"`,
          `"${c.policeReportFiled ? `แจ้งแล้ว (${c.policeReportNumber || ''})` : 'ยังไม่แจ้ง'}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `OFIC_Report_${reportRange.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const savedReport = await firebaseService.createReport({
        title: `รายงานสรุปคดี (${reportRange} - ${reportType})`,
        generatedBy: currentUser?.name || 'ร.ต.อ. พงศกร นิลวรรณ',
        dateRangeStart: '2026-07-01',
        dateRangeEnd: '2026-07-31',
        fileFormat: 'CSV / Excel',
        totalCases: filtered.length,
        totalDamage: filtered.reduce((s, c) => s + (Number(c.damageAmount) || 0), 0)
      });

      setReports(prev => [savedReport, ...prev]);
      setSuccessMsg('สร้างและดาวน์โหลดรายงานเรียบร้อยแล้ว');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>รายงาน</h1>
          <p>สร้างและดาวน์โหลดรายงานสรุปคดีตามช่วงเวลาที่ต้องการ</p>
        </div>
      </div>

      {successMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: '#DCFCE7',
          color: '#15803D',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="bi bi-check-circle-fill"></i>
          <span>{successMsg}</span>
        </div>
      )}

      {/* CREATE REPORT CARD */}
      <div className="card-app mb-3" style={{ marginBottom: '20px' }}>
        <div className="card-app__head">
          <div><h3>สร้างรายงานใหม่</h3></div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <select 
            className="select-app" 
            id="reportRange"
            value={reportRange}
            onChange={(e) => setReportRange(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option>7 วันล่าสุด</option>
            <option>30 วันล่าสุด</option>
            <option>90 วันล่าสุด</option>
            <option>ปีนี้</option>
          </select>

          <select 
            className="select-app" 
            id="reportType"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{ width: 'auto', minWidth: '200px' }}
          >
            <option>ทุกประเภทคดี</option>
            <option>Call Center Scam</option>
            <option>Investment Scam</option>
            <option>Online Shopping Scam</option>
          </select>

          <select 
            className="select-app" 
            id="reportFormat"
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option>Excel (.xlsx / .csv)</option>
            <option>PDF</option>
          </select>
        </div>

        <button 
          className="btn-app btn-app-primary" 
          id="generateBtn"
          onClick={handleExportCSV}
          disabled={generating}
        >
          <i className="bi bi-file-earmark-bar-graph"></i> {generating ? 'กำลังสร้างรายงาน...' : 'สร้างรายงาน'}
        </button>
      </div>

      {/* CHARTS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div className="card-app" style={{ gridColumn: 'span 7' }}>
          <div className="card-app__head">
            <div><h3>แนวโน้มคดีย้อนหลัง 6 เดือน</h3></div>
          </div>
          <div style={{ height: '220px' }}>
            <TrendChart />
          </div>
        </div>

        <div className="card-app" style={{ gridColumn: 'span 5' }}>
          <div className="card-app__head">
            <div><h3>สัดส่วนสถานะคดี</h3></div>
          </div>
          <div style={{ height: '220px' }}>
            <StatusBarChart cases={cases} />
          </div>
        </div>
      </div>

      {/* RECENT REPORTS */}
      <div className="card-app">
        <div className="card-app__head">
          <div><h3>รายงานที่สร้างล่าสุด</h3></div>
        </div>

        <div className="table-responsive">
          <table className="table-app">
            <thead>
              <tr>
                <th>ชื่อรายงาน</th>
                <th>ผู้จัดทำ</th>
                <th>จำนวนคดี</th>
                <th>มูลค่าความเสียหาย</th>
                <th>รูปแบบ</th>
                <th>วันที่สร้าง</th>
                <th style={{ textAlign: 'center' }}>ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.title}</strong></td>
                  <td>{r.generatedBy}</td>
                  <td>{r.totalCases} คดี</td>
                  <td><strong style={{ color: 'var(--danger)' }}>{formatCurrency(r.totalDamage)}</strong></td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#2563EB', fontSize: '12px', fontWeight: 600 }}>
                      {r.fileFormat || 'CSV'}
                    </span>
                  </td>
                  <td>{formatThaiDate(r.createdAt, true)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={handleExportCSV}
                      className="btn-app btn-app-outline-gray btn-app-sm"
                      title="ดาวน์โหลดไฟล์อีกครั้ง"
                    >
                      <i className="bi bi-download"></i> ดาวน์โหลด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
