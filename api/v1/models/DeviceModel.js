const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  deviceToken: { type: String, required: true },  // Device token from Firebase Cloud Messaging
  type: { type: String, enum: ['android', 'ios', 'web'], required: true }, // Device type
}, { timestamps: true });

// Indexes for better query performance
deviceSchema.index({ userId: 1 });
deviceSchema.index({ deviceToken: 1 });

// Create the Device model
const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
