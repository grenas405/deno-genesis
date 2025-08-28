// /types/contact.d.ts

export interface ContactMessageInput {
  name: string;
  email?: string;
  phone: string;
  message: string;
}

export interface ContactMessageRecord extends ContactMessageInput {
  id: number;
  site_key: string;
  submitted_at: string;
}