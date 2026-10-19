-- ==============================================================================
-- 🚀 สคริปต์ SQL ย้ายฐานข้อมูลทั้งหมด (Users + Documents) ไปยัง Supabase
-- โครงการ: ระบบเวียนเอกสาร HQD
-- Project URL: https://roeoqsmkveuehzqoeubn.supabase.co
-- 
-- วิธีใช้งาน:
-- 1. เข้าไปที่หน้าเว็บ Supabase Dashboard -> เลือกโปรเจกต์ของท่าน
-- 2. เมนูด้านซ้ายมือคลิกที่ "SQL Editor" (รูปไอคอน _>)
-- 3. คลิกปุ่ม "+ New query"
-- 4. วางโค้ดทั้งหมดในไฟล์นี้ลงไป แล้วคลิกปุ่มสีเขียว "Run" (หรือกด Ctrl + Enter)
-- 5. สังเกตด้านล่างจะขึ้น "Success. No rows returned" เป็นอันเสร็จสิ้น 100%!
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ส่วนที่ 1: ตารางบุคลากร (Users & Auth)
-- ------------------------------------------------------------------------------

-- 1.1 สร้างตาราง users
create table if not exists public.users (
  id text primary key,                        -- รหัสพนักงาน เช่น '020482'
  name text not null,                         -- ชื่อ-นามสกุล
  department text not null default 'ไม่ระบุ',  -- แผนก
  role text not null default 'user' check (role in ('admin', 'user')), -- สิทธิ์ (admin หรือ user)
  pin text not null default '1234',           -- รหัส PIN (ตัวเลข 4–8 หลัก)
  email text default '',                      -- อีเมล (ถ้ามี)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 1.2 เปิดใช้งาน Row Level Security (RLS)
alter table public.users enable row level security;

-- ลบนโยบายเดิม (ถ้ามี)
drop policy if exists "Allow public read users" on public.users;
drop policy if exists "Allow public update users" on public.users;
drop policy if exists "Allow public insert users" on public.users;
drop policy if exists "Allow public delete users" on public.users;

-- 1.3 สร้างนโยบายความปลอดภัยให้หน้าเว็บใช้งานได้ผ่าน anon key
create policy "Allow public read users" on public.users for select using (true);
create policy "Allow public update users" on public.users for update using (true);
create policy "Allow public insert users" on public.users for insert with check (true);
create policy "Allow public delete users" on public.users for delete using (true);

-- 1.4 นำเข้ารายชื่อบุคลากรตั้งต้นทั้ง 26 ท่าน
insert into public.users (id, pin, name, department, role, email) values
  ('000826', '000826', 'นาง วันทนา วีระถาวร', 'พยาบาล', 'user', ''),
  ('001668', '001668', 'น.ส. ณัฏฐ์พิชญา ศรีตพงษ์', 'เจ้าหน้าที่บริหารงานทั่วไป', 'user', ''),
  ('002610', '002610', 'น.ส. เสาวลักษณ์ เจริญสวัสดิ์', 'นักวิชาการพัฒนาคุณภาพ', 'user', ''),
  ('003308', '003308', 'น.ส. วิมลภัทร์ โพธิ์ปริสุทธิ์', 'เจ้าหน้าที่บริหารงานทั่วไป', 'user', ''),
  ('003613', '003613', 'น.ส. อัญชลี วงศ์ใหญ่', 'พยาบาล', 'user', ''),
  ('003917', '003917', 'นาง พิมพ์สิรี กุลณัฐโภคิน', 'พยาบาล', 'user', ''),
  ('004129', '004129', 'นาง นันทนา สุขสมนิรันดร', 'พยาบาล', 'user', ''),
  ('004438', '004438', 'น.ส. กษมา ดุจเพ็ญ', 'เจ้าหน้าที่บริหารงานทั่วไป', 'user', ''),
  ('004734', '004734', 'น.ส. นฤมล เกียรติศิริกุล', 'พยาบาล', 'user', ''),
  ('005311', '005311', 'น.ส. ศกุณา เกิดเอนก', 'ผู้ปฏิบัติงานบริหาร', 'user', ''),
  ('007931', '007931', 'น.ส. วิมลรัตน์ ชูรักษา', 'พยาบาล', 'user', ''),
  ('010262', '010262', 'น.ส. นลิน เอี่ยมทัพ', 'นักวิชาการพัฒนาคุณภาพ', 'user', ''),
  ('010268', '010268', 'น.ส. ณัฐภรณ์ เกิดลอย', 'นักบริหารความเสี่ยง', 'user', ''),
  ('010291', '010291', 'น.ส. พิมพ์รัตน์ ชาญปรีชญา', 'นักวิชาการพัฒนาคุณภาพ', 'user', ''),
  ('010363', '010363', 'น.ส. นิภาพร จีนไม้', 'นักวิชาการพัฒนาคุณภาพ', 'user', ''),
  ('010427', '010427', 'นาง ศิริลักษณ์ เกี่ยวข้อง', 'นักวิเคราะห์นโยบายและแผน', 'user', ''),
  ('010480', '010480', 'นาง รังสิมา เกียรติยุทธชาติ', 'นักวิชาการพัฒนาคุณภาพ', 'user', ''),
  ('011587', '011587', 'น.ส. วิภาวี จำนงค์พลี', 'พยาบาล', 'user', ''),
  ('011652', '011652', 'น.ส. รุจิลาภา จิรภาสคูณบุญ', 'เจ้าหน้าที่บริหารงานทั่วไป', 'user', ''),
  ('014151', '014151', 'น.ส. มะลิวัลย์ แสงห้าว', 'นักบริหารความเสี่ยง', 'user', ''),
  ('015467', '015467', 'น.ส. อังคณา ประการะโพธิ์', 'ผู้ปฏิบัติงานบริหาร', 'admin', ''),
  ('020256', '020256', 'น.ส. ชมพูนุช เรืองประภาวุฒิ', 'นักสังคมสงเคราะห์', 'user', ''),
  ('020482', '020482', 'นาย ธนพล จันทรพร', 'เจ้าหน้าที่บริหารงานทั่วไป', 'admin', 'jarbtanapol@gmail.com'),
  ('022655', '022655', 'น.ส. สมหมาย กุมผัน', 'พยาบาล', 'user', ''),
  ('029744', '029744', 'นาย ทศพล อินทจักร', 'นักวิชาการพัฒนาคุณภาพ', 'user', ''),
  ('029761', '029761', 'น.ส. รัตติกร เสนเอี่ยม', 'นักบริหารความเสี่ยง', 'user', '')
on conflict (id) do update set
  name = excluded.name,
  department = excluded.department,
  role = excluded.role;


-- ------------------------------------------------------------------------------
-- ส่วนที่ 2: ตารางเอกสารเวียน (Documents & Circulation)
-- ------------------------------------------------------------------------------

-- 2.1 สร้างตาราง documents
create table if not exists public.documents (
  id text primary key,                        -- รหัสเอกสาร เช่น 'DOC-2026-001'
  title text not null,                        -- ชื่อเรื่องเอกสาร
  doc_type text not null default 'หนังสือเวียน', -- ประเภท (ประกาศ, คำสั่ง, หนังสือเวียน ฯลฯ)
  priority text not null default 'ปกติ',      -- ระดับความเร่งด่วน (ปกติ, ด่วน, ด่วนที่สุด)
  start_date date,                            -- วันที่เริ่มสื่อสาร
  end_date date,                              -- วันครบกำหนด
  target_type text not null default 'all',    -- 'all' (ทุกคน) หรือ 'specific' (ระบุคน)
  target_users text[] default '{}',           -- รหัสพนักงานเป้าหมาย (กรณีระบุคน)
  file_url text default '',                   -- ลิงก์ไฟล์บน Google Drive
  file_name text default '',                  -- ชื่อไฟล์แนบ
  file_mime text default 'application/pdf',   -- ชนิดไฟล์
  acknowledged_users text[] default '{}',     -- รายชื่อคนที่กดรับทราบแล้ว
  acknowledged_details jsonb default '{}',    -- วันเวลาที่แต่ละคนกดยืนยัน เช่น {"020482":"2026-10-19 14:00:00"}
  created_by text default '',                 -- รหัสผู้สร้างเอกสาร
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.2 เปิดใช้งาน Row Level Security (RLS)
alter table public.documents enable row level security;

-- ลบนโยบายเดิม (ถ้ามี)
drop policy if exists "Allow public read documents" on public.documents;
drop policy if exists "Allow public update documents" on public.documents;
drop policy if exists "Allow public insert documents" on public.documents;
drop policy if exists "Allow public delete documents" on public.documents;

-- 2.3 สร้างนโยบายความปลอดภัย
create policy "Allow public read documents" on public.documents for select using (true);
create policy "Allow public update documents" on public.documents for update using (true);
create policy "Allow public insert documents" on public.documents for insert with check (true);
create policy "Allow public delete documents" on public.documents for delete using (true);

-- 2.4 นำเข้าเอกสารที่มีอยู่ใน Google Sheet เดิมเข้ามาเป็นข้อมูลเริ่มต้น
insert into public.documents (
  id, title, doc_type, priority, start_date, end_date, target_type, target_users, file_url, acknowledged_users, created_by, created_at
) values
  (
    'DOC-2026-001',
    'เอกสารแรก',
    'ประกาศ',
    'ด่วน',
    '2026-09-26',
    '2026-10-30',
    'all',
    '{}',
    '',
    array['020482', '010363', '029761'],
    '020482',
    '2026-09-26T21:46:26+07:00'
  ),
  (
    'DOC-2026-002',
    'ทดสอบ 2',
    'หนังสือเวียน',
    'ปกติ',
    '2026-09-26',
    '2026-10-30',
    'all',
    '{}',
    '',
    array['020482', '010363', '029761'],
    '020482',
    '2026-09-26T21:51:12+07:00'
  )
on conflict (id) do update set
  title = excluded.title,
  priority = excluded.priority,
  acknowledged_users = excluded.acknowledged_users;


-- ------------------------------------------------------------------------------
-- ส่วนที่ 3: ตารางการตั้งค่าระบบ (App Settings)
-- ------------------------------------------------------------------------------
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table public.app_config enable row level security;
drop policy if exists "Allow public app_config" on public.app_config;
create policy "Allow public app_config" on public.app_config for all using (true);

insert into public.app_config (key, value) values ('documentSortOrder', 'date-desc')
on conflict (key) do nothing;
