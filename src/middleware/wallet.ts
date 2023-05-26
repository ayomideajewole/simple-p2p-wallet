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

export async function createWallet(user:any, res:Response){
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

export async function initializePayment(req:Request, res:Response){
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
        statusCode: 400,
        message: 'The payment failed. Kindly try again.',
      });
    
    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: `Payment initialized successfully. 
        Kindly follow this link to complete your payment:
        ${initialize.authorization_url}`
    });
} catch (ex) {
  return serverError(res, ex);
}
}

export async function verifyPayment(req:any, res:Response){
try {
    let check = new PaymentCheck();
    let paymentExists = await check.isPaymentDuplicated(req.query.reference, res);
    if (paymentExists)
      return res.status(400).json({
        status: 'failed',
        statusCode: 400,
        message: 'This payment already exists!',
      });
    
    let paystack = new Paystack();
    let verifyPaystackPayment = await paystack.verifyTransaction(res);
    if (verifyPaystackPayment.data.status !== 'success')
      return res.status(400).json({
        status: 'success',
        statusCode: 400,
        message: 'This payment is invalid.'
      });

    let paymentData = {
      userId: req.body.user._id,
      reference: req.query.reference,
      paymentGatewayResponse: verifyPaystackPayment
    }
    let payment = new Payment(paymentData);
    await payment.save();
    await fundWallet(req);

} catch (ex) {
  return serverError(res, ex);
}
}

async function fundWallet(req:Request) {

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