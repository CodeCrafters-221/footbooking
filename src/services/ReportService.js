import { supabase } from "./supabaseClient";
import { logAdminAction } from "./adminService";

export const ReportService = {
  async getReports() {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        id, report_type, subject, description, status, priority,
        target_type, target_label, created_at, updated_at,
        profiles:user_id (name),
        report_comments (id, message, created_at, admin_id)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((r) => ({
      id: r.id,
      type: r.report_type,
      status: r.status,
      reporterName: r.profiles?.name || "Inconnu",
      targetType: r.target_type,
      targetLabel: r.target_label,
      description: r.description || r.subject || "",
      createdAt: r.created_at,
      adminComment:
        r.report_comments?.length > 0
          ? r.report_comments[r.report_comments.length - 1].message
          : "",
    }));
  },

  async createReport({
    report_type,
    subject = "",
    description = "",
    target_type = "",
    target_label = "",
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié.");

    const { error } = await supabase.from("reports").insert({
      user_id: user.id,
      report_type,
      subject,
      description,
      target_type,
      target_label,
      status: "open",
      priority: "medium",
    });

    if (error) throw error;
  },

  async updateReportStatus(reportId, newStatus) {
    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", reportId);

    if (error) throw error;

    await logAdminAction("updated_report_status", "reports", reportId, {
      new_status: newStatus,
    });
  },

  async addReportComment(reportId, message) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié.");

    const { error } = await supabase.from("report_comments").insert({
      report_id: reportId,
      admin_id: user.id,
      message,
    });

    if (error) throw error;

    await logAdminAction("added_report_comment", "reports", reportId);
  },
};
