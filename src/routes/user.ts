import express, {Request, Response, NextFunction} from "express";
import passport from "passport";
import { login, signUp } from "../middleware/user";



const router = express.Router();

router.post("/",[
  signUp
]);

router.post("/login", [
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.status(404).json({
          success: "failed!",
          statusCode: 404,
          message: info.message,
        });
        res.end(info.message);
        return;
      }
      login(user, res);
    })(req, res, next);
  },
]);

export default router;