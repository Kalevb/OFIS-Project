import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="contact-section" style={{
      background: '#0B1536',
      color: 'rgba(219, 228, 255, 0.75)',
      paddingTop: '64px',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '40px'
      }}>
        {/* Column 1: Brand & Organization */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}>
              OF
            </div>
            <div>
              <strong style={{ color: '#ffffff', fontSize: '15px', display: 'block', lineHeight: 1.2 }}>
                ศูนย์สืบสวนคดีฉ้อโกงออนไลน์
              </strong>
              <span style={{ fontSize: '11px', color: 'rgba(219, 228, 255, 0.6)' }}>
                Online Fraud Investigation Center
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.8, color: 'rgba(219, 228, 255, 0.7)', marginBottom: '20px' }}>
            หน่วยงานภายใต้การกำกับของสำนักงานตำรวจแห่งชาติ มุ่งมั่นในการป้องกันและปราบปรามอาชญากรรมทางเทคโนโลยี เพื่อความปลอดภัยของประชาชน
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer' }}>
              <i className="bi bi-facebook"></i>
            </span>
            <span style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer' }}>
              <i className="bi bi-twitter-x"></i>
            </span>
            <span style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer' }}>
              <i className="bi bi-youtube"></i>
            </span>
            <span style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer' }}>
              <i className="bi bi-line"></i>
            </span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, marginBottom: '18px' }}>
            เมนูลัด
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
            <li><Link to="/" style={{ color: 'rgba(219, 228, 255, 0.75)', transition: 'color 0.2s' }}>• หน้าแรก</Link></li>
            <li><a href="#about-section" style={{ color: 'rgba(219, 228, 255, 0.75)' }}>• เกี่ยวกับระบบ</a></li>
            <li><Link to="/officer-login" style={{ color: 'rgba(219, 228, 255, 0.75)', transition: 'color 0.2s' }}>• เข้าสู่ระบบเจ้าหน้าที่</Link></li>
            <li><span style={{ color: 'rgba(219, 228, 255, 0.75)', cursor: 'pointer' }}>• คำถามที่พบบ่อย (FAQ)</span></li>
            <li><span style={{ color: 'rgba(219, 228, 255, 0.75)', cursor: 'pointer' }}>• นโยบายความเป็นส่วนตัว</span></li>
            <li><span style={{ color: 'rgba(219, 228, 255, 0.75)', cursor: 'pointer' }}>• เงื่อนไขการใช้งาน</span></li>
          </ul>
        </div>

        {/* Column 3: Contact Info */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, marginBottom: '18px' }}>
            ข้อมูลติดต่อ
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <i className="bi bi-geo-alt-fill" style={{ color: '#60A5FA', marginTop: '3px' }}></i>
              <span>สำนักงานตำรวจแห่งชาติ ถ.พระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="bi bi-telephone-fill" style={{ color: '#60A5FA' }}></i>
              <div>
                <strong>สายด่วน 1441</strong> <span style={{ fontSize: '11.5px', color: '#93C5FD' }}>(24 ชม.)</span>
              </div>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="bi bi-envelope-fill" style={{ color: '#60A5FA' }}></i>
              <span>support@ofic.police.go.th</span>
            </li>
          </ul>
        </div>

        {/* Column 4: Download App */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
            ดาวน์โหลดแอป
          </h4>
          <p style={{ fontSize: '12.5px', color: 'rgba(219, 228, 255, 0.7)', marginBottom: '16px' }}>
            ติดตามสถานะคดีได้ง่ายขึ้น ผ่านแอปพลิเคชันมือถือ
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* App Store Mock */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              cursor: 'pointer',
              width: 'fit-content'
            }}>
              <i className="bi bi-apple" style={{ fontSize: '24px', color: '#ffffff' }}></i>
              <div>
                <span style={{ fontSize: '10px', display: 'block', color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>Download on the</span>
                <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block', lineHeight: 1.2 }}>App Store</strong>
              </div>
            </div>
            {/* Google Play Mock */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              cursor: 'pointer',
              width: 'fit-content'
            }}>
              <i className="bi bi-google-play" style={{ fontSize: '22px', color: '#ffffff' }}></i>
              <div>
                <span style={{ fontSize: '10px', display: 'block', color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>GET IT ON</span>
                <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block', lineHeight: 1.2 }}>Google Play</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div style={{
        marginTop: '48px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '22px 24px',
        textAlign: 'center',
        fontSize: '12.5px',
        color: 'rgba(219, 228, 255, 0.5)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span>© 2026 ศูนย์สืบสวนคดีฉ้อโกงออนไลน์ (OFIC) สงวนลิขสิทธิ์ทุกประการ</span>
          <span>ระบบสนับสนุนการสืบสวนคดีฉ้อโกงออนไลน์ (CSD3202)</span>
        </div>
      </div>
    </footer>
  );
}
