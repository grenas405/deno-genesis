// /services/contactService.ts
import { ContactModel } from "../models/contactModel.ts";
import { ContactMessageInput, ContactMessageRecord } from "../types/contact.d.ts";

export class ContactService {
  static async submitMessage(data: ContactMessageInput): Promise<void> {
    await ContactModel.insertMessage(data);
  }

  static async fetchMessages(): Promise<ContactMessageRecord[]> {
    return await ContactModel.getAllMessages();
  }

  static async deleteMessage(id: string): Promise<number> {
    return await ContactModel.deleteMessageById(id);
  }
}