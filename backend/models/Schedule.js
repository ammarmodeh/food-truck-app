import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  location: { type: String, required: true },
  state: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  coordinates: { lat: Number, lng: Number },
}, { timestamps: true });

export default mongoose.model('Schedule', scheduleSchema);