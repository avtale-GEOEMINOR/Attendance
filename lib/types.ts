export type UserRole = "faculty" | "student";
export type EnrollmentStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "absent";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  program: string | null;
  enrollment_no: string | null;
  faculty_code: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  faculty_id: string;
  title: string;
  code: string | null;
  course_code: string | null;
  join_slug: string | null;
  join_code: string | null;
  sheet_url: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  status: EnrollmentStatus;
  roll_number: string | null;
  requested_at: string;
  decided_at: string | null;
  profiles?: Profile;
}

export interface Session {
  id: string;
  course_id: string;
  session_date: string;
  label: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_at: string;
}
