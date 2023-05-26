import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {Request, Response} from "express";
import { serverError } from "../utils/error";
import { User, validate } from "../models/User";
import { createWallet } from './wallet';

export const signUp =async (req:Request, res:Response) => {
  try {
    const { error } = validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'failed!',
        message: error.details[0].message,
      });
    }

    let user = await User.findOne({email:req.body.email});
    if(user)
      return res.status(401).json({
        status: 'failed!',
        message: 'This User already exists!',
      });
    
    user = new User(req.body);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    await createWallet(user, res);

  } catch (ex) {
    return serverError(res, ex);
  }
}


export const login = async (userDetails: any, res: Response) => {
  try {
    const user = userDetails;

    const jwtPrivateKey = process.env.JWT_SECRET;
    const token = jwt.sign(
      {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      jwtPrivateKey
    );

    return res.status(200).json({
      status: "success",
      message: "Log in successful!",
      data: token,
    });
  } catch (ex) {
    return serverError(res, ex);
  }
};

