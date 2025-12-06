import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  currentLocation: { type: String, required: true },
  state: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },
}, { timestamps: true });

export default mongoose.model('Location', locationSchema);