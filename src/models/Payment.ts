import Joi from 'joi';
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const paymentSchema = new mongoose.Schema({
  reference:{
    type: String,
    required: true,
  },
  paymentGatewayResponse:{
    type: Object,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
},{
  timestamps: true
});

export const Payment = mongoose.model('payment', paymentSchema);

export function validate(payment:{}) {
  const schema = Joi.object({
    userId: Joi.string().required(),
    reference: Joi.string().required(),
    paymentGatewayResponse: Joi.object(),
  });
 
  return schema.validate(payment);
}