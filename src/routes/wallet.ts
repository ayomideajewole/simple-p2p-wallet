import express from "express";
import { initializePayment, transferWalletFunds, verifyPayment } from "../middleware/wallet";
import auth from "../middleware/auth";


const router = express.Router();

router.post("/",[
  auth,
  initializePayment
]);
router.post("/fundWallet",[
  auth,
  verifyPayment
]);
router.patch("/transferFunds",[
  auth,
  transferWalletFunds
]);

export default router;