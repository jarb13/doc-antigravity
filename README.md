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
          docs.push({
            id: String(row[0]).trim(),
            createdAt: String(row[1] || ""),
            title: String(row[2] || "").trim(),
            priority: String(row[3] || "ปกติ").trim(),
            startDate: String(row[4] || ""),
            endDate: String(row[5] || ""),
            targetType: String(row[6] || "all").trim(),
            acknowledgedUsers: String(row[7] || "").split(",").map(s => s.trim()).filter(Boolean)
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: { users: users, docs: docs }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "addDocument") {
      const data = postData.data;
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      
      let fileUrl = "";
      if (data.fileBase64) {
        const matches = data.fileBase64.match(/^data:(.*?);base64,(.*)$/);
        const mimeType = matches ? matches[1] : "application/pdf";
        const base64Data = matches ? matches[2] : data.fileBase64;
        const decoded = Utilities.base64Decode(base64Data);
        const blob = Utilities.newBlob(decoded, mimeType, data.fileName || "document.pdf");
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
      }

      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const docSheet = ss.getSheetByName("Documents");
      const docId = "DOC-" + new Date().getFullYear() + "-" + ("00" + (docSheet.getLastRow())).slice(-3);
      
      docSheet.appendRow([
        docId,
        new Date().toISOString(),
        data.title,
        data.priority,
        data.startDate,
        data.endDate,
        data.targetType === "all" ? "all" : (data.targetUsers || []).join(","),
        "" // ผู้รับทราบเริ่มต้น
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "เพิ่มเอกสารสำเร็จ",
        docId: docId,
        fileUrl: fileUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

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
