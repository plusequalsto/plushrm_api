const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // Changed to bcryptjs for consistency
const jwt = require('jsonwebtoken'); 
const Employee = require('../models/EmployeesModel'); 
const Device = require('../models/DeviceModel');
const Token = require('../models/TokenModel'); 
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const URL = process.env.HEROKU_URL;

const signupVerifyEmail = fs.readFileSync('public/verification_email.html', 'utf8');

const sendVerificationEmail = async (firstName, email, location, token) => {
  const verificationLink = `${URL}/auth/verifysignup/${token}`;
  const currentYear = new Date().getFullYear();
  const options = {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Europe/London',
    timeZoneName: 'short'
  };
  const currentDateTime = new Intl.DateTimeFormat('en-GB', options).format(new Date());
  
  const htmlContent = signupVerifyEmail
    .replace('{{firstName}}', firstName)
    .replace('{{verificationLink}}', verificationLink)
    .replace('{{location}}', location)
    .replace('{{currentDateTime}}', currentDateTime)
    .replace('{{currentYear}}', currentYear);

  const msg = {
    to: email,
    from: {
      email: 'contact@plusequalsto.com',
      name: 'Contact - Plus Equals To'
    },
    subject: `Welcome to PlusPay by Plus Equals To`,
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

const verifySignupToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Find the verification token in the database
    const verificationToken = await Token.findOne({
      accessToken: token,
      expiresAt: { $gt: Date.now() },
      type: 1 // Assuming type 1 is for email verification
    });

    if (!verificationToken) {
      return res.status(400).json({ status: 400, message: 'Invalid or expired token' });
    }

    // Find the employee associated with the verification token
    const employee = await Employee.findById(verificationToken.employeeId); // Use employeeId
    if (!employee) {
      return res.status(404).json({ status: 404, message: 'Employee not found' });
    }

    // Update employee verification status and save
    employee.verified = true;
    employee.enabled = true;
    await employee.save();

    // Delete the verification token from the database
    await Token.deleteOne({ _id: verificationToken._id });

    // Send the verification success HTML page
    res.sendFile(path.join(__dirname, '..', '..', '..', 'public', 'verification_success.html'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Error verifying token', error: error.message });
  }
};

const generateEmailVerificationToken = async (employee, employeeIp, type) => {
  const accessToken = jwt.sign({ employeeId: employee._id, employeeRole: employee.auth.role }, process.env.JWT_SECRET, {
    expiresIn: '15m', // Set your desired expiration time
  });

  await saveToken(employee._id, employee.auth.role, accessToken, '', 1);

  if (type === 1) {
    // Send verification email
    await sendVerificationEmail(employee.firstName, employee.auth.email, employeeIp, accessToken);
  }
};

const saveToken = async (employeeId, employeeRole, accessToken, refreshToken, type) => {
  await Token.create({
    employeeId,
    employeeRole,
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 15 * 60 * 1000,
    type,
  });
};

// Sign Up
const signUp = async (req, res) => {
  const { firstName, lastName, email, password, deviceToken, deviceType } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !deviceToken || !deviceType) {
    return res.status(400).json({ message: 'Email, password, first name, last name, device token, and device type are required.' });
  }

  try {
    // Get the employee's IP address
    let employeeIp = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    if (employeeIp.startsWith('::ffff:')) {
      employeeIp = employeeIp.replace('::ffff:', '');
    }

    // Get the location from IP
    let location = {};
    try {
      const response = await axios.get(`https://ipinfo.io/${employeeIp}?token=587916888074d8`);
      location = `${response.data.city}, ${response.data.region}, ${response.data.country} (${response.data.ip})`;
    } catch (locationError) {
      console.error('Error retrieving location:', locationError);
    }

    // Check if the employee already exists
    const existingEmployee = await Employee.findOne({ 'auth.email': email });
    if (existingEmployee) {
      return res.status(409).json({ message: 'Employee already exists with this email.' });
    }

    // Create a new employee
    const newEmployee = await Employee.create({
      firstName,
      lastName,
      auth: {
        email,
        password, // The password will be hashed by the pre-save middleware
      },
      verified: false, // Ensure that verified is false for new users
      enabled: false, // Account shouldn't be enabled upon creation
    });

    // Create a new device record
    const newDevice = await Device.create({
      employeeId: newEmployee._id, // Adjusted to match the employeeId reference
      token: deviceToken,
      type: deviceType,
    });

    // Generate tokens for the employee
    const accessToken = jwt.sign({ employeeId: newEmployee._id, employeeRole: newEmployee.auth.role }, process.env.JWT_SECRET, {
      expiresIn: '15m', 
    });
    const refreshToken = jwt.sign({ employeeId: newEmployee._id }, process.env.JWT_SECRET, {
      expiresIn: '7d', 
    });
    await saveToken(newEmployee._id, newEmployee.auth.role, accessToken, refreshToken, 2);

    // Create a verification token and send email
    await generateEmailVerificationToken(newEmployee, location, 1);

    // Respond with employee and device information
    res.status(201).json({
      status: 201,
      accessToken,
      refreshToken,
      employee: {
        id: newEmployee._id,
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.auth.email,
        role: newEmployee.auth.role,
      }
    });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  signUp,
  verifySignupToken,
};
