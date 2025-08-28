// /models/analyticsModel.ts
import { db } from "../database/client.ts";
import { SITE_KEY } from "../config/env.ts";
import { SiteAnalytics } from "../types/analytics.d.ts";

export class AnalyticsModel {
  static async getSiteAnalytics(): Promise<SiteAnalytics> {
    // ✅ Use .rows for deno_mysql execute()
    const { rows: appointmentsRows } = await db.execute(
      "SELECT COUNT(*) AS totalAppointments FROM appointments WHERE site_key = ?",
      [SITE_KEY],
    );
    const { rows: blogsRows } = await db.execute(
      "SELECT COUNT(*) AS totalBlogs FROM blogs WHERE site_key = ?",
      [SITE_KEY],
    );
    const { rows: messagesRows } = await db.execute(
      "SELECT COUNT(*) AS totalMessages FROM contact_messages WHERE site_key = ?",
      [SITE_KEY],
    );

    const { totalAppointments } = appointmentsRows[0];
    const { totalBlogs } = blogsRows[0];
    const { totalMessages } = messagesRows[0];

    return { totalAppointments, totalBlogs, totalMessages };
  }
}
