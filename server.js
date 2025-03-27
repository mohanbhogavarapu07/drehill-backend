const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Email transporter with connection pooling
const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true,
  maxConnections: 5,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function for consistent email formatting
const formatEmailContent = (fields) => {
  let content = '';
  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      content += `${label}: ${value}\n`;
    }
  }
  return content;
};

// Contact form endpoint
app.post('/api/submit-form', async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, company, question } = req.body;
    
    // Quick validation
    if (!firstName || !lastName || !email || !mobile || !question) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prepare email (optimized formatting)
    const formattedContent = formatEmailContent({
      name: `${firstName} ${lastName}`,
      email,
      phone: mobile,
      company: company || 'Not provided',
      question,
      timestamp: new Date().toLocaleString()
    });

    const mailOptions = {
      from: `"${firstName} ${lastName}" <${email}>`,
      sender: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.OWNER_EMAIL,
      subject: `New Contact: ${firstName} ${lastName}`,
      text: `NEW CONTACT FORM SUBMISSION\n\n${formattedContent}\n\nYou can reply directly to this email.`
    };

    // Send response immediately
    res.status(200).json({ message: 'Thank you! Your message has been sent.' });

    // Process email in background
    transporter.sendMail(mailOptions)
      .then(() => console.log('Contact email sent'))
      .catch(err => console.error('Contact email error:', err));

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Job application endpoint
app.post('/api/submit-application', async (req, res) => {
  try {
    const { name, email, phone, position, resume } = req.body;
    
    // Quick validation
    if (!name || !email || !phone || !position || !resume) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!resume.startsWith('data:application/') || !resume.includes('base64,')) {
      return res.status(400).json({ message: 'Invalid resume format' });
    }

    // Prepare email
    const formattedContent = formatEmailContent({
      candidate: name,
      email,
      phone,
      position,
      timestamp: new Date().toLocaleString()
    });

    const fileExtension = resume.split(';')[0].split('/')[1];
    const filename = `${name.replace(/\s+/g, '_')}_resume.${fileExtension}`;

    const mailOptions = {
      from: `"${name}" <${email}>`,
      sender: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.OWNER_2_EMAIL,
      subject: `Job Application: ${name} for ${position}`,
      text: `NEW JOB APPLICATION\n\n${formattedContent}\n\nResume attached.`,
      attachments: [{
        filename,
        content: resume.split('base64,')[1],
        encoding: 'base64'
      }]
    };

    // Immediate response
    res.status(200).json({ message: 'Application submitted successfully!' });

    // Process in background
    transporter.sendMail(mailOptions)
      .then(() => console.log('Application email sent'))
      .catch(err => console.error('Application email error:', err));

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Notification subscription
app.post('/api/subscribe-notification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Quick validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const mailOptions = {
      from: `"Notification Subscriber" <${email}>`,
      sender: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.OWNER_EMAIL,
      subject: 'New Notification Subscription',
      text: `NEW NOTIFICATION SUBSCRIPTION\n\nEmail: ${email}\n\nTimestamp: ${new Date().toLocaleString()}`
    };

    // Immediate response
    res.status(200).json({ message: 'Subscription successful!' });

    // Process in background
    transporter.sendMail(mailOptions)
      .then(() => console.log('Subscription email sent'))
      .catch(err => console.error('Subscription email error:', err));

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});