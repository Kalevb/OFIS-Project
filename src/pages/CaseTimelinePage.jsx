import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatThaiDate } from '../utils/format.js';

export default function CaseTimelinePage() {
  const { caseId } = useParams();
  const { currentUser, isOfficer } = useAuth();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = async () => {
    const [c, tl] = await Promise.all([
      firebaseService.getCaseById(caseId),
      firebaseService.getTimeline(caseId)
    ]);
    setCaseData(c);
    setTimeline(tl);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    await firebaseService.addTimelineEvent(caseId, {
      eventType: 'caseNote',
      title: title.trim(),
      description: description.trim(),
      createdBy: currentUser?.name || 'เจ้าหน้าที่'
    });
    setTitle('');
    setDescription('');
    setAdding(false);
    loadData();
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <Link to={`/cases/${caseId}`} style={{ fontSize: '13px', color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <i className="bi bi-arrow-left"></i> กลับไปหน้ารายละเอียดคดี {caseData?.caseCode}
          </Link>
          <h1>ไทม์ไลน์เหตุการณ์คดี {caseData?.caseCode}</h1>
          <p>บันทึกประวัติความเคลื่อนไหว การแจ้งความ และขั้นตอนสืบสวนตามลำดับเวลา</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
        {/* Timeline Event Feed */}
        <div className="card-app" style={{ gridColumn: 'span 8' }}>
          <h3 style={{ fontSize: '17px', marginBottom: '24px' }}>
            ลำดับความคืบหน้า ({timeline.length} เหตุการณ์)
          </h3>

          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', background: '#E5E7EB' }} />

            {timeline.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>ยังไม่มีบันทึกเหตุการณ์ในคดีนี้</p>
            ) : (
              timeline.map((item, idx) => (
                <div key={item.id || idx} style={{ position: 'relative', marginBottom: '24px' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-32px',
                    top: '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: idx === timeline.length - 1 ? '#2563EB' : '#16A34A',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    <i className="bi bi-check2"></i>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '15px', color: '#111827' }}>{item.title}</strong>
                      <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                        {formatThaiDate(item.createdAt, true)}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{ fontSize: '13.5px', color: '#4B5563', lineHeight: 1.6, margin: '6px 0 8px' }}>
                        {item.description}
                      </p>
                    )}
                    <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 500 }}>
                      <i className="bi bi-person-fill me-1"></i> บันทึกโดย: {item.createdBy}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Event Form */}
        <div className="card-app" style={{ gridColumn: 'span 4', height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>เพิ่มเหตุการณ์ในไทม์ไลน์</h3>
          <p style={{ fontSize: '12.5px', color: '#6B7280', marginBottom: '16px' }}>
            บันทึกความคืบหน้า เช่น การติดต่อพยาน การประสานงานธนาคาร หรือการออกหมายเรียก
          </p>

          <form onSubmit={handleAddEvent}>
            <div className="form-group">
              <label className="form-label-app">หัวข้อเหตุการณ์ *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ออกหนังสืออายัดบัญชีม้ากับธนาคาร"
                className="input-app"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label-app">รายละเอียดเพิ่มเติม</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="รายละเอียดการปฏิบัติการ..."
                className="textarea-app"
                rows={4}
              />
            </div>

            <button 
              type="submit" 
              disabled={adding}
              className="btn-app btn-app-primary"
              style={{ width: '100%' }}
            >
              <i className="bi bi-plus-lg"></i>
              {adding ? 'กำลังบันทึก...' : 'บันทึกลงไทม์ไลน์'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 991px) {
          .card-app[style*="grid-column: span 8"],
          .card-app[style*="grid-column: span 4"] {
            grid-column: span 12 !important;
          }
        }
      `}</style>
    </AppShell>
  );
}
