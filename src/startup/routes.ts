import user from "../routes/user";
import wallet from "../routes/wallet";


function routes(app:any){
  app.use("/api/v1/", user)
  app.use("/api/v1/", wallet)
}

export default routes;