import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CASE_TYPES } from '../utils/constants.js';

export default function LandingPage() {
  const { isAuthenticated, isVictim } = useAuth();
  const navigate = useNavigate();
  const [selectedCaseType, setSelectedCaseType] = useState(null);

  const handleStartReport = () => {
    if (isAuthenticated) {
      navigate('/victim/submit-case');
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* ================= HERO SECTION ================= */}
        <section style={{
          padding: '60px 24px 50px',
          maxWidth: '1240px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '48px',
            alignItems: 'center'
          }}>
            {/* Left Copy */}
            <div>
              {/* Pill tag */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '30px',
                background: '#EFF6FF',
                border: '1px solid #DBEAFE',
                color: '#2563EB',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '20px'
              }}>
                <i className="bi bi-shield-check" style={{ fontSize: '15px' }}></i>
                <span>ปลอดภัย • เชื่อถือได้ • เป็นความลับ</span>
              </div>

              {/* Main Heading */}
              <h1 style={{
                fontSize: 'clamp(32px, 4vw, 44px)',
                lineHeight: 1.25,
                fontWeight: 700,
                color: '#1E3A8A',
                marginBottom: '18px'
              }}>
                แจ้งเหตุคดีฉ้อโกงออนไลน์<br />
                <span style={{ color: '#2563EB' }}>ได้ง่ายและปลอดภัย</span>
              </h1>

              {/* Subheading */}
              <p style={{
                fontSize: '15.5px',
                lineHeight: 1.8,
                color: '#4B5563',
                maxWidth: '520px',
                marginBottom: '32px'
              }}>
                ศูนย์กลางในการรับแจ้ง ตรวจสอบ และติดตามคดีฉ้อโกงออนไลน์
                โดยทีมผู้เชี่ยวชาญ เพื่อให้คุณได้รับความช่วยเหลืออย่างรวดเร็ว
              </p>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleStartReport}
                  className="btn-app btn-app-primary btn-app-lg"
                  style={{ gap: '10px' }}
                >
                  <i className="bi bi-pencil-square" style={{ fontSize: '17px' }}></i>
                  แจ้งเหตุตอนนี้
                </button>

                <Link 
                  to="/victim/track-status" 
                  className="btn-app btn-app-outline btn-app-lg"
                  style={{ gap: '10px' }}
                >
                  <i className="bi bi-graph-up" style={{ fontSize: '17px' }}></i>
                  ติดตามสถานะคดี
                </Link>
              </div>
            </div>

            {/* Right Hero Visual Banner (User Custom Artwork) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '560px',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 45px rgba(30, 58, 138, 0.22), 0 8px 18px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: '#0F172A'
              }}>
                <img 
                  src="/images/landingpicture.png" 
                  alt="ภาพประกอบศูนย์สืบสวนคดีฉ้อโกงออนไลน์ (OFIC)" 
                  referrerPolicy="no-referrer"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '360px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4 KEY STATISTICS CARDS ================= */}
        <section style={{
          padding: '10px 24px 40px',
          maxWidth: '1240px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '18px'
          }}>
            {/* Card 1 */}
            <div className="card-app" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px 22px',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#2563EB',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                <i className="bi bi-file-earmark-text"></i>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6B7280', display: 'block' }}>จำนวนคดีที่รับแจ้ง</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <strong style={{ fontSize: '24px', color: '#111827', fontWeight: 700 }}>12,458</strong>
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>คดี</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>สะสมทั้งหมด</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card-app" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px 22px',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#2563EB',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                <i className="bi bi-shield-check"></i>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6B7280', display: 'block' }}>คดีที่คลี่คลายแล้ว</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <strong style={{ fontSize: '24px', color: '#111827', fontWeight: 700 }}>7,895</strong>
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>คดี</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: 500 }}>คิดเป็น 63.4%</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card-app" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px 22px',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#2563EB',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                <i className="bi bi-cash-stack"></i>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6B7280', display: 'block' }}>มูลค่าความเสียหายที่ติดตามคืน</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <strong style={{ fontSize: '24px', color: '#111827', fontWeight: 700 }}>256.42</strong>
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>ล้านบาท</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>สะสมทั้งหมด</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="card-app" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px 22px',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: '#2563EB',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                <i className="bi bi-stopwatch"></i>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#6B7280', display: 'block' }}>ระยะเวลาเฉลี่ยในการดำเนินการ</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <strong style={{ fontSize: '24px', color: '#111827', fontWeight: 700 }}>18</strong>
                  <span style={{ fontSize: '13px', color: '#4B5563' }}>วัน</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>ต่อ 1 คดี</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3-COLUMN SECTIONS (MATCHING WIREFRAME) ================= */}
        <section id="about-section" style={{
          padding: '10px 24px 60px',
          maxWidth: '1240px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '20px'
          }}>
            {/* Left Block: ประเภทคดีที่รองรับ (5 cols) */}
            <div className="card-app" style={{
              gridColumn: 'span 5',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              borderRadius: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <i className="bi bi-person-workspace text-primary" style={{ fontSize: '18px', color: '#2563EB' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                  ประเภทคดีที่รองรับ
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                {/* Type 1 */}
                <div style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid #E5E7EB',
                  background: '#F8FAFC',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img 
                      src="/images/icon-call-center.png" 
                      alt="Call Center" 
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        objectFit: 'contain',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginBottom: '4px' }}>
                        Call Center Scam
                      </strong>
                      <p style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5, marginBottom: '8px' }}>
                        แก๊งคอลเซ็นเตอร์ หลอกลวงทางโทรศัพท์ อ้างเป็นเจ้าหน้าที่ หลอกให้โอนเงิน
                      </p>
                      <button 
                        onClick={() => setSelectedCaseType(CASE_TYPES.call_center)}
                        style={{ border: 'none', background: 'transparent', color: '#2563EB', fontSize: '12.5px', fontWeight: 500, padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        ดูรายละเอียด <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Type 2 */}
                <div style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid #E5E7EB',
                  background: '#F8FAFC',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <img 
                      src="/images/icon-investment.png" 
                      alt="Investment Scam" 
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        objectFit: 'contain',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginBottom: '4px' }}>
                        Investment Scam
                      </strong>
                      <p style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5, marginBottom: '8px' }}>
                        หลอกลงทุน ผ่านแพลตฟอร์มปลอม สัญญาผลตอบแทนสูงผิดปกติ
                      </p>
                      <button 
                        onClick={() => setSelectedCaseType(CASE_TYPES.investment)}
                        style={{ border: 'none', background: 'transparent', color: '#2563EB', fontSize: '12.5px', fontWeight: 500, padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        ดูรายละเอียด <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Type 3 */}
                <div style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid #E5E7EB',
                  background: '#F8FAFC',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(22, 163, 74, 0.1)',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0
                    }}>
                      <i className="bi bi-cart-fill"></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginBottom: '4px' }}>
                        Online Shopping Scam
                      </strong>
                      <p style={{ fontSize: '12.5px', color: '#6B7280', lineHeight: 1.5, marginBottom: '8px' }}>
                        หลอกขายสินค้า/บริการออนไลน์ ไม่ได้รับสินค้า ไม่ได้รับบริการ
                      </p>
                      <button 
                        onClick={() => setSelectedCaseType(CASE_TYPES.online_shopping)}
                        style={{ border: 'none', background: 'transparent', color: '#2563EB', fontSize: '12.5px', fontWeight: 500, padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        ดูรายละเอียด <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Block: ขั้นตอนการใช้งาน (4 cols) */}
            <div className="card-app" style={{
              gridColumn: 'span 4',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              borderRadius: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <i className="bi bi-diagram-3-fill" style={{ fontSize: '18px', color: '#2563EB' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                  ขั้นตอนการใช้งาน
                </h3>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                position: 'relative'
              }}>
                {/* Step 1 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#111827', display: 'block', marginBottom: '2px' }}>ลงทะเบียน</strong>
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }}>สร้างบัญชีผู้ใช้งาน เพื่อยืนยันตัวตน</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#111827', display: 'block', marginBottom: '2px' }}>แจ้งเหตุ</strong>
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }}>กรอกข้อมูลเหตุการณ์ อย่างละเอียด</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    3
                  </div>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#111827', display: 'block', marginBottom: '2px' }}>แนบหลักฐาน</strong>
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }}>อัปโหลดเอกสาร/หลักฐาน ที่เกี่ยวข้อง</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    4
                  </div>
                  <div>
                    <strong style={{ fontSize: '14.5px', color: '#111827', display: 'block', marginBottom: '2px' }}>ติดตามสถานะ</strong>
                    <p style={{ fontSize: '12.5px', color: '#6B7280' }}>ติดตามความคืบหน้าของคดี ได้ตลอดเวลา</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Block: CTA Card (3 cols) */}
            <div style={{
              gridColumn: 'span 3',
              borderRadius: '20px',
              background: 'linear-gradient(145deg, #1E3A8A 0%, #172554 100%)',
              color: '#ffffff',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px rgba(30, 58, 138, 0.25)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Glow */}
              <div style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'rgba(96, 165, 250, 0.15)',
                filter: 'blur(20px)'
              }}></div>

              <div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  color: '#93C5FD',
                  margin: '0 auto 18px'
                }}>
                  <i className="bi bi-shield-check"></i>
                </div>

                <span style={{ fontSize: '12.5px', color: '#93C5FD', display: 'block', marginBottom: '6px' }}>
                  ร่วมสร้างสังคมออนไลน์ที่ปลอดภัย
                </span>

                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4, marginBottom: '20px' }}>
                  แจ้งเหตุวันนี้ เพื่อปกป้องคุณและคนที่คุณรัก
                </h3>
              </div>

              <div>
                <button 
                  onClick={handleStartReport}
                  className="btn-app btn-app-white"
                  style={{ width: '100%', gap: '8px', marginBottom: '10px' }}
                >
                  <i className="bi bi-pencil-square" style={{ color: '#1E3A8A' }}></i>
                  เริ่มแจ้งเหตุ
                </button>
                <span style={{ fontSize: '11.5px', color: 'rgba(219, 228, 255, 0.65)' }}>
                  ใช้เวลาเพียงไม่กี่นาที
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Case Type Modal */}
      {selectedCaseType && (
        <div className="modal-overlay" onClick={() => setSelectedCaseType(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: selectedCaseType.bgColor,
                color: selectedCaseType.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                <i className={`bi ${selectedCaseType.icon}`}></i>
              </div>
              <div>
                <h3 style={{ fontSize: '18px' }}>{selectedCaseType.name}</h3>
                <span style={{ fontSize: '12.5px', color: '#6B7280' }}>{selectedCaseType.nameEn}</span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.7, marginBottom: '20px' }}>
              {selectedCaseType.description}
            </p>

            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px', color: '#111827' }}>
                หลักฐานสำคัญที่ต้องเตรียม:
              </strong>
              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.8 }}>
                <li>สลิปหลักฐานการโอนเงิน (มี QR Code ชัดเจน)</li>
                <li>ภาพถ่ายหน้าจอการสนทนา (แชท LINE, Facebook, ข้อความ SMS)</li>
                <li>ข้อมูลบัญชีธนาคาร เบอร์โทร หรือลิงก์เว็บไซต์ของคนร้าย</li>
                <li>เอกสารบันทึกประจำวันจากสถานีตำรวจ (ถ้ามี)</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedCaseType(null)} 
                className="btn-app btn-app-outline-gray btn-app-sm"
              >
                ปิดหน้าต่าง
              </button>
              <button 
                onClick={() => {
                  setSelectedCaseType(null);
                  handleStartReport();
                }} 
                className="btn-app btn-app-primary btn-app-sm"
              >
                แจ้งเหตุคดีประเภทนี้
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Media query for responsive grid */}
      <style>{`
        @media (max-width: 991px) {
          #about-section > div {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
