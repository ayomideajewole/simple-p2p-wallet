require("dotenv").config();
import express from "express";
import routes from "./startup/routes";
import passport from "passport";
import session from "express-session";
import cors from "cors";


const app = express();

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.get('/', (req, res)=>{
  res.send('Simple Wallet Back end App');
})

routes(app);

require("./config/passport")(passport);
require("./startup/db")();

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express is listening at http://localhost:${port}`)
);