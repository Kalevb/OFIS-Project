export const CASE_TYPES = {
  call_center: {
    id: 'call_center',
    name: 'หลอกลวงทางโทรศัพท์ (แก๊ง Call Center)',
    nameEn: 'Call Center Scam',
    description: 'แก๊งคอลเซ็นเตอร์ หลอกลวงทางโทรศัพท์ อ้างเป็นเจ้าหน้าที่ หลอกให้โอนเงิน',
    icon: 'bi-headset',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.1)'
  },
  investment: {
    id: 'investment',
    name: 'หลอกลงทุน (Investment Scam)',
    nameEn: 'Investment Scam',
    description: 'หลอกลงทุน ผ่านแพลตฟอร์มปลอม สัญญาผลตอบแทนสูงผิดปกติ',
    icon: 'bi-graph-up-arrow',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)'
  },
  online_shopping: {
    id: 'online_shopping',
    name: 'หลอกซื้อขายสินค้าออนไลน์ (Shopping Scam)',
    nameEn: 'Online Shopping Scam',
    description: 'หลอกขายสินค้า/บริการออนไลน์ ไม่ได้รับสินค้า ไม่ได้รับบริการ',
    icon: 'bi-cart-fill',
    color: '#16A34A',
    bgColor: 'rgba(22, 163, 74, 0.1)'
  }
};

export const CASE_STATUSES = {
  pending: {
    id: 'pending',
    label: 'คดีใหม่/รอรับเรื่อง',
    color: '#B45309',
    bgColor: '#FEF3C7',
    badgeClass: 'badge-pending'
  },
  investigating: {
    id: 'investigating',
    label: 'กำลังสืบสวน',
    color: '#1D4ED8',
    bgColor: '#DBEAFE',
    badgeClass: 'badge-investigating'
  },
  evidence_review: {
    id: 'evidence_review',
    label: 'รอตรวจสอบหลักฐาน',
    color: '#4338CA',
    bgColor: '#E0E7FF',
    badgeClass: 'badge-evidence_review'
  },
  resolved: {
    id: 'resolved',
    label: 'คลี่คลายแล้ว',
    color: '#15803D',
    bgColor: '#DCFCE7',
    badgeClass: 'badge-resolved'
  },
  closed: {
    id: 'closed',
    label: 'ปิดคดีแล้ว',
    color: '#374151',
    bgColor: '#E5E7EB',
    badgeClass: 'badge-closed'
  },
  rejected: {
    id: 'rejected',
    label: 'ปฏิเสธคำร้อง',
    color: '#B91C1C',
    bgColor: '#FEE2E2',
    badgeClass: 'badge-rejected'
  }
};

export const USER_ROLES = {
  victim: {
    id: 'victim',
    label: 'ผู้เสียหาย',
    badgeColor: '#2563EB'
  },
  officer: {
    id: 'officer',
    label: 'เจ้าหน้าที่สืบสวน',
    badgeColor: '#1E3A8A'
  },
  admin: {
    id: 'admin',
    label: 'ผู้ดูแลระบบ (Admin)',
    badgeColor: '#DC2626'
  }
};
