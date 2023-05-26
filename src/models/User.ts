import Joi from "joi";
import passwordComplexity from "joi-password-complexity";
import mongoose from "mongoose";

const complexityOptions = {
  min: 5,
  max: 25,
  upperCase: 1,
  lowerCase: 1,
  numeric: 1,
  requirementCount: 5,
};

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("user", userSchema);

export const validate = (user: {}) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
    password: passwordComplexity(complexityOptions).required(),
  });
  return schema.validate(user);
};

