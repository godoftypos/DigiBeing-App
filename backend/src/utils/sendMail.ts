import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export const generateAccessToken = (uid: number | string, expiresIn?: string) => {
    return jwt.sign(
        { userId: uid },
        process.env.JWT_SECRET as string,
        { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN as any || '1h' }
    );
}

const sendVerificationEmail = async (email: string, name: string, otp: number) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #4CAF50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                    }
                    .content {
                        padding: 20px;
                        background-color: #f9f9f9;
                    }
                    .otp-code {
                        font-size: 24px;
                        font-weight: bold;
                        color: #4CAF50;
                        text-align: center;
                        padding: 10px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${name},</p>
                        <p>Thank you for registering with us. To verify your email address, please use the following OTP code:</p>
                        <div class="otp-code">${otp}</div>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you didn't request this verification, please ignore this email.</p>
                        <p>Best regards,<br>The Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Verify Your Email',
            html: emailTemplate
        });
    } catch (error) {
        throw new Error(`Failed to send verification email: ${error}`);
    }
};

export default sendVerificationEmail;

export const sendCredentialEmail = async (
    email: string,
    name: string,
    password: string,
    title="Your Admin Dashboard Credentials"
) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #4CAF50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                    }
                    .content {
                        padding: 20px;
                        background-color: #f9f9f9;
                    }
                    .credentials {
                        font-size: 16px;
                        margin: 20px 0;
                        padding: 10px;
                        background-color: #e8f5e9;
                        border-left: 4px solid #4CAF50;
                    }
                    .button {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #4CAF50;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${title}</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${name},</p>
                        <p>Here are your admin credentials to log into the dashboard:</p>
                        <div class="credentials">
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Password:</strong> ${password}</p>
                        </div>
                        <p>You can access the admin dashboard by clicking the button below:</p>
                        <a href="https://blugig-dashboard.vercel.app/login" class="button">Go to Dashboard</a>
                        <p>If you did not expect this email, please contact support.</p>
                        <p>Best regards,<br>The Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Your Admin Dashboard Credentials',
            html: emailTemplate
        });
    } catch (error) {
        throw new Error(`Failed to send credentials email: ${error}`);
    }
};
