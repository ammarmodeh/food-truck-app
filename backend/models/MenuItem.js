import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  category: { type: String },
  prepTime: { type: Number, default: 5 },
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);