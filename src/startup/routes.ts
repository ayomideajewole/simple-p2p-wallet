import user from "../routes/user";


function routes(app:any){
  app.use("/api/v1/", user)
}

export default routes;