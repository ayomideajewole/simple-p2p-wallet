const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { User } = require("../models/User");

export = function (passport: any) {
  const authenticateUserLogin = async (
    email: string,
    password: string,
    done: any
  ) => {
    try {
      const user = await User.findOne({ email: email });
      if (!user)
        return done(null, false, { message: "The email is not registered" });

      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Password incorrect" });
      }
    } catch (err) {
      return done(err);
    }
  };

  passport.use(
    new LocalStrategy({ usernameField: "email" }, authenticateUserLogin)
  );

  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: any, done: any) => {
    const user = await User.findById(id);
    done(null, user);
  });
};
