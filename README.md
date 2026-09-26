# ระบบเวียนเอกสาร HQD (HQD Document Circulation System)

เว็บแอปพลิเคชันสำหรับเวียนเอกสาร ประกาศ และคำสั่งองค์กร ติดตามสถานะการรับทราบ และจัดการข้อมูลบุคลากร ออกแบบเป็นพิเศษสำหรับบุคลากรและผู้สูงอายุ (Elder-Friendly UI) พร้อมระบบไฟแจ้งเตือนสถานะด้วยสีเรืองแสง (Glow Effects) พัฒนาด้วย **Vanilla HTML, CSS, JavaScript** แยกไฟล์ชัดเจน เหมาะสำหรับการทำ Version Control บน GitHub และ Deploy เป็น Static Website ผ่าน Vercel

---

## 🌟 จุดเด่นและคุณสมบัติหลัก (Key Features)

### 1. Elder-Friendly UI (การออกแบบเพื่อผู้สูงอายุและบุคลากรทุกช่วงวัย)
- **Base Typography ขนาดใหญ่**: ขนาดตัวอักษรเริ่มต้น 19px - 22px ทำให้อ่านง่าย สบายตา
- **ปุ่มปรับขนาดตัวอักษร (Accessibility Sizing)**: มีปุ่ม `ก`, `ก+`, `ก++` บริเวณส่วนหัวของเว็บไซต์
- **High Contrast & Touch Target**: ปุ่มกดขนาดใหญ่ (ความสูงขั้นต่ำ 48px), ไอคอนคู่กับข้อความภาษาไทยชัดเจน, การเว้นวรรค (Spacing) สบายตา ไม่แออัด
- **Kanit & Sarabun Fonts**: แบบอักษรภาษาไทยมาตรฐานที่อ่านง่าย ชัดเจน

### 2. Status Glow Effects (ระบบแสงเรืองแสงแจ้งเตือนสถานะ)
การ์ดเอกสารแต่ละฉบับจะแสดงแสงเรืองแสงรอบกรอบการ์ดตามสถานะแบบไดนามิก:
- 🟢 **แสงสีเขียว (`glow-green`)**: ผู้รับทราบครบทุกคนแล้ว (100%)
- 🟡 **แสงสีเหลือง/ส้ม (`glow-yellow`)**: ใกล้ถึงวันครบกำหนด (Deadline) ภายใน 3 วัน พร้อมเอฟเฟกต์กระพริบเตือนอย่างนุ่มนวล
- 🔴 **แสงสีแดง (`glow-red`)**: เกินกำหนดเวลาแล้ว (Overdue) และยังมีบุคลากรที่ยังไม่ได้กดอ่าน/รับทราบ
- ⚪ **ไม่มีแสงเรืองแสง (`glow-none`)**: เอกสารปกติ มีระยะเวลาคงเหลือมากกว่า 3 วัน

### 3. บทบาทผู้ใช้งานและการเข้าถึง (User Roles & Behaviors)
- **Admin (ผู้ดูแลระบบ)**:
  - เข้าสู่ระบบมาหน้าแรกจะพบหน้า **"เอกสารเวียน"** ทันที และสามารถกด **"รับทราบ"** เอกสารได้เหมือนบุคลากรทั่วไป (ไม่มีการสลับบทบาทให้ยุ่งยาก)
  - มีปุ่มพิเศษ **"ภาพรวมสถานะ"** บนการ์ดเอกสาร เพื่อเปิดดูรายชื่อผู้รับทราบแล้ว และผู้ที่ยังไม่อ่าน
  - มีปุ่ม **"สร้างเอกสารเวียนใหม่"** (แนบไฟล์ PDF/รูปภาพ, กำหนดระดับความสำคัญ, วันที่, และกลุ่มเป้าหมาย)
  - มีแท็บเมนู **"จัดการบุคลากร HQD"** (เพิ่ม/แก้ไข/ลบ/สลับ Role Admin-User) แบบ Real-time
- **User (บุคลากรทั่วไป)**:
  - เห็นเฉพาะหน้าเอกสารเวียน และเห็นเฉพาะเอกสารที่ตนได้รับมอบหมายเท่านั้น (ส่งทุกคน หรือระบุบุคคลถึงตน)
  - สามารถเปิดอ่านเอกสารแนบ และกดปุ่ม **"รับทราบ"** เอกสารได้
  - ไม่มีสิทธิ์เข้าถึงเมนูจัดการบุคลากร หรือปุ่มสร้างเอกสาร

### 4. SPA & 0-Second Local Cache (ความเร็วสูง & ไม่รีโหลดหน้าจอ)
- เมื่อ Deploy บน Vercel **ไม่ใช้คำสั่ง `location.reload()`** โดยเด็ดขาด
- โหลดข้อมูลจาก **Local Cache ทันทีใน 0 วินาที** ทำให้เปิดเว็บแล้วเห็นข้อมูลทันที ไม่มีหน้าขาว
- ทำงานแบบ **Background Sync (Stale-While-Revalidate)** แอบดึงข้อมูลล่าสุดจาก Google Apps Script (GAS) มาอัปเดตหน้าจอเบื้องหลังอัตโนมัติ

### 5. ความปลอดภัยและการป้องกัน XSS (Security)
- มีฟังก์ชัน Sanitize HTML (`escapeHtml`) กรองอักขระพิเศษ ป้องกันการโจมตีแบบ Cross-Site Scripting (XSS) ในทุกจุดที่มีการแสดงผลข้อมูล

---

## 🗂️ โครงสร้างไฟล์ในโครงการ (Project Structure)

```text
├── index.html       # โครงสร้างหน้าเว็บ Semantic HTML ทั้งหมด (Login, SPA Sections, Modals)
├── style.css        # สไตล์ปรับแต่ง Elder-friendly, Glow Effects Animations, Scrollbars
├── app.js           # โลจิก Vanilla JS (IIFE, State Management, Two-Way Sync, Glow Engine)
├── vercel.json      # การตั้งค่า Routing และ Security Headers สำหรับ Vercel Static Deployment
├── .gitignore       # ไฟล์ที่ไม่ต้องการนำขึ้น Git Repository
└── README.md        # คู่มือการใช้งานและเอกสารประกอบระบบ
```

---

## 🚀 ข้อมูลการเชื่อมต่อฐานข้อมูล (Backend & Data Source)

- **Google Apps Script Endpoint**:
  `https://script.google.com/macros/s/AKfycbwh-PvW0UNXCz99CbzZJx9QJxhwL-M13P0fDn_55NTT_r942YryR6OuGhdmZiKlcVW_/exec`
- **Google Sheet Master ID**: `167gvGXW7EeK4fdKJED1TKhqRiMJmFkte5-sH3Ybigk8`
  - ชีต `Users`: เก็บข้อมูลบุคลากร (Employee ID, PIN, Name, Department, Role, Corporate Email)
  - ชีต `Documents`: เก็บข้อมูลเอกสารเวียน (รหัสเอกสาร, วันที่แนบข้อมูล, ชื่อเรื่อง ลิงก์ไฟล์, ระดับความสำคัญ, วันที่เริ่มสื่อสาร, วันที่ deadline, กลุ่มเป้าหมาย, ผู้รับทราบแล้ว)
- **Google Drive Folder ID**: `1kb08cT4u-vMIEA0de7eFcowlI-wiPqNE`

---

## 🔐 บัญชีเข้าสู่ระบบสำหรับทดสอบ (Demo Accounts)

| รหัสพนักงาน (ID) | PIN | ชื่อ-นามสกุล | แผนก | บทบาท (Role) |
|---|---|---|---|---|
| `020482` | `020482` | นาย ธนพล จันทรพร | เจ้าหน้าที่บริหารงานทั่วไป | **Admin** |
| `015467` | `015467` | น.ส. อังคณา ประการะโพธิ์ | ผู้ปฏิบัติงานบริหาร | **Admin** |
| `000826` | `000826` | นาง วันทนา วีระถาวร | พยาบาล | **User** |
| `001668` | `001668` | น.ส. ณัฏฐ์พิชญา ศรีตพงษ์ | เจ้าหน้าที่บริหารงานทั่วไป | **User** |

*(ในหน้า Login มีปุ่มบัญชีทดสอบด่วน สามารถคลิกเพื่อล็อกอินได้ทันทีโดยไม่ต้องพิมพ์)*

---

## 💻 วิธีการนำขึ้น GitHub และ Deploy บน Vercel

### 1. นำขึ้น GitHub Repository
```bash
# เริ่มต้น Git
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# บันทึก Commit
git commit -m "feat: Initial commit for HQD Document Circulation System"

# สร้าง Branch main
git branch -M main

# เชื่อมโยงกับ GitHub Remote Repo ของคุณ
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push โค้ดขึ้น GitHub
git push -u origin main
```

### 2. Deploy ผ่าน Vercel
1. เข้าไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. คลิก **"Add New..."** -> **"Project"**
3. เลือก Repository ที่คุณเพิ่ง Push ขึ้นไปจาก GitHub
4. ในส่วน **Framework Preset** ให้เลือก **Other** (หรือ Static HTML)
5. คลิกปุ่ม **"Deploy"**
6. เว็บไซต์จะพร้อมใช้งานทันทีภายใน 10-15 วินาที พร้อม URL เช่น `https://hqd-doc-system.vercel.app`

---

## 🛠️ โค้ดต้นฉบับ Google Apps Script (GAS Reference)

หากต้องการปรับปรุงหรือ Re-deploy Google Apps Script ให้รองรับการทำงานครบทุกฟังก์ชัน สามารถนำโค้ดด้านล่างนี้ไปวางใน `Code.gs` ของ Google Apps Script:

```javascript
const SPREADSHEET_ID = "167gvGXW7EeK4fdKJED1TKhqRiMJmFkte5-sH3Ybigk8";
const DRIVE_FOLDER_ID = "1kb08cT4u-vMIEA0de7eFcowlI-wiPqNE";

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // 1. ดึงข้อมูลบุคลากรและเอกสารเวียนทั้งหมด
    if (action === "getAppData") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const userSheet = ss.getSheetByName("Users");
      const docSheet = ss.getSheetByName("Documents");

      // Read Users
      const userRows = userSheet.getDataRange().getValues();
      const users = [];
      for (let i = 1; i < userRows.length; i++) {
        const row = userRows[i];
        if (row[0]) {
          users.push({
            id: String(row[0]).trim(),
            pin: String(row[1] || row[0]).trim(),
            name: String(row[2] || "").trim(),
            department: String(row[3] || "").trim(),
            role: String(row[4] || "user").trim().toLowerCase(),
            email: String(row[5] || "").trim()
          });
        }
      }

      // Read Documents
      const docRows = docSheet ? docSheet.getDataRange().getValues() : [];
      const docs = [];
      for (let i = 1; i < docRows.length; i++) {
        const row = docRows[i];
        if (row[0]) {
          const targetAud = String(row[6] || "all").trim();
          const acks = String(row[7] || "").split(",").map(s => s.trim()).filter(Boolean);
          const prio = String(row[3] || "ปกติ").trim();
          docs.push({
            id: String(row[0]).trim(),
            createdAt: String(row[1] || ""),
            title: String(row[2] || "").trim(),
            priority: prio,
            urgencyLevel: prio,
            startDate: String(row[4] || ""),
            endDate: String(row[5] || ""),
            targetType: targetAud.toLowerCase() === "all" ? "all" : "specific",
            targetAudience: targetAud,
            targetUsers: targetAud.toLowerCase() === "all" ? [] : targetAud.split(",").map(s => s.trim()).filter(Boolean),
            acknowledgedUsers: acks,
            readStatus: acks
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: { users: users, docs: docs }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. สลับหรืออัปเดตบทบาทบุคลากร (User <-> Admin) ใน Google Sheet โดยตรง
    if (action === "updateUserRole") {
      const userId = String(postData.userId).trim();
      const newRole = String(postData.role || "user").trim().toLowerCase();
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const userSheet = ss.getSheetByName("Users");
      const rows = userSheet.getDataRange().getValues();
      let found = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === userId) {
          // คอลัมน์ E คือ Role (1-indexed คือ แถว i + 1, คอลัมน์ 5)
          userSheet.getRange(i + 1, 5).setValue(newRole);
          found = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: found ? "success" : "error",
        message: found ? "อัปเดตบทบาทสำเร็จ" : "ไม่พบรหัสบุคลากร"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. แก้ไขข้อมูลบุคลากร (ชื่อ, แผนก, อีเมล, บทบาท)
    if (action === "updateUser") {
      const data = postData.data;
      const userId = String(data.id).trim();
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const userSheet = ss.getSheetByName("Users");
      const rows = userSheet.getDataRange().getValues();
      let found = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === userId) {
          if (data.name !== undefined) userSheet.getRange(i + 1, 3).setValue(data.name);
          if (data.department !== undefined) userSheet.getRange(i + 1, 4).setValue(data.department);
          if (data.role !== undefined) userSheet.getRange(i + 1, 5).setValue(String(data.role).toLowerCase());
          if (data.email !== undefined) userSheet.getRange(i + 1, 6).setValue(data.email);
          found = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: found ? "success" : "error",
        message: found ? "อัปเดตข้อมูลบุคลากรสำเร็จ" : "ไม่พบรหัสบุคลากร"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. เพิ่มบุคลากรใหม่เข้า Google Sheet
    if (action === "addUser") {
      const data = postData.data;
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const userSheet = ss.getSheetByName("Users");
      const rows = userSheet.getDataRange().getValues();
      const userId = String(data.id).trim();
      
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === userId) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "รหัสพนักงานนี้มีอยู่ในระบบแล้ว"
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      userSheet.appendRow([
        userId,
        String(data.pin || userId).trim(),
        String(data.name || "").trim(),
        String(data.department || "").trim(),
        String(data.role || "user").trim().toLowerCase(),
        String(data.email || "").trim()
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "เพิ่มบุคลากรเรียบร้อย"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. ลบบุคลากรออกจาก Google Sheet
    if (action === "deleteUser") {
      const userId = String(postData.userId).trim();
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const userSheet = ss.getSheetByName("Users");
      const rows = userSheet.getDataRange().getValues();
      let found = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === userId) {
          userSheet.deleteRow(i + 1);
          found = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: found ? "success" : "error",
        message: found ? "ลบข้อมูลสำเร็จ" : "ไม่พบรหัสบุคลากร"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. เพิ่มเอกสารเวียนลง Google Sheet ก่อน (ไม่ต้องมีไฟล์)
    if (action === "addDocument") {
      const data = postData.data;

      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const docSheet = ss.getSheetByName("Documents");
      
      // สร้าง docId ที่ไม่ซ้ำโดยใช้ timestamp
      const now = new Date();
      const docId = "DOC-" + now.getFullYear() + "-" + String(docSheet.getLastRow()).padStart(3, "0");
      
      const priority = data.priority || data.urgencyLevel || "ปกติ";
      const targetAudience = (data.targetType === "all" || String(data.targetAudience || "").toLowerCase() === "all") 
        ? "All" 
        : (Array.isArray(data.targetUsers) ? data.targetUsers.join(",") : (data.targetAudience || "All"));

      // บันทึก metadata ลง Sheet ก่อน (fileUrl ว่างไว้ จะถูกเติมภายหลังจาก uploadDocumentFile)
      docSheet.appendRow([
        docId,
        now.toISOString(),
        String(data.title || "").trim(),
        priority,
        String(data.startDate || ""),
        String(data.endDate || ""),
        targetAudience,
        ""  // ผู้รับทราบเริ่มต้นว่าง
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "เพิ่มเอกสารสำเร็จ",
        docId: docId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6b. อัปโหลดไฟล์ไป Google Drive และอัปเดต URL ใน Sheet (แยก action เพื่อป้องกัน payload ใหญ่)
    if (action === "uploadDocumentFile") {
      const data = postData.data;
      let fileUrl = "";

      if (data.fileBase64) {
        try {
          const matches = data.fileBase64.match(/^data:(.*?);base64,(.*)$/);
          const mimeType = matches ? matches[1] : "application/pdf";
          const base64Data = matches ? matches[2] : data.fileBase64;
          const decoded = Utilities.base64Decode(base64Data);
          const blob = Utilities.newBlob(decoded, mimeType, data.fileName || "document.pdf");
          const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          fileUrl = file.getUrl();
        } catch (driveErr) {
          // หากติดสิทธิ์ Drive ให้ดำเนินการต่อ (นัดจาก metadata บันทึกแล้ว)
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: "ไม่สามารถอัปโหลดไฟล์ได้: " + driveErr.toString()
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // หาแถวที่ตรงกับ title แล้วอัปเดต fileUrl ใน title (column C = col 3)
      if (fileUrl) {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const docSheet = ss.getSheetByName("Documents");
        const rows = docSheet.getDataRange().getValues();
        const searchTitle = String(data.docTitle || "").trim();

        for (let i = rows.length - 1; i >= 1; i--) {
          if (String(rows[i][2] || "").trim() === searchTitle) {
            // เพิ่ม fileUrl ต่อท้าย title
            const currentTitle = String(rows[i][2]).trim();
            docSheet.getRange(i + 1, 3).setValue(currentTitle + " (" + fileUrl + ")");
            break;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: fileUrl ? "อัปโหลดไฟล์สำเร็จ" : "ไม่มีไฟล์ซัก",
        fileUrl: fileUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 7. บันทึกการรับทราบเอกสาร
    if (action === "acknowledge") {
      const docId = postData.docId;
      const userId = postData.userId;
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const docSheet = ss.getSheetByName("Documents");
      const rows = docSheet.getDataRange().getValues();

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === String(docId).trim()) {
          const currentAcks = String(rows[i][7] || "").split(",").map(s => s.trim()).filter(Boolean);
          if (!currentAcks.includes(userId)) {
            currentAcks.push(userId);
            docSheet.getRange(i + 1, 8).setValue(currentAcks.join(","));
          }
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "รับทราบเอกสารเรียบร้อย"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "ไม่พบ Action ที่ระบุ"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 📄 ลิขสิทธิ์และการใช้งาน
พัฒนาสำหรับงานพัฒนาคุณภาพและบริหารความเสี่ยง (HQD)  
รองรับการขยายผลและเชื่อมโยงกับระบบบริการโรงพยาบาลอื่นๆ ในอนาคต
