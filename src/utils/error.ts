import {Response} from "express";

export const serverError= (res:Response, err:any) => {
  res.status(500).json({
    message: "Internal Server Error",
    ex: err
  });
}