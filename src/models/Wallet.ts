import Joi from "joi";
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  walletBalance: {
    type: Number,
    default: 0.00
  }
},
{
  timestamps:true
})

export const Wallet = mongoose.model('wallet', walletSchema);

export const validateWallet = (userId) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().required(),
  });
  return schema.validate(userId);
};