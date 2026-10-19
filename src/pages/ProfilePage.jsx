import React, { useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatNationalId, formatPhoneNumber } from '../utils/format.js';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    nationalId: currentUser?.victimProfile?.nationalId || '',
    address: currentUser?.victimProfile?.address || '',
    department: currentUser?.officerProfile?.department || '',
    rankTitle: currentUser?.officerProfile?.rankTitle || '',
    badgeNumber: currentUser?.officerProfile?.badgeNumber || ''
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isOfficer = currentUser?.role === 'officer' || currentUser?.role === 'admin';

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>โปรไฟล์ของฉัน</h1>
          <p>ข้อมูลบัญชีผู้ใช้งานและการติดต่อส่วนบุคคล</p>
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
              <span>บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว</span>
            </div>
          )}

          {/* User Header Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {currentUser?.name ? currentUser.name.slice(0, 2) : 'OF'}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', color: '#111827', marginBottom: '4px' }}>
                {currentUser?.name}
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: isOfficer ? '#1E3A8A' : '#2563EB',
                  color: '#ffffff'
                }}>
                  {currentUser?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : isOfficer ? 'เจ้าหน้าที่สืบสวน' : 'ผู้เสียหาย'}
                </span>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>
                  {currentUser?.email}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label-app">ชื่อ - นามสกุล</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-app"
                />
              </div>

              <div className="form-group">
                <label className="form-label-app">เบอร์โทรศัพท์</label>
                <input 
                  type="text" 
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-app"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label-app">อีเมลสำหรับติดต่อ</label>
                <input 
                  type="email" 
                  value={form.email}
                  disabled
                  className="input-app"
                  style={{ background: '#F8FAFC' }}
                />
              </div>

              {isOfficer ? (
                <>
                  <div className="form-group">
                    <label className="form-label-app">ยศ / ตำแหน่ง</label>
                    <input 
                      type="text" 
                      value={form.rankTitle}
                      onChange={(e) => setForm({ ...form, rankTitle: e.target.value })}
                      className="input-app"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label-app">หมายเลขประจำตัวเจ้าหน้าที่ (Badge Number)</label>
                    <input 
                      type="text" 
                      value={form.badgeNumber}
                      disabled
                      className="input-app"
                      style={{ background: '#F8FAFC' }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label-app">สังกัด / กองบังคับการ</label>
                    <input 
                      type="text" 
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="input-app"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label-app">เลขประจำตัวประชาชน (13 หลัก)</label>
                    <input 
                      type="text" 
                      value={formatNationalId(form.nationalId)}
                      disabled
                      className="input-app"
                      style={{ background: '#F8FAFC' }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label-app">ที่อยู่ปัจจุบัน</label>
                    <textarea 
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="textarea-app"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-app btn-app-primary">
                <i className="bi bi-save"></i> บันทึกข้อมูลโปรไฟล์
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
