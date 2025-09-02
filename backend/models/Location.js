import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  currentLocation: { type: String, required: true },
  coordinates: { lat: Number, lng: Number },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Location', locationSchema);