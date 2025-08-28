// /models/contactModel.ts
import { db } from "../database/client.ts";
import { SITE_KEY } from "../config/env.ts";
import { ContactMessageInput, ContactMessageRecord } from "../types/contact.d.ts";

export class ContactModel {
  static async insertMessage(data: ContactMessageInput): Promise<void> {
    await db.execute(
      `INSERT INTO contact_messages (site_key, name, email, phone, message, submitted_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        SITE_KEY,
        data.name,
        data.email || null,
        data.phone,
        data.message,
      ],
    );
  }

  static async getAllMessages(): Promise<ContactMessageRecord[]> {
    const result = await db.execute(
      `SELECT * FROM contact_messages
       WHERE site_key = ?
       ORDER BY submitted_at DESC`,
      [SITE_KEY],
    );

    return result.rows as ContactMessageRecord[] ?? [];
  }

  static async deleteMessageById(id: string): Promise<number> {
    const result = await db.execute(
      `DELETE FROM contact_messages WHERE id = ? AND site_key = ?`,
      [id, SITE_KEY],
    );

    return result.affectedRows || 0;
  }
}
