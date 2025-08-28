// /models/paymentModel.ts
import stripe from "../config/stripe.ts";
import {
  PaymentIntentInput,
  TerminalPaymentIntentInput,
  CaptureOrCancelInput,
} from "../types/payment.d.ts";

export class PaymentModel {
  static async createPaymentIntent(data: PaymentIntentInput) {
    return await stripe.paymentIntents.create({
      amount: data.amount,
      currency: "usd",
      payment_method_types: ["card"],
    });
  }

  static async fetchTransactions() {
    return await stripe.paymentIntents.list({ limit: 10 });
  }

  static async listReaders() {
    return await stripe.terminal.readers.list({ limit: 10 });
  }

  static async createConnectionToken() {
    return await stripe.terminal.connectionTokens.create();
  }

  static async createTerminalPaymentIntent(data: TerminalPaymentIntentInput) {
    return await stripe.paymentIntents.create({
      amount: data.amount,
      currency: "usd",
      payment_method_types: ["card_present"],
      capture_method: "manual",
    });
  }

  static async captureTerminalPaymentIntent(data: CaptureOrCancelInput) {
    return await stripe.paymentIntents.capture(data.paymentIntentId);
  }

  static async cancelTerminalPaymentIntent(data: CaptureOrCancelInput) {
    return await stripe.paymentIntents.cancel(data.paymentIntentId);
  }
}
