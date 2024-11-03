const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  employeeRole: { type: String, enum: ["Admin", "Employee"], required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: false },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'employees', required: true },
  expiresAt: { type: Date, required: true },
  type: { type: Number, required: true }, // type 1 for email verification, type 2 for JWT token, type 3 for password reset
}, { timestamps: true });

// Indexes for better query performance
tokenSchema.index({ employeeId: 1 });
tokenSchema.index({ accessToken: 1 });
tokenSchema.index({ refreshToken: 1 });

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
