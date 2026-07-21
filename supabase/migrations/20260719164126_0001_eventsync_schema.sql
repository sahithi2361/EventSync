/*
# EventSync Schema — Smart Event Attendance & Approval Management System

Complete schema for a college event attendance system with 4 roles:
Student, Event Coordinator, Dean Academics, Admin.

## 1. Tables (created first, no policies yet)
departments, profiles, events, registrations, attendance, certificates,
notifications, approval_requests, announcements, activity_logs, feedback,
attendance_correction_requests

## 2. RLS + Policies (added after all tables exist)
Owner/staff scoped policies throughout.

## 3. Notes
- profiles.id references auth.users(id); trigger auto-creates profile on signup.
- qr_token + qr_token_updated_at support rotating QR.
- Seed data inserts departments + announcements.
*/

-- ============ TABLES (all created first) ============
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','coordinator','dean','admin')),
  roll_number text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  year int,
  phone text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  department_name text,
  event_type text NOT NULL CHECK (event_type IN ('Workshop','Seminar','Hackathon','Guest Lecture','Technical','Project Expo','Club Event','Cultural','Sports')),
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  venue text NOT NULL,
  max_participants int NOT NULL DEFAULT 100,
  registration_deadline date NOT NULL,
  poster_url text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  coordinator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_open boolean NOT NULL DEFAULT false,
  qr_token text,
  qr_token_updated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','cancelled','attended','absent')),
  registered_at timestamptz DEFAULT now(),
  UNIQUE (event_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','excused')),
  marked_at timestamptz DEFAULT now(),
  marked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by_dean boolean NOT NULL DEFAULT false,
  UNIQUE (event_id, student_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  verification_code text NOT NULL UNIQUE,
  issued_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','event','attendance','certificate')),
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  coordinator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dean_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','changes_requested')),
  student_count int NOT NULL DEFAULT 0,
  report_summary text,
  coordinator_note text,
  dean_note text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (event_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','students','coordinators','dean','admin')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance_correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_note text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_events_coordinator ON events(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============ RLS ENABLE ============
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_correction_requests ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
-- departments
DROP POLICY IF EXISTS "dept_select_auth" ON departments;
CREATE POLICY "dept_select_auth" ON departments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "dept_insert_admin" ON departments;
CREATE POLICY "dept_insert_admin" ON departments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "dept_update_admin" ON departments;
CREATE POLICY "dept_update_admin" ON departments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "dept_delete_admin" ON departments;
CREATE POLICY "dept_delete_admin" ON departments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- profiles
DROP POLICY IF EXISTS "profile_select_own_or_staff" ON profiles;
CREATE POLICY "profile_select_own_or_staff" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','dean','coordinator')));
DROP POLICY IF EXISTS "profile_insert_self" ON profiles;
CREATE POLICY "profile_insert_self" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profile_update_self_or_admin" ON profiles;
CREATE POLICY "profile_update_self_or_admin" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')) WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "profile_delete_admin" ON profiles;
CREATE POLICY "profile_delete_admin" ON profiles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- events
DROP POLICY IF EXISTS "event_select_auth" ON events;
CREATE POLICY "event_select_auth" ON events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "event_insert_coordinator" ON events;
CREATE POLICY "event_insert_coordinator" ON events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','admin')));
DROP POLICY IF EXISTS "event_update_owner_or_admin" ON events;
CREATE POLICY "event_update_owner_or_admin" ON events FOR UPDATE TO authenticated USING (coordinator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')) WITH CHECK (coordinator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "event_delete_owner_or_admin" ON events;
CREATE POLICY "event_delete_owner_or_admin" ON events FOR DELETE TO authenticated USING (coordinator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- registrations
DROP POLICY IF EXISTS "reg_select_own_or_staff" ON registrations;
CREATE POLICY "reg_select_own_or_staff" ON registrations FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "reg_insert_student" ON registrations;
CREATE POLICY "reg_insert_student" ON registrations FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "reg_update_own_or_staff" ON registrations;
CREATE POLICY "reg_update_own_or_staff" ON registrations FOR UPDATE TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin'))) WITH CHECK (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "reg_delete_own" ON registrations;
CREATE POLICY "reg_delete_own" ON registrations FOR DELETE TO authenticated USING (student_id = auth.uid());

-- attendance
DROP POLICY IF EXISTS "att_select_own_or_staff" ON attendance;
CREATE POLICY "att_select_own_or_staff" ON attendance FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "att_insert_coordinator" ON attendance;
CREATE POLICY "att_insert_coordinator" ON attendance FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','admin')));
DROP POLICY IF EXISTS "att_update_staff" ON attendance;
CREATE POLICY "att_update_staff" ON attendance FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "att_delete_admin" ON attendance;
CREATE POLICY "att_delete_admin" ON attendance FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- certificates
DROP POLICY IF EXISTS "cert_select_own_or_staff" ON certificates;
CREATE POLICY "cert_select_own_or_staff" ON certificates FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('dean','admin')));
DROP POLICY IF EXISTS "cert_insert_staff" ON certificates;
CREATE POLICY "cert_insert_staff" ON certificates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "cert_delete_admin" ON certificates;
CREATE POLICY "cert_delete_admin" ON certificates FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- notifications
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_insert_self_or_staff" ON notifications;
CREATE POLICY "notif_insert_self_or_staff" ON notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- approval_requests
DROP POLICY IF EXISTS "appr_select_staff" ON approval_requests;
CREATE POLICY "appr_select_staff" ON approval_requests FOR SELECT TO authenticated USING (coordinator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('dean','admin')));
DROP POLICY IF EXISTS "appr_insert_coordinator" ON approval_requests;
CREATE POLICY "appr_insert_coordinator" ON approval_requests FOR INSERT TO authenticated WITH CHECK (coordinator_id = auth.uid());
DROP POLICY IF EXISTS "appr_update_coordinator_or_dean" ON approval_requests;
CREATE POLICY "appr_update_coordinator_or_dean" ON approval_requests FOR UPDATE TO authenticated USING (coordinator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('dean','admin'))) WITH CHECK (coordinator_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('dean','admin')));
DROP POLICY IF EXISTS "appr_delete_admin" ON approval_requests;
CREATE POLICY "appr_delete_admin" ON approval_requests FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- announcements
DROP POLICY IF EXISTS "ann_select_auth" ON announcements;
CREATE POLICY "ann_select_auth" ON announcements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ann_insert_admin" ON announcements;
CREATE POLICY "ann_insert_admin" ON announcements FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "ann_update_admin" ON announcements;
CREATE POLICY "ann_update_admin" ON announcements FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "ann_delete_admin" ON announcements;
CREATE POLICY "ann_delete_admin" ON announcements FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- activity_logs
DROP POLICY IF EXISTS "log_select_own_or_admin" ON activity_logs;
CREATE POLICY "log_select_own_or_admin" ON activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "log_insert_self_or_staff" ON activity_logs;
CREATE POLICY "log_insert_self_or_staff" ON activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- feedback
DROP POLICY IF EXISTS "fb_select_staff_or_own" ON feedback;
CREATE POLICY "fb_select_staff_or_own" ON feedback FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "fb_insert_student" ON feedback;
CREATE POLICY "fb_insert_student" ON feedback FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "fb_update_own" ON feedback;
CREATE POLICY "fb_update_own" ON feedback FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "fb_delete_own_or_admin" ON feedback;
CREATE POLICY "fb_delete_own_or_admin" ON feedback FOR DELETE TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- attendance_correction_requests
DROP POLICY IF EXISTS "corr_select_own_or_staff" ON attendance_correction_requests;
CREATE POLICY "corr_select_own_or_staff" ON attendance_correction_requests FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));
DROP POLICY IF EXISTS "corr_insert_student" ON attendance_correction_requests;
CREATE POLICY "corr_insert_student" ON attendance_correction_requests FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "corr_update_staff" ON attendance_correction_requests;
CREATE POLICY "corr_update_staff" ON attendance_correction_requests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin'))) WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('coordinator','dean','admin')));

-- ============ TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED DATA ============
INSERT INTO departments (name, code, description) VALUES
  ('Computer Science & Engineering', 'CSE', 'Computing, software, AI, data systems'),
  ('Electronics & Communication', 'ECE', 'Electronics, signals, communication systems'),
  ('Mechanical Engineering', 'ME', 'Mechanical design, manufacturing, thermal sciences'),
  ('Civil Engineering', 'CE', 'Structural, environmental, transportation engineering'),
  ('Electrical Engineering', 'EE', 'Power, machines, control systems'),
  ('Information Technology', 'IT', 'Networks, web, enterprise IT'),
  ('Business Administration', 'MBA', 'Management, finance, marketing')
ON CONFLICT (code) DO NOTHING;

INSERT INTO announcements (title, body, audience) VALUES
  ('Welcome to EventSync', 'The digital attendance system is now live. Register for upcoming events and skip the paper sheets.', 'all'),
  ('Hackathon 2026 Registration Open', 'Registrations for the annual hackathon are now open. Limited seats — register early.', 'students'),
  ('Submit Attendance Reports Promptly', 'Please send attendance reports to Dean Academics within 48 hours of event completion.', 'coordinators')
ON CONFLICT DO NOTHING;
