// /controllers/paymentController.ts
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { PaymentService } from "../services/paymentService.ts";

export const createPaymentIntent = async (ctx: Context) => {
  try {
    const { amount } = await ctx.request.body({ type: "json" }).value;
    if (!amount || isNaN(amount) || amount <= 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid amount" };
      return;
    }
    const intent = await PaymentService.createPaymentIntent({ amount });
    ctx.response.status = 200;
    ctx.response.body = { clientSecret: intent.client_secret };
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: err.message };
  }
};

export const fetchTransactions = async (ctx: Context) => {
  try {
    const transactions = await PaymentService.fetchTransactions();
    ctx.response.status = 200;
    ctx.response.body = transactions;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Unable to fetch transactions" };
  }
};

export const listReaders = async (ctx: Context) => {
  try {
    const readers = await PaymentService.listReaders();
    ctx.response.status = 200;
    ctx.response.body = readers.data;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to list readers" };
  }
};

export const createConnectionToken = async (ctx: Context) => {
  try {
    const token = await PaymentService.createConnectionToken();
    ctx.response.status = 200;
    ctx.response.body = token;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to create connection token" };
  }
};

export const createTerminalPaymentIntent = async (ctx: Context) => {
  try {
    const { amount } = await ctx.request.body({ type: "json" }).value;
    if (!amount || isNaN(amount) || amount <= 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid amount" };
      return;
    }
    const intent = await PaymentService.createTerminalPaymentIntent({ amount });
    ctx.response.status = 200;
    ctx.response.body = intent;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to create terminal payment intent" };
  }
};

export const captureTerminalPaymentIntent = async (ctx: Context) => {
  try {
    const { paymentIntentId } = await ctx.request.body({ type: "json" }).value;
    if (!paymentIntentId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Missing paymentIntentId" };
      return;
    }
    const intent = await PaymentService.captureTerminalPaymentIntent({ paymentIntentId });
    ctx.response.status = 200;
    ctx.response.body = intent;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to capture payment" };
  }
};

export const cancelTerminalPaymentIntent = async (ctx: Context) => {
  try {
    const { paymentIntentId } = await ctx.request.body({ type: "json" }).value;
    if (!paymentIntentId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Missing paymentIntentId" };
      return;
    }
    const intent = await PaymentService.cancelTerminalPaymentIntent({ paymentIntentId });
    ctx.response.status = 200;
    ctx.response.body = intent;
  } catch (err) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to cancel payment" };
  }
};