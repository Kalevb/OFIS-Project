import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatThaiDate } from '../utils/format.js';

export default function EvidenceDetailPage() {
  const { caseId, evidenceId } = useParams();
  const { isOfficer } = useAuth();
  const navigate = useNavigate();

  const [evidence, setEvidence] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    loadEvidence();
  }, [caseId, evidenceId]);

  const loadEvidence = async () => {
    const targetCaseId = caseId || 'case_001';
    const [c, list] = await Promise.all([
      firebaseService.getCaseById(targetCaseId),
      firebaseService.getEvidence(targetCaseId)
    ]);
    setCaseData(c);
    const target = list.find(e => e.id === evidenceId) || list[0] || {
      id: 'evd_001_001',
      fileName: 'สลิปโอนเงิน.jpg',
      fileType: 'image/jpeg',
      fileSize: '1.2 MB',
      verificationStatus: 'pending',
      uploadedAt: '2026-07-27T14:18:00Z',
      note: ''
    };
    setEvidence(target);
    setNote(target.note || '');
  };

  const handleUpdateStatus = async (newStatus) => {
    setSaving(true);
    const targetCaseId = caseId || 'case_001';
    await firebaseService.updateEvidenceStatus(targetCaseId, evidence.id, newStatus, note);
    setAlertMsg(`ปรับปรุงสถานะหลักฐานเป็น "${newStatus === 'verified' ? 'ยืนยันความถูกต้อง' : 'ปฏิเสธหลักฐาน'}" สำเร็จ`);
    setSaving(false);
    loadEvidence();
    setTimeout(() => setAlertMsg(''), 4000);
  };

  if (!evidence) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <i className="bi bi-arrow-repeat spin" style={{ fontSize: '30px', color: 'var(--secondary)' }}></i>
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลหลักฐาน...</p>
        </div>
      </AppShell>
    );
  }

  const isVerified = evidence.verificationStatus === 'verified';
  const isRejected = evidence.verificationStatus === 'rejected';

  return (
    <AppShell>
      {/* Page Header matching evidence-detail.blade.php */}
      <div className="page-header">
        <div>
          <Link 
            to={caseId ? `/cases/${caseId}` : '/case-detail'} 
            style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}
          >
            <i className="bi bi-arrow-left"></i> กลับไปคดี {caseData?.caseCode || 'FR-2026-0231'}
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {evidence.fileName}
            <span 
              className={`status-pill ${isVerified ? 'status-verified' : isRejected ? 'status-rejected' : 'status-investigating'}`}
              id="evidenceStatusPill"
            >
              <span className="dot"></span>
              {isVerified ? 'ยืนยันแล้ว' : isRejected ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
            </span>
          </h1>
          <p>
            คดี {caseData?.caseCode || 'FR-2026-0231'} · อัปโหลดโดย {caseData?.victimName || 'คุณสมชาย ใจดี'} · {formatThaiDate(evidence.uploadedAt, true)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }} id="evidenceActions">
          <button 
            className="btn-app btn-app-danger" 
            id="rejectBtn"
            onClick={() => handleUpdateStatus('rejected')}
            disabled={saving}
          >
            <i className="bi bi-x-lg"></i> ปฏิเสธ
          </button>
          <button 
            className="btn-app btn-app-primary" 
            id="verifyBtn"
            onClick={() => handleUpdateStatus('verified')}
            disabled={saving}
          >
            <i className="bi bi-check-lg"></i> ยืนยันหลักฐาน
          </button>
        </div>
      </div>

      {alertMsg && (
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
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Row with Preview and Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px'
      }}>
        {/* Left Preview Box */}
        <div className="card-app" style={{ gridColumn: 'span 7', padding: 0, overflow: 'hidden' }}>
          <div style={{
            background: '#0d1a45',
            padding: '60px 24px',
            textAlign: 'center',
            minHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {evidence.downloadUrl && (evidence.fileType?.includes('image') || evidence.downloadUrl.startsWith('data:image') || evidence.downloadUrl.includes('.png') || evidence.downloadUrl.includes('.jpg')) ? (
              <img 
                src={evidence.downloadUrl.startsWith('blob:') ? '/images/landingpicture.png' : evidence.downloadUrl} 
                alt={evidence.fileName}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/landingpicture.png';
                }}
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', objectFit: 'contain' }} 
              />
            ) : (
              <>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <i className="bi bi-receipt" style={{ fontSize: '30px', color: '#fff' }}></i>
                </div>
                <p style={{ color: 'rgba(219,228,255,.8)', fontSize: '13px', margin: 0 }}>ตัวอย่างไฟล์หลักฐาน (พรีวิว)</p>
                <p style={{ color: 'rgba(219,228,255,.5)', fontSize: '12px', marginTop: '4px' }}>
                  {evidence.fileName} · {evidence.fileSize || '1.2 MB'}
                </p>
              </>
            )}
          </div>
          <div style={{ padding: '18px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              อัปโหลดเมื่อ {formatThaiDate(evidence.uploadedAt, true)}
            </span>
            {evidence.downloadUrl && (
              <a 
                href={evidence.downloadUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-app btn-app-outline-gray btn-app-sm"
              >
                <i className="bi bi-box-arrow-up-right"></i> เปิดไฟล์ต้นฉบับ
              </a>
            )}
          </div>
        </div>

        {/* Right Details Box */}
        <div className="card-app" style={{ gridColumn: 'span 5' }}>
          <div className="card-app__head">
            <div><h3>ข้อมูลหลักฐาน</h3></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <span className="form-label-app" style={{ color: 'var(--text-secondary)' }}>ประเภทไฟล์</span>
              <strong style={{ fontSize: '14px' }}>{evidence.fileType || 'image/jpeg'}</strong>
            </div>
            <div>
              <span className="form-label-app" style={{ color: 'var(--text-secondary)' }}>ขนาดไฟล์</span>
              <strong style={{ fontSize: '14px' }}>{evidence.fileSize || '1.2 MB'}</strong>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label-app">หมายเหตุการตรวจสอบ</label>
            <textarea 
              className="textarea-app"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="บันทึกผลการตรวจสอบ เช่น สลิปมี QR Code ตรวจสอบตรงกับธนาคาร..."
            />
          </div>

          <button 
            className="btn-app btn-app-primary"
            style={{ width: '100%', marginBottom: '20px' }}
            onClick={() => handleUpdateStatus(evidence.verificationStatus || 'verified')}
            disabled={saving}
          >
            <i className="bi bi-save"></i> บันทึกหมายเหตุ
          </button>

          <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12.5px' }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text)' }}>คำแนะนำในการตรวจสอบ:</strong>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <li>สลิปโอนเงินต้องแสดงเลขบัญชี วันที่ เวลา และยอดเงินชัดเจน</li>
              <li>หากมี QR Code ให้สแกนตรวจสอบกับธนาคารต้นทาง</li>
              <li>ตรวจสอบว่าเลขบัญชีผู้รับตรงกับรายชื่อคนร้ายในระบบตรวจจับความซ้ำหรือไม่</li>
            </ul>
          </div>
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
