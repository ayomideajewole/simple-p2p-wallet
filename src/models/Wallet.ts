import Joi from "joi";
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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
  });
  return schema.validate(userId);
};