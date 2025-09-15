// /types/appointments.d.ts
export interface AppointmentInput {
  name: string;
  phone: string;
  email?: string;
  service: string;
  message?: string;
  date: string;
  time: string;
}

export interface AppointmentRecord extends AppointmentInput {
  id: number;
  created_at: string;
  site_key: string;
}