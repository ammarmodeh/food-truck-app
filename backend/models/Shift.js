import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  startCash: {
    type: Number,
    required: true,
  },
  endCash: {
    type: Number,
  },
  expectedCash: {
    type: Number,
  },
  sales: {
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
  },
  refunds: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
  },
}, {
  timestamps: true,
});

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
