import axios from "axios";

import {Request, Response} from "express";
import { Wallet, validateWallet } from "../models/Wallet";
import { serverError } from "../utils/error";
import { Payment, validatePayment } from "../models/Payment";
import { User } from "../models/User";

const header = {
  headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    }
}

export const createWallet = async(user:any, res:Response) => {
try {
  const data = {
    userId: String(user._id),
    email: user.email
  }

    const {error} = validateWallet(data);
    if(error)
      return res.status(400).json({
        status: 'failed!',
        message: error.details[0].message,
      });
    
    let wallet = new Wallet(data);
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
    if (!req.body.email || !req.body.amount)
      return res.status(400).json({
        status: 'failed',
        message: 'Missing fields! Kindly input required fields.',
      });

    const data = {
      email: req.body.user.email,
      amount: req.body.amount*100,
      callback_url:`${process.env.BASE_URL}/api/v1/wallet/fundWallet`
    }
    let paystack = new Paystack();
    let initialize = await paystack.initializeTransaction(data, res);
    if (initialize.status !== true)
      return res.status(400).json({
        status: 'failed',
        message: 'The payment failed. Kindly try again.',
        data: initialize
      });
    
    return res.status(200).json({
      status: 'success',
      message: `Payment initialized successfully. 
        Kindly follow this link to complete your payment:
        ${initialize.data.authorization_url}`
    });
} catch (ex) {
  return serverError(res, ex);
}
}

export const verifyPayment = async(req:any, res:Response) => {
try {
    let reference = req.query.reference;
    let check = new PaymentCheck();    
    let paymentExists = await check.isPaymentDuplicated(reference, res);    
    if (paymentExists)
      return res.status(400).json({
        status: 'failed',
        message: 'This payment already exists!',
      });
    
    let paystack = new Paystack();
    let verifyPaystackPayment = await paystack.verifyTransaction(reference, res);    
    if (verifyPaystackPayment.data.status !== 'success')
      return res.status(400).json({
        status: 'failed',
        message: 'This payment is invalid.',
        data: verifyPaystackPayment.message
      });

    let paymentData = {
      amount: verifyPaystackPayment.data.amount/100,
      userId: req.body.user._id,
      reference: req.query.reference,
      paymentGatewayResponse: verifyPaystackPayment
    }

    const {error} = validatePayment(paymentData);
    if(error)
      return res.status(400).json({
        status: 'failed!',
        message: error.details[0].message,
      });

    await fundWallet(req, paymentData.amount);

    let payment = new Payment(paymentData);
    await payment.save();

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
    if (!req.body.email || !req.body.amount)
      return res.status(400).json({
        status: 'failed',
        message: 'Missing fields! Kindly input required fields.',
      });

    let requestedAmount = Number(req.body.amount);  

    let balance = new Balance();
    let checkBalance = await balance.getBalance(req, res);    
    if(requestedAmount <= 0.00 || requestedAmount >= Number(checkBalance))
      return res.status(401).json({
        status: 'failed',
        message: 'Insufficient funds!'
      });

    let check = new PaymentCheck();
    let checkReceiver = await check.doesReceiverExist(req.body.email, res);
    if(checkReceiver !== true)
      return res.status(401).json({
        status: 'failed',
        message: 'Recipient user does not exist!'
      });
    
    const senderData = {
      amount: requestedAmount,
      userId: req.body.user._id,
    }
    const receiverData = {
      amount: requestedAmount,
      email: req.body.email
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

export const getWalletBalance = async(req:Request, res:Response) => {
 try {

  let balance = new Balance();
  let walletBalance = await balance.getBalance(req, res);

  return res.status(200).json({
    status: 'success',
    message: `Wallet balance retrieved successfully.`,
    data: {walletBalance: walletBalance}
  });
  
 } catch (ex) {
  return serverError(res, ex);
 }

}

const fundWallet = async(req:Request,amount:number) => {
 
  await Wallet.updateOne({userId:req.body.user._id},{
    $inc: {walletBalance:amount}
  });
  return true;
  
}
class Paystack {
  constructor() {
    
  }
  async initializeTransaction(data, res:Response){
    
    try {
          const response = await axios.post(`${process.env.PAYSTACK_URL}/transaction/initialize/`, data, header);
          // console.log(response.data);
          
          return response.data
    } catch (ex) {
      if(ex.response.data.message){
        return ex.response.data.message
      }
      return 'An error occured';
    }
  }

  async verifyTransaction(reference:string, res:Response){
    
    try {
      const response = await axios.get(`${process.env.PAYSTACK_URL}/transaction/verify/${reference}`,header);
      // console.log(response.data);
      
      return response.data
    } catch (ex) {
      if(ex.response.data.message){
        return ex.response.data
      }
      return 'An error occured';
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

  async doesReceiverExist(email:string, res:Response) {
    try{
    const receiverExists = await User.findOne({email:email});
    if (receiverExists){
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
    const wallet = await Wallet.findOne({userId:req.body.user._id});
    return wallet.walletBalance;
      // console.log(walletBalance);
      
    }catch (ex) {
      return serverError(res, ex);
  }
    }

  async incrementBalance(data:any, res:Response) {
    try{
    const walletBalance = await Wallet.updateOne({email:data.email}, {
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
      $inc:{walletBalance:-data.amount}
    });
      return walletBalance;
    }catch (ex) {
      return serverError(res, ex);
  }
    }
}