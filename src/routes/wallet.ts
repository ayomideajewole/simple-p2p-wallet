import express from "express";
import { initializePayment, verifyPayment } from "../middleware/wallet";
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

export default router;