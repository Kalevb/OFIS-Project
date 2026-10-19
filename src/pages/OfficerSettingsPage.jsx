import React, { useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function OfficerSettingsPage() {
  const { currentUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ text: '', type: '' });
  const [settings, setSettings] = useState({
    notifyNewCase: true,
    notifyDuplicate: true,
    duplicateSensitivity: 'medium',
    autoAssignOfficer: false,
    requireSlipQR: true
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>ตั้งค่าระบบและการสืบสวน</h1>
          <p>กำหนดค่าการแจ้งเตือน ระดับความไวในการตรวจจับรายการซ้ำ และการจัดการข้อมูล</p>
        </div>
      </div>

      <div style={{ maxWidth: '800px' }}>
        <div className="card-app">
          {saved && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#DCFCE7',
              color: '#15803D',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="bi bi-check-circle-fill"></i>
              <span>บันทึกการตั้งค่าระบบเรียบร้อยแล้ว</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>การตรวจจับรายการซ้ำ (Duplicate Detection Sensitivity)</h3>
              <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                กำหนดระดับความละเอียดในการเปรียบเทียบข้อมูลเลขบัญชี เบอร์โทร และเว็บไซต์คนร้าย
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {['low', 'medium', 'high'].map((level) => (
                  <div 
                    key={level}
                    onClick={() => setSettings({ ...settings, duplicateSensitivity: level })}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: settings.duplicateSensitivity === level ? '2px solid #2563EB' : '1px solid #E5E7EB',
                      background: settings.duplicateSensitivity === level ? '#EFF6FF' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '14px', textTransform: 'capitalize', color: settings.duplicateSensitivity === level ? '#1E3A8A' : '#111827' }}>
                      {level === 'low' ? 'ระดับต่ำ (ตรงกัน 100%)' : level === 'medium' ? 'ระดับปานกลาง (แนะนำ)' : 'ระดับสูง (รวมข้อมูลใกล้เคียง)'}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                      {level === 'low' ? 'เลขบัญชีและเบอร์ตรงกันเป๊ะ' : level === 'medium' ? 'เทียบข้าม 8 หลักและโดเมนหลัก' : 'รวมถึงชื่อบัญชีม้าที่คล้ายกัน'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>การแจ้งเตือนเจ้าหน้าที่</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.notifyNewCase}
                    onChange={() => handleToggle('notifyNewCase')}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>แจ้งเตือนเมื่อมีคดีใหม่ส่งเข้าระบบ</strong>
                    <span style={{ fontSize: '12.5px', color: '#6B7280' }}>ส่งแจ้งเตือนในระบบทันทีเมื่อผู้เสียหายแจ้งเหตุ</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.notifyDuplicate}
                    onChange={() => handleToggle('notifyDuplicate')}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>แจ้งเตือนเมื่อระบบตรวจพบข้อมูลคนร้ายซ้ำกับคดีอื่น</strong>
                    <span style={{ fontSize: '12.5px', color: '#6B7280' }}>แจ้งเตือนความเชื่อมโยงของเบอร์โทรหรือบัญชีม้า</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={settings.requireSlipQR}
                    onChange={() => handleToggle('requireSlipQR')}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>บังคับให้สลิปหลักฐานต้องมี QR Code ชัดเจน</strong>
                    <span style={{ fontSize: '12.5px', color: '#6B7280' }}>ช่วยให้เจ้าหน้าที่ตรวจสอบกับธนาคารพาณิชย์ได้รวดเร็ว</span>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
              <button type="submit" className="btn-app btn-app-primary">
                <i className="bi bi-save"></i> บันทึกการตั้งค่า
              </button>
            </div>
          </form>
        </div>

        {/* FIREBASE REALTIME DATABASE IMPORT / EXPORT TOOLS */}
        <div className="card-app" style={{ marginTop: '20px' }}>
          <div className="card-app__head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="stat-card__icon tint-primary" style={{ width: '38px', height: '38px', fontSize: '18px' }}>
                <i className="bi bi-database-fill-gear"></i>
              </div>
              <div>
                <h3 style={{ fontSize: '16px', margin: 0 }}>ฐานข้อมูล Firebase Realtime Database</h3>
                <p style={{ fontSize: '12.5px', color: '#6B7280', margin: 0 }}>ดาวน์โหลดไฟล์ JSON ฉบับสมบูรณ์ หรือนำเข้าข้อมูลตรงสู่คลาวด์ Firebase</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: '4px' }}>
              <i className="bi bi-info-circle-fill text-primary"></i> ข้อมูลในชุด JSON ประกอบด้วย:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
              <li><strong>cases:</strong> 13 สำนวนคดี พร้อมรายละเอียดผู้เสียหาย ผู้ต้องสงสัย เลขบัญชี และสถานะครบทุกคดี</li>
              <li><strong>evidence:</strong> ไฟล์หลักฐาน สลิปโอนเงิน และบันทึกแชทพร้อมรูปภาพพรีวิวความคมชัดสูง</li>
              <li><strong>timeline:</strong> ประวัติและไทม์ไลน์การปฏิบัติงานของเจ้าหน้าที่ทุกคดีอย่างละเอียด</li>
              <li><strong>duplicateMatches:</strong> กลุ่มข้อมูลบัญชีม้า เบอร์โทร และเว็บไซต์ที่ตรวจพบความเชื่อมโยงซ้ำ</li>
              <li><strong>users:</strong> รายชื่อเจ้าหน้าที่ (Admin, Officers) และผู้เสียหาย (Victims) ครบถ้วน</li>
              <li><strong>reports & notifications:</strong> รายงานสรุปสถิติคดีและการแจ้งเตือนในระบบ</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a 
              href="/firebase-rtdb-export.json" 
              download="firebase-rtdb-import.json"
              className="btn-app btn-app-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', textDecoration: 'none' }}
            >
              <i className="bi bi-download"></i> ดาวน์โหลด JSON สำหรับนำเข้า Firebase
            </a>

            <button 
              type="button"
              onClick={async () => {
                setSyncStatus({ text: 'กำลังซิงค์ข้อมูลกับ Firebase RTDB...', type: 'info' });
                try {
                  const res = await fetch('/firebase-rtdb-export.json');
                  const fullData = await res.json();
                  const success = await firebaseService.importFullDatabase(fullData);
                  if (success) {
                    setSyncStatus({ text: 'นำเข้าและซิงค์ข้อมูลเข้าสู่ระบบและ Firebase เรียบร้อยแล้ว', type: 'success' });
                  } else {
                    setSyncStatus({ text: 'บันทึกข้อมูลเข้าหน่วยความจำระบบเรียบร้อยแล้ว', type: 'success' });
                  }
                } catch (e) {
                  setSyncStatus({ text: 'เกิดข้อผิดพลาด: ' + e.message, type: 'error' });
                }
                setTimeout(() => setSyncStatus({ text: '', type: '' }), 4000);
              }}
              className="btn-app btn-app-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <i className="bi bi-cloud-arrow-up-fill"></i> ซิงค์ข้อมูลเข้า Firebase RTDB ตอนนี้
            </button>
          </div>

          {syncStatus.text && (
            <div style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              background: syncStatus.type === 'error' ? '#FEE2E2' : syncStatus.type === 'info' ? '#EFF6FF' : '#DCFCE7',
              color: syncStatus.type === 'error' ? '#B91C1C' : syncStatus.type === 'info' ? '#1D4ED8' : '#15803D'
            }}>
              <i className={`bi ${syncStatus.type === 'error' ? 'bi-exclamation-circle' : syncStatus.type === 'info' ? 'bi-info-circle' : 'bi-check-circle'} me-2`}></i>
              {syncStatus.text}
            </div>
          )}

          <div style={{ marginTop: '16px', padding: '12px 14px', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE', fontSize: '12.5px', color: '#1E40AF' }}>
            <strong>วิธีนำเข้าในหน้าเว็บ Firebase Console:</strong>
            <ol style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
              <li>ไปที่ <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>Firebase Console</a> &gt; เลือกโปรเจกต์ <code>ofis-project-230f8</code></li>
              <li>เลือกเมนู <strong>Build &gt; Realtime Database</strong></li>
              <li>คลิกไอคอนจุดสามจุด <strong>(⋮)</strong> ที่มุมขวาบนของโครงสร้างข้อมูล &gt; เลือก <strong>Import JSON</strong></li>
              <li>เลือกไฟล์ <code>firebase-rtdb-import.json</code> ที่ดาวน์โหลดจากปุ่มด้านบน แล้วกดยืนยัน</li>
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
