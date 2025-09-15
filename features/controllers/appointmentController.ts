// /controllers/appointmentsController.ts
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { AppointmentsService } from "../services/appointmentsService.ts";
import { AppointmentInput } from "../types/appointments.d.ts";

export const submitAppointment = async (ctx: Context) => {
  try {
    const { value } = await ctx.request.body({ type: "json" });
    const { name, phone, email, service, message, date, time } = await value;

    if (!name || !phone || !service || !date || !time) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Name, phone, service, date, and time are required.",
      };
      return;
    }

    const appointmentInput: AppointmentInput = { name, phone, email, service, message, date, time };
    const appointmentId = await AppointmentsService.submitAppointment(appointmentInput);

    ctx.response.status = 201;
    ctx.response.body = {
      message: "Appointment submitted successfully!",
      appointmentId,
    };
  } catch (error) {
    console.error("❌ Error submitting appointment:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to submit appointment" };
  }
};

export const fetchAppointments = async (ctx: Context) => {
  try {
    const appointments = await AppointmentsService.fetchAppointments();
    ctx.response.status = 200;
    ctx.response.body = appointments;
  } catch (error) {
    console.error("❌ Error fetching appointments:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch appointments" };
  }
};

export const deleteAppointment = async (ctx: Context) => {
  const id = ctx.params.id;

  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Appointment ID is required" };
    return;
  }

  try {
    const affected = await AppointmentsService.deleteAppointment(id);

    if (affected === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Appointment not found" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { message: "Appointment deleted successfully" };
  } catch (error) {
    console.error("❌ Error deleting appointment:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};
