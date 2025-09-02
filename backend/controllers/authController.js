import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password, phone });
    await user.save();

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: { id: user._id, name, email, phone, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email, phone: user.phone, isAdmin: user.isAdmin },
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ msg: 'Email already in use' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User with this email does not exist' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Google App Password
      },
    });

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}\n\nThis link will expire in 10 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; }
            .header h1 { color: #f97316; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .button:hover { background-color: #ea580c; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div className="container">
            <div className="header">
              <h1>Password Reset Request</h1>
            </div>
            <div className="content">
              <p>Hello ${user.name},</p>
              <p>You recently requested to reset your password for your account. Click the button below to reset it:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" className="button">Reset Your Password</a>
              </p>
              <p>This link will expire in 10 minutes for security reasons. If you did not request a password reset, please ignore this email.</p>
              <p>Thank you,</p>
              <p>Your App Team</p>
            </div>
            <div className="footer">
              <p>&copy; 2025 Your App. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: 'Password reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to send reset email' });
  }
};

export const resetPassword = async (req, res) => {
  const { password, token } = req.body;

  try {
    // Verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

    // Update the password
    user.password = password; // Password will be hashed by the User schema's pre-save hook
    await user.save();

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ msg: 'Reset token has expired' });
    }
    res.status(500).json({ msg: 'Failed to reset password' });
  }
};