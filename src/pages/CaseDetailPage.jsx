import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency, formatThaiDate } from '../utils/format.js';
import { CASE_TYPES } from '../utils/constants.js';

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const { currentUser, isOfficer } = useAuth();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, victim, suspect, evidence, timeline
  const [statusVal, setStatusVal] = useState('investigating');
  const [officerNote, setOfficerNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusAlert, setStatusAlert] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const getEvidenceSrc = (ev) => {
    if (!ev) return '/images/landingpicture.png';
    if (ev.downloadUrl && (ev.downloadUrl.startsWith('data:') || ev.downloadUrl.startsWith('http') || ev.downloadUrl.startsWith('/'))) {
      if (ev.downloadUrl.startsWith('blob:')) {
        const name = (ev.fileName || '').toLowerCase();
        if (name.includes('landingpicture')) return '/images/landingpicture.png';
        if (name.includes('slip') || name.includes('สลิป')) return '/images/landingpicture.png';
        if (name.includes('chat') || name.includes('แชท')) return '/images/landingpicture.png';
        return '/images/landingpicture.png';
      }
      return ev.downloadUrl;
    }
    const name = (ev.fileName || '').toLowerCase();
    if (name.includes('landingpicture')) return '/images/landingpicture.png';
    if (name.includes('slip') || name.includes('สลิป')) return '/images/landingpicture.png';
    if (name.includes('chat') || name.includes('แชท')) return '/images/landingpicture.png';
    return '/images/landingpicture.png';
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    const targetCaseId = caseId || 'case_001';
    const data = await firebaseService.getCaseById(targetCaseId);
    if (data) {
      setCaseData(data);
      setStatusVal(data.status);
      const [ev, tl] = await Promise.all([
        firebaseService.getEvidence(targetCaseId),
        firebaseService.getTimeline(targetCaseId)
      ]);
      setEvidenceList(ev);
      setTimeline(tl);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusVal) return;
    setSavingStatus(true);
    const targetCaseId = caseId || 'case_001';
    await firebaseService.updateCaseStatus(targetCaseId, statusVal, officerNote, currentUser?.name);
    setStatusAlert(`บันทึกสถานะคดีเรียบร้อยแล้ว`);
    setOfficerNote('');
    setSavingStatus(false);
    setTimeout(() => setStatusAlert(''), 4000);
    loadCase();
  };

  if (!caseData) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <i className="bi bi-arrow-repeat spin" style={{ fontSize: '32px', color: 'var(--secondary)' }}></i>
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลคดี...</p>
        </div>
      </AppShell>
    );
  }

  const typeObj = CASE_TYPES[caseData.caseType] || { name: caseData.caseType, nameEn: 'Call Center Scam', icon: 'bi-telephone-fill' };
  const suspects = Object.values(caseData.suspects || {});

  return (
    <AppShell>
      {/* PAGE HEADER MATCHING case-detail.blade.php */}
      <div className="page-header">
        <div>
          <Link 
            to={isOfficer ? "/officer/dashboard" : "/victim/dashboard"} 
            style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}
          >
            <i className="bi bi-arrow-left"></i> กลับไปหน้าแดชบอร์ด
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            คดี {caseData.caseNumber || caseData.caseCode}
            <span className="status-pill status-investigating" id="statusPillHead">
              <span className="dot"></span>
              {caseData.status === 'pending' ? 'คดีใหม่' : caseData.status === 'investigating' ? 'กำลังสืบสวน' : caseData.status === 'evidence_review' ? 'ยืนยันหลักฐานแล้ว' : 'ปิดคดี'}
            </span>
          </h1>
          {caseData.title && caseData.title !== caseData.description && (
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginTop: '4px', marginBottom: '4px' }}>
              {caseData.title}
            </div>
          )}
          <p>
            {typeObj.nameEn || typeObj.name} · แจ้งเมื่อ {formatThaiDate(caseData.createdAt)} โดย {caseData.victimName}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-app btn-app-outline" onClick={() => window.print()}>
            <i className="bi bi-printer"></i> พิมพ์รายงาน
          </button>
          {isOfficer && (
            <>
              <select 
                className="select-app" 
                id="statusSelect"
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                style={{ width: 'auto', height: '44px' }}
              >
                <option value="pending">คดีใหม่</option>
                <option value="investigating">กำลังสืบสวน</option>
                <option value="evidence_review">ยืนยันหลักฐานแล้ว</option>
                <option value="closed">ปิดคดี</option>
              </select>
              <button 
                className="btn-app btn-app-primary" 
                id="saveStatusBtn"
                onClick={handleUpdateStatus}
                disabled={savingStatus}
              >
                <i className="bi bi-check-lg"></i> บันทึกสถานะ
              </button>
            </>
          )}
        </div>
      </div>

      {statusAlert && (
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
          <span>{statusAlert}</span>
        </div>
      )}

      {/* ROW WITH TABS AND SIDEBAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px'
      }}>
        {/* Main Content Area (8 cols) */}
        <div style={{ gridColumn: 'span 8' }}>
          <div className="card-app">
            <div className="tabs-app">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                ภาพรวม
              </button>
              <button 
                className={`tab-btn ${activeTab === 'victim' ? 'active' : ''}`}
                onClick={() => setActiveTab('victim')}
              >
                ผู้เสียหาย
              </button>
              <button 
                className={`tab-btn ${activeTab === 'suspect' ? 'active' : ''}`}
                onClick={() => setActiveTab('suspect')}
              >
                ผู้ต้องสงสัย
              </button>
              <button 
                className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
                onClick={() => setActiveTab('evidence')}
              >
                หลักฐาน
              </button>
              <button 
                className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                ไทม์ไลน์
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                <div className="field-grid" style={{ marginBottom: '20px' }}>
                  <div>
                    <label className="form-label-app">ประเภทคดี</label>
                    <p style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--text)' }}>
                      {typeObj.nameEn || typeObj.name}
                    </p>
                  </div>
                  <div>
                    <label className="form-label-app">วันที่เกิดเหตุ</label>
                    <p style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--text)' }}>
                      {formatThaiDate(caseData.incidentDate)}
                    </p>
                  </div>
                  <div>
                    <label className="form-label-app">มูลค่าความเสียหาย</label>
                    <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--danger)' }}>
                      {formatCurrency(caseData.damageAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="form-label-app">สถานะการแจ้งความ</label>
                    <p style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--text)' }}>
                      {caseData.policeReportFiled ? `แจ้งความแล้ว (บันทึกประจำวันเลขที่ ${caseData.policeReportNumber || '245/2569'})` : 'ยังไม่ได้แจ้งความ'}
                    </p>
                  </div>
                </div>

                <label className="form-label-app">รายละเอียดเหตุการณ์</label>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
                  {caseData.description}
                </p>

                {/* Duplicate notice box */}
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(245,158,11,.35)',
                  background: 'rgba(245,158,11,.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--warning)', fontSize: '20px' }}></i>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#92400E', display: 'block' }}>ตรวจพบข้อมูลเชื่อมโยงกับคดีอื่น</strong>
                      <span style={{ fontSize: '12px', color: '#B45309' }}>พบเบอร์โทรและบัญชีธนาคารคนร้ายตรงกับคดีในระบบ</span>
                    </div>
                  </div>
                  <Link to="/officer/duplicates" className="btn-app btn-app-outline btn-app-sm">
                    ดูความเชื่อมโยง
                  </Link>
                </div>
              </div>
            )}

            {/* TAB: VICTIM */}
            {activeTab === 'victim' && (
              <div>
                <div className="field-grid">
                  <div>
                    <label className="form-label-app">ชื่อ - นามสกุล ผู้เสียหาย</label>
                    <p style={{ fontWeight: 600, fontSize: '15px' }}>{caseData.victimName}</p>
                  </div>
                  <div>
                    <label className="form-label-app">เบอร์โทรศัพท์</label>
                    <p style={{ fontWeight: 600, fontSize: '15px' }}>{caseData.victimPhone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SUSPECT */}
            {activeTab === 'suspect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {suspects.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                    <i className="bi bi-person-x" style={{ fontSize: '32px', color: '#CBD5E1', display: 'block', marginBottom: '8px' }}></i>
                    <p style={{ margin: 0 }}>ยังไม่มีข้อมูลคนร้ายที่ระบุไว้ในสำนวนคดีนี้</p>
                  </div>
                ) : (
                  suspects.map((s, idx) => (
                    <div key={idx} style={{ padding: '20px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="stat-card__icon tint-danger" style={{ width: '42px', height: '42px', fontSize: '18px', borderRadius: '10px' }}>
                            <i className="bi bi-person-x-fill"></i>
                          </div>
                          <div>
                            <strong style={{ fontSize: '16px', color: '#0F172A', display: 'block' }}>
                              {s.name || s.accountName || 'ไม่ทราบชื่อคนร้าย / บัญชีม้า'}
                            </strong>
                            <span style={{ fontSize: '12px', color: '#64748B' }}>
                              ผู้ต้องสงสัย / บัญชีที่รับโอน (ลำดับที่ {idx + 1})
                            </span>
                          </div>
                        </div>

                        {/* Direct action links to search this suspect across all cases */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(s.bankAccountNumber || s.phone) && (
                            <Link 
                              to={`/officer/cases?search=${encodeURIComponent(s.bankAccountNumber || s.phone || s.name)}`}
                              className="btn-app btn-app-outline btn-app-sm"
                              title="ค้นหาคดีอื่นในระบบที่เกี่ยวข้องกับคนร้ายรายนี้"
                            >
                              <i className="bi bi-search"></i> ค้นหาทุกคดีของคนร้ายนี้
                            </Link>
                          )}
                          <Link 
                            to="/officer/duplicates" 
                            className="btn-app btn-app-outline-gray btn-app-sm"
                            title="เปิดระบบตรวจจับความเชื่อมโยงบัญชีและเบอร์ซ้ำ"
                          >
                            <i className="bi bi-radar"></i> ตรวจจับความเชื่อมโยง
                          </Link>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13.5px' }}>
                        <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                            <i className="bi bi-credit-card-2-front" style={{ marginRight: '4px' }}></i> เลขบัญชีธนาคารคนร้าย
                          </span>
                          <strong style={{ color: '#DC2626', fontSize: '15px', fontFamily: 'monospace' }}>
                            {s.bankAccountNumber || '-'}
                          </strong>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                            <i className="bi bi-bank" style={{ marginRight: '4px' }}></i> ธนาคารคนร้าย
                          </span>
                          <strong style={{ color: '#1E293B', fontSize: '14px' }}>
                            {s.bankName || '-'}
                          </strong>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                            <i className="bi bi-person-vcard" style={{ marginRight: '4px' }}></i> เลขบัตรประชาชนคนร้าย
                          </span>
                          <strong style={{ color: '#1E293B', fontSize: '14px', fontFamily: 'monospace' }}>
                            {s.nationalId || s.idCard || s.citizenId || 'อยู่ระหว่างตรวจสอบ'}
                          </strong>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                            <i className="bi bi-telephone" style={{ marginRight: '4px' }}></i> เบอร์โทรศัพท์คนร้าย
                          </span>
                          <strong style={{ color: '#D97706', fontSize: '14px' }}>
                            {s.phone || '-'}
                          </strong>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                            <i className="bi bi-globe" style={{ marginRight: '4px' }}></i> เว็บไซต์ / ลิงก์ที่ใช้หลอกลวง
                          </span>
                          <span style={{ color: '#2563EB', wordBreak: 'break-all', fontSize: '13px' }}>
                            {s.websiteUrl || s.url || '-'}
                          </span>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                            <i className="bi bi-chat-dots" style={{ marginRight: '4px' }}></i> ช่องทางโซเชียล / LINE คนร้าย
                          </span>
                          <span style={{ color: '#1E293B', fontSize: '13px' }}>
                            {s.socialMedia || s.lineId || s.facebook || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: EVIDENCE */}
            {activeTab === 'evidence' && (
              <div>
                {evidenceList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
                    <i className="bi bi-images" style={{ fontSize: '36px', color: '#CBD5E1', display: 'block', marginBottom: '10px' }}></i>
                    <strong style={{ display: 'block', color: '#334155', fontSize: '14px', marginBottom: '4px' }}>
                      ยังไม่มีหลักฐานที่แนบในคดีนี้
                    </strong>
                    <span style={{ fontSize: '12.5px' }}>ผู้เสียหายยังไม่ได้อัปโหลดไฟล์หลักฐานเพิ่มเติม</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {evidenceList.map((ev) => {
                      const imgSrc = getEvidenceSrc(ev);
                      const isImg = ev.fileType?.includes('image') || (ev.fileName && /\.(png|jpe?g|webp|gif)$/i.test(ev.fileName)) || imgSrc.startsWith('data:image') || imgSrc.includes('.png') || imgSrc.includes('.jpg');

                      return (
                        <div 
                          key={ev.id} 
                          style={{ 
                            background: '#ffffff', 
                            borderRadius: '14px', 
                            border: '1px solid #E2E8F0', 
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          {/* Image Display Container */}
                          <div 
                            style={{ 
                              height: '190px', 
                              background: '#0F172A', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: isImg ? 'pointer' : 'default'
                            }}
                            onClick={() => isImg && setPreviewImage({ url: imgSrc, name: ev.fileName })}
                            title={isImg ? 'คลิกเพื่อดูรูปขนาดเต็ม' : ''}
                          >
                            {isImg ? (
                              <>
                                <img 
                                  src={imgSrc} 
                                  alt={ev.fileName} 
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/images/landingpicture.png';
                                  }}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'contain',
                                    transition: 'transform 0.2s ease'
                                  }} 
                                />
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.3)',
                                  opacity: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  gap: '6px',
                                  transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                >
                                  <i className="bi bi-zoom-in"></i> คลิกดูรูปขนาดเต็ม
                                </div>
                              </>
                            ) : (
                              <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                                <i className="bi bi-file-earmark-pdf" style={{ fontSize: '48px', color: '#EF4444', display: 'block', marginBottom: '6px' }}></i>
                                <span style={{ fontSize: '12px' }}>เอกสาร PDF</span>
                              </div>
                            )}

                            {/* Verification Badge on top corner */}
                            <span style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: ev.verificationStatus === 'verified' ? '#DCFCE7' : ev.verificationStatus === 'rejected' ? '#FEE2E2' : 'rgba(255,255,255,0.9)',
                              color: ev.verificationStatus === 'verified' ? '#15803D' : ev.verificationStatus === 'rejected' ? '#B91C1C' : '#334155',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                            }}>
                              {ev.verificationStatus === 'verified' ? 'ยืนยันแล้ว' : ev.verificationStatus === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                            </span>
                          </div>

                          {/* File Details */}
                          <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <strong style={{ fontSize: '13.5px', color: '#1E293B', display: 'block', wordBreak: 'break-all', marginBottom: '4px' }}>
                                {ev.fileName}
                              </strong>
                              <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginBottom: '12px' }}>
                                {ev.fileSize || '1.0 MB'} · {formatThaiDate(ev.uploadedAt)}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {isImg && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: imgSrc, name: ev.fileName })}
                                  className="btn-app btn-app-outline btn-app-sm"
                                  style={{ flex: 1, fontSize: '12px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <i className="bi bi-eye"></i> ดูรูปภาพ
                                </button>
                              )}

                              <Link 
                                to={`/cases/${caseData.id}/evidence/${ev.id}`} 
                                className="btn-app btn-app-primary btn-app-sm"
                                style={{ flex: 1, fontSize: '12px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <i className="bi bi-shield-check"></i> ตรวจสอบ
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="timeline-app">
                {timeline.map((item, idx) => (
                  <div key={item.id || idx} className="timeline-node done">
                    <div className="timeline-node__dot">
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <div className="timeline-node__title">{item.title}</div>
                    {item.description && <div className="timeline-node__desc">{item.description}</div>}
                    <div className="timeline-node__time">{formatThaiDate(item.createdAt, true)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Info Box (4 cols) */}
        <div style={{ gridColumn: 'span 4' }}>
          <div className="card-app" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>เจ้าหน้าที่ผู้รับผิดชอบ</h3>
            {caseData.assignedOfficer ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div className="user-chip__avatar" style={{ width: '40px', height: '40px', fontSize: '14px', background: '#DBEAFE', color: '#1D4ED8' }}>
                    {caseData.assignedOfficer.slice(0, 2)}
                  </div>
                  <div>
                    <strong>{caseData.assignedOfficer}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {caseData.assignedOfficerRank || 'ชุดสืบสวนอาชญากรรมทางเทคโนโลยี'}
                    </span>
                  </div>
                </div>
                {caseData.notes && (
                  <div style={{ fontSize: '12.5px', background: 'var(--bg)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                    <strong style={{ display: 'block', color: 'var(--text)', marginBottom: '4px' }}>บันทึกของเจ้าหน้าที่:</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{caseData.notes}</span>
                  </div>
                )}
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  คดีนี้ได้รับการรับเรื่องและอยู่ในความดูแลของเจ้าหน้าที่เรียบร้อยแล้ว
                </div>
                {isOfficer && caseData.assignedOfficerId !== currentUser?.uid && caseData.assignedOfficer !== currentUser?.name && (
                  <button
                    type="button"
                    onClick={async () => {
                      const officerId = currentUser?.uid || 'user_o001';
                      const officerName = currentUser?.name || currentUser?.displayName || 'ร.ต.อ. พงศกร นิลวรรณ';
                      await firebaseService.assignOfficer(caseData.id, officerId, officerName);
                      loadCase();
                    }}
                    className="btn-app btn-app-outline btn-app-sm"
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}
                    title="โอนคดีนี้มาเป็นผู้รับผิดชอบ"
                  >
                    <i className="bi bi-arrow-left-right"></i> โอนคดีนี้มาเป็นผู้รับผิดชอบ
                  </button>
                )}
              </>
            ) : (
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: '12px',
                padding: '16px 14px',
                textAlign: 'center',
                color: '#92400E'
              }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FDE68A', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px' }}>
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#78350F' }}>
                  ยังไม่มีเจ้าหน้าที่รับเรื่อง
                </strong>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#92400E', lineHeight: 1.5 }}>
                  คดีนี้ถูกส่งเข้าระบบแล้ว อยู่ระหว่างรอเจ้าหน้าที่ฝ่ายสืบสวนกดรับเรื่องเพื่อเริ่มการตรวจสอบ
                </p>
                {isOfficer && (
                  <button
                    type="button"
                    onClick={async () => {
                      const officerId = currentUser?.uid || 'user_o001';
                      const officerName = currentUser?.name || currentUser?.displayName || 'ร.ต.อ. พงศกร นิลวรรณ';
                      await firebaseService.assignOfficer(caseData.id, officerId, officerName);
                      loadCase();
                    }}
                    className="btn-app btn-app-sm"
                    style={{
                      background: '#10B981',
                      color: '#ffffff',
                      border: 'none',
                      width: '100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontWeight: 600,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="bi bi-person-check-fill"></i> กดรับเรื่องคดีนี้
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="card-app">
            <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>ลิงก์ด่วน</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to={`/cases/${caseData.id}/timeline`} className="btn-app btn-app-outline-gray btn-app-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="bi bi-clock-history"></i> ประวัติไทม์ไลน์ฉบับเต็ม
              </Link>
              <Link to="/officer/duplicates" className="btn-app btn-app-outline-gray btn-app-sm" style={{ justifyContent: 'flex-start' }}>
                <i className="bi bi-diagram-3"></i> หน้าตรวจจับรายการซ้ำ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 991px) {
          div[style*="grid-column: span 8"],
          div[style*="grid-column: span 4"] {
            grid-column: span 12 !important;
          }
        }
      `}</style>
      {/* IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewImage && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#0F172A',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#ffffff' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{previewImage.name}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <img 
              src={previewImage.url} 
              alt={previewImage.name}
              style={{
                maxWidth: '85vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <a
                href={previewImage.url}
                download={previewImage.name}
                target="_blank"
                rel="noreferrer"
                className="btn-app btn-app-primary btn-app-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="bi bi-download"></i> ดาวน์โหลดรูปภาพ
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="btn-app btn-app-outline btn-app-sm"
                style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
