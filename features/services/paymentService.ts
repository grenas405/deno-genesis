// /services/paymentService.ts
import { PaymentModel } from "../models/paymentModel.ts";
import {
  PaymentIntentInput,
  TerminalPaymentIntentInput,
  CaptureOrCancelInput,
  PaymentTransaction,
  ConnectionToken,
} from "../types/payment.d.ts";

export class PaymentService {
  static async createPaymentIntent(data: PaymentIntentInput) {
    return await PaymentModel.createPaymentIntent(data);
  }

  static async fetchTransactions(): Promise<PaymentTransaction[]> {
    const res = await PaymentModel.fetchTransactions();
    return res.data.map(intent => ({
      id: intent.id,
      amount: intent.amount,
      created: intent.created,
      status: intent.status,
      payment_method_types: intent.payment_method_types,
    }));
  }

  static async listReaders() {
    return await PaymentModel.listReaders();
  }

  static async createConnectionToken(): Promise<ConnectionToken> {
    return await PaymentModel.createConnectionToken();
  }

  static async createTerminalPaymentIntent(data: TerminalPaymentIntentInput) {
    return await PaymentModel.createTerminalPaymentIntent(data);
  }

  static async captureTerminalPaymentIntent(data: CaptureOrCancelInput) {
    return await PaymentModel.captureTerminalPaymentIntent(data);
  }

  static async cancelTerminalPaymentIntent(data: CaptureOrCancelInput) {
    return await PaymentModel.cancelTerminalPaymentIntent(data);
  }
}