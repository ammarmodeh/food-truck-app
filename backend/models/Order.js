// Updated Order model
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    qty: { type: Number },
  }],
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  stripePaymentIntentId: { type: String },
  estimatedWait: { type: Number },
  phone: { type: String, required: false },
  readyAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  refundedAt: { type: Date },
  refundReason: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order number (last 6 characters of ID)
orderSchema.virtual('orderNumber').get(function () {
  return this._id.toString().slice(-6).toUpperCase();
});

// Index for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);