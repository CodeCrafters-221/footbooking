export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  role: 'super_admin' | 'owner' | 'user' | 'blocked';
  phone: string | null;
  ville: string | null;
  created_at: string;
  backup_role: 'super_admin' | 'owner' | 'user' | null;
}

export interface PlatformSettings {
  id: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  platform_fee: number;
  allow_new_registrations: boolean;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  report_type: 'complaint' | 'request' | 'bug' | 'abuse' | string;
  subject: string | null;
  description: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  target_type: 'utilisateur' | 'terrain' | 'reservation' | string | null;
  target_label: string | null;
}

export interface ReportComment {
  id: string;
  report_id: string;
  admin_id: string | null;
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'user' | 'log' | 'report' | string;
  is_read: boolean;
  created_at: string;
  link: string | null;
  meta: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Profile>;
      };
      platform_settings: {
        Row: PlatformSettings;
        Insert: Omit<PlatformSettings, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<PlatformSettings>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Report>;
      };
      report_comments: {
        Row: ReportComment;
        Insert: Omit<ReportComment, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<ReportComment>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Notification>;
      };
    };
  };
}
