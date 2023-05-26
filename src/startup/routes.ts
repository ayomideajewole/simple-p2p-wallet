import express from "express";
import user from "../routes/user";
import wallet from "../routes/wallet";


function routes(app:any){
  app.use(express.json())
  app.use("/api/v1/user", user)
  app.use("/api/v1/wallet", wallet)
}

export default routes;