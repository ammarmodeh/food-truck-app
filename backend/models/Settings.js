import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    default: 'Food Truck App'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  soundNotifications: {
    type: Boolean,
    default: true
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },

  // Payment Settings
  stripePublishableKey: {
    type: String,
    default: ''
  },
  acceptCash: {
    type: Boolean,
    default: true
  },
  acceptCard: {
    type: Boolean,
    default: true
  },

  // Order Settings
  autoAcceptOrders: {
    type: Boolean,
    default: false
  },
  defaultPrepTime: {
    type: Number,
    default: 15
  },
  maxOrdersPerHour: {
    type: Number,
    default: 50
  },

  // Email Settings
  smtpHost: {
    type: String,
    default: ''
  },
  smtpPort: {
    type: Number,
    default: 587
  },
  smtpUser: {
    type: String,
    default: ''
  },
  smtpPassword: {
    type: String,
    default: ''
  },

  // Appearance Settings
  primaryColor: {
    type: String,
    default: '#ea580c'
  },
  accentColor: {
    type: String,
    default: '#f97316'
  },

  // Security Settings
  sessionTimeout: {
    type: Number,
    default: 30
  },
  minPasswordLength: {
    type: Number,
    default: 8
  },
  requireStrongPassword: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
