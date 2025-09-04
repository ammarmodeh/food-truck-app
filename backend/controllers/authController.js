import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const { name, password, phone, phoneVerified } = req.body;
  try {
    // Check if user with phone already exists
    let user = await User.findOne({ phone });
    if (user) return res.status(400).json({ msg: 'User with this phone number already exists' });

    if (!phoneVerified) return res.status(400).json({ msg: 'Phone number not verified' });

    user = new User({ name, password, phone, phoneVerified });
    await user.save();

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: { id: user._id, name, phone, phoneVerified, isAdmin: user.isAdmin },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    if (!user.phoneVerified) return res.status(400).json({ msg: 'Phone number not verified' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: { id: user._id, name: user.name, phone, phoneVerified: user.phoneVerified, isAdmin: user.isAdmin },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const verifyPhone = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'User with this phone number does not exist' });

    user.phoneVerified = true;
    await user.save();

    res.json({ msg: 'Phone number verified' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  const { phone } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ msg: 'User with this phone number does not exist' });

    // Verify that the user's phone is already verified
    if (!user.phoneVerified) {
      return res.status(400).json({ msg: 'Phone number not verified. Please verify your phone first.' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

    res.json({
      msg: 'OTP verified successfully. You can now reset your password.',
      resetToken
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ msg: 'Failed to initiate password reset' });
  }
};

export const resetPassword = async (req, res) => {
  const { password, token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

    user.password = password;
    await user.save();

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ msg: 'Reset token has expired' });
    }
    res.status(500).json({ msg: 'Failed to reset password' });
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
  const { name, phone, phoneVerified } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (phone && phone !== user.phone) {
      // Check if new phone number is already in use
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) return res.status(400).json({ msg: 'Phone number already in use' });

      // Only reset phoneVerified if phone is actually changing
      user.phoneVerified = false;
    }

    // Preserve phoneVerified status if it's provided in the request
    if (phoneVerified !== undefined) {
      user.phoneVerified = phoneVerified;
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};