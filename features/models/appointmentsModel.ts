// /models/appointmentsModel.ts
import { db } from "../database/client.ts";
import { SITE_KEY } from "../config/env.ts";
import { AppointmentInput, AppointmentRecord } from "../types/appointments.d.ts";

export class AppointmentsModel {
  static async insertAppointment(data: AppointmentInput): Promise<number> {
    const result = await db.execute(
      `INSERT INTO appointments
        (name, phone, email, service, appointment_date, appointment_time, message, created_at, site_key)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        data.name,
        data.phone,
        data.email || null,
        data.service,
        data.date,
        data.time,
        data.message || null,
        SITE_KEY,
      ],
    );
    return result.lastInsertId as number;
  }

  static async getAllAppointments(): Promise<AppointmentRecord[]> {
    return await db.query(
      "SELECT * FROM appointments WHERE site_key = ? ORDER BY created_at DESC",
      [SITE_KEY],
    );
  }

  static async deleteAppointmentById(id: string): Promise<number> {
    const result = await db.execute(
      "DELETE FROM appointments WHERE id = ? AND site_key = ?",
      [id, SITE_KEY],
    );
    return result.affectedRows || 0;
  }
}
