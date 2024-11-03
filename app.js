const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const path = require('path');
const connectmongoDB = require('./api/config/mongodbConfig.js');

const authRoutes = require('./api/v1/routes/authRoutes.js')

dotenv.config();
const app = express();
connectmongoDB();

// Content Security Policy (CSP) configuration
app.use(
    helmet.contentSecurityPolicy({
        directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
            "'self'",
            "https://kit.fontawesome.com",
            "https://ka-f.fontawesome.com",
            "https://code.jquery.com",
            "https://cdn.jsdelivr.net",
            "https://stackpath.bootstrapcdn.com"
        ],
        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://ka-f.fontawesome.com",
            "https://stackpath.bootstrapcdn.com",
            "https://fonts.googleapis.com" // Added for Google Fonts
        ],
        fontSrc: [
            "'self'",
            "https://kit.fontawesome.com",
            "https://ka-f.fontawesome.com",
            "https://stackpath.bootstrapcdn.com",
            "https://fonts.gstatic.com" // Added for Google Fonts
        ],
        imgSrc: ["'self'", "https://res.cloudinary.com", "data:"],
        connectSrc: ["'self'", "https://ka-f.fontawesome.com"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        preconnectSrc: [
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com"
        ], // Added preconnect sources
        },
    })
);

// Define CORS options
const corsOptions = {
  origin: [
    `${process.env.HEROKU_URL}`,
    'http://80.177.32.233:${port}',
    'http://localhost:${port}'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browsers
};
app.use(xss());
app.use(express.json());
// Apply CORS middleware globally
app.use(cors(corsOptions));
// Handle preflight requests with CORS
app.options('*', cors(corsOptions));
// Serve static files with correct MIME types
// Serving static files with correct MIME types
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  },
}));
app.get('/api/v1', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
      <title>API v1 Response</title>
      <style>
        body {
          color: #2B2B2B;
          font-family: 'Poppins', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #2B2B2B;
          margin: 0;
        }
        .container {
          text-align: center;
          padding: 20px;
          border-radius: 8px;
          background-color: #FAFAFA;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome to PlusHRM API v1</h2>
        <p>This is the HTML response for the <i>/api/v1</i> endpoint.</p>
      </div>
    </body>
    </html>
  `);
});
app.use('/api/v1/auth', authRoutes);
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
    console.log(`Server running on port ${process.env.HEROKU_URL}`);
});