// Utility formatting functions for Thai locale

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatThaiDate(dateString, includeTime = false) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543;
    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} · ${hours}:${minutes} น.`;
    }
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount, includeSymbol = true) {
  if (amount === undefined || amount === null) return '-';
  const formatted = Number(amount).toLocaleString('th-TH');
  return includeSymbol ? `฿${formatted}` : formatted;
}

export function formatMillionBaht(amount) {
  if (!amount) return '0 ล้านบาท';
  const millions = (Number(amount) / 1000000).toFixed(2);
  return `${millions} ล้านบาท`;
}

export function formatNationalId(id) {
  if (!id) return '-';
  const clean = id.replace(/\D/g, '');
  if (clean.length === 13) {
    return `${clean[0]}-${clean.slice(1, 5)}-${clean.slice(5, 10)}-${clean.slice(10, 12)}-${clean[12]}`;
  }
  return id;
}

export function formatPhoneNumber(phone) {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  if (clean.length === 9) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  }
  return phone;
}
