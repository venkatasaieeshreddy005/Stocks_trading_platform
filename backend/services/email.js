require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter using Gmail OAuth2 (matching your tutorial style)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    }
});

// Verify the connection configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email server:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

/**
 * Checks if email OAuth2 credentials are fully configured
 */
function isEmailConfigured() {
    return Boolean(
        process.env.EMAIL_USER &&
        process.env.CLIENT_ID &&
        process.env.CLIENT_SECRET &&
        process.env.REFRESH_TOKEN
    );
}

// Common send email function
const sendEmail = async (to, subject, text, html) => {
    if (!isEmailConfigured()) {
        console.warn('[email] Email credentials not configured - skipping email to', to);
        return { skipped: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"TradeZen" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log('Message sent:', info.messageId);
        return { skipped: false, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

// Registration welcome email
const sendRegistrationEmail = async (userEmail, name) => {
    const subject = 'Welcome to TradeZen!';

    const text = `Hello ${name},

Thank you for registering at TradeZen.
We're excited to have you on board! Enjoy trading with your virtual capital.

Best regards,
The TradeZen Team`;

    const html = `
<html>
<body>
    <p>Hello ${name},</p>
    <p>
        Thank you for registering at <strong>TradeZen</strong>.
        We're excited to have you on board! Enjoy trading with your virtual capital.
    </p>
    <p>
        Best regards,<br>
        <strong>The TradeZen Team</strong>
    </p>
</body>
</html>
`;

    return sendEmail(userEmail, subject, text, html);
};

// 6-digit code email (used for email verification and password reset)
const sendCodeEmail = async (userEmail, name, subject, heading, code) => {
    const text = `Hello ${name},

${heading}

Your 6-digit code is: ${code}

It expires in 10 minutes. If you did not request this, you can ignore this email.

The TradeZen Team`;

    const html = `
<html>
<body>
    <p>Hello ${name},</p>
    <p>${heading}</p>
    <p style="font-size:28px;font-weight:800;letter-spacing:6px;">${code}</p>
    <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
    <p><strong>The TradeZen Team</strong></p>
</body>
</html>
`;

    return sendEmail(userEmail, subject, text, html);
};

module.exports = {
    transporter,
    isEmailConfigured,
    sendEmail,
    sendRegistrationEmail,
    sendCodeEmail
};