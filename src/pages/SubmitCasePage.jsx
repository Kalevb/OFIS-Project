import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatCurrency } from '../utils/format.js';

export default function SubmitCasePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCase, setSuccessCase] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    caseType: 'Call Center Scam',
    incidentDate: new Date().toISOString().split('T')[0],
    description: '',
    damageAmount: '',

    victimName: currentUser?.name || 'สมชาย ใจดี',
    victimNationalId: currentUser?.victimProfile?.nationalId || '',
    victimPhone: currentUser?.phone || '081-234-5678',
    victimEmail: currentUser?.email || 'somchai@example.com',
    victimAddress: currentUser?.victimProfile?.address || '',

    suspectName: '',
    suspectPhone: '',
    suspectBankName: '',
    suspectBankAccountNumber: '',
    suspectWebsiteUrl: '',
    suspectSocialMedia: '',

    timelineEvents: [
      { date: new Date().toISOString().slice(0, 16), title: 'ได้รับการติดต่อทางโทรศัพท์' },
      { date: new Date().toISOString().slice(0, 16), title: 'โอนเงินตามที่ถูกหลอกให้โอน' }
    ],

    policeReportStatus: 'ยังไม่ได้แจ้งความ',
    policeReportNumber: '',
    evidenceFiles: []
  });

  // Auto-sync with logged in victim profile
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        victimName: currentUser.name || prev.victimName,
        victimPhone: currentUser.phone || prev.victimPhone,
        victimEmail: currentUser.email || prev.victimEmail,
        victimNationalId: currentUser.victimProfile?.nationalId || prev.victimNationalId,
        victimAddress: currentUser.victimProfile?.address || prev.victimAddress
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimelineChange = (index, field, value) => {
    const updated = [...formData.timelineEvents];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, timelineEvents: updated }));
  };

  const addTimelineEvent = () => {
    setFormData(prev => ({
      ...prev,
      timelineEvents: [
        ...prev.timelineEvents,
        { date: new Date().toISOString().slice(0, 16), title: '' }
      ]
    }));
  };

  const removeTimelineEvent = (index) => {
    setFormData(prev => ({
      ...prev,
      timelineEvents: prev.timelineEvents.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type
      }));
      setFormData(prev => ({
        ...prev,
        evidenceFiles: [...prev.evidenceFiles, ...newFiles]
      }));
    }
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!formData.description.trim()) {
        setErrorMsg('กรุณากรอกรายละเอียดเหตุการณ์โดยสรุป');
        return;
      }
      if (!formData.damageAmount || Number(formData.damageAmount) <= 0) {
        setErrorMsg('กรุณาระบุมูลค่าความเสียหาย');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.victimName.trim() || !formData.victimPhone.trim()) {
        setErrorMsg('กรุณาระบุชื่อและเบอร์โทรศัพท์');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const typeKey = formData.caseType.includes('Call') ? 'call_center' : formData.caseType.includes('Investment') ? 'investment' : 'online_shopping';
      const suspectsObj = {};
      if (formData.suspectName || formData.suspectPhone || formData.suspectBankAccountNumber) {
        suspectsObj[`susp_${Date.now()}`] = {
          name: formData.suspectName || 'ไม่ทราบชื่อ',
          phone: formData.suspectPhone || '',
          bankName: formData.suspectBankName || '',
          bankAccountNumber: formData.suspectBankAccountNumber || '',
          websiteUrl: formData.suspectWebsiteUrl || '',
          socialMedia: formData.suspectSocialMedia || ''
        };
      }

      const casePayload = {
        victimId: currentUser?.uid || 'user_v001',
        victimName: formData.victimName || currentUser?.name || 'ผู้แจ้งเหตุ',
        victimPhone: formData.victimPhone || currentUser?.phone || '-',
        victimEmail: formData.victimEmail || currentUser?.email || '',
        victimNationalId: formData.victimNationalId || '',
        victimAddress: formData.victimAddress || '',
        caseType: typeKey,
        incidentDate: formData.incidentDate,
        damageAmount: Number(formData.damageAmount) || 0,
        description: formData.description,
        policeReportFiled: formData.policeReportStatus === 'แจ้งความแล้ว',
        policeReportNumber: formData.policeReportNumber || '',
        suspects: suspectsObj
      };

      const created = await firebaseService.createCase(casePayload);

      // Upload evidence files in parallel without blocking UI
      if (formData.evidenceFiles && formData.evidenceFiles.length > 0) {
        await Promise.all(
          formData.evidenceFiles.map(item =>
            firebaseService.uploadEvidence(created.id, item.file, {
              fileName: item.name,
              fileType: item.type
            }).catch(err => {
              console.warn('[OFIC] Evidence upload warning:', err);
              return null;
            })
          )
        );
      }

      // Add timeline events in parallel
      const validTimelineEvents = (formData.timelineEvents || []).filter(t => t.title && t.title.trim());
      if (validTimelineEvents.length > 0) {
        await Promise.all(
          validTimelineEvents.map(t =>
            firebaseService.addTimelineEvent(created.id, {
              eventType: 'victimEvent',
              title: t.title,
              description: `บันทึกเวลา: ${t.date}`,
              createdBy: formData.victimName || 'ผู้เสียหาย'
            }).catch(() => null)
          )
        );
      }

      // Pop-up Success Modal
      setSuccessCase(created);
      setShowSuccessModal(true);
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>แจ้งเหตุฉ้อโกงออนไลน์</h1>
          <p>กรอกข้อมูลตามขั้นตอนด้านล่าง ระบบจะช่วยแนะนำทีละขั้นตอน</p>
        </div>
      </div>

      <div className="card-app">
        {/* STEPPER WIZARD BAR */}
        <div className="wizard-stepper" id="wizardStepper">
          <div className={`wizard-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`} onClick={() => setCurrentStep(1)}>
            <div className="wizard-step__circle">1</div>
            <div className="wizard-step__label">รายละเอียดคดี</div>
          </div>
          <div className={`wizard-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`} onClick={() => setCurrentStep(2)}>
            <div className="wizard-step__circle">2</div>
            <div className="wizard-step__label">ข้อมูลผู้เสียหาย</div>
          </div>
          <div className={`wizard-step ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`} onClick={() => setCurrentStep(3)}>
            <div className="wizard-step__circle">3</div>
            <div className="wizard-step__label">ข้อมูลผู้ต้องสงสัย</div>
          </div>
          <div className={`wizard-step ${currentStep === 4 ? 'active' : currentStep > 4 ? 'completed' : ''}`} onClick={() => setCurrentStep(4)}>
            <div className="wizard-step__circle">4</div>
            <div className="wizard-step__label">ไทม์ไลน์เหตุการณ์</div>
          </div>
          <div className={`wizard-step ${currentStep === 5 ? 'active' : ''}`} onClick={() => setCurrentStep(5)}>
            <div className="wizard-step__circle">5</div>
            <div className="wizard-step__label">แนบหลักฐาน</div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#B91C1C', borderRadius: '12px', fontSize: '13.5px', marginBottom: '20px' }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
          </div>
        )}

        <form id="caseForm">
          {/* STEP 1: CASE DETAILS */}
          {currentStep === 1 && (
            <div>
              <div className="field-grid">
                <div>
                  <label className="form-label-app">ประเภทคดี</label>
                  <select 
                    name="caseType"
                    value={formData.caseType}
                    onChange={handleInputChange}
                    className="select-app"
                    required
                  >
                    <option>Call Center Scam</option>
                    <option>Investment Scam</option>
                    <option>Online Shopping Scam</option>
                  </select>
                </div>
                <div>
                  <label className="form-label-app">วันที่เกิดเหตุ</label>
                  <input 
                    type="date" 
                    name="incidentDate"
                    value={formData.incidentDate}
                    onChange={handleInputChange}
                    className="input-app" 
                    required 
                  />
                </div>
              </div>

              <div className="field-grid" style={{ marginTop: '18px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label-app">รายละเอียดเหตุการณ์โดยสรุป</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="textarea-app" 
                    placeholder="อธิบายเหตุการณ์ที่เกิดขึ้นโดยย่อ..." 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-app">มูลค่าความเสียหายโดยประมาณ (บาท)</label>
                  <input 
                    type="number" 
                    min="0" 
                    name="damageAmount"
                    value={formData.damageAmount}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="0.00" 
                    required 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VICTIM INFO */}
          {currentStep === 2 && (
            <div>
              <div className="field-grid">
                <div>
                  <label className="form-label-app">ชื่อ-นามสกุล</label>
                  <input 
                    type="text" 
                    name="victimName"
                    value={formData.victimName}
                    onChange={handleInputChange}
                    className="input-app" 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-app">เลขบัตรประชาชน</label>
                  <input 
                    type="text" 
                    name="victimNationalId"
                    value={formData.victimNationalId}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="X-XXXX-XXXXX-XX-X" 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-app">เบอร์โทรศัพท์</label>
                  <input 
                    type="tel" 
                    name="victimPhone"
                    value={formData.victimPhone}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="08X-XXX-XXXX" 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-app">อีเมล</label>
                  <input 
                    type="email" 
                    name="victimEmail"
                    value={formData.victimEmail}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="name@example.com" 
                    required 
                  />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label-app">ที่อยู่ปัจจุบัน</label>
                  <textarea 
                    name="victimAddress"
                    value={formData.victimAddress}
                    onChange={handleInputChange}
                    className="textarea-app" 
                    placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" 
                    required 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUSPECT INFO */}
          {currentStep === 3 && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                ข้อมูลในขั้นตอนนี้ไม่บังคับ — กรอกเท่าที่ท่านทราบ
              </p>
              <div className="field-grid">
                <div>
                  <label className="form-label-app">ชื่อ / ชื่อเล่นผู้ต้องสงสัย</label>
                  <input 
                    type="text" 
                    name="suspectName"
                    value={formData.suspectName}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="ไม่ทราบชื่อจริง" 
                  />
                </div>
                <div>
                  <label className="form-label-app">เบอร์โทรศัพท์ผู้ต้องสงสัย</label>
                  <input 
                    type="tel" 
                    name="suspectPhone"
                    value={formData.suspectPhone}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="08X-XXX-XXXX" 
                  />
                </div>
                <div>
                  <label className="form-label-app">ชื่อธนาคาร</label>
                  <input 
                    type="text" 
                    name="suspectBankName"
                    value={formData.suspectBankName}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="เช่น ธนาคารกรุงไทย" 
                  />
                </div>
                <div>
                  <label className="form-label-app">เลขบัญชีธนาคาร</label>
                  <input 
                    type="text" 
                    name="suspectBankAccountNumber"
                    value={formData.suspectBankAccountNumber}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="XXX-X-XXXXX-X" 
                  />
                </div>
                <div>
                  <label className="form-label-app">เว็บไซต์ / URL ที่เกี่ยวข้อง</label>
                  <input 
                    type="text" 
                    name="suspectWebsiteUrl"
                    value={formData.suspectWebsiteUrl}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="https://..." 
                  />
                </div>
                <div>
                  <label className="form-label-app">โซเชียลมีเดีย / ไอดีไลน์</label>
                  <input 
                    type="text" 
                    name="suspectSocialMedia"
                    value={formData.suspectSocialMedia}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="เช่น Facebook, LINE ID" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TIMELINE */}
          {currentStep === 4 && (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                เรียงลำดับเหตุการณ์ที่เกิดขึ้นตามเวลาจริง เพื่อช่วยเจ้าหน้าที่ตรวจสอบได้ง่ายขึ้น
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {formData.timelineEvents.map((t, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 40px', gap: '12px', alignItems: 'center', background: 'var(--bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div>
                      <label className="form-label-app" style={{ margin: 0, fontSize: '12px' }}>วันที่ / เวลา</label>
                      <input 
                        type="datetime-local" 
                        value={t.date}
                        onChange={(e) => handleTimelineChange(idx, 'date', e.target.value)}
                        className="input-app" 
                        style={{ height: '40px', fontSize: '13px' }} 
                      />
                    </div>
                    <div>
                      <label className="form-label-app" style={{ margin: 0, fontSize: '12px' }}>เหตุการณ์</label>
                      <input 
                        type="text" 
                        value={t.title}
                        onChange={(e) => handleTimelineChange(idx, 'title', e.target.value)}
                        className="input-app" 
                        placeholder="เช่น ได้รับการติดต่อทางโทรศัพท์ หรือ โอนเงิน" 
                        style={{ height: '40px', fontSize: '13px' }} 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeTimelineEvent(idx)}
                      style={{ border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: '18px', cursor: 'pointer', marginTop: '16px' }}
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={addTimelineEvent}
                className="btn-app btn-app-outline-gray btn-app-sm"
                style={{ width: '100%', borderStyle: 'dashed', marginTop: '14px', height: '42px' }}
              >
                <i className="bi bi-plus-lg"></i> เพิ่มเหตุการณ์
              </button>
            </div>
          )}

          {/* STEP 5: UPLOAD EVIDENCE */}
          {currentStep === 5 && (
            <div>
              <label className="dropzone" id="dropzone" style={{ display: 'block' }}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                <i className="bi bi-cloud-arrow-up"></i>
                <strong>ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</strong>
                <span>รองรับสลิปโอนเงิน แชทสนทนา รูปภาพ และ PDF — ระบบจะจัดหมวดหมู่ให้อัตโนมัติ</span>
              </label>

              {formData.evidenceFiles.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.evidenceFiles.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="bi bi-file-earmark-check-fill" style={{ color: 'var(--secondary)', fontSize: '18px' }}></i>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{f.name} ({f.size})</span>
                      </div>
                      <button type="button" onClick={() => removeFile(idx)} style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>
                        <i className="bi bi-x-circle-fill"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="field-grid" style={{ marginTop: '18px' }}>
                <div>
                  <label className="form-label-app">มีการแจ้งความที่สถานีตำรวจแล้วหรือไม่</label>
                  <select 
                    name="policeReportStatus"
                    value={formData.policeReportStatus}
                    onChange={handleInputChange}
                    className="select-app"
                  >
                    <option>ยังไม่ได้แจ้งความ</option>
                    <option>แจ้งความแล้ว</option>
                  </select>
                </div>
                <div>
                  <label className="form-label-app">เลขที่บันทึกประจำวัน (ถ้ามี)</label>
                  <input 
                    type="text" 
                    name="policeReportNumber"
                    value={formData.policeReportNumber}
                    onChange={handleInputChange}
                    className="input-app" 
                    placeholder="ไม่บังคับ" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* WIZARD FOOTER NAVIGATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <button 
              type="button" 
              className="btn-app btn-app-outline" 
              onClick={prevStep}
              style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
            >
              <i className="bi bi-arrow-left"></i> ย้อนกลับ
            </button>
            
            {currentStep < 5 ? (
              <button 
                type="button" 
                className="btn-app btn-app-primary" 
                onClick={nextStep}
              >
                ถัดไป <i className="bi bi-arrow-right"></i>
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-app btn-app-primary"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ background: 'var(--success)' }}
              >
                {submitting ? 'กำลังส่งเรื่อง...' : 'ส่งเรื่องแจ้งเหตุ'} <i className="bi bi-check-lg"></i>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* POPUP MODAL: ส่งเรื่องสำเร็จ */}
      {showSuccessModal && successCase && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '32px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Animated Success Badge */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 16px',
              boxShadow: '0 0 0 8px rgba(220, 252, 231, 0.6)'
            }}>
              <i className="bi bi-check-lg"></i>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
              ส่งเรื่องสำเร็จ!
            </h2>
            <p style={{ fontSize: '13.5px', color: '#6B7280', margin: '0 0 20px', lineHeight: 1.5 }}>
              ระบบได้รับข้อมูลของท่านและเปิดสำนวนคดีฉบับเต็มเรียบร้อยแล้ว
            </p>

            {/* Case Dossier Summary Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px 18px',
              textAlign: 'left',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#64748B' }}>หมายเลขสำนวนคดี:</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#1D4ED8',
                  background: '#EFF6FF',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #BFDBFE'
                }}>
                  {successCase.caseNumber || successCase.caseCode}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>ประเภทคดี:</span>
                <strong style={{ color: '#1E293B' }}>{formData.caseType}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>มูลค่าความเสียหาย:</span>
                <strong style={{ color: '#DC2626' }}>{formatCurrency(formData.damageAmount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>ผู้แจ้งเหตุ:</span>
                <span style={{ color: '#1E293B' }}>{formData.victimName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>หลักฐานที่แนบ:</span>
                <span style={{ color: '#1E293B', fontWeight: 500 }}>
                  {formData.evidenceFiles.length > 0 ? `${formData.evidenceFiles.length} รายการ` : 'ไม่มี'}
                </span>
              </div>
            </div>

            {/* Officer Alert Notice */}
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textAlign: 'left',
              marginBottom: '24px'
            }}>
              <i className="bi bi-shield-check" style={{ fontSize: '18px', color: '#2563EB', flexShrink: 0 }}></i>
              <span>ข้อมูลถูกบันทึกเข้าสู่สำนวนคดีแล้ว เจ้าหน้าที่กำลังตรวจหลักฐานและประสานงานอายัดบัญชี</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate(`/cases/${successCase.id}`)}
                className="btn-app btn-app-primary"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <i className="bi bi-file-earmark-text-fill"></i> ไปที่หน้าสำนวนคดีฉบับเต็ม
              </button>

              <button
                type="button"
                onClick={() => navigate('/victim/track-status')}
                className="btn-app btn-app-outline"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  color: '#475569'
                }}
              >
                <i className="bi bi-clock-history"></i> ติดตามสถานะคดีของฉัน
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
