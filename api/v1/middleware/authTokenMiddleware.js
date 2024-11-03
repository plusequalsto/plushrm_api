const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); 
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
const IPINFO_TOKEN = process.env.IPINFO_TOKEN; // Store token in env variables
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
        const verificationToken = await Token.findOne({
            accessToken: token,
            expiresAt: { $gt: Date.now() },
            type: 1 // Assuming type 1 is for email verification
        });

        if (!verificationToken) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const employee = await Employee.findById(verificationToken.employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        employee.verified = true;
        employee.enabled = true;
        await employee.save();

        await Token.deleteOne({ _id: verificationToken._id });

        res.sendFile(path.join(__dirname, '..', '..', '..', 'public', 'verification_success.html'));
    } catch (error) {
        console.error('Error verifying token:', error.message);
        res.status(500).json({ message: 'Error verifying token' });
    }
};

const generateEmailVerificationToken = async (employee, employeeIp, type) => {
    const accessToken = jwt.sign({ employeeId: employee._id, employeeRole: employee.auth.role }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });

    await saveToken(employee._id, employee.auth.role, accessToken, '', 1);

    if (type === 1) {
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

const signUp = async (req, res) => {
    const { firstName, lastName, email, password, deviceToken, deviceType } = req.body;

    if (!email || !password || !firstName || !lastName || !deviceToken || !deviceType) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        let employeeIp = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
        if (employeeIp.startsWith('::ffff:')) {
            employeeIp = employeeIp.replace('::ffff:', '');
        }

        let location = '';
        try {
            const response = await axios.get(`https://ipinfo.io/${employeeIp}?token=${IPINFO_TOKEN}`);
            location = `${response.data.city}, ${response.data.region}, ${response.data.country} (${response.data.ip})`;
        } catch (locationError) {
            console.error('Error retrieving location:', locationError.message);
        }

        const existingEmployee = await Employee.findOne({ 'auth.email': email });
        if (existingEmployee) {
            return res.status(409).json({ message: 'Employee already exists with this email.' });
        }

        const newEmployee = await Employee.create({
            firstName,
            lastName,
            auth: {
                email,
                password, // Ensure this gets hashed in the model
            },
            verified: false,
            enabled: false,
        });

        await Device.create({
            employeeId: newEmployee._id,
            token: deviceToken,
            type: deviceType,
        });

        const accessToken = jwt.sign({ employeeId: newEmployee._id, employeeRole: newEmployee.auth.role }, process.env.JWT_SECRET, {
            expiresIn: '15m',
        });
        const refreshToken = jwt.sign({ employeeId: newEmployee._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        await saveToken(newEmployee._id, newEmployee.auth.role, accessToken, refreshToken, 2);

        await generateEmailVerificationToken(newEmployee, location, 1);

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
            },
        });
    } catch (error) {
        console.error('Error signing up:', error.message);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = {
    signUp,
    verifySignupToken,
};
