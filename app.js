/**
 * ==========================================================================
 * ระบบเวียนเอกสาร HQD (HQD Document Circulation System)
 * Vanilla JavaScript (SPA Architecture, IIFE, Zero-Reload, Elder-Friendly UI)
 * --------------------------------------------------------------------------
 * v3 — ปรับปรุงสำหรับการใช้งานจริงในหน่วยงานขนาด ~20 คน
 *  - ทุกคำสั่งเขียนข้อมูลรอผลตอบกลับจริงจากเซิร์ฟเวอร์ (ไม่ใช้ no-cors)
 *  - คิวส่งการ "รับทราบ" ซ้ำอัตโนมัติเมื่อเน็ตหลุด (ข้อมูลไม่หาย)
 *  - แปลงวันที่ / รหัสพนักงานจาก Google Sheet ให้ถูกต้องเสมอ
 *  - แดชบอร์ดสรุป, รายงาน CSV, เปลี่ยน PIN, เลือกผู้รับตามแผนก
 * ==========================================================================
 */

(() => {
  'use strict';

  /* ==========================================================================
     1. CONFIGURATION & CONSTANTS
     ========================================================================== */
  const CONFIG = {
    // Supabase Configuration for Ultra-Fast Auth & Personnel Management
    SUPABASE_URL: 'https://roeoqsmkveuehzqoeubn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZW9xc21rdmV1ZWh6cW9ldWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzODE3OTYsImV4cCI6MjEwNzk1Nzc5Nn0.CfQOGiRSuOijaOS-8YLrHw09QlG0hkl417lnOhzZdq0',

    // Google Apps Script Web App Deployment URL (Two-Way Sync for Circular Documents & Google Drive)
    GAS_API_URL: 'https://script.google.com/macros/s/AKfycbwh-PvW0UNXCz99CbzZJx9QJxhwL-M13P0fDn_55NTT_r942YryR6OuGhdmZiKlcVW_/exec',

    // Google Sheet & Drive Source IDs (Master Reference)
    SHEET_MASTER_ID: '167gvGXW7EeK4fdKJED1TKhqRiMJmFkte5-sH3Ybigk8',
    DRIVE_FOLDER_ID: '1kb08cT4u-vMIEA0de7eFcowlI-wiPqNE',

    // LocalStorage Cache Keys for Instant 0-second loading
    STORAGE_KEY_USER: 'HQD_CURRENT_USER_V1',
    STORAGE_KEY_DATA: 'HQD_APP_DATA_V2',
    STORAGE_KEY_FONT: 'HQD_FONT_SIZE_V1',
    STORAGE_KEY_OVERRIDES: 'HQD_USER_ROLE_OVERRIDES_V1',
    STORAGE_KEY_READ_DOCS: 'HQD_READ_DOCS_V2',
    STORAGE_KEY_SORT: 'HQD_SYSTEM_SORT_ORDER_V1',
    STORAGE_KEY_DELETED: 'HQD_DELETED_DOC_IDS_V2',
    STORAGE_KEY_PENDING_ACKS: 'HQD_PENDING_ACKS_V1',

    // Sync & network behaviour (เหมาะกับผู้ใช้ ~20 คน ไม่ให้ Apps Script ทำงานหนักเกินไป)
    SYNC_INTERVAL_MS: 45000,
    MIN_SYNC_GAP_MS: 8000,
    REQUEST_TIMEOUT_MS: 30000,
    LOGIN_TIMEOUT_MS: 15000,
    UPLOAD_TIMEOUT_MS: 180000,

    // Business rules
    MAX_FILE_MB: 10,
    NEAR_DEADLINE_DAYS: 3,
    OVERRIDE_TTL_MS: 3 * 60 * 1000,
    DELETED_TTL_MS: 10 * 60 * 1000,
    PENDING_LOCAL_DOC_TTL_MS: 2 * 60 * 1000,
    PENDING_ACK_MAX_AGE_MS: 14 * 24 * 60 * 60 * 1000,
    LOGIN_MAX_ATTEMPTS: 5,
    LOGIN_LOCK_MS: 30000,
  };

  // Initialize Supabase Client (if library loaded)
  const supa = (typeof window !== 'undefined' && window.supabase && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY)
    ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
    : null;

  const SORT_OPTIONS = ['date-desc', 'date-asc', 'priority'];
  const SORT_LABELS = {
    'date-desc': 'วันที่: ใหม่ ➔ เก่า',
    'date-asc': 'วันที่: เก่า ➔ ใหม่',
    'priority': 'ความเร่งด่วน'
  };
  const SORT_ICONS = {
    'date-desc': '<i class="fa-solid fa-arrow-down-wide-short text-hqd-600"></i>',
    'date-asc': '<i class="fa-solid fa-arrow-up-short-wide text-hqd-600"></i>',
    'priority': '<i class="fa-solid fa-fire-flame-curved text-rose-500"></i>'
  };
  const PRIORITY_RANK = { 'ด่วนที่สุด': 3, 'ด่วน': 2, 'ปกติ': 1 };
  const DOC_TYPES = ['คำสั่ง', 'ประกาศ', 'หนังสือเวียน', 'บันทึกข้อความ', 'ระเบียบ/ข้อบังคับ', 'หนังสือทั่วไป'];
  const DOC_TYPE_ICONS = {
    'คำสั่ง': 'fa-file-invoice',
    'ประกาศ': 'fa-bullhorn',
    'หนังสือเวียน': 'fa-arrows-split-up-and-left',
    'บันทึกข้อความ': 'fa-note-sticky',
    'ระเบียบ/ข้อบังคับ': 'fa-scale-balanced',
    'หนังสือทั่วไป': 'fa-file-lines'
  };
  const DOC_TYPE_COLORS = {
    'คำสั่ง': 'bg-blue-50 text-blue-700 border-blue-300',
    'ประกาศ': 'bg-indigo-50 text-indigo-700 border-indigo-300',
    'หนังสือเวียน': 'bg-teal-50 text-teal-700 border-teal-300',
    'บันทึกข้อความ': 'bg-amber-50 text-amber-800 border-amber-300',
    'ระเบียบ/ข้อบังคับ': 'bg-purple-50 text-purple-700 border-purple-300',
    'หนังสือทั่วไป': 'bg-slate-50 text-slate-700 border-slate-300'
  };
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const APP_TITLE = 'ระบบเวียนเอกสาร HQD';


  /* Default Master Personnel Seed (from Google Sheet 167gvGXW7EeK4fdKJED1TKhqRiMJmFkte5-sH3Ybigk8)
     ใช้เฉพาะตอนเปิดครั้งแรกก่อนเชื่อมต่อเซิร์ฟเวอร์ได้เท่านั้น */
  const DEFAULT_USERS_SEED = [
    { id: "000826", pin: "000826", name: "นาง วันทนา วีระถาวร", department: "พยาบาล", role: "user", email: "" },
    { id: "001668", pin: "001668", name: "น.ส. ณัฏฐ์พิชญา ศรีตพงษ์", department: "เจ้าหน้าที่บริหารงานทั่วไป", role: "user", email: "" },
    { id: "002610", pin: "002610", name: "น.ส. เสาวลักษณ์ เจริญสวัสดิ์", department: "นักวิชาการพัฒนาคุณภาพ", role: "user", email: "" },
    { id: "003308", pin: "003308", name: "น.ส. วิมลภัทร์ โพธิ์ปริสุทธิ์", department: "เจ้าหน้าที่บริหารงานทั่วไป", role: "user", email: "" },
    { id: "003613", pin: "003613", name: "น.ส. อัญชลี วงศ์ใหญ่", department: "พยาบาล", role: "user", email: "" },
    { id: "003917", pin: "003917", name: "นาง พิมพ์สิรี กุลณัฐโภคิน", department: "พยาบาล", role: "user", email: "" },
    { id: "004129", pin: "004129", name: "นาง นันทนา สุขสมนิรันดร", department: "พยาบาล", role: "user", email: "" },
    { id: "004438", pin: "004438", name: "น.ส. กษมา ดุจเพ็ญ", department: "เจ้าหน้าที่บริหารงานทั่วไป", role: "user", email: "" },
    { id: "004734", pin: "004734", name: "น.ส. นฤมล เกียรติศิริกุล", department: "พยาบาล", role: "user", email: "" },
    { id: "005311", pin: "005311", name: "น.ส. ศกุณา เกิดเอนก", department: "ผู้ปฏิบัติงานบริหาร", role: "user", email: "" },
    { id: "007931", pin: "007931", name: "น.ส. วิมลรัตน์ ชูรักษา", department: "พยาบาล", role: "user", email: "" },
    { id: "010262", pin: "010262", name: "น.ส. นลิน เอี่ยมทัพ", department: "นักวิชาการพัฒนาคุณภาพ", role: "user", email: "" },
    { id: "010268", pin: "010268", name: "น.ส. ณัฐภรณ์ เกิดลอย", department: "นักบริหารความเสี่ยง", role: "user", email: "" },
    { id: "010291", pin: "010291", name: "น.ส. พิมพ์รัตน์ ชาญปรีชญา", department: "นักวิชาการพัฒนาคุณภาพ", role: "user", email: "" },
    { id: "010363", pin: "010363", name: "น.ส. นิภาพร จีนไม้", department: "นักวิชาการพัฒนาคุณภาพ", role: "user", email: "" },
    { id: "010427", pin: "010427", name: "นาง ศิริลักษณ์ เกี่ยวข้อง", department: "นักวิเคราะห์นโยบายและแผน", role: "user", email: "" },
    { id: "010480", pin: "010480", name: "นาง รังสิมา เกียรติยุทธชาติ", department: "นักวิชาการพัฒนาคุณภาพ", role: "user", email: "" },
    { id: "011587", pin: "011587", name: "น.ส. วิภาวี จำนงค์พลี", department: "พยาบาล", role: "user", email: "" },
    { id: "011652", pin: "011652", name: "น.ส. รุจิลาภา จิรภาสคูณบุญ", department: "เจ้าหน้าที่บริหารงานทั่วไป", role: "user", email: "" },
    { id: "014151", pin: "014151", name: "น.ส. มะลิวัลย์ แสงห้าว", department: "นักบริหารความเสี่ยง", role: "user", email: "" },
    { id: "015467", pin: "015467", name: "น.ส. อังคณา ประการะโพธิ์", department: "ผู้ปฏิบัติงานบริหาร", role: "admin", email: "" },
    { id: "020256", pin: "020256", name: "น.ส. ชมพูนุช เรืองประภาวุฒิ", department: "นักสังคมสงเคราะห์", role: "user", email: "" },
    { id: "020482", pin: "020482", name: "นาย ธนพล จันทรพร", department: "เจ้าหน้าที่บริหารงานทั่วไป", role: "admin", email: "jarbtanapol@gmail.com" },
    { id: "022655", pin: "022655", name: "น.ส. สมหมาย กุมผัน", department: "พยาบาล", role: "user", email: "" },
    { id: "029744", pin: "029744", name: "นาย ทศพล อินทจักร", department: "นักวิชาการพัฒนาคุณภาพ", role: "user", email: "" },
    { id: "029761", pin: "029761", name: "น.ส. รัตติกร เสนเอี่ยม", department: "นักบริหารความเสี่ยง", role: "user", email: "" }
  ];

  /* ==========================================================================
     2. GLOBAL STATE MANAGEMENT (SPA)
     ========================================================================== */
  const state = {
    currentUser: null,        // Currently logged-in user object (ไม่มี PIN)
    users: [],                // Master list of personnel
    documents: [],            // Master list of circular documents
    activeTab: 'docs',        // 'docs' | 'users'
    docSubTab: 'pending',     // 'pending' (ยังไม่อ่าน) | 'acked' (อ่านแล้ว) | 'all' (ทั้งหมด)
    isSyncing: false,         // Background sync flag
    syncPromise: null,        // Shared promise for concurrent sync callers
    lastSyncAt: 0,            // Timestamp of last sync attempt
    lastSyncOkAt: 0,          // Timestamp of last successful sync
    serverSupportsLogin: null,// true = Apps Script เวอร์ชันใหม่ (ตรวจ PIN ฝั่งเซิร์ฟเวอร์)
    dataSignature: '',        // ใช้ตรวจว่าข้อมูลเปลี่ยนจริงก่อน re-render
    modalStack: [],           // Stack of open modals [{ id, returnFocus }]
    busyModals: new Set(),    // Modals that must not be closed (e.g. while uploading)
    confirmResolver: null,    // Resolver for the custom confirm dialog
    selectedCreateFile: null, // File object for upload
    selectedTargetUserIds: new Set(), // Set of selected IDs for 'specific' target
    localFiles: new Map(),    // docId -> File (เปิดดูไฟล์ได้ทันทีแม้ Drive ยังไม่พร้อม, ไม่บันทึกลงเครื่อง)
    viewingDocId: null,       // Document currently open in viewer modal
    trackingDocId: null,      // Document currently open in tracking modal
    viewerObjectUrl: '',      // blob: URL that must be revoked on close
    readDocIds: new Set(),    // Set of doc IDs opened/read by current user
    systemSortOrder: 'date-desc',
    loginFailures: 0,
    loginLockedUntil: 0,
    deptOptionsKey: '',
  };

  /* ==========================================================================
     3. SECURITY & UTILITY FUNCTIONS
     ========================================================================== */
  const $ = (id) => document.getElementById(id);
  const safeOn = (idOrEl, event, handler) => {
    const el = typeof idOrEl === 'string' ? $(idOrEl) : idOrEl;
    if (el) el.addEventListener(event, handler);
  };

  /** Infer document type from title or document properties */
  const inferDocType = (doc) => {
    if (!doc) return 'หนังสือทั่วไป';
    if (doc.docType && doc.docType !== 'all') return doc.docType;
    const t = String(doc.title || '').trim();
    if (/^คำสั่ง/i.test(t)) return 'คำสั่ง';
    if (/^ประกาศ/i.test(t)) return 'ประกาศ';
    if (/^หนังสือเวียน/i.test(t) || /เวียน/i.test(t)) return 'หนังสือเวียน';
    if (/^บันทึกข้อความ/i.test(t) || /^บันทึก/i.test(t)) return 'บันทึกข้อความ';
    if (/^ระเบียบ/i.test(t) || /^ข้อบังคับ/i.test(t)) return 'ระเบียบ/ข้อบังคับ';
    return 'หนังสือทั่วไป';
  };


  /**
   * Escape HTML to strictly prevent Cross-Site Scripting (XSS)
   * Essential requirement for rendering any external API or user input
   */
  const escapeHtml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const nowStamp = () => {
    const now = new Date();
    return `${toYMD(now)} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  };

  /**
   * Normalize staff IDs for comparison.
   * Google Sheet มักแปลง "000826" เป็นตัวเลข 826 — จึงเทียบแบบตัดเลข 0 นำหน้าออก
   */
  const normId = (raw) => {
    const s = String(raw === null || raw === undefined ? '' : raw).trim();
    return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s.toLowerCase();
  };

  /** Map any raw ID to the canonical ID used in the personnel list */
  const canonicalId = (raw) => {
    const s = String(raw === null || raw === undefined ? '' : raw).trim();
    if (!s) return '';
    const key = normId(s);
    const found = state.users.find(u => normId(u.id) === key);
    return found ? found.id : s;
  };

  /** Parse "id1,id2" or array into a de-duplicated list of canonical IDs */
  const parseIdList = (value) => {
    let list = [];
    if (Array.isArray(value)) list = value;
    else if (typeof value === 'string' || typeof value === 'number') list = String(value).split(',');
    const out = [];
    const seen = new Set();
    list.forEach(item => {
      const id = canonicalId(item);
      if (!id || id.toLowerCase() === 'all') return;
      const key = normId(id);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(id);
    });
    return out;
  };

  /**
   * Normalize any date representation to "YYYY-MM-DD" (local date).
   * รองรับ: "2026-10-16", ISO, "Date(2026,9,16)" (gviz), "16/10/2569", Date.toString() จาก Apps Script
   */
  const normalizeDate = (value) => {
    if (value === null || value === undefined || value === '') return '';
    if (value instanceof Date) return isNaN(value.getTime()) ? '' : toYMD(value);
    const s = String(value).trim();
    if (!s) return '';

    let m = s.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/);
    if (m) return `${m[1]}-${pad2(Number(m[2]) + 1)}-${pad2(m[3])}`;

    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/);
    if (m) {
      const rest = m[4] || '';
      if (/(Z|[+-]\d{2}:?\d{2})$/.test(rest)) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return toYMD(d);
      }
      let y = Number(m[1]);
      if (y > 2400) y -= 543;
      return `${y}-${pad2(m[2])}-${pad2(m[3])}`;
    }

    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      let y = Number(m[3]);
      if (y > 2400) y -= 543;
      return `${y}-${pad2(m[2])}-${pad2(m[1])}`;
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() > 2400) d.setFullYear(d.getFullYear() - 543);
      return toYMD(d);
    }
    return '';
  };

  const ymdToLocalDate = (ymd) => {
    if (!ymd) return null;
    const [y, mo, d] = ymd.split('-').map(Number);
    return new Date(y, mo - 1, d);
  };

  /** Whole days from today until the given date (0 = today, negative = overdue) */
  const daysUntil = (value) => {
    const target = ymdToLocalDate(normalizeDate(value));
    if (!target) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  };

  const toTimestamp = (value) => {
    if (!value) return 0;
    const direct = new Date(value).getTime();
    if (!isNaN(direct)) return direct;
    const d = ymdToLocalDate(normalizeDate(value));
    return d ? d.getTime() : 0;
  };

  /**
   * Format Thai Date (e.g., "26 ก.ย. 2569")
   */
  const formatThaiDate = (value) => {
    const ymd = normalizeDate(value);
    if (!ymd) return '-';
    const [y, m, d] = ymd.split('-').map(Number);
    return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
  };

  /**
   * Format Thai Date & Time (e.g., "26 ก.ย. 2569 เวลา 10:30 น.")
   */
  const formatThaiDateTime = (value) => {
    const s = String(value || '').trim();
    if (!s) return '-';
    const m = s.match(/^(\d{4}-\d{1,2}-\d{1,2})[ T](\d{1,2}):(\d{2})/);
    if (m && !/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
      return `${formatThaiDate(m[1])} เวลา ${pad2(m[2])}:${m[3]} น.`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${formatThaiDate(toYMD(d))} เวลา ${pad2(d.getHours())}:${pad2(d.getMinutes())} น.`;
    }
    return formatThaiDate(s);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())} น.`;
  };

  const normalizePriority = (value) => {
    let p = String(value || 'ปกติ').trim();
    if (p === 'ด่วนมาก') p = 'ด่วน';
    return PRIORITY_RANK[p] ? p : 'ปกติ';
  };

  const isCurrentAdmin = () => !!(state.currentUser && state.currentUser.role === 'admin');
  const meId = () => (state.currentUser ? state.currentUser.id : '');

  /**
   * Elder-friendly Toast Notification System
   */
  const showToast = (message, type = 'info', duration = 4500) => {
    const container = $('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg p-4 text-lg font-bold flex items-center gap-3 transition-all cursor-pointer pointer-events-auto border-2';
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    let iconClass = 'fa-solid fa-circle-info text-hqd-600 text-2xl';
    let bgClasses = 'bg-white text-slate-800 border-slate-300';

    if (type === 'success') {
      iconClass = 'fa-solid fa-circle-check text-emerald-600 text-3xl';
      bgClasses = 'bg-emerald-50 text-emerald-900 border-emerald-400';
    } else if (type === 'error') {
      iconClass = 'fa-solid fa-triangle-exclamation text-rose-600 text-3xl';
      bgClasses = 'bg-rose-50 text-rose-900 border-rose-400';
      duration = Math.max(duration, 7000);
    } else if (type === 'warning') {
      iconClass = 'fa-solid fa-circle-exclamation text-amber-600 text-3xl';
      bgClasses = 'bg-amber-50 text-amber-900 border-amber-400';
      duration = Math.max(duration, 6000);
    }

    toast.className += ` ${bgClasses}`;
    toast.innerHTML = `
      <i class="${iconClass}" aria-hidden="true"></i>
      <div class="flex-1">${escapeHtml(message)}</div>
      <button type="button" class="text-slate-400 hover:text-slate-700 text-xl p-1" aria-label="ปิดข้อความ">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    `;

    toast.addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    // จำกัดจำนวน toast บนจอ ไม่ให้รกสายตา
    while (container.children.length > 4) container.firstElementChild.remove();

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  };

  /** Download rows as an Excel-friendly UTF-8 CSV (with BOM for Thai text) */
  const downloadCsv = (filename, rows) => {
    const escapeCell = (cell) => {
      let s = String(cell === null || cell === undefined ? '' : cell);
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // ป้องกัน CSV/Formula injection
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  };

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });

  /* ==========================================================================
     4. STATUS & GLOW EFFECT ENGINE (Core Requirement)
     ========================================================================== */
  const isAssignedTo = (doc, userId) =>
    doc.targetType === 'all' || (Array.isArray(doc.targetUsers) && doc.targetUsers.includes(userId));

  const isAckedBy = (doc, userId) =>
    Array.isArray(doc.acknowledgedUsers) && doc.acknowledgedUsers.includes(userId);

  /** Targets of a document limited to people who still exist in the personnel list */
  const getDocTargets = (doc) => {
    if (doc.targetType === 'all') return state.users.map(u => u.id);
    const ids = Array.isArray(doc.targetUsers) ? doc.targetUsers : [];
    if (state.users.length === 0) return ids;
    const known = new Set(state.users.map(u => u.id));
    return ids.filter(id => known.has(id));
  };

  /** Accurate acknowledgement stats (นับเฉพาะผู้ที่เป็นกลุ่มเป้าหมายจริง) */
  const getDocStats = (doc) => {
    const targets = getDocTargets(doc);
    const ackSet = new Set(doc.acknowledgedUsers || []);
    const ackedIds = targets.filter(id => ackSet.has(id));
    const total = targets.length;
    return {
      targets,
      ackSet,
      ackedIds,
      ackCount: ackedIds.length,
      total,
      percent: total ? Math.round((ackedIds.length / total) * 100) : 0,
      isComplete: total > 0 && ackedIds.length >= total
    };
  };

  /**
   * Determine Document Status and Glow Effect Class
   * 🟢 Green: Admin = รับทราบครบทุกคน / User = ท่านรับทราบแล้ว
   * 🟡 Yellow/Orange: Near deadline within 3 days (รวมวันนี้)
   * 🔴 Red: Overdue and still not acknowledged
   * ⚪ None: Normal document
   */
  const calculateDocStatus = (doc) => {
    const isAdmin = isCurrentAdmin();
    const stats = getDocStats(doc);
    const done = isAdmin ? stats.isComplete : isAckedBy(doc, meId());

    if (done) {
      return {
        glowClass: 'glow-green',
        statusKey: 'glow-green',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        iconHtml: '<i class="fa-solid fa-circle-check text-emerald-600" aria-hidden="true"></i>',
        text: isAdmin ? 'รับทราบครบทุกคน' : 'ท่านรับทราบแล้ว',
        days: null,
        stats
      };
    }

    const days = daysUntil(doc.endDate);

    if (days === null) {
      return {
        glowClass: 'glow-none',
        statusKey: 'glow-none',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
        iconHtml: '<i class="fa-solid fa-calendar text-slate-500" aria-hidden="true"></i>',
        text: 'ไม่ระบุวันครบกำหนด',
        days,
        stats
      };
    }

    if (days < 0) {
      return {
        glowClass: 'glow-red',
        statusKey: 'glow-red',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
        iconHtml: '<i class="fa-solid fa-circle-exclamation text-rose-600" aria-hidden="true"></i>',
        text: `เกินกำหนด ${Math.abs(days)} วัน`,
        days,
        stats
      };
    }

    if (days <= CONFIG.NEAR_DEADLINE_DAYS) {
      return {
        glowClass: 'glow-yellow',
        statusKey: 'glow-yellow',
        badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
        iconHtml: '<i class="fa-solid fa-clock text-amber-600" aria-hidden="true"></i>',
        text: days === 0 ? 'ครบกำหนดวันนี้!' : `เหลืออีก ${days} วัน`,
        days,
        stats
      };
    }

    return {
      glowClass: 'glow-none',
      statusKey: 'glow-none',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      iconHtml: '<i class="fa-solid fa-calendar text-slate-500" aria-hidden="true"></i>',
      text: `เหลือเวลา ${days} วัน`,
      days,
      stats
    };
  };

  /* ==========================================================================
     5. PERSISTENCE & LOCAL CACHE (Instant 0s Load)
     ========================================================================== */
  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const writeJSON = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('localStorage write failed:', key, e);
      return false;
    }
  };

  // --- Session (จดจำในเครื่อง = localStorage, ไม่จดจำ = sessionStorage) ---
  const sessionSafeUser = (u) => u ? ({
    id: u.id, name: u.name, department: u.department, role: u.role, email: u.email || ''
  }) : null;

  const saveSession = (user, remember) => {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEY_USER);
      sessionStorage.removeItem(CONFIG.STORAGE_KEY_USER);
      const store = remember ? localStorage : sessionStorage;
      store.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(sessionSafeUser(user)));
    } catch (e) {
      console.warn('saveSession error:', e);
    }
  };

  const loadSession = () => {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_USER) || sessionStorage.getItem(CONFIG.STORAGE_KEY_USER);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  };

  const updateStoredSession = () => {
    if (!state.currentUser) return;
    let remember = true;
    try { remember = localStorage.getItem(CONFIG.STORAGE_KEY_USER) !== null || sessionStorage.getItem(CONFIG.STORAGE_KEY_USER) === null; } catch { /* ignore */ }
    saveSession(state.currentUser, remember);
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(CONFIG.STORAGE_KEY_USER);
      sessionStorage.removeItem(CONFIG.STORAGE_KEY_USER);
    } catch { /* ignore */ }
  };

  // --- Role overrides (ใช้ชั่วคราวระหว่างรอเซิร์ฟเวอร์ยืนยัน) ---
  const getRoleOverrides = () => {
    const all = readJSON(CONFIG.STORAGE_KEY_OVERRIDES, {});
    const now = Date.now();
    const valid = {};
    Object.keys(all || {}).forEach(id => {
      const o = all[id];
      if (o && o.role && now - (o.timestamp || 0) < CONFIG.OVERRIDE_TTL_MS) valid[id] = o;
    });
    return valid;
  };

  const saveRoleOverride = (userId, role) => {
    const overrides = getRoleOverrides();
    overrides[userId] = { role, timestamp: Date.now() };
    writeJSON(CONFIG.STORAGE_KEY_OVERRIDES, overrides);
  };

  const deleteRoleOverride = (userId) => {
    const overrides = getRoleOverrides();
    delete overrides[userId];
    writeJSON(CONFIG.STORAGE_KEY_OVERRIDES, overrides);
  };

  // --- Opened (viewed) documents per user ---
  const loadUserReadDocs = (userId) => {
    const all = readJSON(CONFIG.STORAGE_KEY_READ_DOCS, {});
    state.readDocIds = new Set(userId && all[userId] ? all[userId] : []);
  };

  const markDocAsRead = (docId) => {
    if (!state.currentUser || !docId) return;
    const userId = state.currentUser.id;
    state.readDocIds.add(docId);
    const all = readJSON(CONFIG.STORAGE_KEY_READ_DOCS, {});
    const list = new Set(all[userId] || []);
    list.add(docId);
    all[userId] = Array.from(list).slice(-300);
    writeJSON(CONFIG.STORAGE_KEY_READ_DOCS, all);
  };

  const hasDocBeenRead = (docId) => state.readDocIds.has(docId);

  // --- Deleted documents tracker (กันเอกสารที่เพิ่งลบโผล่กลับมาระหว่างซิงค์) ---
  const getDeletedDocIds = () => {
    const map = readJSON(CONFIG.STORAGE_KEY_DELETED, {});
    const now = Date.now();
    const valid = {};
    Object.keys(map || {}).forEach(id => {
      if (now - map[id] < CONFIG.DELETED_TTL_MS) valid[id] = map[id];
    });
    return valid;
  };

  const addDeletedDocId = (docId) => {
    const map = getDeletedDocIds();
    map[docId] = Date.now();
    writeJSON(CONFIG.STORAGE_KEY_DELETED, map);
  };

  const removeDeletedDocId = (docId) => {
    const map = getDeletedDocIds();
    delete map[docId];
    writeJSON(CONFIG.STORAGE_KEY_DELETED, map);
  };

  // --- Pending acknowledgements queue (ส่งซ้ำอัตโนมัติจนกว่าเซิร์ฟเวอร์ยืนยัน) ---
  const getPendingAcks = () => {
    const list = readJSON(CONFIG.STORAGE_KEY_PENDING_ACKS, []);
    const now = Date.now();
    return (Array.isArray(list) ? list : []).filter(a => a && a.docId && a.userId && now - (a.queuedAt || 0) < CONFIG.PENDING_ACK_MAX_AGE_MS);
  };

  const addPendingAck = (docId, userId, ackAt) => {
    const list = getPendingAcks().filter(a => !(a.docId === docId && a.userId === userId));
    list.push({ docId, userId, ackAt, queuedAt: Date.now() });
    writeJSON(CONFIG.STORAGE_KEY_PENDING_ACKS, list);
  };

  const removePendingAck = (docId, userId) => {
    writeJSON(CONFIG.STORAGE_KEY_PENDING_ACKS, getPendingAcks().filter(a => !(a.docId === docId && a.userId === userId)));
  };

  // --- Master data cache ---
  const saveToLocalCache = () => {
    const stripPins = state.serverSupportsLogin === true;
    const users = state.users.map(u => {
      if (!stripPins) return u;
      const { pin, ...rest } = u;
      return rest;
    });
    // ห้ามเก็บไฟล์ base64 ลง localStorage (เกินโควตาและทำให้แคชทั้งก้อนบันทึกไม่ได้)
    const documents = state.documents.map(d => {
      const { fileBase64, ...rest } = d;
      if (rest.fileUrl && /^(data|blob):/.test(rest.fileUrl)) rest.fileUrl = '';
      return rest;
    });
    writeJSON(CONFIG.STORAGE_KEY_DATA, {
      users,
      documents,
      serverSupportsLogin: state.serverSupportsLogin,
      savedAt: new Date().toISOString()
    });
  };

  const loadFromLocalCache = () => {
    // Clean up obsolete cache keys (เคยเก็บไฟล์ base64 ทำให้พื้นที่เต็ม)
    ['HQD_APP_DATA_V1', 'HQD_READ_DOCS_V1', 'HQD_DOC_FILES_V1', 'HQD_DELETED_DOC_IDS_V1'].forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });

    const savedSort = localStorage.getItem(CONFIG.STORAGE_KEY_SORT);
    state.systemSortOrder = SORT_OPTIONS.includes(savedSort) ? savedSort : 'date-desc';

    const cached = readJSON(CONFIG.STORAGE_KEY_DATA, null);
    if (cached && Array.isArray(cached.users) && cached.users.length > 0) {
      state.users = cached.users.map(normalizeUser).filter(Boolean);
    } else {
      state.users = DEFAULT_USERS_SEED.map(normalizeUser);
    }
    state.documents = cached && Array.isArray(cached.documents)
      ? cached.documents.filter(d => d && d.id).map(d => ({ ...d, isPendingLocal: false }))
      : [];
    if (cached && typeof cached.serverSupportsLogin === 'boolean') {
      state.serverSupportsLogin = cached.serverSupportsLogin;
    }

    applyRoleOverrides();
    mergePendingAcksIntoDocs();

    const session = loadSession();
    if (session) {
      const match = state.users.find(u => normId(u.id) === normId(session.id));
      state.currentUser = sessionSafeUser(match || session);
      loadUserReadDocs(state.currentUser.id);
    }
  };

  const applyRoleOverrides = () => {
    const overrides = getRoleOverrides();
    state.users = state.users.map(u => {
      const o = overrides[u.id];
      if (!o) return u;
      if (o.role === u.role) return u;
      return { ...u, role: o.role };
    });
  };

  /** Re-apply locally queued acknowledgements so they never "disappear" from the UI */
  const mergePendingAcksIntoDocs = () => {
    const pending = getPendingAcks();
    if (!pending.length) return;
    pending.forEach(p => {
      const doc = state.documents.find(d => d.id === p.docId);
      if (!doc) return;
      if (!Array.isArray(doc.acknowledgedUsers)) doc.acknowledgedUsers = [];
      if (!doc.acknowledgedUsers.includes(p.userId)) doc.acknowledgedUsers.push(p.userId);
      if (!doc.acknowledgedDetails) doc.acknowledgedDetails = {};
      if (!doc.acknowledgedDetails[p.userId]) doc.acknowledgedDetails[p.userId] = p.ackAt;
    });
  };

  /* ==========================================================================
     6. SERVER API (Google Apps Script) — อ่านผลตอบกลับจริงทุกครั้ง
     ========================================================================== */
  class ApiError extends Error {
    constructor(message, { network = false, timeout = false } = {}) {
      super(message);
      this.network = network;
      this.timeout = timeout;
    }
  }

  /**
   * POST to Apps Script. Uses text/plain to avoid CORS preflight; follows the 302 redirect
   * and parses the JSON body. Throws ApiError on network/timeout/invalid response.
   */
  const apiPost = async (action, body = {}, { timeout = CONFIG.REQUEST_TIMEOUT_MS } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, actorId: meId(), ...body }),
        redirect: 'follow',
        signal: controller.signal
      });
      if (!res.ok) throw new ApiError(`เซิร์ฟเวอร์ตอบกลับผิดพลาด (HTTP ${res.status})`, { network: true });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new ApiError('เซิร์ฟเวอร์ตอบกลับในรูปแบบที่ไม่ถูกต้อง (ตรวจสอบการ Deploy Apps Script)', { network: true });
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err && err.name === 'AbortError') throw new ApiError('หมดเวลารอการตอบกลับจากเซิร์ฟเวอร์', { network: true, timeout: true });
      throw new ApiError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต', { network: true });
    } finally {
      clearTimeout(timer);
    }
  };

  const isSuccess = (r) => !!(r && r.status === 'success');
  const isUnsupportedAction = (r) => !!(r && r.status === 'error' && /ไม่พบ Action/i.test(String(r.message || '')));
  const NEED_GAS_UPDATE_MSG = 'ฟังก์ชันนี้ต้องใช้ Google Apps Script เวอร์ชันใหม่ กรุณาให้ผู้ดูแลระบบอัปเดตโค้ดตามคู่มือ README';

  /* ==========================================================================
     7. SERVER TWO-WAY SYNC (Background Fetch, Stale-While-Revalidate)
     ========================================================================== */
  const updateSyncIndicator = (status, message) => {
    const dot = $('sync-indicator-dot');
    const text = $('sync-status-text');
    const wrap = $('sync-status');
    if (!dot || !text) return;

    const pendingCount = getPendingAcks().length;
    let label = message || '';

    if (status === 'syncing') {
      dot.className = 'w-3 h-3 rounded-full syncing-dot inline-block';
      label = 'กำลังซิงค์...';
    } else if (status === 'success') {
      dot.className = `w-3 h-3 rounded-full ${pendingCount ? 'bg-amber-500' : 'bg-emerald-500'} inline-block`;
      label = label || 'พร้อมใช้งาน';
    } else if (status === 'error') {
      dot.className = 'w-3 h-3 rounded-full bg-rose-500 inline-block';
      label = label || 'ออฟไลน์ (ใช้ข้อมูลในเครื่อง)';
    }

    if (pendingCount) label += ` • รอส่ง ${pendingCount}`;
    text.textContent = label;

    const lastOk = state.lastSyncOkAt ? `อัปเดตล่าสุด ${formatTime(state.lastSyncOkAt)}` : 'ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์';
    if (wrap) wrap.title = `${label} — ${lastOk}`;
  };

  const normalizeUser = (u) => {
    if (!u) return null;
    const id = String(u.id === null || u.id === undefined ? '' : u.id).trim();
    if (!id) return null;
    const user = {
      id,
      name: String(u.name || '').trim() || `รหัส ${id}`,
      department: String(u.department || '').trim(),
      role: String(u.role || 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user',
      email: String(u.email || '').trim()
    };
    if (u.pin !== undefined && u.pin !== null && String(u.pin).trim() !== '') user.pin = String(u.pin).trim();
    return user;
  };

  const extractTitleAndUrl = (rawTitle, rawUrl) => {
    let title = String(rawTitle || '').trim();
    let fileUrl = String(rawUrl || '').trim();
    const linkMatch = title.match(/\s*\((https?:\/\/[^)\s]+)\)/);
    if (linkMatch) {
      if (!fileUrl) fileUrl = linkMatch[1];
      title = title.replace(linkMatch[0], '').trim();
    }
    return { title, fileUrl };
  };

  /** Convert a raw server document (from GAS or gviz) to the client model */
  const normalizeServerDoc = (d) => {
    const id = String(d.id === null || d.id === undefined ? '' : d.id).trim();
    if (!id) return null;

    const { title, fileUrl } = extractTitleAndUrl(d.title, d.fileUrl);
    const audience = String(d.targetAudience || '').trim();
    const isAll = d.targetType === 'all' || audience.toLowerCase() === 'all' || (!audience && !(Array.isArray(d.targetUsers) && d.targetUsers.length));
    const targetUsers = isAll ? [] : parseIdList(Array.isArray(d.targetUsers) && d.targetUsers.length ? d.targetUsers : audience);

    const acknowledgedUsers = parseIdList(d.acknowledgedUsers !== undefined ? d.acknowledgedUsers : d.readStatus);
    const acknowledgedDetails = {};
    if (d.acknowledgedDetails && typeof d.acknowledgedDetails === 'object') {
      Object.keys(d.acknowledgedDetails).forEach(k => {
        const cid = canonicalId(k);
        if (cid) acknowledgedDetails[cid] = String(d.acknowledgedDetails[k] || '');
      });
    }

    const docType = d.docType || d.category || inferDocType({ title });

    return {
      id,
      title: title || 'เอกสารเวียน',
      docType,
      fileUrl,
      fileName: d.fileName || '',
      fileMime: d.fileMime || '',
      priority: normalizePriority(d.priority || d.urgencyLevel),
      startDate: normalizeDate(d.startDate),
      endDate: normalizeDate(d.endDate),
      targetType: isAll ? 'all' : 'specific',
      targetUsers,
      acknowledgedUsers,
      acknowledgedDetails,
      createdBy: String(d.createdBy || '').trim(),
      createdAt: d.createdAt ? String(d.createdAt) : '',
      isPendingLocal: false
    };
  };

  /** Build a compact signature to skip unnecessary re-renders */
  const computeSignature = () => JSON.stringify({
    u: state.users.map(u => [u.id, u.name, u.department, u.role, u.email]),
    d: state.documents.map(d => [d.id, d.title, d.fileUrl ? 1 : 0, d.priority, d.startDate, d.endDate, d.targetType, d.targetUsers, d.acknowledgedUsers]),
    s: state.systemSortOrder
  });

  /**
   * Apply fresh server data while preserving in-flight local changes
   */
  const applyServerData = ({ users, docs, config }) => {
    const overrides = getRoleOverrides();

    if (Array.isArray(users) && users.length > 0) {
      const normalized = users.map(normalizeUser).filter(Boolean);
      if (normalized.length > 0) {
        state.users = normalized.map(u => {
          const o = overrides[u.id];
          if (!o) return u;
          if (o.role === u.role) {
            deleteRoleOverride(u.id); // เซิร์ฟเวอร์อัปเดตแล้ว
            return u;
          }
          return { ...u, role: o.role };
        });
        if (isCurrentAdmin()) {
          populateTargetUserFilter();
        }
      }
    }

    if (config && SORT_OPTIONS.includes(String(config.documentSortOrder || '').trim())) {
      state.systemSortOrder = String(config.documentSortOrder).trim();
      localStorage.setItem(CONFIG.STORAGE_KEY_SORT, state.systemSortOrder);
    }

    if (Array.isArray(docs)) {
      const deleted = getDeletedDocIds();
      const previous = new Map(state.documents.map(d => [d.id, d]));
      const serverDocs = docs.map(normalizeServerDoc).filter(d => d && !deleted[d.id]);
      const serverIds = new Set(serverDocs.map(d => d.id));

      // Keep previously-known ack times if the server doesn't store them (Apps Script รุ่นเก่า)
      serverDocs.forEach(doc => {
        const prev = previous.get(doc.id);
        if (prev && prev.acknowledgedDetails) {
          Object.keys(prev.acknowledgedDetails).forEach(uid => {
            if (!doc.acknowledgedDetails[uid] && doc.acknowledgedUsers.includes(uid)) {
              doc.acknowledgedDetails[uid] = prev.acknowledgedDetails[uid];
            }
          });
        }
        if (!doc.fileUrl && prev && prev.fileUrl && !/^(data|blob):/.test(prev.fileUrl)) doc.fileUrl = prev.fileUrl;
      });

      const pendingLocal = state.documents.filter(d =>
        d.isPendingLocal &&
        !serverIds.has(d.id) &&
        !deleted[d.id] &&
        Date.now() - toTimestamp(d.createdAt) < CONFIG.PENDING_LOCAL_DOC_TTL_MS
      );

      state.documents = [...pendingLocal, ...serverDocs];
      mergePendingAcksIntoDocs();

      // Drop queued acks that the server already has
      getPendingAcks().forEach(p => {
        const sd = serverDocs.find(d => d.id === p.docId);
        if (!sd && serverIds.size > 0 && !state.documents.some(d => d.id === p.docId)) removePendingAck(p.docId, p.userId);
      });
    }
  };

  /** Keep the logged-in session in sync with the personnel list */
  const syncCurrentUserWithList = (fromServer) => {
    if (!state.currentUser) return;
    const match = state.users.find(u => normId(u.id) === normId(state.currentUser.id));
    if (!match) {
      if (fromServer && state.users.length > 0) {
        showToast('บัญชีของท่านไม่อยู่ในรายชื่อบุคลากรแล้ว กรุณาติดต่อผู้ดูแลระบบ', 'error');
        logout({ silent: true });
      }
      return;
    }
    const before = JSON.stringify(sessionSafeUser(state.currentUser));
    const roleChanged = state.currentUser.role !== match.role;
    state.currentUser = sessionSafeUser(match);
    if (JSON.stringify(state.currentUser) !== before) {
      updateStoredSession();
      if (roleChanged) {
        showToast(`สิทธิ์ของท่านถูกเปลี่ยนเป็น ${match.role === 'admin' ? 'ผู้ดูแลระบบ' : 'บุคลากรทั่วไป'}`, 'info');
      }
      renderAppView();
    }
  };

  const fetchFromGas = async () => {
    try {
      const result = await apiPost('getAppData');
      if (isSuccess(result) && result.data) {
        if (result.data.capabilities && result.data.capabilities.login) state.serverSupportsLogin = true;
        applyServerData({ users: result.data.users, docs: result.data.docs, config: result.data.config });
        return true;
      }
      console.warn('getAppData error:', result && result.message);
    } catch (err) {
      console.warn('GAS sync failed:', err.message);
    }
    return false;
  };

  /** Read gviz cell: prefer formatted text for IDs, raw value for dates */
  const gvizText = (cell) => {
    if (!cell) return '';
    const v = cell.f !== undefined && cell.f !== null ? cell.f : cell.v;
    return v === null || v === undefined ? '' : String(v).trim();
  };
  const gvizDate = (cell) => (cell ? normalizeDate(cell.v !== null && cell.v !== undefined ? cell.v : cell.f) : '');
  const isHeaderRow = (cell) => /^(id|doc.?id|รหัส.*|staff.?id)$/i.test(gvizText(cell));

  const parseGviz = async (res) => {
    const text = await res.text();
    return JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
  };

  /** Fallback (read-only): Google Sheet public visualization API */
  const fetchFromGviz = async () => {
    try {
      const base = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_MASTER_ID}/gviz/tq?tqx=out:json&sheet=`;
      const [uRes, dRes] = await Promise.all([fetch(base + 'Users'), fetch(base + 'Documents')]);
      if (!uRes.ok && !dRes.ok) return false;

      let users = null;
      if (uRes.ok) {
        const parsed = await parseGviz(uRes);
        const rows = (parsed && parsed.table && parsed.table.rows) || [];
        users = rows
          .filter(r => r.c && r.c[0] && gvizText(r.c[0]) && !isHeaderRow(r.c[0]))
          .map(r => ({
            id: gvizText(r.c[0]),
            pin: gvizText(r.c[1]) || gvizText(r.c[0]),
            name: gvizText(r.c[2]),
            department: gvizText(r.c[3]),
            role: gvizText(r.c[4]),
            email: gvizText(r.c[5])
          }));
        // apply users first so doc IDs canonicalize correctly
        applyServerData({ users });
      }

      let docs = null;
      if (dRes.ok) {
        const parsed = await parseGviz(dRes);
        const rows = (parsed && parsed.table && parsed.table.rows) || [];
        docs = rows
          .filter(r => r.c && r.c[0] && gvizText(r.c[0]) && !isHeaderRow(r.c[0]))
          .map(r => {
            const c = r.c;
            let details = {};
            try { details = c[9] && c[9].v ? JSON.parse(String(c[9].v)) : {}; } catch { details = {}; }
            return {
              id: gvizText(c[0]),
              createdAt: c[1] ? String(c[1].f || c[1].v || '') : '',
              title: gvizText(c[2]),
              priority: gvizText(c[4]) || gvizText(c[3]),
              startDate: gvizDate(c[5]),
              endDate: gvizDate(c[6]),
              targetAudience: gvizText(c[7]) || 'All',
              acknowledgedUsers: gvizText(c[8]),
              acknowledgedDetails: details
            };
          });
        applyServerData({ docs });
      }
      return users !== null || docs !== null;
    } catch (err) {
      console.warn('GViz fallback read failed:', err.message);
      return false;
    }
  };

  /** Retry sending any queued acknowledgements */
  const flushPendingAcks = async () => {
    const pending = getPendingAcks();
    for (const p of pending) {
      try {
        const r = await apiPost('acknowledge', { docId: p.docId, userId: p.userId, ackAt: p.ackAt, actorId: p.userId });
        if (isSuccess(r) || (r && r.status === 'error' && /ไม่พบรหัสเอกสาร/.test(String(r.message || '')))) {
          removePendingAck(p.docId, p.userId);
        }
      } catch {
        break; // ยังออฟไลน์ — ลองใหม่รอบถัดไป
      }
    }
  };

  /**
   * Sync Master Data from Google Apps Script in Background
   */
  const syncWithServer = ({ force = false } = {}) => {
    if (state.isSyncing) return state.syncPromise;
    if (!force && Date.now() - state.lastSyncAt < CONFIG.MIN_SYNC_GAP_MS) return Promise.resolve(false);

    state.isSyncing = true;
    state.lastSyncAt = Date.now();
    updateSyncIndicator('syncing');

    state.syncPromise = (async () => {
      let ok = false;
      let label = '';
      try {
        if (navigator.onLine !== false) {
          // 1. ดึงข้อมูลบุคลากรจาก Supabase แบบ Realtime
          if (supa) {
            try {
              const { data: supaUsers, error: supaErr } = await supa.from('users').select('*').order('id');
              if (!supaErr && Array.isArray(supaUsers) && supaUsers.length > 0) {
                state.users = supaUsers.map(normalizeUser);
                if (isCurrentAdmin()) populateTargetUserFilter();
              }
            } catch (supaFetchErr) {
              console.warn('Supabase users fetch warning:', supaFetchErr);
            }
          }

          // 2. ดึงข้อมูลเอกสารเวียนจาก Supabase แบบ Realtime
          if (supa) {
            try {
              const { data: supaDocs, error: supaDocErr } = await supa
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });

              if (!supaDocErr && Array.isArray(supaDocs) && supaDocs.length > 0) {
                const mappedDocs = supaDocs.map(d => ({
                  id: String(d.id),
                  title: String(d.title || ''),
                  docType: d.doc_type || 'หนังสือเวียน',
                  priority: d.priority || 'ปกติ',
                  startDate: d.start_date ? String(d.start_date) : '',
                  endDate: d.end_date ? String(d.end_date) : '',
                  targetType: d.target_type || 'all',
                  targetUsers: Array.isArray(d.target_users) ? d.target_users.map(String) : [],
                  fileUrl: d.file_url || '',
                  fileName: d.file_name || '',
                  fileMime: d.file_mime || 'application/pdf',
                  acknowledgedUsers: Array.isArray(d.acknowledged_users) ? d.acknowledged_users.map(String) : [],
                  acknowledgedDetails: (d.acknowledged_details && typeof d.acknowledged_details === 'object') ? d.acknowledged_details : {},
                  createdBy: String(d.created_by || ''),
                  createdAt: d.created_at || '',
                  isPendingLocal: false
                }));

                const deleted = getDeletedDocIds();
                const serverIds = new Set(mappedDocs.map(d => d.id));
                const pendingLocal = state.documents.filter(d =>
                  d.isPendingLocal &&
                  !serverIds.has(d.id) &&
                  !deleted[d.id] &&
                  Date.now() - toTimestamp(d.createdAt) < CONFIG.PENDING_LOCAL_DOC_TTL_MS
                );

                state.documents = [...pendingLocal, ...mappedDocs];
                mergePendingAcksIntoDocs();
                ok = true;
                label = 'เชื่อมต่อ Supabase สำเร็จ';
              }
            } catch (supaDocEx) {
              console.warn('Supabase docs fetch warning:', supaDocEx);
            }
          }

          await flushPendingAcks();
          if (!ok) {
            ok = await fetchFromGas();
            label = 'เชื่อมต่อคลาวด์แล้ว';
            if (!ok) {
              ok = await fetchFromGviz();
              label = 'อ่านข้อมูลสำรองจาก Sheet';
            }
          }
        }
      } finally {
        state.isSyncing = false;
      }

      if (ok) {
        state.lastSyncOkAt = Date.now();
        syncCurrentUserWithList(true);
        saveToLocalCache();
        const sig = computeSignature();
        if (sig !== state.dataSignature) {
          state.dataSignature = sig;
          renderCurrentTab();
          refreshOpenModalsAfterSync();
        }
        updateSyncIndicator('success', label);
      } else {
        updateSyncIndicator('error', navigator.onLine === false ? 'ไม่มีอินเทอร์เน็ต' : 'เชื่อมต่อไม่ได้ (ใช้ข้อมูลในเครื่อง)');
      }
      return ok;
    })();

    return state.syncPromise;
  };

  /** If a document open in a modal was deleted/changed by someone else, react gracefully */
  const refreshOpenModalsAfterSync = () => {
    const isOpen = (id) => state.modalStack.some(m => m.id === id);
    if (isOpen('modal-doc-viewer') && state.viewingDocId && !state.documents.some(d => d.id === state.viewingDocId)) {
      closeModal('modal-doc-viewer', { force: true });
      showToast('เอกสารที่ท่านเปิดอยู่ถูกลบออกจากระบบโดยผู้ดูแลระบบแล้ว', 'warning');
    }
    if (isOpen('modal-tracking') && state.trackingDocId) {
      if (state.documents.some(d => d.id === state.trackingDocId)) {
        renderTrackingModal(state.trackingDocId, { keepTab: true });
      } else {
        closeModal('modal-tracking', { force: true });
      }
    }
  };

  /* ==========================================================================
     8. AUTHENTICATION & SESSION MANAGEMENT
     ========================================================================== */
  const setLoginLoading = (loading) => {
    const btn = $('login-submit-btn');
    const text = $('login-submit-text');
    const icon = $('login-submit-icon');
    if (!btn) return;
    btn.disabled = loading;
    btn.classList.toggle('opacity-75', loading);
    btn.classList.toggle('cursor-wait', loading);
    if (text) text.textContent = loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ';
    if (icon) icon.className = loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right';
  };

  const registerLoginFailure = (message) => {
    state.loginFailures += 1;
    if (state.loginFailures >= CONFIG.LOGIN_MAX_ATTEMPTS) {
      state.loginLockedUntil = Date.now() + CONFIG.LOGIN_LOCK_MS;
      state.loginFailures = 0;
      showToast(`กรอกผิดหลายครั้ง กรุณารอ ${CONFIG.LOGIN_LOCK_MS / 1000} วินาทีแล้วลองใหม่`, 'error');
      return;
    }
    showToast(message || 'รหัสพนักงานหรือ PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
    const pinInput = $('login-pin');
    if (pinInput) { pinInput.value = ''; pinInput.focus(); }
  };

  const completeLogin = (user, remember) => {
    state.loginFailures = 0;
    state.currentUser = sessionSafeUser(user);
    saveSession(user, remember);
    loadUserReadDocs(user.id);
    state.docSubTab = 'pending';
    state.activeTab = 'docs';
    state.dataSignature = '';

    showToast(`ยินดีต้อนรับ ${user.name} (${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'บุคลากร'})`, 'success');
    renderAppView();
    syncWithServer({ force: true });
  };

  const login = async (staffId, pin, remember) => {
    const trimmedId = String(staffId || '').trim();
    const trimmedPin = String(pin || '').trim();

    if (!trimmedId || !trimmedPin) {
      showToast('กรุณากรอกรหัสพนักงานและ PIN ให้ครบถ้วน', 'warning');
      return;
    }

    if (Date.now() < state.loginLockedUntil) {
      const wait = Math.ceil((state.loginLockedUntil - Date.now()) / 1000);
      showToast(`กรุณารออีก ${wait} วินาทีแล้วลองใหม่`, 'warning');
      return;
    }

    setLoginLoading(true);
    try {
      // 1) ตรวจสอบผ่าน Supabase ก่อน (ความเร็วสูงระดับมิลลิวินาที)
      if (supa && navigator.onLine !== false) {
        try {
          const { data: supaUser, error: supaErr } = await supa
            .from('users')
            .select('*')
            .eq('id', trimmedId)
            .maybeSingle();

          if (!supaErr && supaUser) {
            const userPin = String(supaUser.pin || '').trim();
            const pinOk = userPin === trimmedPin ||
              (/^\d+$/.test(userPin) && /^\d+$/.test(trimmedPin) && Number(userPin) === Number(trimmedPin));

            if (pinOk) {
              const user = normalizeUser(supaUser);
              const idx = state.users.findIndex(u => normId(u.id) === normId(user.id));
              if (idx >= 0) state.users[idx] = { ...state.users[idx], ...user };
              else state.users.push(user);
              saveToLocalCache();
              completeLogin(user, remember);
              return;
            } else {
              registerLoginFailure('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
              return;
            }
          } else if (!supaErr && !supaUser) {
            registerLoginFailure('ไม่พบรหัสพนักงานนี้ในระบบ');
            return;
          }
        } catch (supaEx) {
          console.warn('Supabase login check failed, falling back:', supaEx);
        }
      }

      // 2) ตรวจสอบกับเซิร์ฟเวอร์ (Apps Script เวอร์ชันใหม่)
      let result = null;
      try {
        result = await apiPost('login', { staffId: trimmedId, pin: trimmedPin }, { timeout: CONFIG.LOGIN_TIMEOUT_MS });
      } catch {
        result = null; // ออฟไลน์ → ใช้การตรวจสอบในเครื่อง
      }

      if (isSuccess(result) && result.user) {
        state.serverSupportsLogin = true;
        const user = normalizeUser(result.user);
        const idx = state.users.findIndex(u => normId(u.id) === normId(user.id));
        if (idx >= 0) state.users[idx] = { ...state.users[idx], ...user };
        else state.users.push(user);
        saveToLocalCache();
        completeLogin(user, remember);
        return;
      }

      if (result && result.status === 'error' && !isUnsupportedAction(result)) {
        state.serverSupportsLogin = true;
        registerLoginFailure(result.message);
        return;
      }

      // 3) Apps Script รุ่นเก่า / ออฟไลน์ → ตรวจสอบจากรายชื่อในเครื่อง
      if (isUnsupportedAction(result)) state.serverSupportsLogin = false;
      if (!state.lastSyncOkAt && navigator.onLine !== false) {
        await syncWithServer({ force: true });
      }

      const key = normId(trimmedId);
      const found = state.users.find(u => normId(u.id) === key);
      if (!found) {
        registerLoginFailure();
        return;
      }
      if (!found.pin) {
        showToast('ไม่สามารถตรวจสอบ PIN ได้ขณะออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่', 'error');
        return;
      }
      const pinOk = found.pin === trimmedPin || (/^\d+$/.test(found.pin) && /^\d+$/.test(trimmedPin) && found.pin.length < trimmedPin.length && Number(found.pin) === Number(trimmedPin));
      if (!pinOk) {
        registerLoginFailure();
        return;
      }
      completeLogin(found, remember);
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = ({ silent = false } = {}) => {
    [...state.modalStack].reverse().forEach(m => closeModal(m.id, { force: true }));
    state.currentUser = null;
    state.readDocIds = new Set();
    state.activeTab = 'docs';
    state.docSubTab = 'pending';
    clearSession();
    ['doc-search-input', 'user-search-input'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    ['doc-status-filter', 'doc-priority-filter', 'user-role-filter', 'user-dept-filter'].forEach(id => { const el = $(id); if (el) el.value = 'all'; });
    document.title = APP_TITLE;
    if (!silent) showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    renderAppView();
  };

  /* ==========================================================================
     9. VIEW ROUTER & NAVIGATION (SPA - ZERO LOCATION.RELOAD)
     ========================================================================== */
  const renderAppView = () => {
    const loginSection = $('login-section');
    const mainSection = $('main-section');

    if (!state.currentUser) {
      loginSection.classList.remove('hidden');
      mainSection.classList.add('hidden');
      const form = $('login-form');
      if (form) form.reset();
      const remember = $('login-remember');
      if (remember) remember.checked = true;
      setTimeout(() => { const id = $('login-id'); if (id) id.focus(); }, 50);
      return;
    }

    loginSection.classList.add('hidden');
    mainSection.classList.remove('hidden');

    const isAdmin = isCurrentAdmin();
    const user = state.currentUser;

    $('header-user-name').textContent = user.name;
    $('header-user-dept').textContent = `${user.department || 'ไม่ระบุแผนก'} (รหัส ${user.id})`;
    $('header-avatar-initial').textContent = (user.name.replace(/^(นาย|นางสาว|นาง|น\.ส\.|ดร\.)\s*/, '').charAt(0)) || 'U';

    const roleBadge = $('user-role-badge');
    if (isAdmin) {
      roleBadge.textContent = 'Admin (ผู้ดูแลระบบ)';
      roleBadge.className = 'hidden sm:inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800 border border-purple-300';
      $('tab-btn-users').classList.remove('hidden');
      $('admin-create-doc-container').classList.remove('hidden');
    } else {
      roleBadge.textContent = 'User (บุคลากร)';
      roleBadge.className = 'hidden sm:inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-hqd-800 border border-hqd-300';
      $('tab-btn-users').classList.add('hidden');
      $('admin-create-doc-container').classList.add('hidden');
      if (state.activeTab === 'users') state.activeTab = 'docs';
    }

    const adminTargetGroup = $('admin-target-filter-group');
    if (adminTargetGroup) {
      adminTargetGroup.classList.toggle('hidden', !isAdmin);
    }
    if (isAdmin) {
      populateTargetUserFilter();
    }

    const legendGreen = $('legend-green-text');
    if (legendGreen) legendGreen.textContent = isAdmin ? 'รับทราบครบทุกคน' : 'ท่านรับทราบแล้ว';
    const statusGreenOpt = document.querySelector('#doc-status-filter option[value="glow-green"]');
    if (statusGreenOpt) statusGreenOpt.textContent = isAdmin ? '🟢 รับทราบครบทุกคน' : '🟢 ท่านรับทราบแล้ว';

    switchTab(state.activeTab);
  };

  const switchTab = (tabName) => {
    if (tabName === 'users' && !isCurrentAdmin()) tabName = 'docs';
    state.activeTab = tabName;
    const tabDocsBtn = $('tab-btn-docs');
    const tabUsersBtn = $('tab-btn-users');

    tabDocsBtn.classList.toggle('active', tabName === 'docs');
    tabUsersBtn.classList.toggle('active', tabName === 'users');
    tabDocsBtn.setAttribute('aria-selected', String(tabName === 'docs'));
    tabUsersBtn.setAttribute('aria-selected', String(tabName === 'users'));
    $('tab-content-docs').classList.toggle('hidden', tabName !== 'docs');
    $('tab-content-users').classList.toggle('hidden', tabName !== 'users');

    renderCurrentTab();
  };

  const renderCurrentTab = () => {
    if (!state.currentUser) return;
    // นับเอกสารค้างเสมอ เพื่ออัปเดต badge/title แม้อยู่หน้าบุคลากร
    if (state.activeTab === 'users') {
      renderPersonnelManagement();
      updatePendingBadges();
    } else {
      renderDocuments();
    }
  };

  const switchDocSubTab = (subTabName) => {
    state.docSubTab = subTabName;
    renderDocuments();
  };

  /* ==========================================================================
     10. RENDER: DOCUMENTS CIRCULATION TAB (With Status Glow Effects & Separation)
     ========================================================================== */
  const getDocBuckets = () => {
    const me = meId();
    const isAdmin = isCurrentAdmin();
    const myDocs = state.documents.filter(d => isAssignedTo(d, me));
    const pending = myDocs.filter(d => !isAckedBy(d, me));
    const acked = myDocs.filter(d => isAckedBy(d, me));
    const all = isAdmin ? state.documents.slice() : myDocs;
    return { myDocs, pending, acked, all };
  };

  const updatePendingBadges = () => {
    if (!state.currentUser) return;
    const { pending } = getDocBuckets();
    const badge = $('badge-doc-count');
    if (badge) {
      badge.textContent = pending.length;
      badge.className = `ml-1 px-2.5 py-0.5 text-sm rounded-full font-bold ${pending.length ? 'bg-rose-500 text-white' : 'bg-hqd-100 text-hqd-800'}`;
    }
    document.title = pending.length ? `(${pending.length}) ${APP_TITLE}` : APP_TITLE;
  };

  const sortDocs = (docs) => {
    const sort = state.systemSortOrder || 'date-desc';
    const time = (d) => (d.startDate ? ymdToLocalDate(d.startDate).getTime() : 0) || toTimestamp(d.createdAt);
    return docs.sort((a, b) => {
      if (sort === 'priority') {
        const diff = (PRIORITY_RANK[b.priority] || 1) - (PRIORITY_RANK[a.priority] || 1);
        if (diff !== 0) return diff;
        const da = daysUntil(a.endDate), db = daysUntil(b.endDate);
        if (da !== null && db !== null && da !== db) return da - db; // ใกล้ครบกำหนดก่อน
        return time(b) - time(a);
      }
      if (sort === 'date-asc') return time(a) - time(b) || toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
      return time(b) - time(a) || toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    });
  };

  const renderDocsSummary = (buckets) => {
    const el = $('docs-summary');
    if (!el) return;
    const isAdmin = isCurrentAdmin();
    const near = buckets.pending.filter(d => { const x = daysUntil(d.endDate); return x !== null && x >= 0 && x <= CONFIG.NEAR_DEADLINE_DAYS; }).length;
    const overdue = buckets.pending.filter(d => { const x = daysUntil(d.endDate); return x !== null && x < 0; }).length;

    let fourth;
    if (isAdmin) {
      let sumAck = 0, sumTotal = 0, incomplete = 0;
      state.documents.forEach(d => {
        const s = getDocStats(d);
        sumAck += s.ackCount;
        sumTotal += s.total;
        if (!s.isComplete) incomplete += 1;
      });
      const rate = sumTotal ? Math.round((sumAck / sumTotal) * 100) : 0;
      fourth = { key: 'all', icon: 'fa-chart-line', tone: 'hqd', value: `${rate}%`, label: 'อัตรารับทราบรวมทั้งหน่วยงาน', sub: `ยังไม่ครบ ${incomplete} จาก ${state.documents.length} ฉบับ` };
    } else {
      fourth = { key: 'acked', icon: 'fa-circle-check', tone: 'emerald', value: buckets.acked.length, label: 'รับทราบแล้ว', sub: 'ฉบับ' };
    }

    const cards = [
      { key: 'pending', icon: 'fa-inbox', tone: buckets.pending.length ? 'rose' : 'emerald', value: buckets.pending.length, label: 'รอท่านรับทราบ', sub: buckets.pending.length ? 'คลิกเพื่อดูรายการ' : 'ไม่มีค้าง เยี่ยมมาก!' },
      { key: 'near', icon: 'fa-hourglass-half', tone: near ? 'amber' : 'slate', value: near, label: `ใกล้ครบกำหนด (≤ ${CONFIG.NEAR_DEADLINE_DAYS} วัน)`, sub: 'ที่ท่านยังไม่รับทราบ' },
      { key: 'overdue', icon: 'fa-triangle-exclamation', tone: overdue ? 'rose' : 'slate', value: overdue, label: 'เกินกำหนดแล้ว', sub: 'ที่ท่านยังไม่รับทราบ' },
      fourth
    ];

    el.innerHTML = cards.map(c => `
      <button type="button" data-summary="${c.key}" class="summary-card summary-${c.tone} text-left p-5 rounded-3xl border-2 bg-white transition flex items-center gap-4 cursor-pointer">
        <span class="summary-icon w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
          <i class="fa-solid ${c.icon}"></i>
        </span>
        <span class="min-w-0">
          <span class="block text-3xl font-bold leading-none summary-value">${escapeHtml(c.value)}</span>
          <span class="block text-base font-bold text-slate-800 mt-1">${escapeHtml(c.label)}</span>
          <span class="block text-sm text-slate-500 truncate">${escapeHtml(c.sub)}</span>
        </span>
      </button>
    `).join('');
  };

  const renderDocCard = (doc) => {
    const me = meId();
    const isAdmin = isCurrentAdmin();
    const statusMeta = calculateDocStatus(doc);
    const stats = statusMeta.stats;
    const assignedToMe = isAssignedTo(doc, me);
    const isAckByMe = isAckedBy(doc, me);
    const myAckTime = isAckByMe && doc.acknowledgedDetails ? doc.acknowledgedDetails[me] : null;
    const hasOpened = hasDocBeenRead(doc.id);
    const isQueued = isAckByMe && getPendingAcks().some(p => p.docId === doc.id && p.userId === me);
    const safeId = escapeHtml(doc.id);

    // Priority Badge: Only 3 levels with distinct Elder-Friendly High-Contrast styling
    // ปกติ: สีเขียวอ่อน | ด่วน: สีส้ม | ด่วนที่สุด: สีแดง
    let priorityClass = 'priority-badge-normal';
    let priorityIcon = '<i class="fa-solid fa-circle-check mr-1.5 text-emerald-600" aria-hidden="true"></i>';
    if (doc.priority === 'ด่วนที่สุด') {
      priorityClass = 'priority-badge-most-urgent';
      priorityIcon = '<i class="fa-solid fa-triangle-exclamation mr-1.5 text-rose-600" aria-hidden="true"></i>';
    } else if (doc.priority === 'ด่วน') {
      priorityClass = 'priority-badge-urgent';
      priorityIcon = '<i class="fa-solid fa-bell mr-1.5 text-amber-600" aria-hidden="true"></i>';
    }

    // Document Type Badge
    const docType = doc.docType || inferDocType(doc);
    const docTypeColor = DOC_TYPE_COLORS[docType] || 'bg-slate-100 text-slate-700 border-slate-300';
    const docTypeIcon = DOC_TYPE_ICONS[docType] || '<i class="fa-solid fa-file-lines mr-1.5" aria-hidden="true"></i>';

    // Target Scope Badge & Label
    const isTargetAll = doc.targetType === 'all';
    const targetBadgeHtml = isTargetAll
      ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-base font-bold bg-indigo-50 text-indigo-700 border border-indigo-200" title="เอกสารนี้เวียนถึงบุคลากรทุกคนในองค์กร">
           <i class="fa-solid fa-bullhorn text-indigo-500" aria-hidden="true"></i><span>ส่งทุกคนในองค์กร</span>
         </span>`
      : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-base font-bold bg-amber-50 text-amber-800 border border-amber-200" title="เอกสารนี้ส่งเจาะจงรายบุคคล">
           <i class="fa-solid fa-user-check text-amber-600" aria-hidden="true"></i><span>ส่งรายบุคคล (${stats.total} คน)</span>
         </span>`;

    const targetLabel = isTargetAll
      ? `บุคลากรทุกคน (${stats.total} คน)`
      : `ระบุเฉพาะบุคคล (${stats.total} คน)`;

    let myActionHtml;
    if (isAckByMe) {
      myActionHtml = `
        <div class="px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-400 text-lg font-bold flex items-center justify-center gap-2 shadow-sm" title="${myAckTime ? `รับทราบเมื่อ ${escapeHtml(formatThaiDateTime(myAckTime))}` : ''}">
          <i class="fa-solid ${isQueued ? 'fa-cloud-arrow-up text-amber-600' : 'fa-circle-check text-emerald-600'} text-xl" aria-hidden="true"></i>
          <span>${isQueued ? 'รับทราบแล้ว (รอส่ง)' : 'รับทราบแล้ว'}</span>
        </div>
        <button type="button" data-action="view" data-id="${safeId}"
          class="px-4 py-3 rounded-2xl border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-100 text-slate-700 text-base font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
          <i class="fa-regular fa-file-lines text-slate-500 text-lg" aria-hidden="true"></i>
          <span>ดูเอกสาร</span>
        </button>`;
    } else if (assignedToMe) {
      myActionHtml = `
        <button type="button" data-action="view" data-id="${safeId}"
          class="px-6 py-3.5 rounded-2xl bg-hqd-600 hover:bg-hqd-700 active:scale-[0.98] text-white text-lg font-bold shadow-md shadow-hqd-600/30 transition flex items-center justify-center gap-2 cursor-pointer ring-4 ring-transparent hover:ring-hqd-200">
          <i class="fa-solid fa-book-open-reader text-xl" aria-hidden="true"></i>
          <span>เปิดอ่านและรับทราบ</span>
        </button>`;
    } else {
      myActionHtml = `
        <button type="button" data-action="view" data-id="${safeId}"
          class="px-4 py-3 rounded-2xl border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-100 text-slate-700 text-base font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          title="ท่านไม่ได้อยู่ในกลุ่มเป้าหมายของเอกสารนี้">
          <i class="fa-regular fa-eye text-slate-500 text-lg" aria-hidden="true"></i>
          <span>ดูเอกสาร</span>
        </button>`;
    }

    return `
      <article class="doc-card ${statusMeta.glowClass} bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between" aria-label="${escapeHtml(doc.title)}">
        <div>
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-xl text-base font-bold bg-slate-100 text-slate-700 border border-slate-300">${safeId}</span>
              <span class="px-3.5 py-1 rounded-xl text-base font-bold border ${docTypeColor}">${docTypeIcon}${escapeHtml(docType)}</span>
              <span class="px-3.5 py-1 rounded-xl text-base font-bold ${priorityClass}">${priorityIcon}${escapeHtml(doc.priority)}</span>
              ${isAdmin ? targetBadgeHtml : ''}
              ${doc.isPendingLocal ? '<span class="px-3 py-1 rounded-xl text-sm font-bold bg-sky-50 text-sky-800 border border-sky-300"><i class="fa-solid fa-rotate mr-1" aria-hidden="true"></i>กำลังซิงค์</span>' : ''}
            </div>
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-base font-bold border ${statusMeta.badgeColor}">
              ${statusMeta.iconHtml}
              <span>${escapeHtml(statusMeta.text)}</span>
            </span>
          </div>

          <h3 class="text-2xl font-bold text-slate-900 leading-snug mb-3 break-words">${escapeHtml(doc.title)}</h3>

          ${!isAckByMe && assignedToMe && hasOpened ? `
            <p class="mb-3 inline-flex items-center gap-2 text-base font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl">
              <i class="fa-solid fa-eye" aria-hidden="true"></i> ท่านเคยเปิดดูแล้ว แต่ยังไม่ได้กดรับทราบ
            </p>` : ''}

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base text-slate-600 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-calendar-plus text-hqd-600" aria-hidden="true"></i>
              <span>เริ่ม: <strong>${escapeHtml(formatThaiDate(doc.startDate))}</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-calendar-check text-rose-500" aria-hidden="true"></i>
              <span>ครบกำหนด: <strong>${escapeHtml(formatThaiDate(doc.endDate))}</strong></span>
            </div>
            <div class="flex items-center gap-2 sm:col-span-2">
              <i class="fa-solid fa-users ${isTargetAll ? 'text-indigo-500' : 'text-amber-500'}" aria-hidden="true"></i>
              <span>เป้าหมาย: <strong>${escapeHtml(targetLabel)}</strong></span>
            </div>
            ${isAckByMe && myAckTime ? `
            <div class="flex items-center gap-2 sm:col-span-2 text-emerald-800">
              <i class="fa-solid fa-signature text-emerald-600" aria-hidden="true"></i>
              <span>ท่านรับทราบเมื่อ: <strong>${escapeHtml(formatThaiDateTime(myAckTime))}</strong></span>
            </div>` : ''}
          </div>

          ${isAdmin ? `
            <div class="mb-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div class="flex justify-between items-center text-base font-bold text-slate-800 mb-2 gap-2 flex-wrap">
                <span class="flex items-center gap-2">
                  <i class="fa-solid fa-chart-simple text-hqd-600" aria-hidden="true"></i>
                  <span>ความคืบหน้าการรับทราบ</span>
                </span>
                <span class="text-hqd-800">${stats.ackCount} / ${stats.total} คน (${stats.percent}%)</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-4 overflow-hidden border border-slate-300" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.percent}" aria-label="ความคืบหน้าการรับทราบ">
                <div class="h-full rounded-full transition-all duration-500 ${stats.isComplete ? 'bg-emerald-500' : 'bg-hqd-600'}" style="width: ${stats.percent}%"></div>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            ${isAdmin ? `
              <button type="button" data-action="track" data-id="${safeId}"
                class="px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 border-2 border-purple-300 text-lg font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                title="ดูรายชื่อผู้รับทราบแล้วและยังไม่อ่าน">
                <i class="fa-solid fa-chart-pie" aria-hidden="true"></i>
                <span>ภาพรวม</span>
              </button>
              <button type="button" data-action="delete" data-id="${safeId}"
                class="px-3.5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 text-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="ลบเอกสารนี้" aria-label="ลบเอกสาร ${escapeHtml(doc.title)}">
                <i class="fa-solid fa-trash-can text-rose-600" aria-hidden="true"></i>
                <span>ลบ</span>
              </button>
            ` : ''}
          </div>
          <div class="flex items-center gap-2 flex-wrap justify-end">
            ${myActionHtml}
          </div>
        </div>
      </article>
    `;
  };

  /**
   * Populate Target User Filter dropdown for Admin
   */
  const populateTargetUserFilter = () => {
    const sel = $('doc-target-user-filter');
    if (!sel) return;
    const currentVal = sel.value;
    const users = (state.users || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));
    sel.innerHTML = '<option value="all">-- ทุกคนที่มีในระบบ (ไม่เจาะจงบุคคล) --</option>' +
      users.map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)}${u.department ? ` (${escapeHtml(u.department)})` : ''}</option>`).join('');
    if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
      sel.value = currentVal;
    }
  };

  const renderDocuments = () => {
    const grid = $('docs-grid');
    const emptyState = $('docs-empty-state');
    const searchInput = $('doc-search-input');
    const statusFilter = $('doc-status-filter');
    const priorityFilter = $('doc-priority-filter');
    const typeFilter = $('doc-type-filter');
    const targetFilter = $('doc-target-filter');
    const targetUserFilter = $('doc-target-user-filter');
    const targetUserWrapper = $('doc-target-user-filter-wrapper');
    if (!grid || !state.currentUser) return;

    const isAdmin = isCurrentAdmin();
    const buckets = getDocBuckets();

    // Sub-tab badges & hints
    $('badge-subtab-pending').textContent = buckets.pending.length;
    $('badge-subtab-acked').textContent = buckets.acked.length;
    $('badge-subtab-all').textContent = buckets.all.length;
    updatePendingBadges();

    ['pending', 'acked', 'all'].forEach(key => {
      const btn = $(`doc-subtab-${key}`);
      if (!btn) return;
      btn.classList.toggle('active', state.docSubTab === key);
      btn.setAttribute('aria-selected', String(state.docSubTab === key));
    });

    const hint = $('doc-subtab-hint');
    if (hint) {
      hint.textContent = state.docSubTab === 'pending'
        ? 'แสดงเฉพาะเอกสารที่ท่านยังไม่ได้กดรับทราบ'
        : state.docSubTab === 'acked'
          ? 'แสดงเอกสารที่ท่านกดรับทราบเรียบร้อยแล้ว'
          : (isAdmin ? 'แสดงเอกสารเวียนทั้งหมดในระบบ (สิทธิ์ผู้ดูแล)' : 'แสดงเอกสารทั้งหมดที่มอบหมายให้ท่าน');
    }

    renderDocsSummary(buckets);
    renderAdminSortControls();

    let displayDocs = state.docSubTab === 'pending' ? buckets.pending
      : state.docSubTab === 'acked' ? buckets.acked
        : buckets.all;

    // Search filter
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchTerm) {
      displayDocs = displayDocs.filter(d =>
        (d.title || '').toLowerCase().includes(searchTerm) ||
        (d.id || '').toLowerCase().includes(searchTerm) ||
        (d.docType || inferDocType(d)).toLowerCase().includes(searchTerm)
      );
    }

    // Priority filter
    const selectedPriority = priorityFilter ? priorityFilter.value : 'all';
    if (selectedPriority !== 'all') {
      displayDocs = displayDocs.filter(d => d.priority === selectedPriority);
    }

    // Status filter
    const selectedStatus = statusFilter ? statusFilter.value : 'all';
    if (selectedStatus !== 'all') {
      displayDocs = displayDocs.filter(d => calculateDocStatus(d).statusKey === selectedStatus);
    }

    // Official Document Type filter
    const selectedType = typeFilter ? typeFilter.value : 'all';
    if (selectedType !== 'all') {
      displayDocs = displayDocs.filter(d => (d.docType || inferDocType(d)) === selectedType);
    }

    // Delivery Target filter (All vs Individual)
    const selectedTarget = (isAdmin && targetFilter) ? targetFilter.value : 'all';
    const isIndividual = selectedTarget === 'individual' || selectedTarget === 'specific';
    if (targetUserWrapper) {
      if (isAdmin && isIndividual) {
        targetUserWrapper.classList.remove('hidden');
      } else {
        targetUserWrapper.classList.add('hidden');
      }
    }

    if (selectedTarget === 'all_staff' || selectedTarget === 'everyone') {
      displayDocs = displayDocs.filter(d => d.targetType === 'all');
    } else if (isIndividual) {
      displayDocs = displayDocs.filter(d => d.targetType !== 'all');
    }

    // Specific individual personnel filter
    const selectedTargetUser = (isAdmin && targetUserFilter && isIndividual) ? targetUserFilter.value : 'all';
    if (selectedTargetUser !== 'all') {
      displayDocs = displayDocs.filter(d => {
        if (d.targetType === 'all') return true;
        return Array.isArray(d.targetUsers) && d.targetUsers.some(uid => normId(uid) === normId(selectedTargetUser));
      });
    }

    displayDocs = sortDocs(displayDocs.slice());

    const isFiltered = Boolean(
      searchTerm ||
      selectedPriority !== 'all' ||
      selectedStatus !== 'all' ||
      selectedType !== 'all' ||
      selectedTarget !== 'all' ||
      selectedTargetUser !== 'all'
    );

    const resultCount = $('docs-result-count');
    if (resultCount) {
      resultCount.textContent = isFiltered ? `พบ ${displayDocs.length} ฉบับตามตัวกรอง` : '';
    }

    if (displayDocs.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      emptyState.innerHTML = renderEmptyState({ isFiltered, buckets, isAdmin });
      return;
    }

    emptyState.classList.add('hidden');
    emptyState.innerHTML = '';
    grid.innerHTML = displayDocs.map(renderDocCard).join('');
  };

  const renderEmptyState = ({ isFiltered, buckets, isAdmin }) => {
    if (isFiltered) {
      return `
        <div class="text-center py-16 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-300">
          <div class="w-20 h-20 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mb-4"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></div>
          <h3 class="text-2xl font-bold text-slate-800 mb-2">ไม่พบเอกสารที่ตรงกับเงื่อนไขการค้นหา</h3>
          <p class="text-slate-500 text-lg max-w-md mx-auto mb-5">ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อค้นหาอีกครั้ง</p>
          <button type="button" data-empty-action="reset-filters" class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition cursor-pointer">ล้างตัวกรองทั้งหมด</button>
        </div>`;
    }
    if (state.docSubTab === 'pending') {
      return `
        <div class="text-center py-16 px-6 bg-white rounded-3xl border-2 border-emerald-300 shadow-sm">
          <div class="w-24 h-24 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-5xl mb-4 shadow-sm ring-8 ring-emerald-50"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>
          <h3 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">ยอดเยี่ยมมาก! ไม่มีเอกสารค้างรับทราบ</h3>
          <p class="text-slate-600 text-lg sm:text-xl max-w-lg mx-auto mb-6">ท่านได้เปิดอ่านและกดรับทราบเอกสารเวียนที่มอบหมายครบถ้วนทุกฉบับแล้ว</p>
          ${buckets.acked.length ? `
          <button type="button" data-empty-action="go-acked" class="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xl font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition inline-flex items-center gap-3 cursor-pointer">
            <i class="fa-solid fa-list-check" aria-hidden="true"></i><span>ดูเอกสารที่รับทราบแล้ว (${buckets.acked.length} ฉบับ)</span>
          </button>` : ''}
          ${isAdmin && state.documents.length === 0 ? `
          <button type="button" data-empty-action="create" class="mt-3 px-8 py-3.5 bg-hqd-600 hover:bg-hqd-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-hqd-600/30 transition inline-flex items-center gap-3 cursor-pointer">
            <i class="fa-solid fa-file-circle-plus" aria-hidden="true"></i><span>สร้างเอกสารเวียนฉบับแรก</span>
          </button>` : ''}
        </div>`;
    }
    if (state.docSubTab === 'acked') {
      return `
        <div class="text-center py-16 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-300">
          <div class="w-20 h-20 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mb-4"><i class="fa-solid fa-file-circle-check" aria-hidden="true"></i></div>
          <h3 class="text-2xl font-bold text-slate-800 mb-2">ยังไม่มีเอกสารที่รับทราบแล้ว</h3>
          <p class="text-slate-500 text-lg max-w-md mx-auto mb-6">เมื่อท่านเปิดอ่านและกดยืนยันรับทราบเอกสาร รายการจะย้ายมาแสดงที่หน้านี้</p>
          <button type="button" data-empty-action="go-pending" class="px-8 py-3.5 bg-hqd-600 hover:bg-hqd-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-hqd-600/30 transition inline-flex items-center gap-3 cursor-pointer">
            <i class="fa-solid fa-clock" aria-hidden="true"></i><span>ไปที่เอกสารรอรับทราบ (${buckets.pending.length} ฉบับ)</span>
          </button>
        </div>`;
    }
    return `
      <div class="text-center py-16 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-300">
        <div class="w-24 h-24 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-4xl mb-4"><i class="fa-solid fa-folder-open" aria-hidden="true"></i></div>
        <h3 class="text-2xl font-bold text-slate-800 mb-2">ยังไม่มีเอกสารเวียนในระบบ</h3>
        <p class="text-slate-500 text-lg max-w-md mx-auto mb-6">${isAdmin ? 'ท่านสามารถสร้างเอกสารเวียนฉบับแรกได้ทันที' : 'ขณะนี้ยังไม่มีเอกสารที่มอบหมายให้ท่าน'}</p>
        ${isAdmin ? `
          <button type="button" data-empty-action="create" class="px-8 py-3.5 bg-hqd-600 hover:bg-hqd-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-hqd-600/30 transition inline-flex items-center gap-3 cursor-pointer">
            <i class="fa-solid fa-file-circle-plus" aria-hidden="true"></i><span>สร้างเอกสารเวียนฉบับแรก</span>
          </button>` : ''}
      </div>`;
  };

  const resetDocFilters = () => {
    const s = $('doc-search-input'); if (s) s.value = '';
    const p = $('doc-priority-filter'); if (p) p.value = 'all';
    const st = $('doc-status-filter'); if (st) st.value = 'all';
    const t = $('doc-type-filter'); if (t) t.value = 'all';
    const tg = $('doc-target-filter'); if (tg) tg.value = 'all';
    const tu = $('doc-target-user-filter'); if (tu) tu.value = 'all';
    const tuw = $('doc-target-user-filter-wrapper'); if (tuw) tuw.classList.add('hidden');
  };

  const renderAdminSortControls = () => {
    const isAdmin = isCurrentAdmin();
    const currentSort = state.systemSortOrder || 'date-desc';
    const sortButtonsWrapper = $('admin-sort-buttons-wrapper');
    const userSortWrapper = $('user-sort-display-wrapper');
    const userSortLabel = $('user-sort-order-label');
    const subtitle = $('admin-sort-subtitle');
    const badge = $('admin-sort-badge-enforced');

    if (sortButtonsWrapper) sortButtonsWrapper.classList.toggle('hidden', !isAdmin);
    if (userSortWrapper) userSortWrapper.classList.toggle('hidden', isAdmin);
    if (badge) badge.classList.toggle('hidden', !isAdmin);
    if (subtitle) {
      subtitle.textContent = isAdmin
        ? 'กดปุ่มด้านขวาเพื่อกำหนดลำดับเอกสารที่บุคลากรทุกคนจะเห็น'
        : 'จัดเรียงตามลำดับที่ผู้ดูแลระบบกำหนดไว้สำหรับบุคลากรทุกคน';
    }

    if (isAdmin) {
      document.querySelectorAll('.admin-sort-btn').forEach(btn => {
        const active = btn.getAttribute('data-sort') === currentSort;
        btn.setAttribute('aria-pressed', String(active));
        btn.className = active
          ? 'admin-sort-btn px-4 py-2.5 rounded-xl font-bold text-base transition flex items-center gap-2 cursor-pointer shadow-md bg-hqd-600 text-white ring-2 ring-hqd-300'
          : 'admin-sort-btn px-4 py-2.5 rounded-xl font-bold text-base transition flex items-center gap-2 cursor-pointer shadow-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-100';
      });
    } else if (userSortLabel) {
      userSortLabel.innerHTML = `${SORT_ICONS[currentSort] || ''} <span>${escapeHtml(SORT_LABELS[currentSort] || currentSort)}</span>`;
    }
  };

  const setSystemSortOrder = async (newSort) => {
    if (!SORT_OPTIONS.includes(newSort) || !isCurrentAdmin()) return;
    if (newSort === state.systemSortOrder) return;
    const previous = state.systemSortOrder;
    state.systemSortOrder = newSort;
    localStorage.setItem(CONFIG.STORAGE_KEY_SORT, newSort);
    renderDocuments();

    try {
      const r = await apiPost('updateSystemConfig', { data: { documentSortOrder: newSort } });
      if (isSuccess(r)) {
        showToast(`บันทึกการจัดเรียงสำหรับทุกคน: ${SORT_LABELS[newSort]} แล้ว`, 'success');
      } else {
        throw new Error(r && r.message ? r.message : 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      state.systemSortOrder = previous;
      localStorage.setItem(CONFIG.STORAGE_KEY_SORT, previous);
      renderDocuments();
      showToast(`ไม่สามารถบันทึกการจัดเรียงได้: ${err.message}`, 'error');
    }
  };

  /**
   * Action: Acknowledge a circular document
   * บันทึกในเครื่องทันที + เข้าคิวส่งซ้ำอัตโนมัติจนกว่าเซิร์ฟเวอร์ยืนยัน
   */
  const acknowledgeDocument = async (docId) => {
    if (!state.currentUser) return;
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;
    const me = meId();
    if (isAckedBy(doc, me)) return;

    const ackAt = nowStamp();
    if (!Array.isArray(doc.acknowledgedUsers)) doc.acknowledgedUsers = [];
    if (!doc.acknowledgedDetails) doc.acknowledgedDetails = {};
    doc.acknowledgedUsers.push(me);
    doc.acknowledgedDetails[me] = ackAt;

    addPendingAck(docId, me, ackAt);
    saveToLocalCache();
    state.dataSignature = computeSignature();
    renderCurrentTab();
    updateSyncIndicator('syncing');

    try {
      let supaOk = false;
      if (supa && navigator.onLine !== false) {
        try {
          const { data: cur } = await supa.from('documents').select('acknowledged_users, acknowledged_details').eq('id', docId).maybeSingle();
          if (cur) {
            const acks = Array.isArray(cur.acknowledged_users) ? cur.acknowledged_users.slice() : [];
            const details = (cur.acknowledged_details && typeof cur.acknowledged_details === 'object') ? { ...cur.acknowledged_details } : {};
            if (!acks.includes(me)) acks.push(me);
            details[me] = ackAt;
            const { error: upErr } = await supa.from('documents').update({
              acknowledged_users: acks,
              acknowledged_details: details,
              updated_at: new Date().toISOString()
            }).eq('id', docId);
            if (!upErr) supaOk = true;
          }
        } catch (sErr) {
          console.warn('Supabase ack error:', sErr);
        }
      }

      // ส่งซิงค์ Apps Script / Sheet เป็นแบ็กอัป
      let r = null;
      try {
        r = await apiPost('acknowledge', { docId, userId: me, ackAt });
      } catch (gasErr) {
        // GAS sync
      }

      if (supaOk || isSuccess(r)) {
        removePendingAck(docId, me);
        showToast(`บันทึกการรับทราบ "${doc.title}" เรียบร้อยแล้ว`, 'success', 5000);
      } else {
        showToast(`บันทึกการรับทราบไว้ในเครื่องแล้ว ระบบจะส่งให้อัตโนมัติเมื่อเชื่อมต่อเซิร์ฟเวอร์`, 'info', 5000);
      }
    } catch {
      showToast('บันทึกการรับทราบไว้ในเครื่องแล้ว ระบบจะส่งข้อมูลให้อัตโนมัติเมื่อเชื่อมต่ออินเทอร์เน็ตได้', 'warning', 7000);
    }
    renderCurrentTab();
    updateSyncIndicator(state.lastSyncOkAt ? 'success' : 'error');
  };

  const deleteDocument = async (docId) => {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc || !isCurrentAdmin()) return;

    const stats = getDocStats(doc);
    const ok = await confirmDialog({
      title: 'ยืนยันการลบเอกสาร',
      message: `"${doc.title}"\n\nรับทราบแล้ว ${stats.ackCount}/${stats.total} คน\nเมื่อลบแล้ว เอกสารและไฟล์แนบจะหายไปจากหน้าจอของบุคลากรทุกคน และไม่สามารถกู้คืนได้`,
      confirmText: 'ลบเอกสาร',
      tone: 'danger'
    });
    if (!ok) return;

    const index = state.documents.indexOf(doc);
    addDeletedDocId(docId);
    state.documents = state.documents.filter(d => d.id !== docId);
    state.localFiles.delete(docId);
    saveToLocalCache();
    renderCurrentTab();

    try {
      if (supa && navigator.onLine !== false) {
        try {
          await supa.from('documents').delete().eq('id', docId);
        } catch (sErr) {
          console.warn('Supabase delete doc warning:', sErr);
        }
      }
      try {
        await apiPost('deleteDocument', { docId });
      } catch (gasErr) {
        // GAS delete
      }
      showToast(`ลบเอกสาร "${doc.title}" เรียบร้อยแล้ว`, 'success');
      return;
    } catch (err) {
      removeDeletedDocId(docId);
      state.documents.splice(Math.max(0, index), 0, doc);
      saveToLocalCache();
      renderCurrentTab();
      showToast(`ไม่สามารถลบเอกสารได้: ${err.message}`, 'error');
    }
  };

  /* ==========================================================================
     11. RENDER: PERSONNEL MANAGEMENT TAB (ADMIN REAL-TIME TWO-WAY SYNC)
     ========================================================================== */
  const getUserPendingInfo = (userId) => {
    const pending = state.documents.filter(d => isAssignedTo(d, userId) && !isAckedBy(d, userId));
    const overdue = pending.filter(d => { const x = daysUntil(d.endDate); return x !== null && x < 0; });
    return { pending, overdue };
  };

  const renderPersonnelManagement = () => {
    const tableBody = $('users-table-body');
    const searchInput = $('user-search-input');
    const deptFilter = $('user-dept-filter');
    const roleFilter = $('user-role-filter');
    if (!tableBody) return;

    $('badge-user-count').textContent = state.users.length;

    // Populate Department Filter options only when the list changes (ไม่รบกวนขณะผู้ใช้กำลังเลือก)
    const departments = Array.from(new Set(state.users.map(u => u.department || 'ไม่ระบุ'))).sort((a, b) => a.localeCompare(b, 'th'));
    const key = departments.join('|');
    if (key !== state.deptOptionsKey) {
      const current = deptFilter.value;
      deptFilter.innerHTML = '<option value="all">แผนกทั้งหมด</option>' +
        departments.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
      deptFilter.value = departments.includes(current) ? current : 'all';
      state.deptOptionsKey = key;
    }

    let filteredUsers = [...state.users];
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (term) {
      filteredUsers = filteredUsers.filter(u =>
        u.id.toLowerCase().includes(term) ||
        u.name.toLowerCase().includes(term) ||
        (u.department || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      );
    }
    if (deptFilter.value !== 'all') filteredUsers = filteredUsers.filter(u => (u.department || 'ไม่ระบุ') === deptFilter.value);
    if (roleFilter && roleFilter.value !== 'all') filteredUsers = filteredUsers.filter(u => u.role === roleFilter.value);

    filteredUsers.sort((a, b) => getUserPendingInfo(b.id).pending.length - getUserPendingInfo(a.id).pending.length || a.name.localeCompare(b.name, 'th'));

    const adminCount = state.users.filter(u => u.role === 'admin').length;
    const totalPending = state.users.reduce((sum, u) => sum + getUserPendingInfo(u.id).pending.length, 0);
    $('users-summary-count').textContent = `แสดง ${filteredUsers.length} จากทั้งหมด ${state.users.length} คน • ผู้ดูแลระบบ ${adminCount} คน • รายการค้างรับทราบรวม ${totalPending} รายการ`;

    if (filteredUsers.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="7" class="text-center py-12 text-slate-400 font-medium">
          <i class="fa-solid fa-users-slash text-4xl mb-2" aria-hidden="true"></i>
          <div>ไม่พบรายชื่อบุคลากรที่ตรงกับเงื่อนไข</div>
        </td></tr>`;
      return;
    }

    const me = meId();
    tableBody.innerHTML = filteredUsers.map(user => {
      const isAdmin = user.role === 'admin';
      const isMe = user.id === me;
      const safeId = escapeHtml(user.id);
      const info = getUserPendingInfo(user.id);
      const pendingTitle = info.pending.map(d => `• ${d.title}`).join('\n');
      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="py-4 px-6 font-bold text-slate-800 whitespace-nowrap">${safeId}</td>
          <td class="py-4 px-6 font-semibold text-slate-900">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold flex-shrink-0" aria-hidden="true">
                <i class="fa-solid ${isAdmin ? 'fa-user-shield' : 'fa-user'}"></i>
              </div>
              <span>${escapeHtml(user.name)}${isMe ? ' <span class="text-sm font-bold text-hqd-700">(ท่าน)</span>' : ''}</span>
            </div>
          </td>
          <td class="py-4 px-6 text-slate-600">${escapeHtml(user.department || '-')}</td>
          <td class="py-4 px-6 text-center" title="${escapeHtml(pendingTitle)}">
            ${info.pending.length === 0
          ? '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-base font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"><i class="fa-solid fa-check" aria-hidden="true"></i> ครบ</span>'
          : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-base font-bold ${info.overdue.length ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-50 text-amber-900 border border-amber-300'}">
                  ${info.pending.length} ฉบับ${info.overdue.length ? ` (เกินกำหนด ${info.overdue.length})` : ''}
                </span>`}
          </td>
          <td class="py-4 px-6 text-slate-500 text-base break-all">${escapeHtml(user.email || '-')}</td>
          <td class="py-4 px-6 text-center">
            <button type="button" data-user-action="toggle-role" data-id="${safeId}"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-bold border transition cursor-pointer ${isAdmin ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}"
              title="คลิกเพื่อสลับบทบาท">
              <i class="fa-solid ${isAdmin ? 'fa-user-shield text-purple-600' : 'fa-user text-slate-500'}" aria-hidden="true"></i>
              <span>${isAdmin ? 'Admin' : 'User'}</span>
            </button>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="flex items-center justify-center gap-1">
              <button type="button" data-user-action="edit" data-id="${safeId}" class="p-2.5 text-hqd-600 hover:text-hqd-800 hover:bg-hqd-50 rounded-xl transition text-lg" title="แก้ไขข้อมูล" aria-label="แก้ไขข้อมูล ${escapeHtml(user.name)}">
                <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
              </button>
              <button type="button" data-user-action="reset-pin" data-id="${safeId}" class="p-2.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition text-lg" title="รีเซ็ต PIN กลับเป็นรหัสพนักงาน" aria-label="รีเซ็ต PIN ของ ${escapeHtml(user.name)}">
                <i class="fa-solid fa-key" aria-hidden="true"></i>
              </button>
              <button type="button" data-user-action="delete" data-id="${safeId}" class="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition text-lg ${isMe ? 'opacity-40 cursor-not-allowed' : ''}" title="${isMe ? 'ไม่สามารถลบบัญชีของตนเองได้' : 'ลบรายชื่อ'}" aria-label="ลบรายชื่อ ${escapeHtml(user.name)}" ${isMe ? 'disabled' : ''}>
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  };

  const toggleUserRole = async (userId) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const adminCount = state.users.filter(u => u.role === 'admin').length;

    if (newRole === 'user' && adminCount <= 1) {
      showToast('ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน ไม่สามารถลดสิทธิ์ได้', 'warning');
      return;
    }
    if (user.id === meId() && newRole === 'user') {
      const ok = await confirmDialog({
        title: 'ลดสิทธิ์ของตนเอง?',
        message: 'หากเปลี่ยนเป็น User ท่านจะไม่สามารถจัดการบุคลากรหรือสร้างเอกสารได้อีก จนกว่าผู้ดูแลระบบคนอื่นจะคืนสิทธิ์ให้',
        confirmText: 'ยืนยันลดสิทธิ์',
        tone: 'warning'
      });
      if (!ok) return;
    }

    const previousRole = user.role;
    user.role = newRole;
    saveRoleOverride(userId, newRole);
    saveToLocalCache();
    renderPersonnelManagement();

    try {
      if (supa && navigator.onLine !== false) {
        try {
          await supa.from('users').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId);
        } catch (supaErr) {
          console.warn('Supabase toggleRole warning:', supaErr);
        }
      }
      try {
        await apiPost('updateUserRole', { userId, role: newRole });
      } catch (gasErr) {
        // Apps script sync attempt
      }
      showToast(`เปลี่ยนบทบาทของ ${user.name} เป็น ${newRole === 'admin' ? 'Admin (ผู้ดูแลระบบ)' : 'User (บุคลากร)'} แล้ว`, 'success');
      if (user.id === meId()) {
        state.currentUser.role = newRole;
        updateStoredSession();
        renderAppView();
      }
    } catch (err) {
      user.role = previousRole;
      deleteRoleOverride(userId);
      saveToLocalCache();
      renderPersonnelManagement();
      showToast(`ไม่สามารถเปลี่ยนบทบาทได้: ${err.message}`, 'error');
    }
  };

  const deleteUser = async (userId) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    if (user.id === meId()) {
      showToast('ไม่สามารถลบบัญชีของตนเองได้', 'warning');
      return;
    }
    if (user.role === 'admin' && state.users.filter(u => u.role === 'admin').length <= 1) {
      showToast('ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน', 'warning');
      return;
    }
    const ok = await confirmDialog({
      title: 'ยืนยันการลบบุคลากร',
      message: `ลบ "${user.name}" (รหัส ${user.id}) ออกจากระบบ?\nบุคคลนี้จะไม่สามารถเข้าสู่ระบบได้อีก`,
      confirmText: 'ลบรายชื่อ',
      tone: 'danger'
    });
    if (!ok) return;

    const index = state.users.indexOf(user);
    state.users = state.users.filter(u => u.id !== userId);
    saveToLocalCache();
    renderPersonnelManagement();

    try {
      if (supa && navigator.onLine !== false) {
        try {
          await supa.from('users').delete().eq('id', userId);
        } catch (supaErr) {
          console.warn('Supabase deleteUser warning:', supaErr);
        }
      }
      try {
        await apiPost('deleteUser', { userId });
      } catch (gasErr) {
        // Apps script delete sync
      }
      deleteRoleOverride(userId);
      showToast(`ลบข้อมูล ${user.name} สำเร็จ`, 'success');
    } catch (err) {
      state.users.splice(Math.max(0, index), 0, user);
      saveToLocalCache();
      renderPersonnelManagement();
      showToast(`ไม่สามารถลบได้: ${err.message}`, 'error');
    }
  };

  const resetUserPin = async (userId) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    const ok = await confirmDialog({
      title: 'รีเซ็ต PIN',
      message: `รีเซ็ต PIN ของ "${user.name}" กลับเป็นรหัสพนักงาน (${user.id})?\nกรุณาแจ้งให้ผู้ใช้เปลี่ยน PIN ใหม่หลังเข้าสู่ระบบ`,
      confirmText: 'รีเซ็ต PIN',
      tone: 'warning'
    });
    if (!ok) return;
    try {
      if (supa && navigator.onLine !== false) {
        try {
          await supa.from('users').update({ pin: userId, updated_at: new Date().toISOString() }).eq('id', userId);
        } catch (supaErr) {
          console.warn('Supabase resetPin warning:', supaErr);
        }
      }
      try {
        await apiPost('resetPin', { userId });
      } catch (gasErr) {
        // Apps script reset sync
      }
      user.pin = user.id;
      saveToLocalCache();
      showToast(`รีเซ็ต PIN ของ ${user.name} เรียบร้อยแล้ว`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const exportSummaryReport = () => {
    const docs = sortDocs(state.documents.slice());
    if (!docs.length) {
      showToast('ยังไม่มีเอกสารสำหรับออกรายงาน', 'info');
      return;
    }
    const header = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'แผนก', 'ค้างรับทราบ (ฉบับ)', ...docs.map(d => `${d.id} ${d.title}`)];
    const rows = state.users.map(u => {
      const info = getUserPendingInfo(u.id);
      return [
        u.id, u.name, u.department, info.pending.length,
        ...docs.map(d => {
          if (!isAssignedTo(d, u.id)) return '-';
          if (!isAckedBy(d, u.id)) return 'ยังไม่รับทราบ';
          const t = d.acknowledgedDetails && d.acknowledgedDetails[u.id];
          return t ? `รับทราบ ${formatThaiDateTime(t)}` : 'รับทราบแล้ว';
        })
      ];
    });
    const footer = ['', 'สรุปรายเอกสาร', '', '', ...docs.map(d => { const s = getDocStats(d); return `${s.ackCount}/${s.total} (${s.percent}%)`; })];
    downloadCsv(`HQD-รายงานการรับทราบ-${toYMD(new Date())}.csv`, [header, ...rows, footer]);
    showToast('ดาวน์โหลดรายงานสรุป (เปิดด้วย Excel ได้) เรียบร้อยแล้ว', 'success');
  };

  /* ==========================================================================
     12. MODAL: CREATE DOCUMENT (ADMIN)
     ========================================================================== */
  /**
   * Setup Date Pickers for Document Creation with Thai Date (วัน เดือน ปี) preview
   */
  const updateDateDisplays = () => {
    const startInput = $('doc-form-start-date');
    const endInput = $('doc-form-end-date');
    const startDisplay = document.querySelector('#doc-form-start-date-display .date-text');
    const endDisplay = document.querySelector('#doc-form-end-date-display .date-text');
    if (startDisplay) startDisplay.textContent = startInput.value ? formatThaiDate(startInput.value) : '-';
    if (endDisplay) {
      const days = endInput.value ? daysUntil(endInput.value) : null;
      endDisplay.textContent = endInput.value
        ? `${formatThaiDate(endInput.value)}${days !== null && days >= 0 ? ` (อีก ${days} วัน)` : ''}`
        : '-';
    }
    if (startInput.value) endInput.min = startInput.value;
  };

  const setupDatePickers = () => {
    const startInput = $('doc-form-start-date');
    const endInput = $('doc-form-end-date');
    if (!startInput || !endInput) return;
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    startInput.value = toYMD(today);
    endInput.value = toYMD(nextWeek);
    updateDateDisplays();
  };

  const resetSelectedFile = () => {
    state.selectedCreateFile = null;
    const fileInput = $('doc-form-file');
    if (fileInput) fileInput.value = '';
    $('file-drop-prompt').classList.remove('hidden');
    $('file-selected-info').classList.add('hidden');
  };

  const openCreateDocModal = () => {
    if (!isCurrentAdmin()) return;
    const form = $('create-doc-form');
    if (form) form.reset();
    const typeSelect = $('doc-form-type');
    if (typeSelect) typeSelect.value = 'หนังสือเวียน';
    setupDatePickers();
    resetSelectedFile();
    setCreateDocLoading(false);
    state.busyModals.delete('modal-create-doc');

    // STRICT REQUIREMENT: Pre-check all users by default!
    state.selectedTargetUserIds = new Set(state.users.map(u => u.id));
    const search = $('modal-user-search-input');
    if (search) search.value = '';
    renderTargetUsersGrid();

    if (form) {
      form.querySelectorAll('input[name="targetType"]').forEach(r => { r.checked = r.value === 'all'; });
    }
    const specificContainer = $('specific-users-container');
    if (specificContainer) specificContainer.classList.add('hidden');
    updateAllTargetHint();

    showModal('modal-create-doc', { initialFocus: '#doc-form-title' });
  };

  const updateAllTargetHint = () => {
    const el = $('target-all-hint');
    if (el) el.textContent = `(${state.users.length} คน)`;
  };

  /**
   * Render Elder-friendly Checkbox Grid for Specific Personnel Target
   * STRICT REQUIREMENT: All pre-checked by default so admin unchecks non-relevant ones
   */
  const renderTargetUsersGrid = () => {
    const grid = $('target-users-grid');
    if (!grid) return;
    const term = ($('modal-user-search-input') || {}).value ? $('modal-user-search-input').value.trim().toLowerCase() : '';

    let displayUsers = [...state.users].sort((a, b) => (a.department || '').localeCompare(b.department || '', 'th') || a.name.localeCompare(b.name, 'th'));
    if (term) {
      displayUsers = displayUsers.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term) ||
        (u.department || '').toLowerCase().includes(term)
      );
    }

    grid.innerHTML = displayUsers.length ? displayUsers.map(user => {
      const isChecked = state.selectedTargetUserIds.has(user.id);
      return `
        <label class="user-checkbox-card p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 ${isChecked ? 'selected' : 'border-slate-200'}">
          <input type="checkbox" class="target-user-cb w-6 h-6 text-hqd-600 rounded focus:ring-hqd-500 cursor-pointer flex-shrink-0" value="${escapeHtml(user.id)}" ${isChecked ? 'checked' : ''} />
          <span class="overflow-hidden flex-1">
            <span class="block font-bold text-slate-800 text-base leading-tight truncate">${escapeHtml(user.name)}</span>
            <span class="block text-sm text-slate-500 truncate">${escapeHtml(user.department || '')} • ${escapeHtml(user.id)}</span>
          </span>
        </label>`;
    }).join('') : '<div class="col-span-full text-center text-slate-400 py-6">ไม่พบรายชื่อที่ค้นหา</div>';

    renderTargetDeptChips();
    updateTargetCount();
  };

  const renderTargetDeptChips = () => {
    const el = $('target-dept-chips');
    if (!el) return;
    const depts = Array.from(new Set(state.users.map(u => u.department || 'ไม่ระบุ'))).sort((a, b) => a.localeCompare(b, 'th'));
    el.innerHTML = depts.map(d => {
      const ids = state.users.filter(u => (u.department || 'ไม่ระบุ') === d).map(u => u.id);
      const selected = ids.filter(id => state.selectedTargetUserIds.has(id)).length;
      const full = selected === ids.length;
      return `<button type="button" class="dept-chip ${full ? 'active' : selected ? 'partial' : ''}" data-dept="${escapeHtml(d)}" aria-pressed="${full}">
        <i class="fa-solid ${full ? 'fa-square-check' : selected ? 'fa-square-minus' : 'fa-square'}" aria-hidden="true"></i>
        ${escapeHtml(d)} <span class="opacity-70">(${selected}/${ids.length})</span>
      </button>`;
    }).join('');
  };

  const updateTargetCount = () => {
    const indicator = $('target-count-indicator');
    if (indicator) indicator.textContent = `เลือกแล้ว ${state.selectedTargetUserIds.size} จาก ${state.users.length} คน`;
  };

  const ALLOWED_FILE = (file) => file && (file.type === 'application/pdf' || /^image\//.test(file.type) || /\.(pdf|png|jpe?g|webp|gif)$/i.test(file.name));

  const processSelectedFile = (file) => {
    if (!file) return;
    if (!ALLOWED_FILE(file)) {
      showToast('รองรับเฉพาะไฟล์ PDF หรือรูปภาพ (JPG, PNG) เท่านั้น', 'warning');
      return;
    }
    if (file.size > CONFIG.MAX_FILE_MB * 1024 * 1024) {
      showToast(`ไฟล์มีขนาด ${(file.size / 1048576).toFixed(1)} MB เกินกำหนด ${CONFIG.MAX_FILE_MB} MB กรุณาลดขนาดไฟล์`, 'warning');
      return;
    }
    state.selectedCreateFile = file;
    $('file-name-display').textContent = file.name;
    $('file-size-display').textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    $('file-preview-icon').className = `fa-solid ${/^image\//.test(file.type) ? 'fa-file-image text-sky-500' : 'fa-file-pdf text-rose-500'} text-3xl`;
    $('file-drop-prompt').classList.add('hidden');
    $('file-selected-info').classList.remove('hidden');

    // ช่วยกรอกชื่อเรื่องจากชื่อไฟล์ ถ้ายังว่าง พร้อมตรวจหาประเภทเอกสารอัตโนมัติ
    const titleInput = $('doc-form-title');
    if (titleInput && !titleInput.value.trim()) {
      titleInput.value = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
      const detected = inferDocType({ title: titleInput.value });
      const typeSelect = $('doc-form-type');
      if (typeSelect && detected) typeSelect.value = detected;
    }
  };

  const setCreateDocLoading = (loading, label) => {
    const submitBtn = $('create-doc-submit-btn');
    const btnText = $('create-doc-btn-text');
    const btnIcon = $('create-doc-btn-icon');
    const progress = $('create-doc-progress');
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('opacity-75', loading);
      submitBtn.classList.toggle('cursor-wait', loading);
    }
    if (btnText) btnText.textContent = loading ? (label || 'กำลังบันทึก...') : 'บันทึกและเวียนเอกสาร';
    if (btnIcon) btnIcon.className = loading ? 'fa-solid fa-spinner fa-spin text-xl' : 'fa-solid fa-paper-plane';
    if (progress) progress.classList.toggle('hidden', !loading);
    document.querySelectorAll('#modal-create-doc .modal-close-btn').forEach(b => { b.disabled = loading; });
    if (loading) state.busyModals.add('modal-create-doc');
    else state.busyModals.delete('modal-create-doc');
  };

  /**
   * Handle Create Document Form Submit
   * บันทึกเอกสารเวียน: ส่งข้อมูลไปยัง Google Apps Script
   * หากเครือข่ายขัดข้อง จะทำการบันทึกข้อมูลและไฟล์ลงในเครื่องแบบออฟไลน์ทันที เพื่อไม่ให้ข้อมูลสูญหาย
   */
  const handleCreateDocumentSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (state.busyModals.has('modal-create-doc')) return;

    const titleInput = $('doc-form-title');
    const title = titleInput ? titleInput.value.trim() : '';
    const typeSelect = $('doc-form-type');
    const docType = typeSelect ? typeSelect.value : inferDocType({ title });
    const prioritySelect = $('doc-form-priority');
    const priority = prioritySelect ? prioritySelect.value : 'ปกติ';
    const startInput = $('doc-form-start-date');
    const startDate = startInput ? startInput.value : '';
    const endInput = $('doc-form-end-date');
    const endDate = endInput ? endInput.value : '';
    const targetType = (document.querySelector('input[name="targetType"]:checked') || {}).value || 'all';
    const file = state.selectedCreateFile;

    if (!title) {
      showToast('กรุณากรอกชื่อเรื่องเอกสาร', 'warning');
      if (titleInput) titleInput.focus();
      return;
    }
    if (!startDate || !endDate) {
      showToast('กรุณาระบุวันที่เริ่มและวันครบกำหนดให้ครบถ้วน', 'warning');
      return;
    }
    if (endDate < startDate) {
      showToast('วันครบกำหนดต้องไม่น้อยกว่าวันที่เริ่มสื่อสาร', 'warning');
      if (endInput) endInput.focus();
      return;
    }
    if (!file) {
      showToast('กรุณาแนบไฟล์เอกสาร (PDF หรือ รูปภาพ)', 'warning');
      return;
    }

    let targetUsers = [];
    if (targetType === 'specific') {
      targetUsers = Array.from(state.selectedTargetUserIds);
      if (targetUsers.length === 0) {
        showToast('กรุณาเลือกบุคลากรเป้าหมายอย่างน้อย 1 คน', 'warning');
        return;
      }
    }

    setCreateDocLoading(true, 'กำลังเตรียมไฟล์...');
    let fileBase64 = '';
    try {
      fileBase64 = await readFileAsDataURL(file);
    } catch {
      fileBase64 = '';
    }

    setCreateDocLoading(true, 'กำลังอัปโหลดและเวียนเอกสาร...');
    let r = null;
    let isServerOk = false;

    try {
      r = await apiPost('addDocument', {
        data: {
          title,
          docType,
          priority,
          urgencyLevel: priority,
          startDate,
          endDate,
          targetType,
          targetUsers,
          targetAudience: targetType === 'all' ? 'All' : targetUsers.join(','),
          fileName: file.name,
          fileMime: file.type || 'application/pdf',
          fileBase64,
          createdBy: meId(),
          creatorName: state.currentUser ? state.currentUser.name : ''
        }
      }, { timeout: CONFIG.UPLOAD_TIMEOUT_MS });

      if (isSuccess(r)) {
        isServerOk = true;
      } else {
        throw new Error((r && r.message) || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      console.warn('apiPost addDocument error/offline:', err);
      // หากเครือข่ายขัดข้อง ออฟไลน์ หรือเซิร์ฟเวอร์ยังไม่พร้อม ให้ fallback บันทึกลงในเครื่องทันทีเพื่อไม่ให้ข้อมูลสูญหาย
      const localDocId = `LOCAL-${Date.now()}`;
      const localDoc = {
        id: localDocId,
        title,
        docType,
        fileUrl: fileBase64 || '',
        fileName: file.name,
        fileMime: file.type || 'application/pdf',
        priority,
        startDate,
        endDate,
        targetType,
        targetUsers,
        acknowledgedUsers: [],
        acknowledgedDetails: {},
        createdBy: meId(),
        createdAt: new Date().toISOString(),
        isPendingLocal: true
      };
      state.localFiles.set(localDocId, file);
      state.documents = [localDoc, ...state.documents.filter(d => d.id !== localDocId)];
      saveToLocalCache();

      if (supa && navigator.onLine !== false) {
        try {
          await supa.from('documents').upsert({
            id: localDocId,
            title,
            doc_type: docType,
            priority,
            start_date: startDate,
            end_date: endDate,
            target_type: targetType,
            target_users: targetUsers,
            file_url: '',
            file_name: file.name,
            file_mime: file.type || 'application/pdf',
            acknowledged_users: [],
            acknowledged_details: {},
            created_by: meId()
          });
        } catch (supaErr) {
          console.warn('Supabase fallback insert warning:', supaErr);
        }
      }

      setCreateDocLoading(false);
      closeModal('modal-create-doc', { force: true });
      state.docSubTab = isAssignedTo(localDoc, meId()) ? 'pending' : 'all';
      resetDocFilters();
      renderCurrentTab();

      const isNet = err.network || !navigator.onLine || /เครือข่าย|เชื่อมต่อ|Network|Failed to fetch|AbortError|timeout/i.test(err.message || '');
      const isDriveAuth = /DriveApp|Access denied/i.test(err.message || '');
      if (isDriveAuth) {
        showToast(`บันทึกเอกสาร "${title}" ลงในระบบแล้ว — Google Drive ยังไม่ได้รับสิทธิ์ (เปิด Apps Script แล้วกด Run "authorizeDrive")`, 'warning', 12000);
      } else if (isNet) {
        showToast(`บันทึกเอกสาร "${title}" (${localDocId}) ลงในเครื่องเรียบร้อยแล้ว (จะซิงค์ขึ้นเซิร์ฟเวอร์อัตโนมัติเมื่อออนไลน์)`, 'info', 8000);
      } else {
        showToast(`บันทึกเอกสาร "${title}" (${localDocId}) เรียบร้อยแล้ว`, 'info', 6000);
      }
      return;
    }

    const docId = String(r.docId || `TMP-${Date.now()}`);
    const newDoc = {
      id: docId,
      title,
      docType,
      fileUrl: r.fileUrl || fileBase64 || '',
      fileName: file.name,
      fileMime: file.type || 'application/pdf',
      priority,
      startDate,
      endDate,
      targetType,
      targetUsers,
      acknowledgedUsers: [],
      acknowledgedDetails: {},
      createdBy: meId(),
      createdAt: new Date().toISOString(),
      isPendingLocal: !r.fileUrl
    };
    state.localFiles.set(docId, file);
    state.documents = [newDoc, ...state.documents.filter(d => d.id !== docId)];
    saveToLocalCache();

    if (supa && navigator.onLine !== false) {
      try {
        await supa.from('documents').upsert({
          id: docId,
          title,
          doc_type: docType,
          priority,
          start_date: startDate,
          end_date: endDate,
          target_type: targetType,
          target_users: targetUsers,
          file_url: r ? (r.fileUrl || '') : '',
          file_name: file.name,
          file_mime: file.type || 'application/pdf',
          acknowledged_users: [],
          acknowledged_details: {},
          created_by: meId()
        });
      } catch (supaInsertErr) {
        console.warn('Supabase insert doc warning:', supaInsertErr);
      }
    }

    setCreateDocLoading(false);
    closeModal('modal-create-doc', { force: true });
    state.docSubTab = isAssignedTo(newDoc, meId()) ? 'pending' : 'all';
    resetDocFilters();
    renderCurrentTab();

    if (!r.fileUrl) {
      showToast('บันทึกเอกสารแล้ว แต่ไม่สามารถอัปโหลดไฟล์ไปยัง Google Drive ได้ (ผู้ดูแลต้องกด Run "authorizeDrive" ใน Apps Script) — บุคลากรคนอื่นจะยังไม่เห็นไฟล์แนบ', 'warning', 10000);
    } else {
      showToast(`สร้างเอกสาร "${title}" (${docId}) และเวียนให้บุคลากรเรียบร้อยแล้ว`, 'success', 6000);
    }
    setTimeout(() => syncWithServer({ force: true }), 1500);
  };

  /* ==========================================================================
     13. MODAL: TRACKING OVERVIEW (ADMIN - ACKNOWLEDGED VS UNREAD)
     ========================================================================== */
  const getTrackingLists = (doc) => {
    const stats = getDocStats(doc);
    const findUser = (id) => state.users.find(u => u.id === id) || { id, name: `รหัส ${id}`, department: 'ไม่ระบุ' };
    const ackUsers = stats.ackedIds.map(id => ({ ...findUser(id), ackTime: doc.acknowledgedDetails ? doc.acknowledgedDetails[id] : null }))
      .sort((a, b) => toTimestamp(String(a.ackTime || '').replace(' ', 'T')) - toTimestamp(String(b.ackTime || '').replace(' ', 'T')));
    const pendingUsers = stats.targets.filter(id => !stats.ackSet.has(id)).map(findUser)
      .sort((a, b) => (a.department || '').localeCompare(b.department || '', 'th') || a.name.localeCompare(b.name, 'th'));
    return { stats, ackUsers, pendingUsers };
  };

  const renderTrackingModal = (docId, { keepTab = false } = {}) => {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;
    state.trackingDocId = docId;

    const { stats, ackUsers, pendingUsers } = getTrackingLists(doc);
    const days = daysUntil(doc.endDate);

    $('modal-tracking-title').textContent = `ภาพรวมสถานะ (${doc.id})`;
    $('modal-tracking-subtitle').textContent = `${doc.title} • ครบกำหนด ${formatThaiDate(doc.endDate)}${days !== null ? (days < 0 ? ` (เกิน ${-days} วัน)` : days === 0 ? ' (วันนี้)' : ` (อีก ${days} วัน)`) : ''}`;
    $('track-total-count').textContent = stats.total;
    $('track-ack-count').textContent = `${ackUsers.length} (${stats.percent}%)`;
    $('track-pending-count').textContent = pendingUsers.length;
    $('track-tab-ack-badge').textContent = ackUsers.length;
    $('track-tab-pending-badge').textContent = pendingUsers.length;

    const personRow = (u, right, hover) => `
      <div class="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white border-2 border-slate-200 ${hover} transition">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg flex-shrink-0" aria-hidden="true"><i class="fa-solid fa-user"></i></div>
          <div class="min-w-0">
            <div class="font-bold text-slate-900 text-lg truncate">${escapeHtml(u.name)}</div>
            <div class="text-sm text-slate-500 truncate">${escapeHtml(u.department || '')} • รหัส ${escapeHtml(u.id)}</div>
          </div>
        </div>
        ${right}
      </div>`;

    $('track-list-ack').innerHTML = ackUsers.length === 0
      ? '<div class="text-center py-8 text-slate-400"><i class="fa-solid fa-clipboard-question text-3xl mb-2" aria-hidden="true"></i><div>ยังไม่มีผู้รับทราบเอกสารนี้</div></div>'
      : ackUsers.map(u => personRow(u, `
          <div class="text-right flex-shrink-0">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-base font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <i class="fa-solid fa-circle-check text-emerald-600" aria-hidden="true"></i><span>รับทราบแล้ว</span>
            </span>
            <div class="text-sm text-slate-500 mt-1">${u.ackTime ? escapeHtml(formatThaiDateTime(u.ackTime)) : '-'}</div>
          </div>`, 'hover:border-emerald-300')).join('');

    $('track-list-pending').innerHTML = pendingUsers.length === 0
      ? '<div class="text-center py-8 text-emerald-600"><i class="fa-solid fa-circle-check text-4xl mb-2" aria-hidden="true"></i><div class="text-xl font-bold">รับทราบครบทุกคนแล้ว 100%!</div></div>'
      : pendingUsers.map(u => personRow(u, `
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-base font-bold bg-rose-100 text-rose-800 border border-rose-300 flex-shrink-0">
            <i class="fa-solid fa-clock text-rose-600" aria-hidden="true"></i><span>ยังไม่อ่าน</span>
          </span>`, 'hover:border-rose-300')).join('');

    if (!keepTab) switchTrackingTab(pendingUsers.length ? 'pending' : 'ack');
  };

  const openTrackingModal = (docId) => {
    renderTrackingModal(docId);
    showModal('modal-tracking');
  };

  const switchTrackingTab = (type) => {
    const tabAckBtn = $('track-tab-ack-btn');
    const tabPendingBtn = $('track-tab-pending-btn');
    const inactive = 'pb-3 text-xl font-bold border-b-4 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition';
    if (type === 'ack') {
      tabAckBtn.className = 'pb-3 text-xl font-bold border-b-4 border-emerald-500 text-emerald-700 flex items-center gap-2 transition';
      tabPendingBtn.className = inactive;
    } else {
      tabPendingBtn.className = 'pb-3 text-xl font-bold border-b-4 border-rose-500 text-rose-700 flex items-center gap-2 transition';
      tabAckBtn.className = inactive;
    }
    tabAckBtn.setAttribute('aria-selected', String(type === 'ack'));
    tabPendingBtn.setAttribute('aria-selected', String(type !== 'ack'));
    $('track-list-ack').classList.toggle('hidden', type !== 'ack');
    $('track-list-pending').classList.toggle('hidden', type === 'ack');
  };

  const copyUnreadReminder = async () => {
    const doc = state.documents.find(d => d.id === state.trackingDocId);
    if (!doc) return;
    const { pendingUsers } = getTrackingLists(doc);
    if (pendingUsers.length === 0) {
      showToast('ไม่มีผู้ค้างอ่านเอกสารนี้', 'info');
      return;
    }
    const link = /^https?:/.test(location.href) ? `\nเข้าอ่านได้ที่: ${location.origin}${location.pathname}` : '';
    const text = `📢 แจ้งเตือนเอกสารเวียนรอรับทราบ\nเรื่อง: ${doc.title} (${doc.id})\nครบกำหนด: ${formatThaiDate(doc.endDate)}\n\nรายชื่อผู้ที่ยังไม่ได้กดรับทราบ (${pendingUsers.length} คน):\n` +
      pendingUsers.map((u, i) => `${i + 1}. ${u.name} (${u.department || 'ไม่ระบุ'})`).join('\n') + link;
    const ok = await copyText(text);
    showToast(ok ? 'คัดลอกข้อความแจ้งเตือนแล้ว — นำไปวางใน LINE กลุ่มได้ทันที' : 'ไม่สามารถคัดลอกอัตโนมัติได้', ok ? 'success' : 'warning');
  };

  const exportTrackingCsv = () => {
    const doc = state.documents.find(d => d.id === state.trackingDocId);
    if (!doc) return;
    const { ackUsers, pendingUsers, stats } = getTrackingLists(doc);
    const rows = [
      ['เอกสาร', `${doc.id} ${doc.title}`],
      ['ประเภทหนังสือราชการ', doc.docType || inferDocType(doc)],
      ['กลุ่มเป้าหมาย', doc.targetType === 'all' ? 'บุคลากรทุกคนในองค์กร' : `ระบุเฉพาะบุคคล (${stats.total} คน)`],
      ['ความสำคัญ', doc.priority],
      ['วันที่เริ่ม', formatThaiDate(doc.startDate)],
      ['วันครบกำหนด', formatThaiDate(doc.endDate)],
      ['สรุป', `รับทราบ ${stats.ackCount}/${stats.total} คน (${stats.percent}%)`],
      [],
      ['ลำดับ', 'รหัสพนักงาน', 'ชื่อ-นามสกุล', 'แผนก', 'สถานะ', 'เวลารับทราบ'],
      ...ackUsers.map((u, i) => [i + 1, u.id, u.name, u.department, 'รับทราบแล้ว', u.ackTime ? formatThaiDateTime(u.ackTime) : '']),
      ...pendingUsers.map((u, i) => [ackUsers.length + i + 1, u.id, u.name, u.department, 'ยังไม่รับทราบ', ''])
    ];
    downloadCsv(`HQD-${doc.id}-การรับทราบ.csv`, rows);
    showToast('ดาวน์โหลดรายงาน CSV เรียบร้อยแล้ว', 'success');
  };

  /* ==========================================================================
     14. MODAL: DOCUMENT VIEWER
     ========================================================================== */
  const toEmbeddableDriveUrl = (url) => {
    if (!url) return '';
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    return url;
  };

  const resetViewer = () => {
    const iframe = $('viewer-frame');
    const img = $('viewer-image');
    if (iframe) { iframe.onload = null; iframe.src = 'about:blank'; }
    if (img) img.removeAttribute('src');
    if (state.viewerObjectUrl) {
      URL.revokeObjectURL(state.viewerObjectUrl);
      state.viewerObjectUrl = '';
    }
    state.viewingDocId = null;
  };

  const setAckButtonState = (enabled) => {
    const ackBtn = $('viewer-ack-btn');
    const ackIcon = $('viewer-ack-btn-icon');
    const ackText = $('viewer-ack-btn-text');
    if (!ackBtn) return;
    ackBtn.disabled = !enabled;
    ackBtn.className = enabled
      ? 'w-full lg:w-auto px-8 py-3.5 text-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-3 cursor-pointer ring-4 ring-emerald-200'
      : 'w-full lg:w-auto px-8 py-3.5 text-xl font-bold text-slate-500 bg-slate-200 border-2 border-slate-300 rounded-2xl transition flex items-center justify-center gap-3 cursor-not-allowed';
    if (ackIcon) ackIcon.className = enabled ? 'fa-solid fa-check-circle text-2xl' : 'fa-solid fa-lock text-xl';
    if (ackText) ackText.textContent = enabled ? 'ฉันได้อ่านและรับทราบแล้ว' : 'กรุณาติ๊กยืนยันว่าได้อ่านแล้ว';
  };

  const openDocumentViewer = (docId) => {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    resetViewer();
    state.viewingDocId = docId;
    markDocAsRead(docId);

    $('viewer-doc-title').textContent = doc.title;
    $('viewer-doc-meta').textContent = `${doc.id} • ความสำคัญ: ${doc.priority} • ครบกำหนด: ${formatThaiDate(doc.endDate)}`;

    const iframe = $('viewer-frame');
    const img = $('viewer-image');
    const openLink = $('viewer-download-link');
    const emptyNotice = $('viewer-empty-notice');
    const loading = $('viewer-loading');

    // Resolve the best available source (Drive link > in-memory file just uploaded)
    let url = doc.fileUrl && !/^(data|blob):/.test(doc.fileUrl) ? doc.fileUrl : '';
    let localType = '';
    if (!url && state.localFiles.has(docId)) {
      const file = state.localFiles.get(docId);
      state.viewerObjectUrl = URL.createObjectURL(file);
      url = state.viewerObjectUrl;
      localType = file.type || '';
    }

    const isDrive = /(drive|docs)\.google\.com/.test(url);
    const isImage = !isDrive && (/^image\//.test(localType) || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url));

    iframe.classList.add('hidden');
    img.classList.add('hidden');
    emptyNotice.classList.add('hidden');
    loading.classList.add('hidden');

    if (!url) {
      emptyNotice.classList.remove('hidden');
      openLink.classList.add('hidden');
    } else {
      openLink.classList.remove('hidden');
      openLink.href = url;
      if (isImage) {
        img.src = url;
        img.classList.remove('hidden');
      } else {
        loading.classList.remove('hidden');
        iframe.classList.remove('hidden');
        const hideLoading = () => loading.classList.add('hidden');
        iframe.onload = hideLoading;
        setTimeout(hideLoading, 15000);
        iframe.src = isDrive ? toEmbeddableDriveUrl(url) : url;
      }
    }

    // Configure Acknowledge Button & Mandatory Checkbox state
    const me = meId();
    const confirmContainer = $('viewer-confirm-container');
    const confirmCheckbox = $('viewer-confirm-checkbox');
    const actionContainer = $('viewer-ack-action-container');
    const isAckByMe = isAckedBy(doc, me);
    const assigned = isAssignedTo(doc, me);

    if (isAckByMe || !assigned) {
      confirmContainer.classList.add('hidden');
      const myAckTime = isAckByMe && doc.acknowledgedDetails ? doc.acknowledgedDetails[me] : null;
      actionContainer.innerHTML = isAckByMe
        ? `<div class="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-emerald-100 text-emerald-800 border-2 border-emerald-400 text-lg font-bold flex items-center justify-center gap-2 shadow-sm">
             <i class="fa-solid fa-circle-check text-2xl text-emerald-600" aria-hidden="true"></i>
             <span>ท่านได้รับทราบเอกสารนี้แล้ว ${myAckTime ? `(${escapeHtml(formatThaiDateTime(myAckTime))})` : ''}</span>
           </div>`
        : `<div class="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-700 border-2 border-slate-300 text-lg font-bold flex items-center justify-center gap-2">
             <i class="fa-solid fa-circle-info text-xl text-slate-500" aria-hidden="true"></i>
             <span>ท่านไม่ได้อยู่ในกลุ่มเป้าหมายของเอกสารนี้</span>
           </div>`;
    } else {
      confirmContainer.classList.remove('hidden');
      confirmCheckbox.checked = false;
      actionContainer.innerHTML = `
        <button type="button" id="viewer-ack-btn" disabled>
          <i class="fa-solid fa-lock text-xl" id="viewer-ack-btn-icon" aria-hidden="true"></i>
          <span id="viewer-ack-btn-text">กรุณาติ๊กยืนยันว่าได้อ่านแล้ว</span>
        </button>`;
      setAckButtonState(false);
    }

    showModal('modal-doc-viewer', { initialFocus: '.modal-close-btn' });
  };

  /* ==========================================================================
     15. MODAL: PERSONNEL ADD / EDIT
     ========================================================================== */
  const openUserFormModal = (mode = 'add', user = null) => {
    const form = $('user-mgmt-form');
    form.reset();
    const idInput = $('user-form-id');
    $('user-form-mode').value = mode;

    if (mode === 'edit' && user) {
      $('modal-user-form-title').textContent = `แก้ไขข้อมูลบุคลากร (${user.id})`;
      idInput.value = user.id;
      idInput.readOnly = true;
      idInput.classList.add('bg-slate-100');
      $('user-form-name').value = user.name;
      $('user-form-dept').value = user.department || '';
      $('user-form-email').value = user.email || '';
      $('user-form-role').value = user.role || 'user';
      showModal('modal-user-form', { initialFocus: '#user-form-name' });
    } else {
      $('modal-user-form-title').textContent = 'เพิ่มบุคลากรใหม่';
      idInput.readOnly = false;
      idInput.classList.remove('bg-slate-100');
      $('user-form-role').value = 'user';
      showModal('modal-user-form', { initialFocus: '#user-form-id' });
    }

    const deptList = $('dept-suggestions');
    if (deptList) {
      deptList.innerHTML = Array.from(new Set(state.users.map(u => u.department).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'th'))
        .map(d => `<option value="${escapeHtml(d)}"></option>`).join('');
    }
  };

  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    if (state.busyModals.has('modal-user-form')) return;

    const mode = $('user-form-mode').value;
    const id = $('user-form-id').value.trim();
    const name = $('user-form-name').value.trim();
    const department = $('user-form-dept').value.trim();
    const email = $('user-form-email').value.trim();
    const role = $('user-form-role').value === 'admin' ? 'admin' : 'user';

    if (!id || !name || !department) {
      showToast('กรุณากรอกรหัสพนักงาน ชื่อ-นามสกุล และแผนกให้ครบถ้วน', 'warning');
      return;
    }

    const submitBtn = $('user-form-submit-btn');
    const setBusy = (busy) => {
      submitBtn.disabled = busy;
      submitBtn.classList.toggle('opacity-75', busy);
      if (busy) state.busyModals.add('modal-user-form'); else state.busyModals.delete('modal-user-form');
    };

    if (mode === 'add') {
      if (state.users.some(u => normId(u.id) === normId(id))) {
        showToast(`รหัสพนักงาน "${id}" มีอยู่ในระบบแล้ว`, 'error');
        return;
      }
      setBusy(true);
      try {
        if (supa && navigator.onLine !== false) {
          try {
            await supa.from('users').insert({ id, pin: id, name, department, email, role });
          } catch (supaErr) {
            console.warn('Supabase addUser warning:', supaErr);
          }
        }
        try {
          await apiPost('addUser', { data: { id, pin: id, name, department, email, role } });
        } catch (gasErr) {
          // Apps script sync attempt
        }
        state.users.push({ id, pin: id, name, department, email, role });
        saveToLocalCache();
        showToast(`เพิ่มบุคลากร "${name}" สำเร็จ (PIN เริ่มต้นคือรหัสพนักงาน)`, 'success');
        setBusy(false);
        closeModal('modal-user-form', { force: true });
        renderPersonnelManagement();
      } catch (err) {
        setBusy(false);
        showToast(`ไม่สามารถเพิ่มบุคลากรได้: ${err.message}`, 'error');
      }
      return;
    }

    const existing = state.users.find(u => u.id === id);
    if (!existing) return;
    if (existing.role === 'admin' && role === 'user' && state.users.filter(u => u.role === 'admin').length <= 1) {
      showToast('ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน ไม่สามารถลดสิทธิ์ได้', 'warning');
      return;
    }

    setBusy(true);
    try {
      if (supa && navigator.onLine !== false) {
        try {
          await supa.from('users').update({ name, department, email, role, updated_at: new Date().toISOString() }).eq('id', id);
        } catch (supaErr) {
          console.warn('Supabase updateUser warning:', supaErr);
        }
      }
      try {
        await apiPost('updateUser', { data: { id, name, department, email, role } });
      } catch (gasErr) {
        // Apps script sync attempt
      }
      Object.assign(existing, { name, department, email, role });
      saveToLocalCache();
      if (state.currentUser && state.currentUser.id === id) {
        state.currentUser = sessionSafeUser(existing);
        updateStoredSession();
        renderAppView();
      }
      showToast(`อัปเดตข้อมูล "${name}" สำเร็จ`, 'success');
      setBusy(false);
      closeModal('modal-user-form', { force: true });
      renderPersonnelManagement();
    } catch (err) {
      setBusy(false);
      showToast(`ไม่สามารถบันทึกข้อมูลได้: ${err.message}`, 'error');
    }
  };

  /* ==========================================================================
     16. MODAL: CHANGE PIN (ทุกคน)
     ========================================================================== */
  const openChangePinModal = () => {
    const form = $('change-pin-form');
    if (form) form.reset();
    showModal('modal-change-pin', { initialFocus: '#pin-current' });
  };

  const handleChangePinSubmit = async (e) => {
    e.preventDefault();
    if (state.busyModals.has('modal-change-pin')) return;
    const oldPin = $('pin-current').value.trim();
    const newPin = $('pin-new').value.trim();
    const confirmPin = $('pin-confirm').value.trim();

    if (!oldPin || !newPin) { showToast('กรุณากรอก PIN ให้ครบถ้วน', 'warning'); return; }
    if (!/^\d{4,8}$/.test(newPin)) { showToast('PIN ใหม่ต้องเป็นตัวเลข 4–8 หลัก', 'warning'); $('pin-new').focus(); return; }
    if (newPin !== confirmPin) { showToast('PIN ใหม่ทั้งสองช่องไม่ตรงกัน', 'warning'); $('pin-confirm').focus(); return; }
    if (newPin === oldPin) { showToast('PIN ใหม่ต้องไม่ซ้ำกับ PIN เดิม', 'warning'); return; }
    if (newPin === meId()) { showToast('เพื่อความปลอดภัย กรุณาอย่าใช้รหัสพนักงานเป็น PIN', 'warning'); return; }

    const btn = $('change-pin-submit-btn');
    btn.disabled = true;
    state.busyModals.add('modal-change-pin');
    try {
      // 1. อัปเดต PIN ใน Supabase
      if (supa && navigator.onLine !== false) {
        try {
          const { error: supaErr } = await supa
            .from('users')
            .update({ pin: newPin, updated_at: new Date().toISOString() })
            .eq('id', meId());
          if (supaErr) console.warn('Supabase update PIN warning:', supaErr);
        } catch (supaEx) {
          console.warn('Supabase update PIN exception:', supaEx);
        }
      }

      // 2. ซิงค์กับ Google Apps Script (ถ้ามี)
      try {
        await apiPost('changePin', { userId: meId(), oldPin, newPin });
      } catch (gasErr) {
        // หาก Apps Script ยังไม่พร้อม แต่ Supabase บันทึกแล้ว ก็ถือว่าสำเร็จ
      }

      const u = state.users.find(x => x.id === meId());
      if (u) u.pin = newPin;
      saveToLocalCache();
      state.busyModals.delete('modal-change-pin');
      closeModal('modal-change-pin', { force: true });
      showToast('เปลี่ยน PIN เรียบร้อยแล้ว กรุณาจำ PIN ใหม่ไว้สำหรับเข้าสู่ระบบครั้งถัดไป', 'success', 6000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      state.busyModals.delete('modal-change-pin');
    }
  };

  /* ==========================================================================
     17. MODAL SYSTEM HELPERS (stack, focus trap, custom confirm)
     ========================================================================== */
  const FOCUSABLE = 'a[href]:not(.hidden), button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const topModalId = () => (state.modalStack.length ? state.modalStack[state.modalStack.length - 1].id : null);

  const showModal = (modalId, { initialFocus } = {}) => {
    const modal = $(modalId);
    if (!modal) return;
    if (!state.modalStack.some(m => m.id === modalId)) {
      state.modalStack.push({ id: modalId, returnFocus: document.activeElement });
    }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const target = (initialFocus && modal.querySelector(initialFocus)) || modal.querySelector(FOCUSABLE);
      if (target) target.focus({ preventScroll: true });
    });
  };

  const closeModal = (modalId, { force = false } = {}) => {
    if (!modalId) return;
    if (!force && state.busyModals.has(modalId)) {
      showToast('กรุณารอให้การบันทึกเสร็จสิ้นก่อน', 'warning');
      return;
    }
    const modal = $(modalId);
    if (!modal) return;
    modal.classList.add('hidden');

    const idx = state.modalStack.findIndex(m => m.id === modalId);
    const entry = idx >= 0 ? state.modalStack.splice(idx, 1)[0] : null;
    if (state.modalStack.length === 0) document.body.style.overflow = '';

    if (modalId === 'modal-doc-viewer') resetViewer();
    if (modalId === 'modal-tracking') state.trackingDocId = null;
    if (modalId === 'modal-confirm' && state.confirmResolver) {
      const resolve = state.confirmResolver;
      state.confirmResolver = null;
      resolve(false);
    }

    if (entry && entry.returnFocus && document.contains(entry.returnFocus) && typeof entry.returnFocus.focus === 'function') {
      entry.returnFocus.focus({ preventScroll: true });
    }
  };

  /** Elder-friendly confirm dialog (แทน window.confirm ที่ตัวเล็กและอ่านยาก) */
  const confirmDialog = ({ title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', tone = 'danger' }) => new Promise(resolve => {
    if (state.confirmResolver) state.confirmResolver(false);
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    $('confirm-cancel-btn').textContent = cancelText;
    const okBtn = $('confirm-ok-btn');
    okBtn.textContent = confirmText;
    const icon = $('confirm-icon');
    if (tone === 'danger') {
      okBtn.className = 'px-6 py-3.5 text-xl font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-lg shadow-rose-600/30 transition cursor-pointer';
      icon.className = 'w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl flex-shrink-0';
      icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
    } else {
      okBtn.className = 'px-6 py-3.5 text-xl font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-lg shadow-amber-600/30 transition cursor-pointer';
      icon.className = 'w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0';
      icon.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>';
    }
    state.confirmResolver = resolve;
    showModal('modal-confirm', { initialFocus: '#confirm-cancel-btn' });
  });

  /* ==========================================================================
     18. ACCESSIBILITY & FONT SIZING CONTROLS
     ========================================================================== */
  const setFontScale = (scale) => {
    if (!['sm', 'md', 'lg'].includes(scale)) scale = 'md';
    document.documentElement.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    document.documentElement.classList.add(`font-scale-${scale}`);
    localStorage.setItem(CONFIG.STORAGE_KEY_FONT, scale);

    ['sm', 'md', 'lg'].forEach(s => {
      const btn = $(`font-size-${s}`);
      if (!btn) return;
      const active = s === scale;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('bg-white', active);
      btn.classList.toggle('text-hqd-700', active);
      btn.classList.toggle('shadow-sm', active);
      btn.classList.toggle('text-slate-600', !active);
    });
  };

  /* ==========================================================================
     19. EVENT BINDINGS & APP INITIALIZATION
     ========================================================================== */
  const initializeEventListeners = () => {
    // --- 1. Login ---
    $('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      login($('login-id').value, $('login-pin').value, $('login-remember') ? $('login-remember').checked : true);
    });

    $('toggle-pin-btn').addEventListener('click', () => {
      const pinInput = $('login-pin');
      const icon = $('toggle-pin-icon');
      const show = pinInput.type === 'password';
      pinInput.type = show ? 'text' : 'password';
      icon.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    // --- 2. Header & navigation ---
    $('logout-btn').addEventListener('click', async () => {
      const pending = getPendingAcks().filter(p => p.userId === meId()).length;
      if (pending) {
        const ok = await confirmDialog({
          title: 'ยังมีข้อมูลรอส่ง',
          message: `มีการรับทราบ ${pending} รายการที่ยังส่งไปยังเซิร์ฟเวอร์ไม่สำเร็จ\nระบบจะส่งให้อัตโนมัติเมื่อมีผู้เปิดเว็บนี้ในเครื่องนี้อีกครั้ง\nต้องการออกจากระบบหรือไม่?`,
          confirmText: 'ออกจากระบบ',
          tone: 'warning'
        });
        if (!ok) return;
      }
      logout();
    });
    $('tab-btn-docs').addEventListener('click', () => switchTab('docs'));
    $('tab-btn-users').addEventListener('click', () => switchTab('users'));
    $('open-change-pin-btn').addEventListener('click', openChangePinModal);
    $('manual-refresh-btn').addEventListener('click', async () => {
      const ok = await syncWithServer({ force: true });
      showToast(ok ? 'อัปเดตข้อมูลล่าสุดเรียบร้อยแล้ว' : 'ยังเชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กำลังใช้ข้อมูลในเครื่อง', ok ? 'success' : 'warning', 3000);
    });

    ['sm', 'md', 'lg'].forEach(s => $(`font-size-${s}`).addEventListener('click', () => setFontScale(s)));

    // --- 3. Documents tab ---
    ['pending', 'acked', 'all'].forEach(key => $(`doc-subtab-${key}`).addEventListener('click', () => switchDocSubTab(key)));

    let searchTimer = null;
    safeOn('doc-search-input', 'input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderDocuments, 150);
    });
    safeOn('doc-status-filter', 'change', renderDocuments);
    safeOn('doc-priority-filter', 'change', renderDocuments);
    safeOn('doc-type-filter', 'change', renderDocuments);
    safeOn('doc-target-filter', 'change', () => {
      const tf = $('doc-target-filter');
      const tuf = $('doc-target-user-filter');
      const val = tf ? tf.value : '';
      if (val !== 'individual' && val !== 'specific' && tuf) {
        tuf.value = 'all';
      }
      renderDocuments();
    });
    safeOn('doc-target-user-filter', 'change', renderDocuments);
    safeOn('reset-doc-filters-btn', 'click', () => {
      resetDocFilters();
      renderDocuments();
    });

    $('admin-sort-buttons-wrapper').addEventListener('click', (e) => {
      const btn = e.target.closest('.admin-sort-btn');
      if (btn) setSystemSortOrder(btn.getAttribute('data-sort'));
    });

    // Document cards (event delegation — ผูกครั้งเดียว ไม่ต้องผูกใหม่ทุกครั้งที่ render)
    $('docs-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const docId = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'view') openDocumentViewer(docId);
      else if (action === 'track') openTrackingModal(docId);
      else if (action === 'delete') deleteDocument(docId);
    });

    $('docs-empty-state').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-empty-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-empty-action');
      if (action === 'reset-filters') { resetDocFilters(); renderDocuments(); }
      else if (action === 'go-acked') switchDocSubTab('acked');
      else if (action === 'go-pending') switchDocSubTab('pending');
      else if (action === 'create') openCreateDocModal();
    });

    $('docs-summary').addEventListener('click', (e) => {
      const card = e.target.closest('[data-summary]');
      if (!card) return;
      const key = card.getAttribute('data-summary');
      resetDocFilters();
      if (key === 'near') { $('doc-status-filter').value = 'glow-yellow'; state.docSubTab = 'pending'; }
      else if (key === 'overdue') { $('doc-status-filter').value = 'glow-red'; state.docSubTab = 'pending'; }
      else state.docSubTab = key;
      renderDocuments();
      const grid = $('docs-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // --- 4. Personnel tab ---
    $('user-search-input').addEventListener('input', renderPersonnelManagement);
    $('user-dept-filter').addEventListener('change', renderPersonnelManagement);
    $('user-role-filter').addEventListener('change', renderPersonnelManagement);
    $('open-add-user-modal-btn').addEventListener('click', () => openUserFormModal('add'));
    $('export-report-csv-btn').addEventListener('click', exportSummaryReport);
    $('user-mgmt-form').addEventListener('submit', handleUserFormSubmit);

    $('users-table-body').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-user-action]');
      if (!btn || btn.disabled) return;
      const userId = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-user-action');
      if (action === 'toggle-role') toggleUserRole(userId);
      else if (action === 'edit') { const u = state.users.find(x => x.id === userId); if (u) openUserFormModal('edit', u); }
      else if (action === 'delete') deleteUser(userId);
      else if (action === 'reset-pin') resetUserPin(userId);
    });

    // --- 5. Create document modal ---
    $('open-create-doc-modal-btn').addEventListener('click', openCreateDocModal);
    $('create-doc-form').addEventListener('submit', handleCreateDocumentSubmit);
    $('doc-form-start-date').addEventListener('change', updateDateDisplays);
    $('doc-form-end-date').addEventListener('change', updateDateDisplays);

    document.querySelectorAll('input[name="targetType"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const specific = radio.value === 'specific' && radio.checked;
        $('specific-users-container').classList.toggle('hidden', !specific);
        if (specific) renderTargetUsersGrid();
      });
    });

    $('select-all-users-btn').addEventListener('click', () => {
      state.selectedTargetUserIds = new Set(state.users.map(u => u.id));
      renderTargetUsersGrid();
    });
    $('deselect-all-users-btn').addEventListener('click', () => {
      state.selectedTargetUserIds.clear();
      renderTargetUsersGrid();
    });
    $('modal-user-search-input').addEventListener('input', renderTargetUsersGrid);

    $('target-users-grid').addEventListener('change', (e) => {
      const cb = e.target.closest('.target-user-cb');
      if (!cb) return;
      if (cb.checked) state.selectedTargetUserIds.add(cb.value);
      else state.selectedTargetUserIds.delete(cb.value);
      cb.closest('.user-checkbox-card').classList.toggle('selected', cb.checked);
      cb.closest('.user-checkbox-card').classList.toggle('border-slate-200', !cb.checked);
      renderTargetDeptChips();
      updateTargetCount();
    });

    $('target-dept-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.dept-chip');
      if (!chip) return;
      const dept = chip.getAttribute('data-dept');
      const ids = state.users.filter(u => (u.department || 'ไม่ระบุ') === dept).map(u => u.id);
      const allSelected = ids.every(id => state.selectedTargetUserIds.has(id));
      ids.forEach(id => (allSelected ? state.selectedTargetUserIds.delete(id) : state.selectedTargetUserIds.add(id)));
      renderTargetUsersGrid();
    });

    // File upload: click, keyboard, drag & drop
    const dropZone = $('file-drop-zone');
    const fileInput = $('doc-form-file');
    dropZone.addEventListener('click', (e) => {
      if (!e.target.closest('#remove-file-btn')) fileInput.click();
    });
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) processSelectedFile(fileInput.files[0]);
      fileInput.value = '';
    });
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-hqd-600', 'bg-hqd-50');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-hqd-600', 'bg-hqd-50'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-hqd-600', 'bg-hqd-50');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) processSelectedFile(e.dataTransfer.files[0]);
    });
    $('remove-file-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      resetSelectedFile();
    });

    // --- 6. Tracking modal ---
    $('track-tab-ack-btn').addEventListener('click', () => switchTrackingTab('ack'));
    $('track-tab-pending-btn').addEventListener('click', () => switchTrackingTab('pending'));
    $('copy-unread-btn').addEventListener('click', copyUnreadReminder);
    $('export-tracking-csv-btn').addEventListener('click', exportTrackingCsv);

    // --- 7. Viewer acknowledge flow ---
    $('viewer-confirm-checkbox').addEventListener('change', (e) => setAckButtonState(e.target.checked));
    $('viewer-ack-action-container').addEventListener('click', (e) => {
      const btn = e.target.closest('#viewer-ack-btn');
      if (!btn || btn.disabled) return;
      if (!$('viewer-confirm-checkbox').checked) {
        showToast('กรุณาคลิกเลือกยืนยันว่าได้เปิดอ่านเอกสารเรียบร้อยแล้ว', 'warning');
        return;
      }
      const docId = state.viewingDocId;
      closeModal('modal-doc-viewer');
      acknowledgeDocument(docId);
    });

    // --- 8. Change PIN & confirm dialog ---
    $('change-pin-form').addEventListener('submit', handleChangePinSubmit);
    $('confirm-ok-btn').addEventListener('click', () => {
      const resolve = state.confirmResolver;
      state.confirmResolver = null;
      closeModal('modal-confirm');
      if (resolve) resolve(true);
    });
    $('confirm-cancel-btn').addEventListener('click', () => closeModal('modal-confirm'));

    // --- 9. Modal close triggers (X button, overlay click, Escape, focus trap) ---
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-modal')));
    });
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) modal.dataset.overlayDown = '1';
      });
      modal.addEventListener('click', (e) => {
        // ปิดเมื่อคลิกพื้นหลังจริงๆ เท่านั้น (กันปิดโดยไม่ตั้งใจตอนลากเลือกข้อความ)
        if (e.target === modal && modal.dataset.overlayDown === '1') closeModal(modal.id);
        modal.dataset.overlayDown = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      const top = topModalId();
      if (!top) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal(top);
        return;
      }
      if (e.key === 'Tab') {
        const modal = $(top);
        const items = Array.from(modal.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    });

    // --- 10. Connectivity & lifecycle ---
    window.addEventListener('online', () => {
      showToast('เชื่อมต่ออินเทอร์เน็ตแล้ว กำลังส่งข้อมูลที่ค้างอยู่...', 'info', 3000);
      syncWithServer({ force: true });
    });
    window.addEventListener('offline', () => updateSyncIndicator('error', 'ไม่มีอินเทอร์เน็ต'));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.currentUser) syncWithServer();
    });
    window.addEventListener('beforeunload', (e) => {
      if (state.busyModals.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  };

  /**
   * Main Application Bootstrap
   */
  const init = () => {
    // 1. Load saved font size preference
    setFontScale(localStorage.getItem(CONFIG.STORAGE_KEY_FONT) || 'md');

    // 2. Load Local Cache immediately (0-second render latency)
    loadFromLocalCache();
    state.dataSignature = computeSignature();

    // 3. Setup all event listeners
    initializeEventListeners();

    // 4. Render initial view (SPA, no reload)
    renderAppView();
    updateSyncIndicator(navigator.onLine === false ? 'error' : 'success', navigator.onLine === false ? 'ไม่มีอินเทอร์เน็ต' : 'ข้อมูลในเครื่อง');

    // 5. Trigger Background Server Sync (GAS Two-Way Sync)
    syncWithServer({ force: true });

    // 6. Periodic Background Sync — เฉพาะตอนเปิดหน้าจออยู่ เพื่อลดภาระ Apps Script
    setInterval(() => {
      if (state.currentUser && document.visibilityState === 'visible') syncWithServer();
      // รีเฟรชสถานะวันครบกำหนดเมื่อข้ามเที่ยงคืน
      else if (state.currentUser) renderCurrentTab();
    }, CONFIG.SYNC_INTERVAL_MS);
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
