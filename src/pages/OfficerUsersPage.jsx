import React, { useState, useEffect } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import { firebaseService } from '../services/firebaseService.js';
import { formatThaiDate } from '../utils/format.js';
import { USER_ROLES } from '../utils/constants.js';

export default function OfficerUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const list = await firebaseService.getUsers();
    setUsers(list);
    setLoading(false);
  };

  const handleRoleChange = async (uid, newRole) => {
    await firebaseService.updateUserRole(uid, newRole, true);
    setMsg('อัปเดตบทบาทผู้ใช้งานสำเร็จ');
    setTimeout(() => setMsg(''), 3000);
    loadUsers();
  };

  const handleToggleStatus = async (user) => {
    const updatedStatus = !user.isActive;
    await firebaseService.updateUserRole(user.uid, user.role, updatedStatus);
    setMsg(`เปลี่ยนสถานะบัญชีเป็น ${updatedStatus ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'} สำเร็จ`);
    setTimeout(() => setMsg(''), 3000);
    loadUsers();
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>จัดการผู้ใช้งาน (User Management)</h1>
          <p>เฉพาะผู้ดูแลระบบ (Admin) — กำหนดสิทธิ์ ควบคุมบทบาท และจัดการบัญชีผู้ใช้งานในระบบ</p>
        </div>
      </div>

      {msg && (
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
          <span>{msg}</span>
        </div>
      )}

      <div className="card-app">
        <div className="card-app-header">
          <div>
            <h3 style={{ fontSize: '17px' }}>รายชื่อผู้ใช้งานทั้งหมด ({users.length})</h3>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>สามารถเปลี่ยนสิทธิ์และระงับการใช้งานได้ทันที</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#6B7280' }}>
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '24px' }}></i>
            <p style={{ marginTop: '8px' }}>กำลังโหลดรายชื่อผู้ใช้...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-app">
              <thead>
                <tr>
                  <th>ชื่อผู้ใช้งาน</th>
                  <th>อีเมล</th>
                  <th>เบอร์โทร</th>
                  <th>บทบาท (Role)</th>
                  <th>สถานะบัญชี</th>
                  <th>วันที่สร้าง</th>
                  <th style={{ textAlign: 'center' }}>เปลี่ยนบทบาท</th>
                  <th style={{ textAlign: 'center' }}>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleObj = USER_ROLES[u.role] || { label: u.role, badgeColor: '#6B7280' };
                  const isActive = u.isActive !== false;

                  return (
                    <tr key={u.uid}>
                      <td>
                        <strong>{u.name || 'ไม่ระบุชื่อ'}</strong>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: `${roleObj.badgeColor}15`,
                          color: roleObj.badgeColor,
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {roleObj.label}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: 500,
                          background: isActive ? '#DCFCE7' : '#FEE2E2',
                          color: isActive ? '#15803D' : '#B91C1C'
                        }}>
                          {isActive ? 'ใช้งานปกติ' : 'ถูกระงับ'}
                        </span>
                      </td>
                      <td>{formatThaiDate(u.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                          className="select-app"
                          style={{ height: '34px', fontSize: '12.5px', width: 'auto' }}
                        >
                          <option value="victim">ผู้เสียหาย (victim)</option>
                          <option value="officer">เจ้าหน้าที่ (officer)</option>
                          <option value="admin">ผู้ดูแลระบบ (admin)</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleToggleStatus(u)}
                          className={`btn-app btn-app-sm ${isActive ? 'btn-app-outline-gray' : 'btn-app-primary'}`}
                          style={{ fontSize: '12px' }}
                        >
                          {isActive ? 'ระงับบัญชี' : 'เปิดใช้งาน'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
