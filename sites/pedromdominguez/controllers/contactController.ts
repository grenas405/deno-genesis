// /controllers/contactController.ts
import { Context } from "https://deno.land/x/oak/mod.ts";
import { ContactService } from "../services/contactService.ts";
import { ContactMessageInput } from "../types/contact.d.ts";

export const submitContactMessage = async (ctx: Context) => {
  try {
    const { value } = await ctx.request.body({ type: "json" });
    const { name, email, phone, message } = await value;

    if (!name || !phone || !message) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Name, phone, and message are required.",
      };
      return;
    }

    const input: ContactMessageInput = { name, email, phone, message };
    await ContactService.submitMessage(input);

    ctx.response.status = 200;
    ctx.response.body = { message: "Message submitted successfully." };
  } catch (error) {
    console.error("❌ Error submitting contact message:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

export const fetchContactMessages = async (ctx: Context) => {
  try {
    const messages = await ContactService.fetchMessages();
    ctx.response.status = 200;
    ctx.response.body = messages;
  } catch (error) {
    console.error("❌ Error fetching contact messages:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

export const deleteContactMessage = async (ctx: Context) => {
  const id = ctx.params.id;

  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Contact message ID is required." };
    return;
  }

  try {
    const affected = await ContactService.deleteMessage(id);

    if (affected === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Message not found." };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { message: "Contact message deleted successfully." };
  } catch (error) {
    console.error("❌ Error deleting contact message:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};