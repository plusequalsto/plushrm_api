const mongoose = require('mongoose');

const accessSchema = new mongoose.Schema({
  employeeRole: { 
    type: String, 
    enum: [
      'Admin HR', 
      'Payroll HR', 
      'Recruitment HR', 
      'Employee Relations HR', 
      'HR Analyst', 
      'General HR', 
      'Employee'
    ], 
    default: 'Employee', // Default role is Employee
    required: true 
  },
  permissions: {
    // Define permissions for each core requirement: time tracking, employee management, leave requests, payroll
    timeTracking: { type: Boolean, default: false },
    employeeManagement: { type: Boolean, default: false },
    leaveRequests: { type: Boolean, default: false },
    payroll: { type: Boolean, default: false },
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'employees', // Ensure this matches your actual employee model name
    required: true 
  },
  expiresAt: { type: Date, required: true }, // Expiry date for token or role assignment
  type: { 
    type: Number, 
    required: true, 
    enum: [1, 2, 3], // 1: Admin Role, 2: HR Role, 3: Viewer
  },
}, { timestamps: true });

// Indexes for improved query performance
accessSchema.index({ employeeId: 1 });
accessSchema.index({ employeeRole: 1 });

const Access = mongoose.model('Access', accessSchema);

module.exports = Access;
