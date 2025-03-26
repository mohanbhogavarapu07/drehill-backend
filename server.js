const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require('dotenv').config();
// Add this near the top of your file
const path = require('path');

// Serve static files from React in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

const app = express();

// Configure middleware with increased payload limits
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Handle contact form submissions
app.post('/api/submit-form', async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, company, country, question } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !mobile || !country || !question) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Plain text email content
    const textContent = `
      New Contact Form Submission
      ---------------------------
      Name: ${firstName} ${lastName}
      Email: ${email}
      Phone: ${mobile}
      Company: ${company || 'Not provided'}
      Country: ${country}
      
      Question/Inquiry:
      ${question}
      
      You can reply directly to this email.
      Sent via Drehill contact form at ${new Date().toLocaleString()}
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `New Contact from ${firstName} ${lastName}`,
      text: textContent
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Form submitted successfully!' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      message: 'Failed to submit form',
      error: error.message 
    });
  }
});

// Handle job application submissions
app.post('/api/submit-application', async (req, res) => {
  try {
    const { name, email, phone, position, resume } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !position || !resume) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate resume format
    if (!resume.startsWith('data:application/') || !resume.includes('base64,')) {
      return res.status(400).json({ message: 'Invalid resume format' });
    }

    // Plain text email content
    const textContent = `
      New Job Application Received
      ---------------------------
      Position: ${position}
      Candidate: ${name}
      Email: ${email}
      Phone: ${phone}
      
      Resume is attached to this email.
      
      You can contact the candidate directly by replying to this email.
      Application submitted via Drehill careers portal at ${new Date().toLocaleString()}
    `;

    // Extract file extension from base64 string
    const fileExtension = resume.split(';')[0].split('/')[1];
    const filename = `${name.replace(/\s+/g, '_')}_resume.${fileExtension}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_2_EMAIL,  // Changed to owner 2
      subject: `New Application for ${position}`,
      text: textContent,
      attachments: [
        {
          filename,
          content: resume.split('base64,')[1],
          encoding: 'base64'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Application submitted successfully!' });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ 
      message: 'Failed to submit application',
      error: error.message 
    });
  }
});

// Add this new endpoint to your existing server.js
app.post('/api/subscribe-notification', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Plain text email content
    const textContent = `
      New Notification Subscription
      ----------------------------
      Email: ${email}
      
      This user wants to be notified about product launches.
      
      Subscription created at: ${new Date().toLocaleString()}
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `New Product Notification Subscription`,
      text: textContent
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Subscription successful!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to process subscription',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});