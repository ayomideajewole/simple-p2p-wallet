import {Request, Response} from "express";
import { Wallet, validateWallet } from "../models/Wallet";
import axios from "axios";
import { serverError } from "../utils/error";
import { Payment } from "../models/Payment";

const header = {
  headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    }
}

export const createWallet = async(user:any, res:Response) => {
try {
    const {error} = validateWallet(user._id);
    if(error)
      return res.status(400).json({
        status: 'failed!',
        message: error.details[0].message,
      });
    
    let wallet = new Wallet(user._id);
    await wallet.save();
    
    return res.status(200).json({
      status: 'success!',
      message: 'Wallet creation successful!',
      data: user, wallet
    });
} catch (ex) {
  return serverError(res, ex);
}
}

export const initializePayment = async(req:Request, res:Response) => {
try {
    const data = {
      email: req.body.user.email,
      koboAmount: req.body.amount*100,
    }
    let paystack = new Paystack();
    let initialize = await paystack.initializeTransaction(data, res);
    if (initialize.status !== true)
      return res.status(400).json({
        status: 'failed',
        message: 'The payment failed. Kindly try again.',
      });
    
    return res.status(200).json({
      status: 'success',
      message: `Payment initialized successfully. 
        Kindly follow this link to complete your payment:
        ${initialize.authorization_url}`
    });
} catch (ex) {
  return serverError(res, ex);
}
}

export const verifyPayment = async(req:any, res:Response) => {
try {
    let check = new PaymentCheck();
    let paymentExists = await check.isPaymentDuplicated(req.query.reference, res);
    if (paymentExists)
      return res.status(400).json({
        status: 'failed',
        message: 'This payment already exists!',
      });
    
    let paystack = new Paystack();
    let verifyPaystackPayment = await paystack.verifyTransaction(res);
    if (verifyPaystackPayment.data.status !== 'success')
      return res.status(400).json({
        status: 'failed',
        message: 'This payment is invalid.'
      });

    let paymentData = {
      amount: verifyPaystackPayment.data.status.amount/100,
      userId: req.body.user._id,
      reference: req.query.reference,
      paymentGatewayResponse: verifyPaystackPayment
    }
    let payment = new Payment(paymentData);
    await payment.save();
    await fundWallet(req);
    return res.status(200).json({
      status: 'success',
      message: `Your wallet has been successfully
       funded with ${paymentData.amount}NGN.`
    });

} catch (ex) {
  return serverError(res, ex);
}
}

export const transferWalletFunds = async(req:Request, res:Response) => {
  try {
    let balance = new Balance();
    let checkBalance = await balance.getBalance(req, res);
    if(req.body.amount >= Number(checkBalance) || Number(checkBalance) === 0.00)
      return res.status(401).json({
        status: 'failed',
        message: 'Insufficient funds!'
      });
    
    const senderData = {
      amount: req.body.amount,
      userId: req.body.user._id,
    }
    const receiverData = {
      amount: req.body.amount,
      userId: req.params._id
    }
    await balance.decrementBalance(senderData, res);
    await balance.incrementBalance(receiverData, res);
    return res.status(200).json({
      status: 'success',
      message: `Your have successfully
       funded this user with ${senderData.amount}NGN.`
    });

  } catch (ex) {
    return serverError(res, ex);
  }
}

const fundWallet = async(req:Request) => {

  await Wallet.updateOne({userId:req.body.user._id},{
    $inc: {walletBalance:req.body.amount}
  });
  return true;
}
class Paystack {
  constructor() {
    
  }
  async initializeTransaction(data, res:Response){
    
    try {
          const response = await axios.post(`${process.env.PAYSTACK_URL}/transaction/initialize/`,header, data);
          console.log(response.data);
          
          return response.data
    } catch (ex) {
      if(ex.response.data.message){
        return serverError(res, ex.response.data.message)
      }
      return serverError(res, 'An error occured');
    }
  }

  async verifyTransaction(res:Response){
    
    try {
          const response = await axios.get(`${process.env.PAYSTACK_URL}/transaction/verify/`,header);
          console.log(response.data);
          
          return response.data
    } catch (ex) {
      if(ex.response.data.message){
        return serverError(res, ex.response.data.message)
      }
      return serverError(res, 'An error occured');
    }
  }
}

class PaymentCheck{
  constructor(){}

  async isPaymentDuplicated(reference:string, res:Response) {
    try{
    const paymentExists = await Payment.findOne({reference:reference});
    if (paymentExists){
      return true;
    } else{
      return false;
    } 
    }catch (ex) {
      return serverError(res, ex);
  }
  }

}

class Balance{
  constructor(){

  }

  async getBalance(req:Request, res:Response) {
    try{
    const walletBalance = await Wallet.findOne({userId:req.body.user._id}).select('walletBalance');
      return walletBalance;
    }catch (ex) {
      return serverError(res, ex);
  }
    }

  async incrementBalance(data:any, res:Response) {
    try{
    const walletBalance = await Wallet.updateOne({userId:data.userId}, {
      $inc:{walletBalance:data.amount}
    });
      return walletBalance;
    }catch (ex) {
      return serverError(res, ex);
  }
    }

  async decrementBalance(data:any, res:Response) {
    try{
    const walletBalance = await Wallet.updateOne({userId:data.userId}, {
      $dec:{walletBalance:data.amount}
    });
      return walletBalance;
    }catch (ex) {
      return serverError(res, ex);
  }
    }
}