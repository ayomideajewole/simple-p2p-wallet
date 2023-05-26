import express from "express";
import { getWalletBalance, initializePayment, transferWalletFunds, verifyPayment } from "../middleware/wallet";
import auth from "../middleware/auth";


const router = express.Router();

router.post("/",[
  auth,
  initializePayment
]);
router.get("/fundWallet/",[
  auth,
  verifyPayment
]);
router.post("/transferFunds",[
  auth,
  transferWalletFunds
]);
router.get("/getWalletBalance",[
  auth,
  getWalletBalance
]);

export default router;