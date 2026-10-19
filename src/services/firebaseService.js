// Firebase Realtime Database and Storage service layer
import { ref, get, set, push, update, onValue, query, orderByChild } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from './firebase.js';

// Default initial state structure when fetching from Firebase project
const defaultFallbackState = {
  cases: {},
  users: {},
  evidence: {},
  timeline: {},
  stats: {
    totalCases: 0,
    investigatingCases: 0,
    freezingCases: 0,
    prosecutingCases: 0,
    completedCases: 0,
    totalDamageAmount: 0,
    totalVictims: 0,
    arrestedSuspects: 0
  },
  reports: {},
  notifications: {},
  duplicateMatches: {}
};

// Local cache / state fallback to guarantee zero crash and instant speed
const STORAGE_KEY = 'OFIC_DATABASE_STATE_RTDB_V1';
const OVERRIDES_STORAGE_KEY = 'OFIC_CASE_OVERRIDES_V1';

export function getLocalCaseOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveCaseOverride(caseId, caseData) {
  try {
    const overrides = getLocalCaseOverrides();
    overrides[caseId] = {
      ...(overrides[caseId] || {}),
      ...caseData,
      _overrideTimestamp: Date.now()
    };
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Failed to save case override:', e);
  }
}

function getLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read local storage state', e);
  }
  return { ...defaultFallbackState };
}

function saveLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('LocalStorage quota warning, creating clean copy:', e);
    try {
      // Create lean copy without heavy data URLs in evidence so quota is never exceeded
      const leanState = { ...state };
      if (leanState.evidence) {
        const leanEv = {};
        for (const [cid, evMap] of Object.entries(leanState.evidence)) {
          leanEv[cid] = {};
          for (const [eid, ev] of Object.entries(evMap)) {
            leanEv[cid][eid] = {
              ...ev,
              downloadUrl: ev.downloadUrl?.startsWith('data:') ? '/images/landingpicture.png' : ev.downloadUrl
            };
          }
        }
        leanState.evidence = leanEv;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leanState));
    } catch (err2) {
      console.error('Failed to save to localStorage:', err2);
    }
  }
}

// Preserve local officer claim updates and user actions across page reloads & devices
export function mergeCasesWithLocal(remoteCasesObj, localCasesObj) {
  const merged = { ...(remoteCasesObj || {}) };
  const overrides = getLocalCaseOverrides();

  // 1. Merge local memory cases
  if (localCasesObj) {
    for (const [id, localCase] of Object.entries(localCasesObj)) {
      if (!merged[id]) {
        merged[id] = localCase;
      } else {
        const localTime = new Date(localCase.updatedAt || 0).getTime();
        const remoteTime = new Date(merged[id].updatedAt || 0).getTime();
        if (localTime >= remoteTime || (localCase.assignedOfficerId && !merged[id].assignedOfficerId)) {
          merged[id] = { ...merged[id], ...localCase };
        }
      }
    }
  }

  // 2. Explicitly apply user actions (overrides) like "รับเรื่อง" or status change
  // This guarantees that accepted cases NEVER revert on page refresh even if cloud write is delayed/restricted
  for (const [id, overrideCase] of Object.entries(overrides)) {
    if (merged[id]) {
      merged[id] = { ...merged[id], ...overrideCase };
    } else {
      merged[id] = overrideCase;
    }
  }

  return merged;
}

// Compress user image into lightweight persistent DataURL (~30-60KB) so it survives refresh & displays everywhere
export async function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.72) {
  if (!file) return '';
  if (typeof file === 'string') return file;

  if (typeof window !== 'undefined' && file instanceof Blob && file.type && file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxHeight) {
            if (w > h) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            } else {
              w = Math.round((w * maxHeight) / h);
              h = maxHeight;
            }
          }
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch {
            resolve(e.target?.result || '');
          }
        };
        img.onerror = () => resolve(e.target?.result || '');
        img.src = e.target?.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
  return '';
}

// In-memory active state
let activeState = getLocalState();

// Normalize case data from either RTDB or Firestore schemas
export function normalizeCase(d, fallbackId) {
  if (!d) return null;
  const id = d.caseId || d.id || fallbackId || 'case_001';
  const caseCode = d.caseCode || d.caseNumber || (id ? id.toUpperCase() : 'CASE-2026-001');
  const victimName = d.victimName || d.victim?.name || 'สมชาย ใจดี';
  const victimPhone = d.victimPhone || d.victim?.phone || '-';
  const victimIdCard = d.victimIdCard || d.victim?.idCard || d.victimProfile?.nationalId || '';

  // Format suspects
  let suspects = d.suspects;
  if (!suspects && d.suspect) {
    suspects = {
      suspect_001: {
        name: d.suspect.name || d.suspect.accountName || 'ไม่ทราบชื่อ',
        phone: d.suspect.phone || '-',
        bankName: d.suspect.bank || d.suspect.bankName || '-',
        bankAccountNumber: d.suspect.accountNumber || d.suspect.bankAccountNumber || '-',
        websiteUrl: d.suspect.websiteUrl || '-',
        socialMedia: d.suspect.socialMedia || '-'
      }
    };
  }

  const assignedOfficer = d.assignedOfficerName || d.assignedOfficer || d.investigator || '';

  return {
    ...d,
    id,
    caseId: id,
    caseCode,
    caseNumber: caseCode,
    victimName,
    victimPhone,
    victimIdCard,
    suspects: suspects || {},
    assignedOfficer,
    assignedOfficerName: assignedOfficer,
    assignedOfficer: assignedOfficer,
    assignedOfficerId: d.assignedOfficerId || d.officerId || '',
    assignedOfficerRank: d.assignedOfficerRank || '',
    investigator: assignedOfficer,
    title: d.title || d.description || '',
    caseType: d.caseType || d.category || 'call_center',
    damageAmount: Number(d.damageAmount || 0),
    description: d.description || d.title || '',
    incidentDate: d.incidentDate || '',
    incidentLocation: d.incidentLocation || d.location || '',
    location: d.incidentLocation || d.location || '',
    policeReportFiled: d.policeReportFiled ?? true,
    policeReportNumber: d.policeReportNumber || '',
    status: d.status || 'investigating',
    notes: d.notes || d.officerNotes || '',
    platform: d.platform || '',
    priority: d.priority || 'medium',
    evidenceCount: d.evidenceCount || (d.evidenceList ? Object.keys(d.evidenceList).length : 0)
  };
}

function sanitizeForFirebase(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj, (k, v) => (v === undefined ? null : v)));
}

// Helper to push update to Firebase RTDB and local cache
async function writePath(path, value) {
  const cleanValue = sanitizeForFirebase(value);
  // Update local memory & storage
  const parts = path.split('/').filter(Boolean);
  let cur = activeState;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = cleanValue;
  saveLocalState(activeState);

  // Attempt Firebase RTDB write
  try {
    const dbRef = ref(database, path);
    await set(dbRef, cleanValue);
  } catch (err) {
    console.info(`[OFIC Sync] Firebase RTDB wrote locally (cloud: ${err.message})`);
  }
}

// Helper with timeout to guarantee zero hang and lightning fast responsiveness
function withTimeout(promise, ms = 1800) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('OFIC_TIMEOUT')), ms))
  ]);
}

// Background sync in-flight tracker to prevent duplicate concurrent network calls
let isCasesSyncing = false;
let isUsersSyncing = false;

export const firebaseService = {
  // Fast init: loads local dataset first, then syncs RTDB in background without blocking
  async init() {
    // 1. Ensure local state has initial data from seed if cache is empty
    if (!activeState.cases || Object.keys(activeState.cases).length === 0) {
      try {
        const res = await fetch('/firebase-rtdb-export.json');
        if (res.ok) {
          const seedData = await res.json();
          activeState = { ...activeState, ...seedData };
          activeState.cases = mergeCasesWithLocal(activeState.cases, {});
          saveLocalState(activeState);
        }
      } catch (e) {
        console.info('[OFIC Seed] local seed check:', e.message);
      }
    } else {
      activeState.cases = mergeCasesWithLocal(activeState.cases, {});
      saveLocalState(activeState);
    }

    // 2. Background sync from Firebase Realtime Database with timeout guard
    this.syncCasesInBackground();

    return activeState;
  },

  // Non-blocking background sync from Firebase RTDB
  async syncCasesInBackground() {
    if (isCasesSyncing) return;
    isCasesSyncing = true;
    try {
      const snap = await withTimeout(get(ref(database, 'cases')), 2000);
      if (snap && snap.exists()) {
        const val = snap.val();
        activeState.cases = mergeCasesWithLocal(val, activeState.cases);
        saveLocalState(activeState);
      }
    } catch (e) {
      // Quiet timeout / offline handling - local state is already intact
    } finally {
      isCasesSyncing = false;
    }
  },

  // Real-time listener for cases
  subscribeCases(callback) {
    // First, invoke callback immediately with cached state for 0ms initial render
    if (activeState.cases && Object.keys(activeState.cases).length > 0) {
      try {
        callback(Object.values(activeState.cases).map(c => normalizeCase(c, c.id || c.caseId)));
      } catch {}
    }

    try {
      const casesRef = ref(database, 'cases');
      return onValue(casesRef, (snapshot) => {
        if (snapshot.exists()) {
          activeState.cases = mergeCasesWithLocal(snapshot.val(), activeState.cases);
          saveLocalState(activeState);
          callback(Object.values(activeState.cases).map(c => normalizeCase(c, c.id || c.caseId)));
        } else {
          activeState.cases = mergeCasesWithLocal({}, activeState.cases);
          callback(Object.values(activeState.cases || {}).map(c => normalizeCase(c, c.id || c.caseId)));
        }
      }, (error) => {
        console.warn('RTDB subscribe notice, maintaining local cache', error);
        activeState.cases = mergeCasesWithLocal({}, activeState.cases);
        callback(Object.values(activeState.cases || {}).map(c => normalizeCase(c, c.id || c.caseId)));
      });
    } catch {
      activeState.cases = mergeCasesWithLocal({}, activeState.cases);
      callback(Object.values(activeState.cases || {}).map(c => normalizeCase(c, c.id || c.caseId)));
      return () => {};
    }
  },

  // Cases API - Instant Cache-First Response (<5ms) + Background Sync
  async getCases(forceRefresh = false) {
    const hasCases = activeState.cases && Object.keys(activeState.cases).length > 0;

    // If cache is empty, load seed first
    if (!hasCases) {
      await this.init();
    } else {
      activeState.cases = mergeCasesWithLocal(activeState.cases, {});
      // Trigger non-blocking cloud check in background
      this.syncCasesInBackground();
    }

    if (forceRefresh) {
      try {
        const snap = await withTimeout(get(ref(database, 'cases')), 2000);
        if (snap && snap.exists()) {
          activeState.cases = mergeCasesWithLocal(snap.val(), activeState.cases);
          saveLocalState(activeState);
        }
      } catch {}
    }

    return Object.values(activeState.cases || {}).map(c => normalizeCase(c, c.id || c.caseId));
  },

  async getCaseById(caseId) {
    const overrides = getLocalCaseOverrides();
    const localExisting = overrides[caseId] || (activeState.cases && activeState.cases[caseId]) || null;

    // Return instant local match immediately if found (0ms)
    if (localExisting) {
      const normalized = normalizeCase(localExisting, caseId);
      // Query update in background without blocking
      withTimeout(get(ref(database, `cases/${caseId}`)), 1800).then(snap => {
        if (snap && snap.exists()) {
          let updatedNorm = normalizeCase(snap.val(), caseId);
          if (overrides[caseId]) {
            updatedNorm = { ...updatedNorm, ...overrides[caseId] };
          }
          if (!activeState.cases) activeState.cases = {};
          activeState.cases[caseId] = updatedNorm;
          saveLocalState(activeState);
        }
      }).catch(() => {});

      return normalized;
    }

    // If not in local cache, query Realtime Database with timeout guard
    try {
      const snap = await withTimeout(get(ref(database, `cases/${caseId}`)), 2000);
      if (snap && snap.exists()) {
        const norm = normalizeCase(snap.val(), caseId);
        if (!activeState.cases) activeState.cases = {};
        activeState.cases[caseId] = norm;
        saveLocalState(activeState);
        return norm;
      }
    } catch (e) {
      console.info('[OFIC RTDB] getCaseById notice:', e.message);
    }

    return null;
  },

  async createCase(caseData) {
    const caseId = `case_${Date.now()}`;
    const year = new Date().getFullYear() + 543;
    const count = Object.keys(activeState.cases || {}).length + 1;
    const caseCode = `CASE-${year}-${String(count).padStart(3, '0')}`;

    // New cases are submitted with NO assigned officer until an officer clicks "รับเรื่อง"
    const newCase = {
      ...caseData,
      id: caseId,
      caseCode,
      status: 'pending',
      assignedOfficerId: '',
      assignedOfficerName: '',
      assignedOfficer: '',
      assignedOfficerRank: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await writePath(`cases/${caseId}`, newCase);

    // Add initial timeline log
    const logId = `log_${Date.now()}`;
    const log = {
      id: logId,
      eventType: 'caseCreated',
      title: 'ส่งเรื่องแจ้งเหตุสำเร็จ',
      description: 'ผู้เสียหายส่งข้อมูลแจ้งเหตุผ่านระบบออนไลน์ อยู่ระหว่างรอเจ้าหน้าที่รับเรื่อง',
      createdBy: caseData.victimName || 'ผู้เสียหาย',
      createdAt: new Date().toISOString()
    };
    await writePath(`timeline/${caseId}/${logId}`, log);

    // Notify officer queue about new incoming case
    const notifId = `notif_${Date.now()}`;
    const notif = {
      id: notifId,
      title: `มีคดีใหม่รอรับเรื่อง: ${caseCode}`,
      message: `ผู้เสียหาย ${caseData.victimName || 'ประชาชน'} แจ้งเหตุ ${caseData.caseType || 'ฉ้อโกง'} มูลค่า ${Number(caseData.damageAmount || 0).toLocaleString()} บาท`,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    await writePath(`notifications/user_o001/${notifId}`, notif);

    // Re-run duplicate detection
    this.runDuplicateDetection();

    // Re-calculate statistics
    this.recalculateStats();

    return newCase;
  },

  async updateCaseStatus(caseId, status, note = '', officerName = 'เจ้าหน้าที่') {
    const existing = await this.getCaseById(caseId);
    if (!existing) return null;

    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };
    saveCaseOverride(caseId, updated);
    await writePath(`cases/${caseId}`, updated);
    this.recalculateStats();

    // Add timeline entry
    const logId = `log_${Date.now()}`;
    const log = {
      id: logId,
      eventType: 'statusChanged',
      title: `เปลี่ยนสถานะคดีเป็น: ${status}`,
      description: note || `เจ้าหน้าที่ได้อัปเดตสถานะคดีเรียบร้อยแล้ว`,
      createdBy: officerName,
      createdAt: new Date().toISOString()
    };
    await writePath(`timeline/${caseId}/${logId}`, log);

    // Notify victim
    if (existing.victimId) {
      const notifId = `notif_${Date.now()}`;
      const notif = {
        id: notifId,
        title: `อัปเดตสถานะคดี ${existing.caseCode}`,
        message: `คดีของคุณได้รับการอัปเดตสถานะเป็น "${status}" ${note ? `(${note})` : ''}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      await writePath(`notifications/${existing.victimId}/${notifId}`, notif);
    }

    return updated;
  },

  async assignOfficer(caseId, officerId, officerName, officerRank = '') {
    let existing = (activeState.cases && activeState.cases[caseId]) || null;
    if (!existing) {
      existing = await this.getCaseById(caseId);
    }
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      assignedOfficerId: officerId,
      assignedOfficerName: officerName,
      assignedOfficer: officerName,
      assignedOfficerRank: officerRank || existing.assignedOfficerRank || 'เจ้าหน้าที่สืบสวน',
      status: existing.status === 'pending' ? 'investigating' : existing.status,
      updatedAt: now
    };

    if (!activeState.cases) activeState.cases = {};
    activeState.cases[caseId] = updated;
    saveCaseOverride(caseId, updated);
    saveLocalState(activeState);

    await writePath(`cases/${caseId}`, updated);
    this.recalculateStats();

    // Log to timeline
    const logId = `log_${Date.now()}`;
    await writePath(`timeline/${caseId}/${logId}`, {
      id: logId,
      eventType: 'officerAssigned',
      title: 'เจ้าหน้าที่รับเรื่องเรียบร้อยแล้ว',
      description: `${officerName} ได้รับเรื่องและเริ่มทำการสืบสวนคดี`,
      createdBy: officerName,
      createdAt: now
    });

    return updated;
  },

  // Evidence API - Instant Cache-First Response
  async getEvidence(caseId) {
    const cached = activeState.evidence && activeState.evidence[caseId];
    if (cached && Object.keys(cached).length > 0) {
      // Background sync without blocking
      withTimeout(get(ref(database, `evidence/${caseId}`)), 1600).then(snap => {
        if (snap && snap.exists()) {
          if (!activeState.evidence) activeState.evidence = {};
          activeState.evidence[caseId] = snap.val();
          saveLocalState(activeState);
        }
      }).catch(() => {});
      return Object.values(cached);
    }

    try {
      const snap = await withTimeout(get(ref(database, `evidence/${caseId}`)), 1800);
      if (snap && snap.exists()) {
        if (!activeState.evidence) activeState.evidence = {};
        activeState.evidence[caseId] = snap.val();
        saveLocalState(activeState);
      }
    } catch {}
    const ev = (activeState.evidence && activeState.evidence[caseId]) || {};
    return Object.values(ev);
  },

  async uploadEvidence(caseId, file, meta = {}) {
    const evidenceId = `evd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fileName = file?.name || meta.fileName || 'ไฟล์หลักฐาน';
    const fileType = file?.type || meta.fileType || 'image/jpeg';
    const fileSize = file?.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : (meta.fileSize || '1.0 MB');
    const storagePath = `evidence/${caseId}/${fileName}`;

    let downloadUrl = '';

    // 1. If file is an image, compress into a lightweight Data URL (~30-50KB) that persists permanently
    if (file && typeof file !== 'string') {
      try {
        downloadUrl = await compressImageFile(file);
      } catch (err) {
        console.warn('[OFIC] Image compression error:', err);
      }
    } else if (typeof file === 'string') {
      downloadUrl = file;
    }

    // 2. Fallback matching known public assets or blob URL
    if (!downloadUrl || downloadUrl.length < 50) {
      const lower = fileName.toLowerCase();
      if (lower.includes('landingpicture')) {
        downloadUrl = '/images/landingpicture.png';
      } else if (lower.includes('slip') || lower.includes('สลิป')) {
        downloadUrl = '/images/slip-transfer.png';
      } else if (lower.includes('chat') || lower.includes('แชท')) {
        downloadUrl = '/images/chat-evidence.png';
      } else if (file && typeof window !== 'undefined' && file instanceof Blob && window.URL) {
        try {
          downloadUrl = window.URL.createObjectURL(file);
        } catch {}
      }
    }

    if (!downloadUrl) {
      downloadUrl = `https://placehold.co/800x600/1e3a8a/ffffff?text=${encodeURIComponent(fileName)}`;
    }

    const evidenceObj = {
      id: evidenceId,
      caseId,
      fileName,
      fileType,
      fileSize,
      storagePath,
      downloadUrl,
      verificationStatus: 'pending',
      note: meta.note || '',
      uploadedAt: new Date().toISOString()
    };

    await writePath(`evidence/${caseId}/${evidenceId}`, evidenceObj);
    return evidenceObj;
  },

  async updateEvidenceStatus(caseId, evidenceId, verificationStatus, note = '') {
    const evidenceList = await this.getEvidence(caseId);
    const target = evidenceList.find(e => e.id === evidenceId);
    if (!target) return null;

    const updated = {
      ...target,
      verificationStatus,
      note: note || target.note,
      verifiedAt: new Date().toISOString()
    };
    await writePath(`evidence/${caseId}/${evidenceId}`, updated);

    // Timeline log
    const logId = `log_${Date.now()}`;
    await writePath(`timeline/${caseId}/${logId}`, {
      id: logId,
      eventType: 'evidenceReviewed',
      title: `ตรวจสอบหลักฐาน: ${target.fileName}`,
      description: `สถานะ: ${verificationStatus === 'verified' ? 'ยืนยันความถูกต้อง' : 'ปฏิเสธหลักฐาน'} (${note || 'ไม่มีหมายเหตุ'})`,
      createdBy: 'เจ้าหน้าที่สืบสวน',
      createdAt: new Date().toISOString()
    });

    return updated;
  },

  // Timeline API - Instant Cache-First Response
  async getTimeline(caseId) {
    const cached = activeState.timeline && activeState.timeline[caseId];
    if (cached && Object.keys(cached).length > 0) {
      // Sync in background without blocking
      withTimeout(get(ref(database, `timeline/${caseId}`)), 1600).then(snap => {
        if (snap && snap.exists()) {
          if (!activeState.timeline) activeState.timeline = {};
          activeState.timeline[caseId] = snap.val();
          saveLocalState(activeState);
        }
      }).catch(() => {});
      return Object.values(cached).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    try {
      const snap = await withTimeout(get(ref(database, `timeline/${caseId}`)), 1800);
      if (snap && snap.exists()) {
        if (!activeState.timeline) activeState.timeline = {};
        activeState.timeline[caseId] = snap.val();
        saveLocalState(activeState);
      }
    } catch {}
    const tl = (activeState.timeline && activeState.timeline[caseId]) || {};
    return Object.values(tl).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async addTimelineEvent(caseId, event) {
    const logId = `log_${Date.now()}`;
    const log = {
      id: logId,
      ...event,
      createdAt: new Date().toISOString()
    };
    await writePath(`timeline/${caseId}/${logId}`, log);
    return log;
  },

  // Duplicate Detection API
  async getDuplicates() {
    try {
      const snap = await get(ref(database, 'duplicateMatches'));
      if (snap.exists()) {
        activeState.duplicateMatches = snap.val();
        saveLocalState(activeState);
      }
    } catch {}
    return Object.values(activeState.duplicateMatches || {});
  },

  runDuplicateDetection() {
    const cases = Object.values(activeState.cases || {});
    const bankMap = {};
    const phoneMap = {};
    const urlMap = {};

    cases.forEach(c => {
      const suspects = Object.values(c.suspects || {});
      suspects.forEach(s => {
        // Bank
        if (s.bankAccountNumber && s.bankAccountNumber.trim()) {
          const key = s.bankAccountNumber.replace(/\D/g, '');
          if (key.length >= 8) {
            if (!bankMap[key]) bankMap[key] = { value: `${s.bankAccountNumber} (${s.bankName || 'ไม่ระบุธนาคาร'})`, name: s.name, cases: [] };
            if (!bankMap[key].cases.includes(c.id)) bankMap[key].cases.push(c.id);
          }
        }
        // Phone
        if (s.phone && s.phone.trim()) {
          const key = s.phone.replace(/\D/g, '');
          if (key.length >= 9) {
            if (!phoneMap[key]) phoneMap[key] = { value: s.phone, name: s.name, cases: [] };
            if (!phoneMap[key].cases.includes(c.id)) phoneMap[key].cases.push(c.id);
          }
        }
        // URL
        if (s.websiteUrl && s.websiteUrl.trim()) {
          const key = s.websiteUrl.toLowerCase().trim();
          if (!urlMap[key]) urlMap[key] = { value: s.websiteUrl, name: s.name, cases: [] };
          if (!urlMap[key].cases.includes(c.id)) urlMap[key].cases.push(c.id);
        }
      });
    });

    const newDuplicates = {};
    let dupIdx = 1;

    // Filter >= 2
    Object.values(bankMap).forEach(item => {
      if (item.cases.length >= 2) {
        const id = `dup_bank_${dupIdx++}`;
        newDuplicates[id] = {
          id,
          matchType: 'bank_account',
          matchTypeName: 'บัญชีธนาคารซ้ำ',
          matchValue: item.value,
          targetName: item.name || 'ไม่ระบุชื่อ',
          caseCount: item.cases.length,
          caseIds: item.cases,
          detectedAt: new Date().toISOString()
        };
      }
    });

    Object.values(phoneMap).forEach(item => {
      if (item.cases.length >= 2) {
        const id = `dup_phone_${dupIdx++}`;
        newDuplicates[id] = {
          id,
          matchType: 'phone',
          matchTypeName: 'เบอร์โทรศัพท์ซ้ำ',
          matchValue: item.value,
          targetName: item.name || 'ไม่ระบุชื่อ',
          caseCount: item.cases.length,
          caseIds: item.cases,
          detectedAt: new Date().toISOString()
        };
      }
    });

    Object.values(urlMap).forEach(item => {
      if (item.cases.length >= 2) {
        const id = `dup_url_${dupIdx++}`;
        newDuplicates[id] = {
          id,
          matchType: 'website',
          matchTypeName: 'เว็บไซต์หลอกลวงซ้ำ',
          matchValue: item.value,
          targetName: item.name || 'ไม่ระบุชื่อ',
          caseCount: item.cases.length,
          caseIds: item.cases,
          detectedAt: new Date().toISOString()
        };
      }
    });

    // Merge or keep existing
    activeState.duplicateMatches = {
      ...(activeState.duplicateMatches || {}),
      ...newDuplicates
    };
    saveLocalState(activeState);
    return Object.values(activeState.duplicateMatches);
  },

  // Users API - Instant Cache-First Response
  async getUsers() {
    const hasUsers = activeState.users && Object.keys(activeState.users).length > 0;
    if (hasUsers) {
      if (!isUsersSyncing) {
        isUsersSyncing = true;
        withTimeout(get(ref(database, 'users')), 1800).then(snap => {
          if (snap && snap.exists()) {
            activeState.users = snap.val();
            saveLocalState(activeState);
          }
        }).catch(() => {}).finally(() => { isUsersSyncing = false; });
      }
      return Object.values(activeState.users || {});
    }

    try {
      const snap = await withTimeout(get(ref(database, 'users')), 2000);
      if (snap && snap.exists()) {
        activeState.users = snap.val();
        saveLocalState(activeState);
      }
    } catch {}
    return Object.values(activeState.users || {});
  },

  async getUserById(uid) {
    if (activeState.users && activeState.users[uid]) {
      return activeState.users[uid];
    }
    try {
      const snap = await withTimeout(get(ref(database, `users/${uid}`)), 1800);
      if (snap && snap.exists()) {
        const val = snap.val();
        if (!activeState.users) activeState.users = {};
        activeState.users[uid] = val;
        saveLocalState(activeState);
        return val;
      }
    } catch {}
    return null;
  },

  async saveUser(userData) {
    const uid = userData.uid;
    if (!uid) return null;
    const existing = (activeState.users && activeState.users[uid]) || {};
    const updated = {
      ...existing,
      ...userData,
      updatedAt: new Date().toISOString()
    };
    if (!activeState.users) activeState.users = {};
    activeState.users[uid] = updated;
    saveLocalState(activeState);
    await writePath(`users/${uid}`, updated);
    return updated;
  },

  async updateUserRole(uid, role, isActive = true) {
    const user = (activeState.users && activeState.users[uid]) || {};
    const updated = {
      ...user,
      role,
      isActive,
      updatedAt: new Date().toISOString()
    };
    await writePath(`users/${uid}`, updated);
    return updated;
  },

  // Stats API
  async getStats() {
    try {
      const snap = await get(ref(database, 'stats'));
      if (snap.exists()) {
        activeState.stats = snap.val();
        saveLocalState(activeState);
      }
    } catch {}
    if (!activeState.stats || !activeState.stats.totalCases) {
      return this.recalculateStats();
    }
    return activeState.stats || defaultFallbackState.stats;
  },

  async recalculateStats() {
    const allCases = Object.values(activeState.cases || {});
    const totalDamage = allCases.reduce((acc, c) => acc + (Number(c.damageAmount) || 0), 0);
    const updatedStats = {
      totalCases: allCases.length,
      investigatingCases: allCases.filter(c => c.status === 'investigating' || c.status === 'pending').length,
      freezingCases: allCases.filter(c => c.status === 'freezing').length,
      prosecutingCases: allCases.filter(c => c.status === 'prosecuting').length,
      completedCases: allCases.filter(c => c.status === 'completed' || c.status === 'resolved').length,
      totalDamageAmount: totalDamage,
      totalVictims: new Set(allCases.map(c => c.victimId || c.victimEmail || c.victimName)).size,
      arrestedSuspects: activeState.stats?.arrestedSuspects || 4
    };
    activeState.stats = updatedStats;
    await writePath('stats', updatedStats);
    return updatedStats;
  },

  // Reports API
  async getReports() {
    try {
      const snap = await get(ref(database, 'reports'));
      if (snap.exists()) {
        activeState.reports = snap.val();
        saveLocalState(activeState);
      }
    } catch {}
    return Object.values(activeState.reports || {});
  },

  async createReport(reportData) {
    const repId = `rep_${Date.now()}`;
    const rep = {
      id: repId,
      ...reportData,
      createdAt: new Date().toISOString()
    };
    await writePath(`reports/${repId}`, rep);
    return rep;
  },

  // Notifications API
  async getNotifications(uid) {
    try {
      const snap = await get(ref(database, `notifications/${uid}`));
      if (snap.exists()) {
        if (!activeState.notifications) activeState.notifications = {};
        activeState.notifications[uid] = snap.val();
        saveLocalState(activeState);
      }
    } catch {}
    const notifs = (activeState.notifications && activeState.notifications[uid]) || {};
    return Object.values(notifs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async markNotificationRead(uid, notifId) {
    await writePath(`notifications/${uid}/${notifId}/isRead`, true);
  },

  // Full Database Seed / Direct Import API
  async importFullDatabase(fullData) {
    if (!fullData || typeof fullData !== 'object') return false;
    activeState = { ...activeState, ...fullData };
    saveLocalState(activeState);

    try {
      const rootRef = ref(database);
      await set(rootRef, sanitizeForFirebase(fullData));
      console.log('[OFIC RTDB] Successfully seeded entire database to Firebase Cloud');
      return true;
    } catch (err) {
      console.warn('[OFIC RTDB] Cloud write permission or network error, stored locally:', err.message);
      return false;
    }
  },

  exportDatabase() {
    return activeState;
  }
};
