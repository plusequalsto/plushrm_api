const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing

// Authentication Schema
const authSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ },
    password: { 
        type: String, 
        required: true, 
        minlength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function(v) {
                return /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[!@#$%^&*]/.test(v);
            },
            message: props => `${props.value} is not a valid password!`
        }
    },
    role: { 
        type: String, 
        enum: ['Admin HR', 'Payroll HR', 'Recruitment HR', 'Employee Relations HR', 'HR Analyst', 'General HR'], 
        required: true 
    },
}, { _id: false });

// Main Employee Schema
const employeeSchema = new mongoose.Schema({
    verified: { type: Boolean, default: false },
    enabled: { type: Boolean, default: false }, // True means the account is active
    employeeId: { type: String, required: true, unique: true }, // Unique Employee ID
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    department: { type: String, required: true }, // Department name
    jobTitle: { type: String, required: true }, // Job title in the organization
    dateOfJoining: { type: Date, required: true },
    accessLevel: {
        type: String, 
        enum: ['Full', 'Limited', 'Viewer'], // Access level within HR roles
        required: true,
    },
    auth: { type: authSchema, required: true }, // Embedded authentication schema
    lastLoginDate: { type: Date },
    timezone: { type: String, default: 'UTC' },
}, { timestamps: true });

// Indexes for better query performance
employeeSchema.index({ 'auth.email': 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ jobTitle: 1 });

// Middleware to hash the password before saving a new employee
employeeSchema.pre('save', async function (next) {
    const employee = this;
    if (employee.isModified('auth.password')) { 
        employee.auth.password = await bcrypt.hash(employee.auth.password, 8);
    }
    next();
});

// Middleware to hash the password before updating it
employeeSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (update.auth && update.auth.password) {
        update.auth.password = await bcrypt.hash(update.auth.password, 8);
    }
    next();
});

// Create the Employee model
const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
