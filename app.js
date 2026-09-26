/**
 * ==========================================================================
 * ระบบเวียนเอกสาร HQD (HQD Document Circulation System)
 * Vanilla JavaScript (SPA Architecture, IIFE, Zero-Reload, Elder-Friendly UI)
 * ==========================================================================
 */

(() => {
  'use strict';

  /* ==========================================================================
     1. CONFIGURATION & CONSTANTS
     ========================================================================== */
  const CONFIG = {
    // Google Apps Script Web App Deployment URL (Two-Way Sync)
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
  };

  /* Default Master Personnel Seed (from Google Sheet 167gvGXW7EeK4fdKJED1TKhqRiMJmFkte5-sH3Ybigk8) */
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

  /* Master Circular Documents Seed (Empty for production live usage) */
  const DEFAULT_DOCS_SEED = [];

  /**
   * Helper to identify and filter test / mock documents from development
   */
  const isTestDocument = (doc) => {
    if (!doc || !doc.title) return true;
    const testTitles = [
      'patient safety goals',
      'มาตรการบริหารจัดการความเสี่ยงองค์กร',
      'ข้อตกลงการพัฒนาคุณภาพและบริการทางการพยาบาล',
      'internal quality audit',
      'test doc',
      'mflv[qqq',
      'ทดสอบอีกครั้ง'
    ];
    const lowerTitle = String(doc.title).toLowerCase().trim();
    if (!lowerTitle) return true;
    return testTitles.some(t => lowerTitle.includes(t.toLowerCase()));
  };

  /* ==========================================================================
     2. GLOBAL STATE MANAGEMENT (SPA)
     ========================================================================== */
  const state = {
    currentUser: null,       // Currently logged-in user object
    users: [],               // Master list of personnel
    documents: [],           // Master list of circular documents
    activeTab: 'docs',       // 'docs' | 'users'
    docSubTab: 'pending',    // 'pending' (ยังไม่อ่าน) | 'acked' (อ่านแล้ว) | 'all' (ทั้งหมด)
    isSyncing: false,        // Background sync flag
    activeModal: null,       // Current active modal ID
    selectedCreateFile: null,// File object for upload
    selectedCreateBase64: '',// Data URL base64 string
    selectedTargetUserIds: new Set(), // Set of selected IDs for 'specific' target
    viewingDocId: null,      // Document currently open in viewer modal
    readDocIds: new Set(),   // Set of doc IDs opened/read by current user
  };

  /* ==========================================================================
     3. SECURITY & UTILITY FUNCTIONS
     ========================================================================== */
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

  /**
   * Format Thai Date (e.g., "26 ก.ย. 2569")
   */
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const year = date.getFullYear() + (date.getFullYear() < 2400 ? 543 : 0);
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  /**
   * Format Thai Date & Time (e.g., "26 ก.ย. 2569 เวลา 10:30 น.")
   */
  const formatThaiDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    try {
      const parts = dateTimeStr.split(' ');
      const dateFormatted = formatThaiDate(parts[0]);
      if (parts[1]) {
        return `${dateFormatted} เวลา ${parts[1]} น.`;
      }
      return dateFormatted;
    } catch {
      return dateTimeStr;
    }
  };

  /**
   * Elder-friendly Toast Notification System
   */
  const showToast = (message, type = 'info', duration = 4500) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg p-4 text-lg font-bold flex items-center gap-3 transition-all cursor-pointer pointer-events-auto border-2';

    let iconClass = 'fa-solid fa-circle-info text-2xl';
    let bgClasses = 'bg-white text-slate-800 border-slate-300';

    if (type === 'success') {
      iconClass = 'fa-solid fa-circle-check text-emerald-600 text-3xl';
      bgClasses = 'bg-emerald-50 text-emerald-900 border-emerald-400';
    } else if (type === 'error') {
      iconClass = 'fa-solid fa-triangle-exclamation text-rose-600 text-3xl';
      bgClasses = 'bg-rose-50 text-rose-900 border-rose-400';
    } else if (type === 'warning') {
      iconClass = 'fa-solid fa-circle-exclamation text-amber-600 text-3xl';
      bgClasses = 'bg-amber-50 text-amber-900 border-amber-400';
    }

    toast.className += ` ${bgClasses}`;
    toast.innerHTML = `
      <i class="${iconClass}"></i>
      <div class="flex-1">${escapeHtml(message)}</div>
      <button type="button" class="text-slate-400 hover:text-slate-700 text-xl p-1" aria-label="ปิด">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    toast.addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  };

  /* ==========================================================================
     4. STATUS & GLOW EFFECT ENGINE (Core Requirement)
     ========================================================================== */
  /**
   * Determine Document Status and Glow Effect Class
   * 🟢 Green: 100% acknowledged by assignees
   * 🟡 Yellow/Orange: Near deadline within 3 days
   * 🔴 Red: Overdue and has unread users
   * ⚪ None: Normal document
   */
  const calculateDocStatus = (doc) => {
    const targetCount = doc.targetUsers && doc.targetUsers.length > 0 ? doc.targetUsers.length : 1;
    const ackCount = doc.acknowledgedUsers ? doc.acknowledgedUsers.length : 0;
    const is100Percent = ackCount >= targetCount;

    // 1. 🟢 If 100% acknowledged -> Green Glow
    if (is100Percent) {
      return {
        glowClass: 'glow-green',
        statusKey: 'glow-green',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        iconHtml: '<i class="fa-solid fa-circle-check text-emerald-600"></i>',
        text: 'รับทราบครบ 100%',
        is100Percent: true,
        daysRemaining: null
      };
    }

    // Check dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(doc.endDate);
    deadline.setHours(23, 59, 59, 999);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 2. 🔴 If past deadline and not 100% -> Red Glow
    if (diffDays < 0) {
      return {
        glowClass: 'glow-red',
        statusKey: 'glow-red',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
        iconHtml: '<i class="fa-solid fa-circle-exclamation text-rose-600"></i>',
        text: `เกินกำหนด (${Math.abs(diffDays)} วัน)`,
        is100Percent: false,
        daysRemaining: diffDays
      };
    }

    // 3. 🟡 If deadline within 3 days (0 to 3 days) -> Yellow/Orange Glow
    if (diffDays <= 3) {
      return {
        glowClass: 'glow-yellow',
        statusKey: 'glow-yellow',
        badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
        iconHtml: '<i class="fa-solid fa-clock text-amber-600"></i>',
        text: diffDays === 0 ? 'ครบกำหนดวันนี้!' : `ใกล้ครบกำหนด (${diffDays} วัน)`,
        is100Percent: false,
        daysRemaining: diffDays
      };
    }

    // 4. ⚪ Normal document -> No Glow
    return {
      glowClass: 'glow-none',
      statusKey: 'glow-none',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      iconHtml: '<i class="fa-solid fa-calendar text-slate-500"></i>',
      text: `เหลือเวลา ${diffDays} วัน`,
      is100Percent: false,
      daysRemaining: diffDays
    };
  };

  /* ==========================================================================
     5. PERSISTENCE & LOCAL CACHE (Instant 0s Load)
     ========================================================================== */
  const getRoleOverrides = () => {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_OVERRIDES) || '{}');
    } catch {
      return {};
    }
  };

  const saveRoleOverride = (userId, role) => {
    try {
      const overrides = getRoleOverrides();
      overrides[userId] = { role, timestamp: Date.now() };
      localStorage.setItem(CONFIG.STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    } catch (e) {
      console.warn('saveRoleOverride error:', e);
    }
  };

  const deleteRoleOverride = (userId) => {
    try {
      const overrides = getRoleOverrides();
      delete overrides[userId];
      localStorage.setItem(CONFIG.STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
    } catch (e) {
      console.warn('deleteRoleOverride error:', e);
    }
  };

  const loadUserReadDocs = (userId) => {
    if (!userId) {
      state.readDocIds = new Set();
      return;
    }
    try {
      const all = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_READ_DOCS) || '{}');
      state.readDocIds = new Set(all[userId] || []);
    } catch {
      state.readDocIds = new Set();
    }
  };

  const markDocAsRead = (docId) => {
    if (!state.currentUser || !docId) return;
    const userId = state.currentUser.id;
    state.readDocIds.add(docId);
    try {
      const all = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY_READ_DOCS) || '{}');
      if (!all[userId]) all[userId] = [];
      if (!all[userId].includes(docId)) {
        all[userId].push(docId);
      }
      localStorage.setItem(CONFIG.STORAGE_KEY_READ_DOCS, JSON.stringify(all));
    } catch (e) {
      console.warn('markDocAsRead error:', e);
    }
  };

  const hasDocBeenRead = (docId) => {
    return state.readDocIds && state.readDocIds.has(docId);
  };

  const syncCurrentUserWithList = () => {
    if (!state.currentUser) return;
    const currentInList = state.users.find(u => u.id === state.currentUser.id);
    if (currentInList) {
      let changed = false;
      if (state.currentUser.role !== currentInList.role) {
        state.currentUser.role = currentInList.role;
        changed = true;
      }
      if (state.currentUser.name !== currentInList.name) {
        state.currentUser.name = currentInList.name;
        changed = true;
      }
      if (state.currentUser.department !== currentInList.department) {
        state.currentUser.department = currentInList.department;
        changed = true;
      }
      if (changed) {
        localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(state.currentUser));
        renderAppView();
      }
    }
  };

  const saveToLocalCache = () => {
    try {
      const dataToSave = {
        users: state.users,
        documents: state.documents,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(CONFIG.STORAGE_KEY_DATA, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const loadFromLocalCache = () => {
    try {
      // Clean up obsolete V1 cache keys
      try {
        localStorage.removeItem('HQD_APP_DATA_V1');
        localStorage.removeItem('HQD_READ_DOCS_V1');
      } catch (_) { }

      // 1. Load active user session
      const savedUser = localStorage.getItem(CONFIG.STORAGE_KEY_USER);
      if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        loadUserReadDocs(state.currentUser.id);
      }

      // 2. Load cached master data
      const cachedData = localStorage.getItem(CONFIG.STORAGE_KEY_DATA);
      const roleOverrides = getRoleOverrides();

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        state.users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : DEFAULT_USERS_SEED;
        state.documents = Array.isArray(parsed.documents) ? parsed.documents.filter(d => !isTestDocument(d)) : [];
      } else {
        // Fallback to default seeds (empty documents for production)
        state.users = DEFAULT_USERS_SEED;
        state.documents = [];
      }

      // Apply local role overrides so user-specified roles are never lost
      state.users = state.users.map(u => {
        if (roleOverrides[u.id] && roleOverrides[u.id].role) {
          return { ...u, role: roleOverrides[u.id].role };
        }
        return u;
      });

      // Synchronize current session with list
      if (state.currentUser) {
        const matching = state.users.find(u => u.id === state.currentUser.id);
        if (matching) {
          state.currentUser.role = matching.role;
          state.currentUser.name = matching.name;
          state.currentUser.department = matching.department;
          localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(state.currentUser));
        }
      }

      saveToLocalCache();
    } catch (e) {
      console.error('Error loading cache, using default seeds:', e);
      state.users = DEFAULT_USERS_SEED;
      state.documents = [];
    }
  };

  /* ==========================================================================
     6. SERVER TWO-WAY SYNC (Background Fetch, Stale-While-Revalidate)
     ========================================================================== */
  const updateSyncIndicator = (status, message) => {
    const dot = document.getElementById('sync-indicator-dot');
    const text = document.getElementById('sync-status-text');
    if (!dot || !text) return;

    if (status === 'syncing') {
      dot.className = 'w-3 h-3 rounded-full syncing-dot inline-block';
      text.textContent = 'กำลังซิงค์...';
    } else if (status === 'success') {
      dot.className = 'w-3 h-3 rounded-full bg-emerald-500 inline-block';
      text.textContent = message || 'พร้อมใช้งาน';
    } else if (status === 'error') {
      dot.className = 'w-3 h-3 rounded-full bg-amber-500 inline-block';
      text.textContent = message || 'ออฟไลน์ (ใช้ข้อมูลในเครื่อง)';
    }
  };

  /**
   * Sync Master Data from Google Apps Script in Background
   */
  const syncWithServer = async () => {
    if (state.isSyncing) return;
    state.isSyncing = true;
    updateSyncIndicator('syncing');

    const roleOverrides = getRoleOverrides();

    try {
      // 1. Fetch from GAS endpoint with action "getAppData"
      const response = await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getAppData' })
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.status === 'success' && result.data) {
          // Reconcile Users:
          // Sheet เป็น source of truth สำหรับ role
          // แต่ถ้ามี local override ที่ยังรอ sync ก็ยังคงใช้ override นั้นก่อน
          // เมื่อ Sheet ได้รับการอัปเดตแล้ว override จะถูกล้างออกอัตโนมัติในรอบถัดไป
          if (Array.isArray(result.data.users) && result.data.users.length > 0) {
            state.users = result.data.users.map(u => {
              const override = roleOverrides[u.id];
              if (override && override.role) {
                // ถ้า Sheet มี role ตรงกับ override แล้ว ให้ลบ override ทิ้ง (sync สำเร็จ)
                if (override.role === u.role) {
                  deleteRoleOverride(u.id);
                }
                // ใช้ override เสมอจนกว่า Sheet จะตรงกัน
                return { ...u, role: override.role };
              }
              return u;
            });
          }
          // Reconcile Documents if server has docs
          if (Array.isArray(result.data.docs)) {
            const serverDocs = result.data.docs
              .filter(d => !isTestDocument(d))
              .map(d => {
                const targetAud = String(d.targetAudience || d.targetType || 'all').trim();
                const isAll = targetAud.toLowerCase() === 'all';
                const targetUsers = Array.isArray(d.targetUsers) && d.targetUsers.length > 0
                  ? d.targetUsers
                  : (isAll ? state.users.map(u => u.id) : targetAud.split(',').map(s => s.trim()).filter(Boolean));

                let ackUsers = [];
                if (Array.isArray(d.acknowledgedUsers)) ackUsers = d.acknowledgedUsers;
                else if (Array.isArray(d.readStatus)) ackUsers = d.readStatus;
                else if (typeof d.readStatus === 'string' && d.readStatus) ackUsers = d.readStatus.split(',').map(s => s.trim()).filter(Boolean);
                else if (typeof d.acknowledgedUsers === 'string' && d.acknowledgedUsers) ackUsers = d.acknowledgedUsers.split(',').map(s => s.trim()).filter(Boolean);

                let cleanTitle = String(d.title || '').trim();
                let fileUrl = d.fileUrl || '';
                const linkMatch = cleanTitle.match(/\((https?:\/\/[^)]+)\)/);
                if (linkMatch && !fileUrl) {
                  fileUrl = linkMatch[1];
                  cleanTitle = cleanTitle.replace(/\s*\((https?:\/\/[^)]+)\)/, '').trim();
                }

                let priority = String(d.priority || d.urgencyLevel || 'ปกติ').trim();
                if (priority === 'ด่วนมาก') priority = 'ด่วน';
                if (!['ปกติ', 'ด่วน', 'ด่วนที่สุด'].includes(priority)) priority = 'ปกติ';

                return {
                  id: String(d.id).trim(),
                  title: cleanTitle || 'เอกสารเวียน',
                  fileUrl: fileUrl,
                  fileName: d.fileName || 'document.pdf',
                  fileMime: d.fileMime || 'application/pdf',
                  priority: priority,
                  startDate: String(d.startDate || '').split('T')[0],
                  endDate: String(d.endDate || '').split('T')[0],
                  targetType: isAll ? 'all' : 'specific',
                  targetUsers: targetUsers,
                  acknowledgedUsers: ackUsers,
                  acknowledgedDetails: d.acknowledgedDetails || {},
                  createdAt: d.createdAt ? (typeof d.createdAt === 'number' ? new Date(d.createdAt).toISOString() : String(d.createdAt)) : new Date().toISOString()
                };
              });

            // Merge with local state documents to ensure newly created ones are never lost
            const existingIds = new Set(serverDocs.map(d => d.id));
            const localOnlyDocs = state.documents.filter(d => !existingIds.has(d.id) && !isTestDocument(d));
            state.documents = [...localOnlyDocs, ...serverDocs];
          }

          syncCurrentUserWithList();
          saveToLocalCache();
          updateSyncIndicator('success', 'เชื่อมต่อคลาวด์แล้ว');
          renderCurrentTab();
          state.isSyncing = false;
          return;
        }
      }
    } catch (gasErr) {
      console.warn('Background GAS sync failed, attempting Google Visualization read:', gasErr);
    }

    // 2. Fallback: Google Sheet Public Visualization API
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_MASTER_ID}/gviz/tq?tqx=out:json&sheet=Users`;
      const gvizRes = await fetch(gvizUrl);
      if (gvizRes.ok) {
        const textData = await gvizRes.text();
        const jsonStr = textData.substring(textData.indexOf('{'), textData.lastIndexOf('}') + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.table && parsed.table.rows) {
          const fetchedUsers = [];
          for (let i = 1; i < parsed.table.rows.length; i++) {
            const cells = parsed.table.rows[i].c;
            if (cells && cells[0] && cells[0].v) {
              const uId = String(cells[0].v).trim();
              const sheetRole = cells[4] && String(cells[4].v).trim().toLowerCase() === 'admin' ? 'admin' : 'user';
              const finalRole = (roleOverrides[uId] && roleOverrides[uId].role) ? roleOverrides[uId].role : sheetRole;

              fetchedUsers.push({
                id: uId,
                pin: cells[1] ? String(cells[1].v).trim() : uId,
                name: cells[2] ? String(cells[2].v).trim() : '',
                department: cells[3] ? String(cells[3].v).trim() : '',
                role: finalRole,
                email: cells[5] ? String(cells[5].v).trim() : ''
              });
            }
          }
          if (fetchedUsers.length > 0) {
            state.users = fetchedUsers;
            syncCurrentUserWithList();
            saveToLocalCache();
            updateSyncIndicator('success', 'เชื่อมต่อข้อมูล Sheet แล้ว');
            renderCurrentTab();
          }
        }
      }
    } catch (gvizErr) {
      console.warn('GViz fallback read failed:', gvizErr);
      updateSyncIndicator('error', 'ใช้งานแบบออฟไลน์');
    }

    state.isSyncing = false;
  };

  /**
   * Send User Role Update to Server (Syncs directly with Google Sheet column E)
   */
  const sendUserRoleToServer = async (userId, role) => {
    try {
      const payload = {
        action: 'updateUserRole',
        userId: userId,
        role: role
      };
      await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Handles 302 redirect gracefully
      });
      return true;
    } catch (err) {
      console.warn('sendUserRoleToServer delay:', err);
      return false;
    }
  };

  /**
   * Send Full User Info Update to Server
   */
  const sendUserUpdateToServer = async (userData) => {
    try {
      const payload = {
        action: 'updateUser',
        data: {
          id: userData.id,
          name: userData.name,
          department: userData.department,
          role: userData.role,
          email: userData.email || ''
        }
      };
      await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return true;
    } catch (err) {
      console.warn('sendUserUpdateToServer delay:', err);
      return false;
    }
  };

  /**
   * Send New User Creation to Server
   */
  const sendNewUserToServer = async (userData) => {
    try {
      const payload = {
        action: 'addUser',
        data: {
          id: userData.id,
          pin: userData.pin || userData.id,
          name: userData.name,
          department: userData.department,
          role: userData.role || 'user',
          email: userData.email || ''
        }
      };
      await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return true;
    } catch (err) {
      console.warn('sendNewUserToServer delay:', err);
      return false;
    }
  };

  /**
   * Send User Deletion to Server
   */
  const sendDeleteUserToServer = async (userId) => {
    try {
      const payload = {
        action: 'deleteUser',
        userId: userId
      };
      await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return true;
    } catch (err) {
      console.warn('sendDeleteUserToServer delay:', err);
      return false;
    }
  };

  /**
   * Send Document Deletion to Server
   */
  const sendDeleteDocumentToServer = async (docId) => {
    try {
      const payload = {
        action: 'deleteDocument',
        docId: docId
      };
      await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      return true;
    } catch (err) {
      console.warn('sendDeleteDocumentToServer error:', err);
      return false;
    }
  };

  /**
   * Send Document Acknowledgment to Server
   */
  const sendAcknowledgeToServer = async (docId, userId) => {
    try {
      const payload = {
        action: 'acknowledge',
        docId: docId,
        userId: userId
      };
      await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Handles 302 redirect gracefully
      });
    } catch (err) {
      console.warn('Server acknowledge sync queued/delayed:', err);
    }
  };

  /**
   * Send New Document to Server (Handles HTTP 302 Redirect & DriveApp requirement)
   */
  const sendNewDocumentToServer = async (docData) => {
    try {
      const targetAudience = docData.targetType === 'all' ? 'All' : (docData.targetUsers || []).join(',');

      // Step 1: ส่ง metadata ก่อน (ไม่มี fileBase64 เพื่อป้องกัน payload ใหญ่เกิน)
      // เพื่อให้แน่ใจว่าแถวใน Documents Sheet ถูกสร้างขึ้นเสมอ
      const metaPayload = {
        action: 'addDocument',
        data: {
          title: docData.title,
          priority: docData.priority,
          urgencyLevel: docData.priority,
          startDate: docData.startDate,
          endDate: docData.endDate,
          targetType: docData.targetType,
          targetUsers: Array.isArray(docData.targetUsers) ? docData.targetUsers : [],
          targetAudience: targetAudience,
          fileName: docData.fileName || 'document.pdf',
          fileBase64: '',   // ไม่ส่งไฟล์ในรอบแรก เพื่อให้ payload เล็กและไม่เกิน GAS limit
          fileUrl: '',      // GAS จะสร้าง fileUrl เอง จาก Drive ในรอบที่สอง
          createdBy: state.currentUser ? state.currentUser.id : '',
          creatorName: state.currentUser ? state.currentUser.name : ''
        }
      };

      await fetch(CONFIG.GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(metaPayload),
        mode: 'no-cors' // จัดการ 302 redirect จาก GAS อัตโนมัติ
      });

      // Step 2: ส่งไฟล์ base64 แยกต่างหาก (ถ้ามี) ใน background
      // ใช้ setTimeout เพื่อไม่ block UI
      if (docData.fileBase64 && docData.fileBase64.length > 0) {
        setTimeout(async () => {
          try {
            const filePayload = {
              action: 'uploadDocumentFile',
              data: {
                docTitle: docData.title,  // ใช้ title จับคู่แถวที่เพิ่งสร้าง
                fileName: docData.fileName || 'document.pdf',
                fileBase64: docData.fileBase64,
                targetAudience: targetAudience
              }
            };
            await fetch(CONFIG.GAS_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(filePayload),
              mode: 'no-cors'
            });
          } catch (fileErr) {
            console.warn('File upload to Drive deferred/failed (non-critical):', fileErr);
          }
        }, 1500);
      }

      return true;
    } catch (err) {
      console.warn('sendNewDocumentToServer note:', err);
      return true;
    }
  };

  /* ==========================================================================
     7. AUTHENTICATION & SESSION MANAGEMENT
     ========================================================================== */
  const login = (staffId, pin) => {
    const trimmedId = String(staffId).trim();
    const trimmedPin = String(pin).trim();

    if (!trimmedId || !trimmedPin) {
      showToast('กรุณากรอกรหัสพนักงานและ PIN ให้ครบถ้วน', 'warning');
      return;
    }

    // Find user in master list
    const foundUser = state.users.find(u =>
      u.id.toLowerCase() === trimmedId.toLowerCase() &&
      (u.pin === trimmedPin || u.id === trimmedPin)
    );

    if (!foundUser) {
      showToast('รหัสพนักงานหรือ PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error');
      return;
    }

    // Set active user & save session
    state.currentUser = foundUser;
    localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(foundUser));

    // Load read tracking for logged-in user & set default tab to 'pending' (รอฉันรับทราบ)
    loadUserReadDocs(foundUser.id);
    state.docSubTab = 'pending';

    showToast(`ยินดีต้อนรับ ${foundUser.name} (${foundUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'บุคลากร'})`, 'success');

    // Smooth SPA Transition without page reload
    renderAppView();
    // Trigger background sync
    syncWithServer();
  };

  const logout = () => {
    state.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEY_USER);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    renderAppView();
  };

  /* ==========================================================================
     8. VIEW ROUTER & NAVIGATION (SPA - ZERO LOCATION.RELOAD)
     ========================================================================== */
  const renderAppView = () => {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    const tabUsersBtn = document.getElementById('tab-btn-users');
    const adminCreateContainer = document.getElementById('admin-create-doc-container');
    const userRoleBadge = document.getElementById('user-role-badge');
    const headerAvatar = document.getElementById('header-avatar-initial');
    const headerName = document.getElementById('header-user-name');
    const headerDept = document.getElementById('header-user-dept');

    if (!state.currentUser) {
      // Show Login Screen
      loginSection.classList.remove('hidden');
      mainSection.classList.add('hidden');
      document.getElementById('login-form').reset();
      return;
    }

    // Show Main Application
    loginSection.classList.add('hidden');
    mainSection.classList.remove('hidden');

    const isAdmin = state.currentUser.role === 'admin';

    // Update Header Profile
    headerName.textContent = state.currentUser.name;
    headerDept.textContent = `${state.currentUser.department} (รหัส ${state.currentUser.id})`;
    headerAvatar.textContent = state.currentUser.name.charAt(0) || 'U';

    // Role Badge
    if (isAdmin) {
      userRoleBadge.textContent = 'Admin (ผู้ดูแลระบบ)';
      userRoleBadge.className = 'hidden sm:inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800 border border-purple-300';
      tabUsersBtn.classList.remove('hidden');
      adminCreateContainer.classList.remove('hidden');
    } else {
      userRoleBadge.textContent = 'User (บุคลากร)';
      userRoleBadge.className = 'hidden sm:inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-hqd-800 border border-hqd-300';
      tabUsersBtn.classList.add('hidden');
      adminCreateContainer.classList.add('hidden');
      // If user was on users tab, switch to docs
      if (state.activeTab === 'users') {
        state.activeTab = 'docs';
      }
    }

    // Render active tab content
    switchTab(state.activeTab);
  };

  const switchTab = (tabName) => {
    state.activeTab = tabName;
    const tabDocsBtn = document.getElementById('tab-btn-docs');
    const tabUsersBtn = document.getElementById('tab-btn-users');
    const contentDocs = document.getElementById('tab-content-docs');
    const contentUsers = document.getElementById('tab-content-users');

    if (tabName === 'docs') {
      tabDocsBtn.classList.add('active');
      tabUsersBtn.classList.remove('active');
      contentDocs.classList.remove('hidden');
      contentUsers.classList.add('hidden');
      renderDocuments();
    } else if (tabName === 'users' && state.currentUser && state.currentUser.role === 'admin') {
      tabUsersBtn.classList.add('active');
      tabDocsBtn.classList.remove('active');
      contentUsers.classList.remove('hidden');
      contentDocs.classList.add('hidden');
      renderPersonnelManagement();
    }
  };

  const renderCurrentTab = () => {
    if (!state.currentUser) return;
    if (state.activeTab === 'docs') {
      renderDocuments();
    } else if (state.activeTab === 'users') {
      renderPersonnelManagement();
    }
  };

  const switchDocSubTab = (subTabName) => {
    state.docSubTab = subTabName;
    renderDocuments();
  };

  /* ==========================================================================
     9. RENDER: DOCUMENTS CIRCULATION TAB (With Status Glow Effects & Separation)
     ========================================================================== */
  const renderDocuments = () => {
    const grid = document.getElementById('docs-grid');
    const emptyState = document.getElementById('docs-empty-state');
    const countBadge = document.getElementById('badge-doc-count');
    const searchInput = document.getElementById('doc-search-input');
    const statusFilter = document.getElementById('doc-status-filter');
    const priorityFilter = document.getElementById('doc-priority-filter');

    if (!grid) return;

    const isAdmin = state.currentUser && state.currentUser.role === 'admin';
    const currentUserId = state.currentUser ? state.currentUser.id : '';

    // Filter documents by user assignment
    // Admin sees all circular documents; User sees only assigned to them
    let userDocs = state.documents.filter(doc => {
      if (isAdmin) return true;
      if (doc.targetType === 'all') return true;
      return Array.isArray(doc.targetUsers) && doc.targetUsers.includes(currentUserId);
    });

    // Calculate unread (pending) vs read (acknowledged) counts for the current user
    const pendingDocs = userDocs.filter(d => !d.acknowledgedUsers || !d.acknowledgedUsers.includes(currentUserId));
    const ackedDocs = userDocs.filter(d => d.acknowledgedUsers && d.acknowledgedUsers.includes(currentUserId));
    const allDocsCount = userDocs.length;

    // Update Sub-Tab Badges & Top Nav Badge
    const badgeSubPending = document.getElementById('badge-subtab-pending');
    const badgeSubAcked = document.getElementById('badge-subtab-acked');
    const badgeSubAll = document.getElementById('badge-subtab-all');
    const subtabHint = document.getElementById('doc-subtab-hint');

    if (badgeSubPending) badgeSubPending.textContent = pendingDocs.length;
    if (badgeSubAcked) badgeSubAcked.textContent = ackedDocs.length;
    if (badgeSubAll) badgeSubAll.textContent = allDocsCount;
    // Show unread pending count on main nav badge
    if (countBadge) countBadge.textContent = pendingDocs.length;

    // Update Sub-Tab active styles
    const btnPending = document.getElementById('doc-subtab-pending');
    const btnAcked = document.getElementById('doc-subtab-acked');
    const btnAll = document.getElementById('doc-subtab-all');

    if (btnPending) btnPending.classList.toggle('active', state.docSubTab === 'pending');
    if (btnAcked) btnAcked.classList.toggle('active', state.docSubTab === 'acked');
    if (btnAll) btnAll.classList.toggle('active', state.docSubTab === 'all');

    if (subtabHint) {
      if (state.docSubTab === 'pending') {
        subtabHint.textContent = 'แสดงเฉพาะเอกสารที่ท่านยังไม่ได้กดรับทราบ (รอการเปิดอ่าน)';
      } else if (state.docSubTab === 'acked') {
        subtabHint.textContent = 'แสดงเอกสารที่ท่านเปิดอ่านและกดรับทราบเรียบร้อยแล้ว';
      } else {
        subtabHint.textContent = 'แสดงเอกสารเวียนทั้งหมดในระบบ';
      }
    }

    // Filter according to active Sub-Tab
    let displayDocs = userDocs;
    if (state.docSubTab === 'pending') {
      displayDocs = pendingDocs;
    } else if (state.docSubTab === 'acked') {
      displayDocs = ackedDocs;
    }

    // Apply Search Filter
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchTerm) {
      displayDocs = displayDocs.filter(d =>
        (d.title && d.title.toLowerCase().includes(searchTerm)) ||
        (d.id && d.id.toLowerCase().includes(searchTerm))
      );
    }

    // Apply Priority Filter
    const selectedPriority = priorityFilter ? priorityFilter.value : 'all';
    if (selectedPriority !== 'all') {
      displayDocs = displayDocs.filter(d => d.priority === selectedPriority);
    }

    // Apply Status Filter (Glow status)
    const selectedStatus = statusFilter ? statusFilter.value : 'all';
    if (selectedStatus !== 'all') {
      displayDocs = displayDocs.filter(doc => {
        const statusMeta = calculateDocStatus(doc);
        return selectedStatus === statusMeta.statusKey;
      });
    }

    // Handle Empty States
    if (displayDocs.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');

      if (searchTerm || selectedPriority !== 'all' || selectedStatus !== 'all') {
        emptyState.innerHTML = `
          <div class="text-center py-16 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <div class="w-20 h-20 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mb-4">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <h3 class="text-2xl font-bold text-slate-800 mb-2">ไม่พบเอกสารที่ตรงกับเงื่อนไขการค้นหา</h3>
            <p class="text-slate-500 text-lg max-w-md mx-auto mb-5">ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อค้นหาอีกครั้ง</p>
            <button type="button" id="reset-doc-filters-btn" class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition cursor-pointer">
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        `;
        const resetBtn = document.getElementById('reset-doc-filters-btn');
        if (resetBtn) {
          resetBtn.onclick = () => {
            if (searchInput) searchInput.value = '';
            if (priorityFilter) priorityFilter.value = 'all';
            if (statusFilter) statusFilter.value = 'all';
            renderDocuments();
          };
        }
      } else if (state.docSubTab === 'pending') {
        emptyState.innerHTML = `
          <div class="text-center py-16 px-6 bg-white rounded-3xl border-2 border-emerald-300 shadow-sm">
            <div class="w-24 h-24 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-5xl mb-4 shadow-sm ring-8 ring-emerald-50">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <h3 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">ยอดเยี่ยมมาก! ไม่มีเอกสารค้างรับทราบ</h3>
            <p class="text-slate-600 text-lg sm:text-xl max-w-lg mx-auto mb-6">
              ท่านได้เปิดอ่านและกดรับทราบเอกสารเวียนที่มอบหมายครบถ้วนทุกฉบับแล้ว
            </p>
            <button type="button" id="empty-go-to-acked-btn" class="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xl font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition inline-flex items-center gap-3 cursor-pointer">
              <i class="fa-solid fa-list-check"></i>
              <span>ดูเอกสารที่รับทราบแล้ว (${ackedDocs.length} ฉบับ)</span>
            </button>
          </div>
        `;
        const goAckedBtn = document.getElementById('empty-go-to-acked-btn');
        if (goAckedBtn) {
          goAckedBtn.onclick = () => switchDocSubTab('acked');
        }
      } else if (state.docSubTab === 'acked') {
        emptyState.innerHTML = `
          <div class="text-center py-16 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <div class="w-20 h-20 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-3xl mb-4">
              <i class="fa-solid fa-file-circle-check"></i>
            </div>
            <h3 class="text-2xl font-bold text-slate-800 mb-2">ยังไม่มีเอกสารที่รับทราบแล้ว</h3>
            <p class="text-slate-500 text-lg max-w-md mx-auto mb-6">เมื่อท่านเปิดอ่านและกดยืนยันรับทราบเอกสาร รายการจะย้ายมาแสดงที่หน้านี้</p>
            <button type="button" id="empty-go-to-pending-btn" class="px-8 py-3.5 bg-hqd-600 hover:bg-hqd-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-hqd-600/30 transition inline-flex items-center gap-3 cursor-pointer">
              <i class="fa-solid fa-clock"></i>
              <span>ไปที่เอกสารรอรับทราบ (${pendingDocs.length} ฉบับ)</span>
            </button>
          </div>
        `;
        const goPendingBtn = document.getElementById('empty-go-to-pending-btn');
        if (goPendingBtn) {
          goPendingBtn.onclick = () => switchDocSubTab('pending');
        }
      } else {
        emptyState.innerHTML = `
          <div class="text-center py-16 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-300">
            <div class="w-24 h-24 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-4xl mb-4">
              <i class="fa-solid fa-folder-open"></i>
            </div>
            <h3 class="text-2xl font-bold text-slate-800 mb-2">ยังไม่มีเอกสารเวียนในระบบ</h3>
            <p class="text-slate-500 text-lg max-w-md mx-auto mb-6">พร้อมสำหรับการเริ่มต้นใช้งานจริง ${isAdmin ? 'ท่านสามารถสร้างเอกสารเวียนฉบับแรกได้ทันที' : 'ขณะนี้ยังไม่มีเอกสารที่มอบหมายให้ท่าน'}</p>
            ${isAdmin ? `
              <button type="button" id="empty-create-doc-btn" class="px-8 py-3.5 bg-hqd-600 hover:bg-hqd-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-hqd-600/30 transition inline-flex items-center gap-3 cursor-pointer">
                <i class="fa-solid fa-file-circle-plus"></i>
                <span>สร้างเอกสารเวียนฉบับแรก</span>
              </button>
            ` : ''}
          </div>
        `;
        const createFirstBtn = document.getElementById('empty-create-doc-btn');
        if (createFirstBtn) {
          createFirstBtn.onclick = () => openCreateDocModal();
        }
      }
      return;
    }

    emptyState.classList.add('hidden');

    // Render Document Cards
    grid.innerHTML = displayDocs.map(doc => {
      const statusMeta = calculateDocStatus(doc);
      const isAckByMe = doc.acknowledgedUsers && doc.acknowledgedUsers.includes(currentUserId);
      const myAckTime = isAckByMe && doc.acknowledgedDetails ? doc.acknowledgedDetails[currentUserId] : null;
      const hasRead = hasDocBeenRead(doc.id);

      // Target calculations for Admin progress bar
      const targetCount = doc.targetUsers ? doc.targetUsers.length : state.users.length;
      const ackCount = doc.acknowledgedUsers ? doc.acknowledgedUsers.length : 0;
      const percent = Math.min(100, Math.round((ackCount / (targetCount || 1)) * 100));

      // Priority Badge: Only 3 levels with distinct Elder-Friendly High-Contrast styling
      // ปกติ: สีเขียวอ่อน | ด่วน: สีส้ม | ด่วนที่สุด: สีแดง
      let priorityClass = 'priority-badge-normal';
      let priorityIcon = '<i class="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i>';
      let priorityText = 'ปกติ';

      if (doc.priority === 'ด่วนที่สุด') {
        priorityClass = 'priority-badge-most-urgent';
        priorityIcon = '<i class="fa-solid fa-triangle-exclamation mr-1.5 text-rose-600"></i>';
        priorityText = 'ด่วนที่สุด';
      } else if (doc.priority === 'ด่วน' || doc.priority === 'ด่วนมาก') {
        priorityClass = 'priority-badge-urgent';
        priorityIcon = '<i class="fa-solid fa-bell mr-1.5 text-amber-600"></i>';
        priorityText = 'ด่วน';
      }

      return `
        <article class="doc-card ${statusMeta.glowClass} bg-white rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between">
          
          <!-- Card Header (ID, Priority, Glow Status Tag) -->
          <div>
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-xl text-base font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  ${escapeHtml(doc.id)}
                </span>
                <span class="px-3.5 py-1 rounded-xl text-base font-bold ${priorityClass}">
                  ${priorityIcon}${escapeHtml(priorityText)}
                </span>
              </div>

              <!-- Status Glow Badge: ONE single colored icon per status, no duplicate dots -->
              <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-base font-bold border ${statusMeta.badgeColor}">
                ${statusMeta.iconHtml}
                <span>${escapeHtml(statusMeta.text)}</span>
              </span>
            </div>

            <!-- Document Title (Elder-friendly large font) -->
            <h3 class="text-2xl sm:text-2xl font-bold text-slate-900 leading-snug mb-3">
              ${escapeHtml(doc.title)}
            </h3>

            <!-- Dates & Target Info -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base text-slate-600 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-calendar-plus text-hqd-600"></i>
                <span>เริ่ม: <strong>${formatThaiDate(doc.startDate)}</strong></span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-calendar-check text-rose-500"></i>
                <span>สิ้นสุด: <strong>${formatThaiDate(doc.endDate)}</strong></span>
              </div>
              <div class="flex items-center gap-2 sm:col-span-2">
                <i class="fa-solid fa-users text-slate-500"></i>
                <span>เป้าหมาย: <strong>${doc.targetType === 'all' ? 'บุคลากรทุกคนในองค์กร' : `ระบุเฉพาะบุคคล (${targetCount} คน)`}</strong></span>
              </div>
            </div>

            <!-- ADMIN ONLY: Progress Bar & Ratio -->
            ${isAdmin ? `
              <div class="mb-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                <div class="flex justify-between items-center text-base font-bold text-slate-800 mb-2">
                  <span class="flex items-center gap-2">
                    <i class="fa-solid fa-chart-simple text-hqd-600"></i>
                    <span>ความคืบหน้าการรับทราบ</span>
                  </span>
                  <span class="text-hqd-800">${ackCount} / ${targetCount} คน (${percent}%)</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-4 overflow-hidden border border-slate-300">
                  <div 
                    class="h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-hqd-600'}" 
                    style="width: ${percent}%"
                  ></div>
                </div>
              </div>
            ` : ''}

          </div>

          <!-- Card Footer (Action Buttons) -->
          <div class="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <!-- Left: Read / Open Document Button -->
            <button 
              type="button" 
              class="open-viewer-btn px-5 py-3 rounded-2xl border-2 border-slate-300 hover:border-hqd-500 hover:bg-hqd-50 text-slate-700 hover:text-hqd-800 text-lg font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              data-id="${escapeHtml(doc.id)}"
            >
              <i class="fa-solid fa-book-open text-xl text-hqd-600"></i>
              <span>${hasRead ? 'เปิดอ่านอีกครั้ง' : 'เปิดอ่านเอกสาร'}</span>
            </button>

            <!-- Right: Acknowledge & Tracking Buttons -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              
              <!-- ADMIN SPECIAL: Tracking Overview & Delete Buttons -->
              ${isAdmin ? `
                <button 
                  type="button" 
                  class="open-tracking-btn px-4 py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 border-2 border-purple-300 text-lg font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  data-id="${escapeHtml(doc.id)}"
                  title="ดูรายชื่อผู้รับทราบแล้วและยังไม่อ่าน"
                >
                  <i class="fa-solid fa-chart-pie"></i>
                  <span>ภาพรวม</span>
                </button>
                <button 
                  type="button" 
                  class="delete-doc-btn px-3.5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 text-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  data-id="${escapeHtml(doc.id)}"
                  title="ลบเอกสารนี้"
                >
                  <i class="fa-solid fa-trash-can text-rose-600"></i>
                  <span>ลบ</span>
                </button>
              ` : ''}

              <!-- Acknowledge Button State: Read Enforced -->
              ${isAckByMe ? `
                <div class="px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-400 text-lg font-bold flex items-center justify-center gap-2 shadow-sm" title="${myAckTime ? `รับทราบเมื่อ: ${formatThaiDateTime(myAckTime)}` : ''}">
                  <i class="fa-solid fa-circle-check text-xl text-emerald-600"></i>
                  <span>รับทราบแล้ว</span>
                </div>
              ` : hasRead ? `
                <button 
                  type="button" 
                  class="ack-doc-btn px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-lg font-bold shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                  data-id="${escapeHtml(doc.id)}"
                  title="คลิกเพื่อบันทึกการรับทราบเอกสาร"
                >
                  <i class="fa-solid fa-check text-xl"></i>
                  <span>กดรับทราบ</span>
                </button>
              ` : `
                <button 
                  type="button" 
                  class="need-read-btn px-5 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-lg font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  data-id="${escapeHtml(doc.id)}"
                  title="ต้องเปิดอ่านเอกสารก่อนจึงจะสามารถกดรับทราบได้"
                >
                  <i class="fa-solid fa-lock text-amber-600"></i>
                  <span>ต้องเปิดอ่านก่อน</span>
                </button>
              `}

            </div>

          </div>

        </article>
      `;
    }).join('');

    // Attach Event Listeners to Buttons
    attachDocumentCardEvents();
  };

  const attachDocumentCardEvents = () => {
    // Open Document Viewer
    document.querySelectorAll('.open-viewer-btn').forEach(btn => {
      btn.onclick = () => {
        const docId = btn.getAttribute('data-id');
        openDocumentViewer(docId);
      };
    });

    // Need Read Button (Directs to reading document first)
    document.querySelectorAll('.need-read-btn').forEach(btn => {
      btn.onclick = () => {
        const docId = btn.getAttribute('data-id');
        showToast('กรุณาเปิดอ่านเนื้อหาเอกสารให้เข้าใจก่อนกดรับทราบ', 'warning', 3500);
        openDocumentViewer(docId);
      };
    });

    // Acknowledge Document (Only accessible when opened/read)
    document.querySelectorAll('.ack-doc-btn').forEach(btn => {
      btn.onclick = () => {
        const docId = btn.getAttribute('data-id');
        acknowledgeDocument(docId);
      };
    });

    // Open Tracking Overview (Admin)
    document.querySelectorAll('.open-tracking-btn').forEach(btn => {
      btn.onclick = () => {
        const docId = btn.getAttribute('data-id');
        openTrackingModal(docId);
      };
    });

    // Delete Document (Admin)
    document.querySelectorAll('.delete-doc-btn').forEach(btn => {
      btn.onclick = async () => {
        const docId = btn.getAttribute('data-id');
        const doc = state.documents.find(d => d.id === docId);
        if (!doc) return;

        if (!confirm(`ท่านต้องการลบเอกสาร "${doc.title}" ออกจากระบบใช่หรือไม่?`)) {
          return;
        }

        // Optimistic UI update
        state.documents = state.documents.filter(d => d.id !== docId);
        saveToLocalCache();
        renderCurrentTab();
        showToast(`ลบเอกสาร "${doc.title}" เรียบร้อยแล้ว`, 'success');

        await sendDeleteDocumentToServer(docId);
      };
    });
  };

  /**
   * Action: Acknowledge a circular document
   */
  const acknowledgeDocument = async (docId) => {
    if (!state.currentUser) return;
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    const currentUserId = state.currentUser.id;
    if (!doc.acknowledgedUsers) doc.acknowledgedUsers = [];
    if (!doc.acknowledgedDetails) doc.acknowledgedDetails = {};

    if (!doc.acknowledgedUsers.includes(currentUserId)) {
      doc.acknowledgedUsers.push(currentUserId);
      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      doc.acknowledgedDetails[currentUserId] = timeStr;

      saveToLocalCache();
      showToast(`ท่านได้รับทราบเอกสาร "${doc.title}" เรียบร้อยแล้ว (ย้ายไปที่แท็บรับทราบแล้ว)`, 'success', 5000);

      // Reactive re-render with 0-second latency
      renderCurrentTab();

      // Background async sync with Google Apps Script
      sendAcknowledgeToServer(docId, currentUserId);
    }
  };

  /* ==========================================================================
     10. RENDER: PERSONNEL MANAGEMENT TAB (ADMIN REAL-TIME TWO-WAY SYNC)
     ========================================================================== */
  const renderPersonnelManagement = () => {
    const tableBody = document.getElementById('users-table-body');
    const searchInput = document.getElementById('user-search-input');
    const deptFilter = document.getElementById('user-dept-filter');
    const roleFilter = document.getElementById('user-role-filter');
    const countSummary = document.getElementById('users-summary-count');
    const badgeUserCount = document.getElementById('badge-user-count');

    if (!tableBody) return;

    badgeUserCount.textContent = state.users.length;

    // Populate Department Filter options dynamically
    const departments = Array.from(new Set(state.users.map(u => u.department || 'ไม่ระบุ'))).sort();
    const currentDeptVal = deptFilter.value;
    deptFilter.innerHTML = '<option value="all">แผนกทั้งหมด</option>' +
      departments.map(d => `<option value="${escapeHtml(d)}" ${d === currentDeptVal ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('');

    // Filter Users
    let filteredUsers = [...state.users];

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(u =>
        (u.id && u.id.toLowerCase().includes(searchTerm)) ||
        (u.name && u.name.toLowerCase().includes(searchTerm)) ||
        (u.department && u.department.toLowerCase().includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(searchTerm))
      );
    }

    if (deptFilter && deptFilter.value !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.department === deptFilter.value);
    }

    if (roleFilter && roleFilter.value !== 'all') {
      filteredUsers = filteredUsers.filter(u => u.role === roleFilter.value);
    }

    countSummary.textContent = `แสดง ${filteredUsers.length} จากทั้งหมด ${state.users.length} คน`;

    if (filteredUsers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-12 text-slate-400 font-medium">
            <i class="fa-solid fa-users-slash text-4xl mb-2"></i>
            <div>ไม่พบรายชื่อบุคลากรที่ตรงกับเงื่อนไข</div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filteredUsers.map(user => {
      const isAdmin = user.role === 'admin';
      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="py-4 px-6 font-bold text-slate-800">${escapeHtml(user.id)}</td>
          <td class="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold">
              ${escapeHtml(user.name.charAt(0) || 'U')}
            </div>
            <span>${escapeHtml(user.name)}</span>
          </td>
          <td class="py-4 px-6 text-slate-600">${escapeHtml(user.department || '-')}</td>
          <td class="py-4 px-6 text-slate-500 font-sans text-base">${escapeHtml(user.email || '-')}</td>
          <td class="py-4 px-6 text-center">
            <button 
              type="button" 
              class="toggle-role-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-bold border transition cursor-pointer ${isAdmin ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}"
              data-id="${escapeHtml(user.id)}"
              title="คลิกเพื่อสลับบทบาท"
            >
              <i class="fa-solid ${isAdmin ? 'fa-user-shield text-purple-600' : 'fa-user text-slate-500'}"></i>
              <span>${isAdmin ? 'Admin' : 'User'}</span>
            </button>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="flex items-center justify-center gap-2">
              <button 
                type="button" 
                class="edit-user-btn p-2 text-hqd-600 hover:text-hqd-800 hover:bg-hqd-50 rounded-xl transition text-lg"
                data-id="${escapeHtml(user.id)}"
                title="แก้ไขข้อมูล"
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button 
                type="button" 
                class="delete-user-btn p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition text-lg"
                data-id="${escapeHtml(user.id)}"
                title="ลบรายชื่อ"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Personnel Events
    attachPersonnelEvents();
  };

  const attachPersonnelEvents = () => {
    // Toggle Role (User <-> Admin)
    document.querySelectorAll('.toggle-role-btn').forEach(btn => {
      btn.onclick = async () => {
        const userId = btn.getAttribute('data-id');
        const user = state.users.find(u => u.id === userId);
        if (user) {
          const newRole = user.role === 'admin' ? 'user' : 'admin';
          user.role = newRole;

          // 1. Save role override to localStorage so background sync never reverts it
          saveRoleOverride(userId, newRole);
          saveToLocalCache();

          // 2. If the user being modified is the currently logged-in user, immediately update session & UI
          if (state.currentUser && state.currentUser.id === userId) {
            state.currentUser.role = newRole;
            localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(state.currentUser));
            renderAppView();
          }

          showToast(`เปลี่ยนบทบาทของ ${user.name} เป็น ${newRole === 'admin' ? 'Admin (ผู้ดูแลระบบ)' : 'User (บุคลากร)'} เรียบร้อยแล้ว`, 'success');
          renderPersonnelManagement();

          // 3. Dispatch to Google Apps Script / Sheet
          await sendUserRoleToServer(userId, newRole);
        }
      };
    });

    // Edit User
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.onclick = () => {
        const userId = btn.getAttribute('data-id');
        const user = state.users.find(u => u.id === userId);
        if (user) {
          openUserFormModal('edit', user);
        }
      };
    });

    // Delete User
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.onclick = async () => {
        const userId = btn.getAttribute('data-id');
        const user = state.users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`คุณต้องการลบรายชื่อ "${user.name}" (รหัส ${user.id}) ออกจากระบบใช่หรือไม่?`)) {
          state.users = state.users.filter(u => u.id !== userId);
          deleteRoleOverride(userId);
          saveToLocalCache();
          showToast(`ลบข้อมูล ${user.name} สำเร็จ`, 'info');
          renderPersonnelManagement();
          await sendDeleteUserToServer(userId);
        }
      };
    });
  };

  /**
   * Setup Date Pickers for Document Creation with Thai Date (วัน เดือน ปี) preview
   */
  const setupDatePickers = () => {
    const startInput = document.getElementById('doc-form-start-date');
    const endInput = document.getElementById('doc-form-end-date');
    const startDisplay = document.querySelector('#doc-form-start-date-display .date-text');
    const endDisplay = document.querySelector('#doc-form-end-date-display .date-text');
    if (!startInput || !endInput) return;

    const updateDisplay = () => {
      if (startDisplay) {
        startDisplay.textContent = startInput.value ? formatThaiDate(startInput.value) : '-';
      }
      if (endDisplay) {
        endDisplay.textContent = endInput.value ? formatThaiDate(endInput.value) : '-';
      }
    };

    if (!startInput.dataset.hasDateListener) {
      startInput.addEventListener('change', updateDisplay);
      startInput.addEventListener('input', updateDisplay);
      endInput.addEventListener('change', updateDisplay);
      endInput.addEventListener('input', updateDisplay);
      startInput.dataset.hasDateListener = 'true';
    }

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const toYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    startInput.value = toYMD(today);
    endInput.value = toYMD(nextWeek);
    updateDisplay();
  };

  const openCreateDocModal = () => {
    const modal = document.getElementById('modal-create-doc');
    const form = document.getElementById('create-doc-form');
    form.reset();

    // Setup Date Pickers with Thai Date format (วัน เดือน ปี)
    setupDatePickers();

    // Reset file preview
    state.selectedCreateFile = null;
    state.selectedCreateBase64 = '';
    document.getElementById('file-drop-prompt').classList.remove('hidden');
    document.getElementById('file-selected-info').classList.add('hidden');

    // Reset Target Users Grid
    // STRICT REQUIREMENT: Pre-check all users by default!
    state.selectedTargetUserIds = new Set(state.users.map(u => u.id));
    renderTargetUsersGrid();

    // Reset radio selection to 'all'
    const radios = form.querySelectorAll('input[name="targetType"]');
    radios.forEach(r => { if (r.value === 'all') r.checked = true; });
    document.getElementById('specific-users-container').classList.add('hidden');

    showModal('modal-create-doc');
  };

  /**
   * Render Elder-friendly Checkbox Grid for Specific Personnel Target
   * STRICT REQUIREMENT: All pre-checked by default so admin unchecks non-relevant ones
   */
  const renderTargetUsersGrid = (filterTerm = '') => {
    const grid = document.getElementById('target-users-grid');
    const indicator = document.getElementById('target-count-indicator');
    if (!grid) return;

    let displayUsers = [...state.users];
    if (filterTerm) {
      const term = filterTerm.toLowerCase();
      displayUsers = displayUsers.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term) ||
        (u.department && u.department.toLowerCase().includes(term))
      );
    }

    grid.innerHTML = displayUsers.map(user => {
      const isChecked = state.selectedTargetUserIds.has(user.id);
      return `
        <label class="user-checkbox-card p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 ${isChecked ? 'selected' : 'border-slate-200'}">
          <input 
            type="checkbox" 
            class="target-user-cb w-6 h-6 text-hqd-600 rounded focus:ring-hqd-500 cursor-pointer"
            value="${escapeHtml(user.id)}" 
            ${isChecked ? 'checked' : ''}
          />
          <div class="overflow-hidden flex-1">
            <div class="font-bold text-slate-800 text-base leading-tight truncate">${escapeHtml(user.name)}</div>
            <div class="text-xs text-slate-500 truncate">${escapeHtml(user.department || '')} • ${escapeHtml(user.id)}</div>
          </div>
        </label>
      `;
    }).join('');

    if (indicator) {
      indicator.textContent = `เลือกแล้ว ${state.selectedTargetUserIds.size} จาก ${state.users.length} คน`;
    }

    // Attach change handlers
    grid.querySelectorAll('.target-user-cb').forEach(cb => {
      cb.onchange = () => {
        const id = cb.value;
        if (cb.checked) {
          state.selectedTargetUserIds.add(id);
          cb.closest('.user-checkbox-card').classList.add('selected');
        } else {
          state.selectedTargetUserIds.delete(id);
          cb.closest('.user-checkbox-card').classList.remove('selected');
        }
        if (indicator) {
          indicator.textContent = `เลือกแล้ว ${state.selectedTargetUserIds.size} จาก ${state.users.length} คน`;
        }
      };
    });
  };

  /**
   * Handle Create Document Form Submit
   */
  const handleCreateDocumentSubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById('doc-form-title').value.trim();
    const priority = document.getElementById('doc-form-priority').value;
    const startDate = document.getElementById('doc-form-start-date').value;
    const endDate = document.getElementById('doc-form-end-date').value;
    const targetType = document.querySelector('input[name="targetType"]:checked').value;

    if (!title) {
      showToast('กรุณากรอกชื่อเรื่องเอกสาร', 'warning');
      return;
    }

    if (!startDate || !endDate) {
      showToast('กรุณาระบุวันที่เริ่มและสิ้นสุดให้ครบถ้วน', 'warning');
      return;
    }

    if (endDate < startDate) {
      showToast('วันที่สิ้นสุด (Deadline) ต้องไม่น้อยกว่าวันที่เริ่มต้น', 'warning');
      return;
    }

    if (!state.selectedCreateBase64) {
      showToast('กรุณาแนบไฟล์เอกสาร (PDF หรือ รูปภาพ)', 'warning');
      return;
    }

    let targetUsersList = [];
    if (targetType === 'all') {
      targetUsersList = state.users.map(u => u.id);
    } else {
      targetUsersList = Array.from(state.selectedTargetUserIds);
      if (targetUsersList.length === 0) {
        showToast('กรุณาเลือกบุคลากรเป้าหมายอย่างน้อย 1 คน', 'warning');
        return;
      }
    }

    const submitBtn = document.getElementById('create-doc-submit-btn');
    const btnText = document.getElementById('create-doc-btn-text');
    const btnIcon = document.getElementById('create-doc-btn-icon');

    // UI Loading state
    submitBtn.disabled = true;
    btnText.textContent = 'กำลังบันทึกและเวียนเอกสาร...';
    btnIcon.className = 'fa-solid fa-spinner fa-spin text-xl';

    const newDocId = `DOC-${new Date().getFullYear()}-${String(state.documents.length + 1).padStart(3, '0')}`;
    const newDoc = {
      id: newDocId,
      title: title,
      fileUrl: state.selectedCreateBase64, // Local data URL for instant viewing
      fileName: state.selectedCreateFile ? state.selectedCreateFile.name : 'document.pdf',
      fileMime: state.selectedCreateFile ? state.selectedCreateFile.type : 'application/pdf',
      fileBase64: state.selectedCreateBase64,
      priority: priority,
      startDate: startDate,
      endDate: endDate,
      targetType: targetType,
      targetUsers: targetUsersList,
      acknowledgedUsers: [],
      acknowledgedDetails: {},
      createdAt: new Date().toISOString()
    };

    // 1. Optimistic instant UI update
    state.documents.unshift(newDoc);
    saveToLocalCache();
    renderCurrentTab();

    // 2. Dispatch to Server with HTTP 302 Redirect handling
    await sendNewDocumentToServer(newDoc);

    // Reset button & close modal
    submitBtn.disabled = false;
    btnText.textContent = 'บันทึกและเวียนเอกสาร';
    btnIcon.className = 'fa-solid fa-paper-plane';

    closeModal('modal-create-doc');
    showToast(`สร้างเอกสาร "${title}" และเวียนให้บุคลากรเรียบร้อยแล้ว`, 'success', 5000);
  };

  /* ==========================================================================
     12. MODAL: TRACKING OVERVIEW (ADMIN - ACKNOWLEDGED VS UNREAD)
     ========================================================================== */
  const openTrackingModal = (docId) => {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    state.viewingDocId = docId;

    document.getElementById('modal-tracking-title').textContent = `ภาพรวมสถานะ (${doc.id})`;
    document.getElementById('modal-tracking-subtitle').textContent = doc.title;

    // Calculate targets & acks
    const targetIds = doc.targetType === 'all'
      ? state.users.map(u => u.id)
      : (doc.targetUsers || []);

    const ackIds = new Set(doc.acknowledgedUsers || []);

    const ackUsers = [];
    const pendingUsers = [];

    targetIds.forEach(id => {
      const user = state.users.find(u => u.id === id) || { id, name: `รหัส ${id}`, department: 'ไม่ระบุ' };
      if (ackIds.has(id)) {
        ackUsers.push({
          ...user,
          ackTime: doc.acknowledgedDetails ? doc.acknowledgedDetails[id] : null
        });
      } else {
        pendingUsers.push(user);
      }
    });

    // Update Counters
    document.getElementById('track-total-count').textContent = targetIds.length;
    document.getElementById('track-ack-count').textContent = ackUsers.length;
    document.getElementById('track-pending-count').textContent = pendingUsers.length;

    document.getElementById('track-tab-ack-badge').textContent = ackUsers.length;
    document.getElementById('track-tab-pending-badge').textContent = pendingUsers.length;

    // Render Acknowledged List
    const ackContainer = document.getElementById('track-list-ack');
    if (ackUsers.length === 0) {
      ackContainer.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <i class="fa-solid fa-clipboard-question text-3xl mb-2"></i>
          <div>ยังไม่มีผู้รับทราบเอกสารนี้</div>
        </div>
      `;
    } else {
      ackContainer.innerHTML = ackUsers.map(u => `
        <div class="flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-300 transition">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <div class="font-bold text-slate-900 text-lg">${escapeHtml(u.name)}</div>
              <div class="text-sm text-slate-500">${escapeHtml(u.department || '')} • รหัส ${escapeHtml(u.id)}</div>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-base font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <i class="fa-solid fa-circle-check text-emerald-600"></i>
              <span>รับทราบแล้ว</span>
            </span>
            <div class="text-xs text-slate-500 mt-1">${u.ackTime ? formatThaiDateTime(u.ackTime) : '-'}</div>
          </div>
        </div>
      `).join('');
    }

    // Render Pending Unread List
    const pendingContainer = document.getElementById('track-list-pending');
    if (pendingUsers.length === 0) {
      pendingContainer.innerHTML = `
        <div class="text-center py-8 text-emerald-600">
          <i class="fa-solid fa-circle-check text-4xl mb-2"></i>
          <div class="text-xl font-bold">รับทราบครบทุกคนแล้ว 100%!</div>
        </div>
      `;
    } else {
      pendingContainer.innerHTML = pendingUsers.map(u => `
        <div class="flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-rose-300 transition">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <div class="font-bold text-slate-900 text-lg">${escapeHtml(u.name)}</div>
              <div class="text-sm text-slate-500">${escapeHtml(u.department || '')} • รหัส ${escapeHtml(u.id)}</div>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-base font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <i class="fa-solid fa-clock text-rose-600"></i>
            <span>ยังไม่อ่าน</span>
          </span>
        </div>
      `).join('');
    }

    // Set Default Tab to Acknowledged
    switchTrackingTab('ack');

    showModal('modal-tracking');
  };

  const switchTrackingTab = (type) => {
    const tabAckBtn = document.getElementById('track-tab-ack-btn');
    const tabPendingBtn = document.getElementById('track-tab-pending-btn');
    const listAck = document.getElementById('track-list-ack');
    const listPending = document.getElementById('track-list-pending');

    if (type === 'ack') {
      tabAckBtn.className = 'pb-3 text-xl font-bold border-b-4 border-emerald-500 text-emerald-700 flex items-center gap-2 transition';
      tabPendingBtn.className = 'pb-3 text-xl font-bold border-b-4 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition';
      listAck.classList.remove('hidden');
      listPending.classList.add('hidden');
    } else {
      tabPendingBtn.className = 'pb-3 text-xl font-bold border-b-4 border-rose-500 text-rose-700 flex items-center gap-2 transition';
      tabAckBtn.className = 'pb-3 text-xl font-bold border-b-4 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition';
      listPending.classList.remove('hidden');
      listAck.classList.add('hidden');
    }
  };

  /* ==========================================================================
     13. MODAL: DOCUMENT VIEWER
     ========================================================================== */
  const openDocumentViewer = (docId) => {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    state.viewingDocId = docId;

    // Automatically mark this document as read/opened by the current user
    markDocAsRead(docId);

    document.getElementById('viewer-doc-title').textContent = doc.title;
    document.getElementById('viewer-doc-meta').textContent = `${doc.id} • ระดับความสำคัญ: ${doc.priority} • ครบกำหนด: ${formatThaiDate(doc.endDate)}`;

    const iframe = document.getElementById('viewer-frame');
    const img = document.getElementById('viewer-image');
    const downloadLink = document.getElementById('viewer-download-link');
    const confirmContainer = document.getElementById('viewer-confirm-container');
    const confirmCheckbox = document.getElementById('viewer-confirm-checkbox');
    const actionContainer = document.getElementById('viewer-ack-action-container');

    downloadLink.href = doc.fileUrl || '#';

    // Check if it's an image or PDF
    const isImage = (doc.fileMime && doc.fileMime.startsWith('image/')) || (doc.fileName && /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName));

    if (isImage) {
      iframe.classList.add('hidden');
      img.classList.remove('hidden');
      img.src = doc.fileUrl;
    } else {
      img.classList.add('hidden');
      iframe.classList.remove('hidden');
      iframe.src = doc.fileUrl;
    }

    // Configure Acknowledge Button & Mandatory Checkbox state
    const currentUserId = state.currentUser ? state.currentUser.id : '';
    const isAckByMe = doc.acknowledgedUsers && doc.acknowledgedUsers.includes(currentUserId);
    const myAckTime = isAckByMe && doc.acknowledgedDetails ? doc.acknowledgedDetails[currentUserId] : null;

    if (isAckByMe) {
      if (confirmContainer) confirmContainer.classList.add('hidden');
      if (actionContainer) {
        actionContainer.innerHTML = `
          <div class="w-full lg:w-auto px-6 py-3.5 rounded-2xl bg-emerald-100 text-emerald-800 border-2 border-emerald-400 text-lg font-bold flex items-center justify-center gap-2 shadow-sm">
            <i class="fa-solid fa-circle-check text-2xl text-emerald-600"></i>
            <span>ท่านได้รับทราบเอกสารนี้แล้ว ${myAckTime ? `(${formatThaiDateTime(myAckTime)})` : ''}</span>
          </div>
        `;
      }
    } else {
      if (confirmContainer) confirmContainer.classList.remove('hidden');
      if (confirmCheckbox) confirmCheckbox.checked = false;

      if (actionContainer) {
        actionContainer.innerHTML = `
          <button 
            type="button" 
            id="viewer-ack-btn" 
            disabled
            class="w-full lg:w-auto px-8 py-3.5 text-xl font-bold text-slate-400 bg-slate-200 border-2 border-slate-300 rounded-2xl transition flex items-center justify-center gap-3 opacity-70 cursor-not-allowed"
          >
            <i class="fa-solid fa-lock text-xl" id="viewer-ack-btn-icon"></i>
            <span id="viewer-ack-btn-text">กรุณาติ๊กยืนยันว่าได้อ่านแล้ว</span>
          </button>
        `;

        const ackBtn = document.getElementById('viewer-ack-btn');
        const ackIcon = document.getElementById('viewer-ack-btn-icon');
        const ackText = document.getElementById('viewer-ack-btn-text');

        if (confirmCheckbox) {
          confirmCheckbox.onchange = () => {
            if (confirmCheckbox.checked) {
              ackBtn.disabled = false;
              ackBtn.className = 'w-full lg:w-auto px-8 py-3.5 text-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-3 cursor-pointer ring-4 ring-emerald-200';
              if (ackIcon) ackIcon.className = 'fa-solid fa-check-circle text-2xl';
              if (ackText) ackText.textContent = 'ฉันได้อ่านและรับทราบแล้ว';
            } else {
              ackBtn.disabled = true;
              ackBtn.className = 'w-full lg:w-auto px-8 py-3.5 text-xl font-bold text-slate-400 bg-slate-200 border-2 border-slate-300 rounded-2xl transition flex items-center justify-center gap-3 opacity-70 cursor-not-allowed';
              if (ackIcon) ackIcon.className = 'fa-solid fa-lock text-xl';
              if (ackText) ackText.textContent = 'กรุณาติ๊กยืนยันว่าได้อ่านแล้ว';
            }
          };
        }

        ackBtn.onclick = () => {
          if (!confirmCheckbox || !confirmCheckbox.checked) {
            showToast('กรุณาคลิกเลือกยืนยันว่าได้เปิดอ่านเอกสารเรียบร้อยแล้ว', 'warning');
            return;
          }
          acknowledgeDocument(docId);
          closeModal('modal-doc-viewer');
        };
      }
    }

    showModal('modal-doc-viewer');
  };

  /* ==========================================================================
     14. MODAL: PERSONNEL ADD / EDIT
     ========================================================================== */
  const openUserFormModal = (mode = 'add', user = null) => {
    const form = document.getElementById('user-mgmt-form');
    form.reset();

    const titleEl = document.getElementById('modal-user-form-title');
    const modeEl = document.getElementById('user-form-mode');
    const idInput = document.getElementById('user-form-id');
    const nameInput = document.getElementById('user-form-name');
    const deptInput = document.getElementById('user-form-dept');
    const emailInput = document.getElementById('user-form-email');
    const roleSelect = document.getElementById('user-form-role');

    modeEl.value = mode;

    if (mode === 'edit' && user) {
      titleEl.textContent = `แก้ไขข้อมูลบุคลากร (${user.id})`;
      idInput.value = user.id;
      idInput.readOnly = true;
      idInput.classList.add('bg-slate-100');
      nameInput.value = user.name;
      deptInput.value = user.department || '';
      emailInput.value = user.email || '';
      roleSelect.value = user.role || 'user';
    } else {
      titleEl.textContent = 'เพิ่มบุคลากรใหม่';
      idInput.readOnly = false;
      idInput.classList.remove('bg-slate-100');
      roleSelect.value = 'user';
    }

    showModal('modal-user-form');
  };

  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    const mode = document.getElementById('user-form-mode').value;
    const id = document.getElementById('user-form-id').value.trim();
    const name = document.getElementById('user-form-name').value.trim();
    const dept = document.getElementById('user-form-dept').value.trim();
    const email = document.getElementById('user-form-email').value.trim();
    const role = document.getElementById('user-form-role').value;

    if (!id || !name || !dept) {
      showToast('กรุณากรอกรหัสพนักงาน ชื่อ-นามสกุล และแผนกให้ครบถ้วน', 'warning');
      return;
    }

    if (mode === 'add') {
      // Check duplicate ID
      if (state.users.some(u => u.id === id)) {
        showToast(`รหัสพนักงาน "${id}" มีอยู่ในระบบแล้ว`, 'error');
        return;
      }
      const newUser = { id, pin: id, name, department: dept, email, role };
      state.users.push(newUser);
      saveRoleOverride(id, role);
      saveToLocalCache();
      showToast(`เพิ่มบุคลากร "${name}" สำเร็จ`, 'success');
      sendNewUserToServer(newUser);
    } else {
      // Update
      const existing = state.users.find(u => u.id === id);
      if (existing) {
        existing.name = name;
        existing.department = dept;
        existing.email = email;
        existing.role = role;
        saveRoleOverride(id, role);
        saveToLocalCache();

        if (state.currentUser && state.currentUser.id === id) {
          state.currentUser.name = name;
          state.currentUser.department = dept;
          state.currentUser.role = role;
          localStorage.setItem(CONFIG.STORAGE_KEY_USER, JSON.stringify(state.currentUser));
          renderAppView();
        }

        showToast(`อัปเดตข้อมูล "${name}" สำเร็จ`, 'success');
        sendUserUpdateToServer(existing);
      }
    }

    saveToLocalCache();
    renderPersonnelManagement();
    closeModal('modal-user-form');
  };

  /* ==========================================================================
     15. MODAL SYSTEM HELPERS
     ========================================================================== */
  const showModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    state.activeModal = modalId;
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    state.activeModal = null;
    document.body.style.overflow = '';

    // If viewer modal, reset iframe src to stop playing/loading
    if (modalId === 'modal-doc-viewer') {
      const iframe = document.getElementById('viewer-frame');
      if (iframe) iframe.src = 'about:blank';
    }
  };

  /* ==========================================================================
     16. ACCESSIBILITY & FONT SIZING CONTROLS
     ========================================================================== */
  const setFontScale = (scale) => {
    document.documentElement.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    document.documentElement.classList.add(`font-scale-${scale}`);
    localStorage.setItem(CONFIG.STORAGE_KEY_FONT, scale);

    const btnSm = document.getElementById('font-size-sm');
    const btnMd = document.getElementById('font-size-md');
    const btnLg = document.getElementById('font-size-lg');

    [btnSm, btnMd, btnLg].forEach(btn => {
      if (btn) btn.className = 'px-2.5 py-1 text-base rounded-xl font-bold text-slate-600 hover:text-slate-900 transition';
    });

    const activeBtn = scale === 'sm' ? btnSm : scale === 'lg' ? btnLg : btnMd;
    if (activeBtn) {
      activeBtn.className = 'px-2.5 py-1 text-base rounded-xl font-bold bg-white text-hqd-700 shadow-sm transition';
    }
  };

  /* ==========================================================================
     17. EVENT BINDINGS & APP INITIALIZATION
     ========================================================================== */
  const initializeEventListeners = () => {

    // --- 1. Login Form ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value;
        const pin = document.getElementById('login-pin').value;
        login(id, pin);
      };
    }

    // Toggle PIN visibility
    const togglePinBtn = document.getElementById('toggle-pin-btn');
    if (togglePinBtn) {
      togglePinBtn.onclick = () => {
        const pinInput = document.getElementById('login-pin');
        const icon = document.getElementById('toggle-pin-icon');
        if (pinInput.type === 'password') {
          pinInput.type = 'text';
          icon.className = 'fa-solid fa-eye-slash';
        } else {
          pinInput.type = 'password';
          icon.className = 'fa-solid fa-eye';
        }
      };
    }

    // (Quick demo login buttons removed for security)

    // --- 2. Top Navigation & Logout ---
    document.getElementById('logout-btn').onclick = logout;
    document.getElementById('tab-btn-docs').onclick = () => switchTab('docs');
    document.getElementById('tab-btn-users').onclick = () => switchTab('users');

    // Manual Refresh button
    const refreshBtn = document.getElementById('manual-refresh-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        showToast('กำลังตรวจสอบการอัปเดตข้อมูล...', 'info');
        syncWithServer();
      };
    }

    // Font Sizing Switcher
    document.getElementById('font-size-sm').onclick = () => setFontScale('sm');
    document.getElementById('font-size-md').onclick = () => setFontScale('md');
    document.getElementById('font-size-lg').onclick = () => setFontScale('lg');

    // --- 2.1 Document Sub-Tabs (Pending / Acked / All) ---
    const subPendingBtn = document.getElementById('doc-subtab-pending');
    const subAckedBtn = document.getElementById('doc-subtab-acked');
    const subAllBtn = document.getElementById('doc-subtab-all');

    if (subPendingBtn) subPendingBtn.onclick = () => switchDocSubTab('pending');
    if (subAckedBtn) subAckedBtn.onclick = () => switchDocSubTab('acked');
    if (subAllBtn) subAllBtn.onclick = () => switchDocSubTab('all');

    // --- 3. Document Filters & Search ---
    const docSearch = document.getElementById('doc-search-input');
    const docStatusFilter = document.getElementById('doc-status-filter');
    const docPriorityFilter = document.getElementById('doc-priority-filter');

    if (docSearch) docSearch.oninput = renderDocuments;
    if (docStatusFilter) docStatusFilter.onchange = renderDocuments;
    if (docPriorityFilter) docPriorityFilter.onchange = renderDocuments;

    // --- 4. Personnel Search & Filters ---
    const userSearch = document.getElementById('user-search-input');
    const userDeptFilter = document.getElementById('user-dept-filter');
    const userRoleFilter = document.getElementById('user-role-filter');

    if (userSearch) userSearch.oninput = renderPersonnelManagement;
    if (userDeptFilter) userDeptFilter.onchange = renderPersonnelManagement;
    if (userRoleFilter) userRoleFilter.onchange = renderPersonnelManagement;

    // Open Add Personnel Modal
    const openAddUserBtn = document.getElementById('open-add-user-modal-btn');
    if (openAddUserBtn) {
      openAddUserBtn.onclick = () => openUserFormModal('add');
    }

    // Personnel Form Submit
    const userMgmtForm = document.getElementById('user-mgmt-form');
    if (userMgmtForm) {
      userMgmtForm.onsubmit = handleUserFormSubmit;
    }

    // --- 5. Create Document Modal Triggers ---
    const openCreateDocBtn = document.getElementById('open-create-doc-modal-btn');
    if (openCreateDocBtn) {
      openCreateDocBtn.onclick = openCreateDocModal;
    }

    const createDocForm = document.getElementById('create-doc-form');
    if (createDocForm) {
      createDocForm.onsubmit = handleCreateDocumentSubmit;
    }

    // Target Type Radio Switch
    const targetRadios = document.querySelectorAll('input[name="targetType"]');
    targetRadios.forEach(radio => {
      radio.onchange = () => {
        const specificContainer = document.getElementById('specific-users-container');
        if (radio.value === 'specific') {
          specificContainer.classList.remove('hidden');
          renderTargetUsersGrid();
        } else {
          specificContainer.classList.add('hidden');
        }
      };
    });

    // Select/Deselect All Target Users
    const selectAllBtn = document.getElementById('select-all-users-btn');
    if (selectAllBtn) {
      selectAllBtn.onclick = () => {
        state.selectedTargetUserIds = new Set(state.users.map(u => u.id));
        renderTargetUsersGrid(document.getElementById('modal-user-search-input').value);
      };
    }

    const deselectAllBtn = document.getElementById('deselect-all-users-btn');
    if (deselectAllBtn) {
      deselectAllBtn.onclick = () => {
        state.selectedTargetUserIds.clear();
        renderTargetUsersGrid(document.getElementById('modal-user-search-input').value);
      };
    }

    // Modal Search Target Users
    const modalUserSearch = document.getElementById('modal-user-search-input');
    if (modalUserSearch) {
      modalUserSearch.oninput = (e) => {
        renderTargetUsersGrid(e.target.value);
      };
    }

    // File Upload Drag & Drop and File Picker
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('doc-form-file');
    const dropPrompt = document.getElementById('file-drop-prompt');
    const selectedInfo = document.getElementById('file-selected-info');
    const fileNameDisplay = document.getElementById('file-name-display');
    const fileSizeDisplay = document.getElementById('file-size-display');
    const removeFileBtn = document.getElementById('remove-file-btn');

    if (dropZone && fileInput) {
      dropZone.onclick = (e) => {
        if (!e.target.closest('#remove-file-btn')) {
          fileInput.click();
        }
      };

      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          processSelectedFile(fileInput.files[0]);
        }
      };

      dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('border-hqd-600', 'bg-hqd-50');
      };

      dropZone.ondragleave = () => {
        dropZone.classList.remove('border-hqd-600', 'bg-hqd-50');
      };

      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-hqd-600', 'bg-hqd-50');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processSelectedFile(e.dataTransfer.files[0]);
        }
      };

      if (removeFileBtn) {
        removeFileBtn.onclick = (e) => {
          e.stopPropagation();
          state.selectedCreateFile = null;
          state.selectedCreateBase64 = '';
          fileInput.value = '';
          dropPrompt.classList.remove('hidden');
          selectedInfo.classList.add('hidden');
        };
      }
    }

    const processSelectedFile = (file) => {
      state.selectedCreateFile = file;
      fileNameDisplay.textContent = file.name;
      fileSizeDisplay.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      dropPrompt.classList.add('hidden');
      selectedInfo.classList.remove('hidden');

      const reader = new FileReader();
      reader.onload = () => {
        state.selectedCreateBase64 = reader.result;
      };
      reader.readAsDataURL(file);
    };

    // --- 6. Tracking Modal Tabs & Actions ---
    document.getElementById('track-tab-ack-btn').onclick = () => switchTrackingTab('ack');
    document.getElementById('track-tab-pending-btn').onclick = () => switchTrackingTab('pending');

    const copyUnreadBtn = document.getElementById('copy-unread-btn');
    if (copyUnreadBtn) {
      copyUnreadBtn.onclick = () => {
        const doc = state.documents.find(d => d.id === state.viewingDocId);
        if (!doc) return;
        const targetIds = doc.targetType === 'all' ? state.users.map(u => u.id) : (doc.targetUsers || []);
        const ackIds = new Set(doc.acknowledgedUsers || []);
        const unreadNames = targetIds
          .filter(id => !ackIds.has(id))
          .map(id => {
            const u = state.users.find(x => x.id === id);
            return u ? `${u.name} (${u.department || 'ไม่ระบุ'})` : `รหัส ${id}`;
          });

        if (unreadNames.length === 0) {
          showToast('ไม่มีผู้ค้างอ่านเอกสารนี้', 'info');
          return;
        }

        const copyText = `รายชื่อผู้ยังไม่อ่านเอกสาร "${doc.title}":\n` + unreadNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
        navigator.clipboard.writeText(copyText).then(() => {
          showToast('คัดลอกรายชื่อผู้ยังไม่อ่านลง Clipboard แล้ว', 'success');
        }).catch(() => {
          showToast('ไม่สามารถคัดลอกอัตโนมัติได้', 'warning');
        });
      };
    }

    // --- 7. Modal Close Triggers (X button & Overlay click) ---
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.onclick = () => {
        const modalId = btn.getAttribute('data-modal');
        if (modalId) closeModal(modalId);
      };
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.onclick = (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      };
    });

    // Close on Escape Key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.activeModal) {
        closeModal(state.activeModal);
      }
    });
  };

  /**
   * Main Application Bootstrap
   */
  const init = () => {
    // 1. Load saved font size preference
    const savedFont = localStorage.getItem(CONFIG.STORAGE_KEY_FONT) || 'md';
    setFontScale(savedFont);

    // 2. Load Local Cache immediately (0-second render latency)
    loadFromLocalCache();

    // 3. Setup all event listeners
    initializeEventListeners();

    // 4. Render initial view (SPA, no reload)
    renderAppView();

    // 5. Trigger Background Server Sync (GAS Two-Way Sync)
    syncWithServer();
  };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
