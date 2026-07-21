export type Role = 'student' | 'coordinator' | 'dean' | 'admin';

export type EventType =
  | 'Workshop'
  | 'Seminar'
  | 'Hackathon'
  | 'Guest Lecture'
  | 'Technical'
  | 'Project Expo'
  | 'Club Event'
  | 'Cultural'
  | 'Sports';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  roll_number?: string | null;
  department_id?: string | null;
  year?: number | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  event_type: EventType;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  max_participants: number;
  registration_deadline: string;
  poster_url?: string | null;
  status: EventStatus;
  coordinator_id: string;
  attendance_open: boolean;
  qr_token?: string | null;
  qr_token_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
  coordinator?: Profile;
  department?: Department;
  registration_count?: number;
}

export interface Registration {
  id: string;
  event_id: string;
  student_id: string;
  status: 'registered' | 'cancelled' | 'attended' | 'absent';
  registered_at: string;
  event?: Event;
  student?: Profile;
}

export interface AttendanceRow {
  id: string;
  event_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'excused';
  marked_at: string;
  marked_by?: string | null;
  approved_by_dean: boolean;
  event?: Event;
  student?: Profile;
}

export interface Certificate {
  id: string;
  attendance_id: string;
  student_id: string;
  event_id: string;
  verification_code: string;
  issued_at: string;
  event?: Event;
  student?: Profile;
  attendance?: AttendanceRow;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string | null;
  type: 'info' | 'success' | 'warning' | 'error' | 'event' | 'attendance' | 'certificate';
  read: boolean;
  link?: string | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  event_id: string;
  coordinator_id: string;
  dean_id?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  student_count: number;
  report_summary?: string | null;
  coordinator_note?: string | null;
  dean_note?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  event?: Event;
  coordinator?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  body?: string | null;
  audience: 'all' | 'students' | 'coordinators' | 'dean' | 'admin';
  created_by?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity?: string | null;
  entity_id?: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
}

export interface Feedback {
  id: string;
  event_id: string;
  student_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  event?: Event;
  student?: Profile;
}

export interface CorrectionRequest {
  id: string;
  attendance_id: string;
  student_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string | null;
  reviewer_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  attendance?: AttendanceRow;
}
