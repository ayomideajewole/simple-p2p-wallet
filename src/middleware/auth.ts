import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

export default async function (req: Request, res: Response, next: NextFunction){
  try{
    const { authorization } = req.headers;
    if (!authorization)
      return res.status(401).send("Authorization token not included!");

    await jwt.verify(
      authorization,
      process.env.JWT_SECRET,
      (err: any, decoded: any) => {
        if (err || !decoded) {
          if (err.message === "TokenExpiredError") {
            return res
              .status(400)
              .send("Session expired! Kindly log in again.");
          }
          return res.status(401).send("Invalid Token!");
        }

        req.body = { ...req.body, user: decoded };
        return next();
      }
    );
  } catch (error) {
    return error;
  }
}
