import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  createPaymentIntent,
  fetchTransactions,
  listReaders,
  createConnectionToken,
  createTerminalPaymentIntent,
  captureTerminalPaymentIntent,
  cancelTerminalPaymentIntent,
} from "../controllers/paymentController.ts";

const router = new Router();

// === ROUTES ===

// === 💳 Online Payments ===

// 🔓 Public: Create a payment intent
router.post("/create-payment-intent", createPaymentIntent);

// 🔓 Public/Admin: Fetch all transactions
router.get("/transactions", fetchTransactions);

// === 🏧 Stripe Terminal ===

// 🔓 Public/Admin: List Terminal readers
router.get("/terminal/readers", listReaders);

// 🔓 Public/Admin: Create Terminal connection token
router.post("/terminal/connection-token", createConnectionToken);

// 🔓 Public/Admin: Create Terminal payment intent
router.post("/terminal/payment-intent", createTerminalPaymentIntent);

// 🔓 Public/Admin: Capture Terminal payment intent
router.post("/terminal/capture", captureTerminalPaymentIntent);

// 🔓 Public/Admin: Cancel Terminal payment intent
router.post("/terminal/cancel", cancelTerminalPaymentIntent);

export default router;