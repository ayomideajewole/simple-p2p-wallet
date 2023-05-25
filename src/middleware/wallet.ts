import {Request, Response} from "express";
import { Wallet, validateWallet } from "../models/Wallet";


export async function createWallet(user:any, res:Response){
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
}