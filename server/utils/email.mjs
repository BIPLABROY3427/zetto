import nodemailer from 'nodemailer';

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD
        }
    });
};

export const sendSignupOTP = async (email, otp, name) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.MAIL_FROM || 'Getway <no-reply@getway.com>',
        to: email,
        subject: 'Getway - Your Signup Verification OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #0f172a; text-align: center;">Getway</h2>
                <p>Hello ${name},</p>
                <p>Thank you for signing up with Getway. To complete your registration, please use the following One-Time Password (OTP). This OTP is valid for 10 minutes.</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0; color: #8b5cf6;">
                    ${otp}
                </div>
                <p>If you did not initiate this request, you can safely ignore this email.</p>
                <br />
                <p>Best regards,<br/><strong>Getway Team</strong></p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

export const sendPasswordResetOTP = async (email, otp, name) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.MAIL_FROM || 'Getway <no-reply@getway.com>',
        to: email,
        subject: 'Getway - Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #0f172a; text-align: center;">Getway</h2>
                <p>Hello ${name},</p>
                <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to reset it. This OTP is valid for 10 minutes.</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0; color: #8b5cf6;">
                    ${otp}
                </div>
                <p>If you did not initiate this request, you can safely ignore this email.</p>
                <br />
                <p>Best regards,<br/><strong>Getway Team</strong></p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};
