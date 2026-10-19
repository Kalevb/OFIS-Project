// Reusable search matcher for Cases, Suspects (คนร้าย), and Victims
export function matchCaseWithQuery(c, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return true;
  if (!c) return false;

  const q = rawQuery.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, ''); // Digits only without hyphens/spaces

  // 1. Case code & number
  if (c.caseCode && c.caseCode.toLowerCase().includes(q)) return true;
  if (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) return true;
  if (c.id && c.id.toLowerCase().includes(q)) return true;
  if (c.title && c.title.toLowerCase().includes(q)) return true;
  if (c.description && c.description.toLowerCase().includes(q)) return true;
  if (c.caseType && c.caseType.toLowerCase().includes(q)) return true;
  if (c.incidentLocation && c.incidentLocation.toLowerCase().includes(q)) return true;
  if (c.policeReportNumber && c.policeReportNumber.toLowerCase().includes(q)) return true;

  // 2. Victim Information
  if (c.victimName && c.victimName.toLowerCase().includes(q)) return true;
  if (c.victimEmail && c.victimEmail.toLowerCase().includes(q)) return true;
  if (c.victimPhone) {
    if (c.victimPhone.includes(q)) return true;
    if (qDigits.length >= 3 && c.victimPhone.replace(/\D/g, '').includes(qDigits)) return true;
  }
  if (c.victimNationalId) {
    if (c.victimNationalId.includes(q)) return true;
    if (qDigits.length >= 4 && c.victimNationalId.replace(/\D/g, '').includes(qDigits)) return true;
  }

  // Bank synonym mapping for Thai banks
  const BANK_SYNONYMS = [
    { keys: ['kbank', 'กสิกร', 'kasikorn', 'ธนาคารกสิกรไทย'], name: 'กสิกรไทย' },
    { keys: ['scb', 'ไทยพาณิชย์', 'siam commercial'], name: 'ไทยพาณิชย์' },
    { keys: ['ktb', 'กรุงไทย', 'krungthai', 'krung thai'], name: 'กรุงไทย' },
    { keys: ['bbl', 'กรุงเทพ', 'bangkok bank'], name: 'กรุงเทพ' },
    { keys: ['ttb', 'ทหารไทยธนชาต', 'ทหารไทย', 'ธนชาต', 'tmb'], name: 'ทหารไทยธนชาต' },
    { keys: ['gsb', 'ออมสิน', 'government savings bank'], name: 'ออมสิน' },
    { keys: ['bay', 'กรุงศรี', 'กรุงศรีอยุธยา', 'krungsri'], name: 'กรุงศรีอยุธยา' },
    { keys: ['truemoney', 'ทรูมันนี่', 'true money', 'wallet', 'ทรูวอลเล็ต'], name: 'ทรูมันนี่วอลเล็ท' },
    { keys: ['promptpay', 'พร้อมเพย์'], name: 'พร้อมเพย์' }
  ];

  // 3. Suspect Information (ข้อมูลคนร้ายอย่างละเอียด: ชื่อ, เลขบัตร, ธนาคาร, เลขบัญชี, เบอร์โทร ฯลฯ)
  const suspectsList = [
    ...Object.values(c.suspects || {}),
    ...(c.suspect ? [c.suspect] : [])
  ];

  for (const s of suspectsList) {
    if (!s) continue;

    // ชื่อคนร้าย / นามแฝง / ชื่อบัญชีม้า
    const suspectName = (s.name || s.accountName || '').toLowerCase();
    if (suspectName && suspectName.includes(q)) return true;

    // ธนาคารคนร้าย (ตรวจทั้งชื่อตรงและตัวย่อ เช่น kbank, scb, กสิกร)
    const bankName = (s.bankName || s.bank || '').toLowerCase();
    if (bankName) {
      if (bankName.includes(q)) return true;
      for (const syn of BANK_SYNONYMS) {
        const matchesSyn = syn.keys.some(k => q.includes(k) || k.includes(q));
        if (matchesSyn && (bankName.includes(syn.name.toLowerCase()) || syn.keys.some(k => bankName.includes(k)))) {
          return true;
        }
      }
    }

    // เลขบัญชีธนาคารคนร้าย (ทั้งแบบมีขีดและไม่มีขีด)
    const bankAcc = (s.bankAccountNumber || s.accountNumber || '').toString();
    if (bankAcc) {
      if (bankAcc.toLowerCase().includes(q)) return true;
      if (qDigits.length >= 3 && bankAcc.replace(/\D/g, '').includes(qDigits)) return true;
    }

    // เบอร์โทรศัพท์คนร้าย (ทั้งแบบมีขีดและไม่มีขีด)
    const suspectPhone = (s.phone || '').toString();
    if (suspectPhone) {
      if (suspectPhone.includes(q)) return true;
      if (qDigits.length >= 3 && suspectPhone.replace(/\D/g, '').includes(qDigits)) return true;
    }

    // เลขบัตรประชาชนคนร้าย (National ID / ID Card / Citizen ID 13 หลัก)
    const suspectIdCard = (s.nationalId || s.idCard || s.citizenId || '').toString();
    if (suspectIdCard) {
      if (suspectIdCard.includes(q)) return true;
      if (qDigits.length >= 4 && suspectIdCard.replace(/\D/g, '').includes(qDigits)) return true;
    }

    // เว็บไซต์ / ลิงก์คนร้าย
    const website = (s.websiteUrl || s.url || s.website || '').toLowerCase();
    if (website && website.includes(q)) return true;

    // โซเชียลมีเดีย / LINE / Facebook คนร้าย
    const social = (s.socialMedia || s.lineId || s.facebook || '').toLowerCase();
    if (social && social.includes(q)) return true;
  }

  // 4. Assigned Officer
  if (c.assignedOfficer && c.assignedOfficer.toLowerCase().includes(q)) return true;
  if (c.assignedOfficerName && c.assignedOfficerName.toLowerCase().includes(q)) return true;

  return false;
}

// Format highlight or indicator for search matches
export function getSuspectMatchSummary(c, rawQuery) {
  if (!rawQuery || !rawQuery.trim() || !c) return null;
  const q = rawQuery.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');

  const suspectsList = [
    ...Object.values(c.suspects || {}),
    ...(c.suspect ? [c.suspect] : [])
  ];

  for (const s of suspectsList) {
    if (!s) continue;
    const sName = (s.name || s.accountName || '');
    const sBank = (s.bankName || s.bank || '');
    const sAcc = (s.bankAccountNumber || s.accountNumber || '');
    const sPhone = (s.phone || '');
    const sId = (s.nationalId || s.idCard || '');

    if (sName.toLowerCase().includes(q)) {
      return { type: 'ชื่อคนร้าย', value: sName };
    }
    if (sBank.toLowerCase().includes(q)) {
      return { type: 'ธนาคารคนร้าย', value: `${sBank} (${sAcc || '-'})` };
    }
    if (sAcc && (sAcc.includes(q) || (qDigits.length >= 3 && sAcc.replace(/\D/g, '').includes(qDigits)))) {
      return { type: 'เลขบัญชีคนร้าย', value: `${sAcc} (${sBank || sName || 'คนร้าย'})` };
    }
    if (sPhone && (sPhone.includes(q) || (qDigits.length >= 3 && sPhone.replace(/\D/g, '').includes(qDigits)))) {
      return { type: 'เบอร์โทรคนร้าย', value: sPhone };
    }
    if (sId && (sId.includes(q) || (qDigits.length >= 4 && sId.replace(/\D/g, '').includes(qDigits)))) {
      return { type: 'เลขบัตรคนร้าย', value: sId };
    }
  }

  return null;
}
