// /services/appointmentsService.ts
import { AppointmentsModel } from "../models/appointmentsModel.ts";
import { AppointmentInput, AppointmentRecord } from "../types/appointments.d.ts";

export class AppointmentsService {
  static async submitAppointment(data: AppointmentInput): Promise<number> {
    // You could add extra business logic here, e.g., spam check
    return await AppointmentsModel.insertAppointment(data);
  }

  static async fetchAppointments(): Promise<AppointmentRecord[]> {
    return await AppointmentsModel.getAllAppointments();
  }

  static async deleteAppointment(id: string): Promise<number> {
    return await AppointmentsModel.deleteAppointmentById(id);
  }
}